"""Baixa as imagens de satélite e os contornos de um mapa e grava o índice que o kit/mapa/mapa.js lê.

Uso (da pasta do vídeo, com o Python da fábrica):
    python kit/mapa/baixar.py .                 # lê ./mapa.json, grava ./mapa/<id>.jpg e ./mapa/indice.json
    python kit/mapa/baixar.py . --forcar        # baixa tudo de novo (ignora o cache)
    python kit/mapa/baixar.py . --so cuiaba,MT  # refaz só essas camadas/contornos (as outras vêm do cache)

mapa.json:
    {"camadas": [
        {"id": "america", "fonte": "nasa-relevo", "bbox": [lon0, lat0, lon1, lat1], "largura": 3072},
        {"id": "mt", "fonte": "nasa-modis", "data": "2024-07-20", "bbox": [...], "largura": 3072},
        {"id": "cuiaba", "fonte": "sentinel2", "periodo": "2024-06-01/2024-07-31", "bbox": [...], "largura": 3072}],
     "contornos": [{"id": "MT", "fonte": "ibge-uf", "uf": "MT"}]}

Fontes (todas com licença que permite uso comercial com crédito):
    nasa-relevo  NASA GIBS, Blue Marble com relevo e batimetria (~500 m/px): continente, país, oceano.
    nasa-modis   NASA GIBS, MODIS cor verdadeira de um dia (~250 m/px): estado, região. "data" ou "datas"
                 (lista: a 1ª manda, as outras só preenchem as faixas pretas entre as passagens do satélite);
                 "satelite": "terra" (padrão, passa de manhã) ou "aqua" (à tarde: outra chance de pegar o dia sem nuvem).
    sentinel2    Copernicus Sentinel-2 L2A (10 m/px) pelo STAC da Element84 na AWS, asset "visual" (TCI). Mosaico de
                 várias cenas reprojetadas para a grade de destino; prefere o dia com mais cenas e menos nuvem.
                 Opções: "periodo" (obrigatório), "nuvens" (máx. %, padrão 2), "data" (dia preferido).
    ibge-uf      contorno de estado pela API de malhas do IBGE (qualidade intermediária), simplificado em Mercator.

Opções de qualquer camada: "ajuste": {"brilho": 1.0, "gama": 1.0, "saturacao": 1.0, "petroleo": 0..1} e
"casar": "<id de camada mais grossa>" (aproxima média e contraste das cores dessa camada, "forca" 0..1, padrão 0.6),
que suaviza a troca de nível durante o zoom. Tudo sai em Web Mercator (EPSG:3857).
"""
import argparse
import hashlib
import io
import json
import math
import os
import sys
import time
import urllib.request
from datetime import date

import numpy as np
from PIL import Image

R = 6378137.0
MAX_LADO = 4096
GIBS = 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi'
STAC = 'https://earth-search.aws.element84.com/v1'
IBGE = 'https://servicodados.ibge.gov.br/api/v3/malhas/estados/{uf}?formato=application/vnd.geo%2Bjson&qualidade=intermediaria'
UA = {'User-Agent': 'faceless-shorts-mapa/1.0'}
NATIVO = {'nasa-relevo': 500.0, 'nasa-modis': 250.0, 'sentinel2': 10.0}   # resolução da fonte em metros de chão
CREDITO = {'nasa-relevo': 'NASA GIBS/Blue Marble', 'nasa-modis': 'NASA GIBS/MODIS'}


def merc(lon, lat):
    lat = max(-85.05, min(85.05, lat))
    return R * math.radians(lon), R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


def lat_de_y(y):
    return math.degrees(2 * math.atan(math.exp(y / R)) - math.pi / 2)


def limites(bbox):
    x0, y0 = merc(bbox[0], bbox[1])
    x1, y1 = merc(bbox[2], bbox[3])
    return [min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)]


def grade(cam):
    """limites em Mercator e tamanho em px (a largura manda; a altura sai da proporção)."""
    lim = limites(cam['bbox'])
    w = int(cam.get('largura', 2048))
    h = int(round(w * (lim[3] - lim[1]) / (lim[2] - lim[0])))
    if max(w, h) > MAX_LADO:
        f = MAX_LADO / max(w, h)
        w, h = int(round(w * f)), int(round(h * f))
        print(f'  aviso: {cam["id"]} reduzida para {w}x{h} (máximo {MAX_LADO} px por lado)')
    return lim, w, h


def baixar_url(url, tentativas=4):
    for i in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r:
                return r.read(), r.headers.get('Content-Type', '')
        except Exception as e:  # rede instável: tenta de novo com espera crescente
            if i == tentativas - 1:
                raise
            print(f'  falhou ({e}); tentando de novo')
            time.sleep(2 + 3 * i)


def gibs(camada, lim, w, h, tempo=None):
    url = (f'{GIBS}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/jpeg&CRS=EPSG:3857&STYLES=&LAYERS={camada}'
           f'&BBOX={lim[0]:.2f},{lim[1]:.2f},{lim[2]:.2f},{lim[3]:.2f}&WIDTH={w}&HEIGHT={h}' + (f'&TIME={tempo}' if tempo else ''))
    dados, tipo = baixar_url(url)
    if 'image' not in tipo:
        raise RuntimeError(f'GIBS devolveu {tipo}: {dados[:300]!r}')
    return np.asarray(Image.open(io.BytesIO(dados)).convert('RGB'))


def vazio(a, limiar=6):
    """máscara dos pixels sem dado (faixa preta entre passagens / borda de cena), um pouco dilatada."""
    m = a.max(axis=2) <= limiar
    d = m.copy()
    d[1:] |= m[:-1]; d[:-1] |= m[1:]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
    return d


def tapar_buracos(a, m, passos=48):
    """preenche os pixels vazios com a média dos vizinhos válidos (crescendo da borda); o que sobrar vira a cor média."""
    a = a.astype(np.float32)
    m = m.copy()
    for _ in range(passos):
        if not m.any():
            break
        soma = np.zeros_like(a)
        n = np.zeros(m.shape, np.float32)
        ok = ~m
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            s = np.roll(np.roll(a * ok[..., None], dy, 0), dx, 1)
            c = np.roll(np.roll(ok.astype(np.float32), dy, 0), dx, 1)
            soma += s
            n += c
        novo = m & (n > 0)
        a[novo] = soma[novo] / n[novo][:, None]
        m &= ~novo
    if m.any():
        a[m] = a[~m].mean(axis=0) if (~m).any() else 0
    return np.clip(a, 0, 255).astype(np.uint8)


def nasa_modis(cam, lim, w, h):
    datas = cam.get('datas') or [cam['data']]
    a = None
    for d in datas:
        sat = cam.get('satelite', 'terra').capitalize()
        img = gibs(f'MODIS_{sat}_CorrectedReflectance_TrueColor', lim, w, h, d)
        if a is None:
            a = img.copy()
            m = vazio(a)
        else:
            a[m] = img[m]
            m = vazio(a)
        print(f'  MODIS {d}: {100 * (1 - m.mean()):.2f}% coberto')
        if m.mean() < 0.0005:   # o que sobra é pixel escuro de verdade (lago, sombra), não faixa sem dado
            break
    if m.mean() >= 0.0005:
        print(f'  aviso: {100 * m.mean():.2f}% sem dado em {cam["id"]}; tapado com os vizinhos (ponha mais "datas")')
        a = tapar_buracos(a, m)
    return a, {'datas': datas}


def sentinel2(cam, lim, w, h):
    os.environ.setdefault('AWS_NO_SIGN_REQUEST', 'YES')
    os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
    import rasterio
    from rasterio.enums import Resampling
    from rasterio.transform import from_bounds as transf
    from rasterio.warp import reproject, transform_bounds
    from rasterio.windows import Window, from_bounds as janela
    from pystac_client import Client

    itens = list(Client.open(STAC).search(collections=['sentinel-2-l2a'], bbox=cam['bbox'], datetime=cam['periodo'],
                                          query={'eo:cloud_cover': {'lt': cam.get('nuvens', 2)}}, max_items=120).items())
    if not itens:
        raise RuntimeError(f'{cam["id"]}: nenhuma cena Sentinel-2 com menos de {cam.get("nuvens", 2)}% de nuvem em {cam["periodo"]}')
    dia = lambda it: it.properties['datetime'][:10]
    pref = date.fromisoformat(cam['data']) if cam.get('data') else None
    grupos = {}
    for it in itens:
        grupos.setdefault(dia(it), []).append(it)

    amostra = [(cam['bbox'][0] + (cam['bbox'][2] - cam['bbox'][0]) * (i + 0.5) / 16,
                cam['bbox'][1] + (cam['bbox'][3] - cam['bbox'][1]) * (j + 0.5) / 16) for i in range(16) for j in range(16)]

    def cobertura(g):
        """fração da área pedida que as cenas do dia cobrem (pelas pegadas do STAC, numa grade 16x16)."""
        return sum(any(dentro(lon, lat, it.geometry) for it in g) for lon, lat in amostra) / len(amostra)

    def nota(d):
        g = grupos[d]
        dist = abs((date.fromisoformat(d) - pref).days) if pref else 0
        return (-round(cobertura(g), 2), round(sum(i.properties['eo:cloud_cover'] for i in g) / len(g), 1), dist)

    ordem = sorted(grupos, key=nota)
    fila = sorted(grupos[ordem[0]], key=lambda i: i.properties['eo:cloud_cover'])
    fila += sorted([i for d in ordem[1:] for i in grupos[d]], key=lambda i: (i.properties['eo:cloud_cover'], dia(i)))

    lat_meio = lat_de_y((lim[1] + lim[3]) / 2)
    chao = (lim[2] - lim[0]) / w * math.cos(math.radians(lat_meio))   # m de chão por px de destino
    nivel = -1
    while 10 * 2 ** (nivel + 2) <= chao * 0.75 and nivel < 3:
        nivel += 1
    dst_t = transf(*lim, w, h)
    a = np.zeros((3, h, w), np.uint8)
    falta = np.ones((h, w), bool)
    usados = []
    with rasterio.Env(AWS_NO_SIGN_REQUEST='YES', GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR', GDAL_HTTP_MAX_RETRY='4',
                      GDAL_HTTP_RETRY_DELAY='2'):
        for it in fila:
            if falta.mean() < 0.0005:
                break
            if not any(dentro(lon, lat, it.geometry) for lon, lat in amostra):
                continue
            href = it.assets['visual'].href
            with rasterio.open(href, **({'overview_level': nivel} if nivel >= 0 else {})) as src:
                b = transform_bounds('EPSG:3857', src.crs, *lim)
                jan = janela(*b, src.transform).round_offsets().round_lengths()
                try:
                    jan = jan.intersection(Window(0, 0, src.width, src.height))
                except Exception:   # a cena não cruza a área pedida
                    continue
                if jan.width <= 0 or jan.height <= 0:
                    continue
                dados = src.read(window=jan)
                tmp = np.zeros_like(a)
                reproject(dados, tmp, src_transform=src.window_transform(jan), src_crs=src.crs, src_nodata=0,
                          dst_transform=dst_t, dst_crs='EPSG:3857', dst_nodata=0,
                          resampling=Resampling.average if nivel >= 0 or chao > 13 else Resampling.cubic)
            novo = falta & (tmp.max(axis=0) > 0)
            if not novo.any():
                continue
            a[:, novo] = tmp[:, novo]
            falta &= ~novo
            usados.append({'id': it.id, 'dia': dia(it), 'nuvens': it.properties['eo:cloud_cover']})
            print(f'  {it.id} ({dia(it)}, {it.properties["eo:cloud_cover"]:.2f}% nuvem): {100 * (1 - falta.mean()):.1f}% coberto')
    img = np.moveaxis(a, 0, 2)
    m = vazio(img, 2) & falta
    if m.any():
        print(f'  aviso: {100 * m.mean():.2f}% sem dado em {cam["id"]}; tapado com os vizinhos')
        img = tapar_buracos(img, m)
    anos = sorted({u['dia'][:4] for u in usados})
    return img, {'cenas': usados, 'anos': anos, 'nivelOverview': nivel}


def dentro(lon, lat, geo):
    """ponto dentro de um Polygon/MultiPolygon GeoJSON (par-ímpar, só o anel externo)."""
    polis = [geo['coordinates']] if geo['type'] == 'Polygon' else geo['coordinates']
    for poli in polis:
        anel, ok = poli[0], False
        for (x0, y0), (x1, y1) in zip(anel, anel[1:] + anel[:1]):
            if (y0 > lat) != (y1 > lat) and lon < x0 + (lat - y0) * (x1 - x0) / (y1 - y0):
                ok = not ok
        if ok:
            return True
    return False


def ajustar(a, aj):
    if not aj:
        return a
    f = a.astype(np.float32) / 255
    if aj.get('petroleo'):   # água azul-marinho → azul-petróleo (puxa o verde para perto do azul onde o azul domina)
        k = float(aj['petroleo'])
        agua = np.clip((f[..., 2] - np.maximum(f[..., 0], f[..., 1]) - 0.03) * 8, 0, 1) * k
        f[..., 1] = f[..., 1] + (f[..., 2] * 0.92 - f[..., 1]) * agua
        f[..., 2] = f[..., 2] * (1 - 0.12 * agua)
    s = aj.get('saturacao', 1.0)
    if s != 1.0:
        cinza = f.mean(axis=2, keepdims=True)
        f = cinza + (f - cinza) * s
    f = np.clip(f * aj.get('brilho', 1.0), 0, 1) ** (1 / aj.get('gama', 1.0))
    return (np.clip(f, 0, 1) * 255 + 0.5).astype(np.uint8)


def casar(a, lim, ref, forca):
    """aproxima média e desvio de cada canal da camada aos da camada de referência (mais grossa) na mesma área."""
    rimg = np.asarray(Image.open(ref['caminho']).convert('RGB')).astype(np.float32)
    rl, rh, rw = ref['limites'], rimg.shape[0], rimg.shape[1]
    px = lambda x: int(round((x - rl[0]) / (rl[2] - rl[0]) * rw))
    py = lambda y: int(round((rl[3] - y) / (rl[3] - rl[1]) * rh))
    x0, x1 = sorted((px(lim[0]), px(lim[2])))
    y0, y1 = sorted((py(lim[3]), py(lim[1])))
    rec = rimg[max(0, y0):min(rh, y1), max(0, x0):min(rw, x1)]
    if rec.size < 3 * 16:
        print('  aviso: a área de referência para "casar" é pequena demais; ignorado')
        return a
    f = a.astype(np.float32)
    for c in range(3):
        mr, sr = rec[..., c].mean(), rec[..., c].std() + 1e-3
        ma, sa = f[..., c].mean(), f[..., c].std() + 1e-3
        alvo = (f[..., c] - ma) / sa * sr + mr
        f[..., c] = f[..., c] + (alvo - f[..., c]) * forca
    return np.clip(f, 0, 255).astype(np.uint8)


def douglas_peucker(pts, tol):
    if len(pts) < 4:
        return pts
    p = np.asarray(pts, np.float64)
    manter = np.zeros(len(p), bool)
    manter[0] = manter[-1] = True
    pilha = [(0, len(p) - 1)]
    while pilha:
        i, j = pilha.pop()
        if j <= i + 1:
            continue
        a, b = p[i], p[j]
        ab = b - a
        n = math.hypot(*ab)
        seg = p[i + 1:j]
        if n < 1e-9:
            d = np.hypot(*(seg - a).T)
        else:
            d = np.abs(ab[0] * (seg[:, 1] - a[1]) - ab[1] * (seg[:, 0] - a[0])) / n
        k = int(np.argmax(d))
        if d[k] > tol:
            manter[i + 1 + k] = True
            pilha += [(i, i + 1 + k), (i + 1 + k, j)]
    return p[manter].tolist()


def contorno_ibge(ct):
    uf = ct.get('uf', ct['id'])
    dados, _ = baixar_url(IBGE.format(uf=uf))
    gj = json.loads(dados)
    aneis = []
    for f in gj['features']:
        g = f['geometry']
        polis = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        for poli in polis:
            for anel in poli:
                xy = [merc(lon, lat) for lon, lat in anel]
                s = douglas_peucker(xy, ct.get('tolerancia', 400))
                if len(s) >= 4:
                    aneis.append([[round(x), round(y)] for x, y in s])
    todos = [p for a in aneis for p in a]
    lim = [min(p[0] for p in todos), min(p[1] for p in todos), max(p[0] for p in todos), max(p[1] for p in todos)]
    print(f'  contorno {ct["id"]} ({uf}): {len(aneis)} anel(is), {len(todos)} pontos')
    return {'id': ct['id'], 'fonte': 'ibge-uf', 'uf': uf, 'aneis': aneis, 'limites': lim}


def chave(obj):
    return hashlib.sha1(json.dumps(obj, sort_keys=True).encode()).hexdigest()[:12]


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')   # console do Windows: acentos legíveis
    except Exception:
        pass
    ap = argparse.ArgumentParser(description='Baixa as camadas de satélite e os contornos de <pasta>/mapa.json.')
    ap.add_argument('pasta')
    ap.add_argument('--forcar', action='store_true', help='baixa tudo de novo, ignorando o cache')
    ap.add_argument('--so', default='', help='ids separados por vírgula: refaz só esses')
    arg = ap.parse_args()
    pasta = os.path.abspath(arg.pasta)
    cfg = json.load(open(os.path.join(pasta, 'mapa.json'), encoding='utf-8'))
    saida = os.path.join(pasta, 'mapa')
    os.makedirs(saida, exist_ok=True)
    so = {s for s in arg.so.split(',') if s}
    refazer = lambda i: arg.forcar or i in so

    camadas, feitas = [], {}
    for cam in cfg.get('camadas', []):
        cid, fonte = cam['id'], cam['fonte']
        if fonte not in NATIVO:
            sys.exit(f'camada {cid}: fonte desconhecida "{fonte}" (use nasa-relevo, nasa-modis ou sentinel2)')
        lim, w, h = grade(cam)
        jpg, meta_f = os.path.join(saida, f'{cid}.jpg'), os.path.join(saida, f'{cid}.json')
        k = chave(cam)
        meta = json.load(open(meta_f, encoding='utf-8')) if os.path.exists(meta_f) else None
        if os.path.exists(jpg) and meta and meta.get('chave') == k and not refazer(cid):
            print(f'{cid}: em cache')
        else:
            print(f'{cid}: baixando {fonte} {w}x{h}')
            if fonte == 'nasa-relevo':
                img, extra = gibs('BlueMarble_ShadedRelief_Bathymetry', lim, w, h), {}
            elif fonte == 'nasa-modis':
                img, extra = nasa_modis(cam, lim, w, h)
            else:
                img, extra = sentinel2(cam, lim, w, h)
            img = ajustar(img, cam.get('ajuste'))
            if cam.get('casar'):
                if cam['casar'] not in feitas:
                    sys.exit(f'camada {cid}: "casar" aponta para "{cam["casar"]}", que precisa vir antes em mapa.json')
                img = casar(img, lim, feitas[cam['casar']], float(cam.get('forca', 0.6)))
            Image.fromarray(img).save(jpg, quality=cam.get('qualidade', 86), optimize=True, progressive=True)
            meta = {'chave': k, **extra}
            json.dump(meta, open(meta_f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        lat_meio = lat_de_y((lim[1] + lim[3]) / 2)
        mpp = (lim[2] - lim[0]) / w
        mpp_fonte = NATIVO[fonte] / math.cos(math.radians(lat_meio))   # metros Mercator por px da fonte
        ent = {'id': cid, 'arquivo': f'{cid}.jpg', 'fonte': fonte, 'limites': [round(v, 2) for v in lim], 'largura': w, 'altura': h,
               'mpp': round(mpp, 3), 'mppFonte': round(mpp_fonte, 3), 'mppEfetivo': round(max(mpp, mpp_fonte), 3),
               **{c: meta[c] for c in ('datas', 'cenas', 'anos') if c in meta}}
        camadas.append(ent)
        feitas[cid] = {**ent, 'caminho': jpg}

    contornos = {}
    for ct in cfg.get('contornos', []):
        if ct.get('fonte', 'ibge-uf') != 'ibge-uf':
            sys.exit(f'contorno {ct["id"]}: fonte desconhecida "{ct.get("fonte")}" (use ibge-uf)')
        f = os.path.join(saida, f'contorno-{ct["id"]}.json')
        k = chave(ct)
        antigo = json.load(open(f, encoding='utf-8')) if os.path.exists(f) else None
        if antigo and antigo.get('chave') == k and not refazer(ct['id']):
            print(f'contorno {ct["id"]}: em cache')
            contornos[ct['id']] = antigo['contorno']
        else:
            contornos[ct['id']] = contorno_ibge(ct)
            json.dump({'chave': k, 'contorno': contornos[ct['id']]}, open(f, 'w', encoding='utf-8'), separators=(',', ':'))

    camadas.sort(key=lambda c: -c['mppEfetivo'])   # do mais grosso ao mais fino
    fontes = {c['fonte'] for c in camadas}
    partes = []
    nasa = [CREDITO[f] for f in ('nasa-relevo', 'nasa-modis') if f in fontes]
    if nasa:
        partes.append('Imagens: ' + ', '.join(nasa))
    anos = sorted({a for c in camadas for a in c.get('anos', [])})
    if 'sentinel2' in fontes:
        partes.append(f'contém dados modificados Copernicus Sentinel {"/".join(anos) or ""}'.strip())
    if contornos:
        partes.append('malhas: IBGE')
    indice = {'versao': 1, 'projecao': 'EPSG:3857', 'raio': R, 'camadas': camadas, 'contornos': contornos,
              'creditos': '; '.join(partes)}
    json.dump(indice, open(os.path.join(saida, 'indice.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'mapa/indice.json: {len(camadas)} camadas, {len(contornos)} contornos')
    print(f'créditos: {indice["creditos"]}')


if __name__ == '__main__':
    main()
