# Mapa de Satélite (estilo `mapa-satelite`)

> Guia em português (o exemplo é narrado em pt-BR com a voz `pm_alex`). Para inglês: `"lang": "en"`, uma voz `am_*`/`af_*` e reescreva as falas.

## 1. O que é o estilo

Vídeos verticais 1080x1920 em que **uma imagem de satélite real é o palco o vídeo inteiro**. A câmera faz zoom contínuo (país → estado → cidade e de volta). O estado acende, linhas e rotas se desenham por cima da foto, ícones andam por elas e rótulos ficam presos ao terreno. O ano aparece no canto e cartões cartoon planos entram por cima.

Formato: **história de um lugar contada em linha do tempo**, por exemplo uma obra pública que atrasou décadas, um dinheiro que sumiu, uma rota, uma viagem ou uma mudança de cidade. A cada fala o ano muda e o mapa mostra onde aquilo aconteceu.

Referência de linguagem: shorts brasileiros de "mapa de satélite que vai ampliando" sobre escândalos de obras. Nada é copiado de nenhum perfil: roteiro, cartões e cenas são próprios. A imagem vem só de fontes abertas (ver 4).

| item | valor |
|---|---|
| estilo | `mapa-satelite` (`bash SKILL/scripts/new_video.sh mapa-satelite <nome>`) |
| exemplo | `example/` ("45 anos esperando 10 km de metrô", Linha 2 do metrô de BH, ~51 s, 11 linhas); renderiza como está, com as imagens já baixadas em `mapa/` |
| tema | `example/tema.json` (cores da legenda e do HUD) |
| style sheet | `style-sheet.png` |
| motor | `fs3d` (`index.html` + `src/main.js` + `src/cenas.js`, `window.OP`, `tools/capture.mjs`, `tools/mix.py`, `voice.py`/`words.py`), igual ao `pixel-3d`. As cenas são canvas 2D: não chamam `blit` |

- **As cenas ficam em `src/cenas.js`** (não `shots.js`). Os cartões do exemplo estão em `src/objetos.js` e os traçados em `src/linhas.js`.
- **Cada vídeo carrega cópia do kit** (`kit/`). O código do vídeo só importa de `../kit/` e do próprio `src/`. three.js só o vendorizado.

## 2. Regras visuais

1. **O satélite é o palco o tempo todo.** Toda cena começa com `mapa.desenhar(ctx, camera, …)`. Nada de fundo liso, nem de mundo 3D de blocos no mesmo quadro.
2. **A câmera nunca para.** Use voo entre chaves (`roteiroDeCamera` ou a `trilha` do exemplo) e uma deriva lenta de zoom (`mpp * Math.exp(-0.035 * t)`).
3. **O mergulho estado → cidade leva ~1 a 1,3 s**, com desfoque proporcional à velocidade (`velocidadeZoom`). É o desfoque que esconde a troca de imagem.
4. **Realce de estado:** fora escurece, dentro clareia, com contorno branco brilhando (`mapa.realce`).
5. **Rotas e linhas:** verde neon `#3DFF7A` para o que existe ou funciona, dourado `#FFC93C` para o que está em obra ou é a "linha do problema", tracejado para o que é só plano, branco para trajeto longo (navio, viagem). Elas se desenham com o `progresso` preso a palavras.
6. **Ano:** serif itálica dourada no canto superior esquerdo (`ano`), trocando a cada linha da linha do tempo.
7. **Cartões por cima:** planos, cartoon, fundo creme, contorno escuro grosso e sombra dura (`caixa`, `carimbo` e outros em `src/objetos.js`). Use carimbo vermelho para o que deu errado ("PAROU", "NUNCA CHEGOU"). Um cartão por ideia, no terço de cima.
8. **Terço inferior escuro** (o `desenhar` já faz isso). A legenda fica lá: 1 a 3 palavras em CAIXA ALTA, branca com contorno, uma palavra em amarelo. Rótulos e rotas ficam acima de y ~1350.
9. **Créditos das imagens no rodapé** (`rodape(ctx, mapa.creditos)`) e na descrição do post. É obrigatório: ver 4.
10. **Todo quadro é função pura de `t`.** Nenhum instante fixo em segundos: tudo vem de `tempo.linha(i)` e `tempo.palavra('palavra', i)`, para realinhar sozinho com outra voz.

## 3. Formato do roteiro

- **Gancho:** o absurdo em número ("45 anos esperando 10 km de metrô").
- **Linha do tempo:** uma linha falada por marco, começando pelo ano ("Em mil novecentos e noventa e oito, …"). Escreva os números por extenso na fala e em algarismos nos `caps`.
- **Fecho:** onde está hoje, com ironia leve ("Previsão: 2028. Se não atrasar.").
- **Fatos:** casos reais com fonte em `script.json` "sources". Escândalo com pessoas: só o que foi noticiado, sem afirmar crime não julgado. Na dúvida, use um lugar ou empresa fictícia.

## 4. Imagens: de onde vêm (licenças)

Use **só** estas fontes. Todas permitem uso comercial **com crédito**.

| `fonte` no mapa.json | o que é | resolução | uso |
|---|---|---|---|
| `nasa-relevo` | NASA GIBS, Blue Marble com relevo e fundo do mar | ~500 m/px | continente, país, oceano |
| `nasa-modis` | NASA GIBS, MODIS cor verdadeira de um dia (`data` ou `datas`; `satelite`: `terra` ou `aqua`) | ~250 m/px | estado, região |
| `sentinel2` | Copernicus Sentinel-2 L2A (asset `visual`), pelo STAC da Element84 na AWS, sem conta (`periodo`; `nuvens`, padrão 2%) | 10 m/px | cidade (até ~1° de lado) |
| `ibge-uf` (contorno) | malha do estado pela API pública do IBGE | | realce de estado |

**Nunca** use Google Maps, Google Earth, Esri World Imagery, Mapbox, EOX s2cloudless nem prints de app de mapa: a licença não permite, ou o uso comercial é pago. Traçados de linhas e estações podem vir do OpenStreetMap; nesse caso acrescente "© OpenStreetMap" ao crédito. Para tirar o traçado de uma linha (bbox na ordem sul, oeste, norte, leste):

```
PYTHONUTF8=1 SKILL/scripts/py -c "
import json, urllib.request, urllib.parse
q = '[out:json][timeout:60];relation[\"route\"~\"subway|light_rail|train|tram\"](-20.10,-44.10,-19.80,-43.86);out geom;'
r = urllib.request.Request('https://overpass-api.de/api/interpreter', data=urllib.parse.urlencode({'data': q}).encode(), headers={'User-Agent': 'faceless-shorts'})
d = json.load(urllib.request.urlopen(r, timeout=90)); json.dump(d, open('review/linhas-osm.json', 'w', encoding='utf-8'))
print([e['tags'].get('name') for e in d['elements']])"
```

(No Windows o `curl` costuma falhar no TLS do Overpass; o Python funciona.)

Cada relação traz `tags.name` e `members[].geometry` (`{lat, lon}`). Junte os trechos `way` da linha que interessa numa lista `[lon, lat]` (em ordem, sem pontos repetidos), simplifique com `suavizar` e salve em `src/linhas.js`. As estações são os membros `node` com `role` `stop` ou `platform`. Linha que ainda não existe no OSM (obra, plano): trace à mão em poucos pontos e confira sobre a imagem.

## 5. Fluxo do mapa

```
mapa.json  →  kit/mapa/baixar.py  →  mapa/<id>.jpg + mapa/indice.json  →  kit/mapa/mapa.js (no navegador)
```

```
SKILL/scripts/py kit/mapa/baixar.py .                # baixa o que falta (1-2 min, precisa de internet)
SKILL/scripts/py kit/mapa/baixar.py . --so bh,MG     # refaz só essas camadas; --forcar refaz tudo
```

O `baixar.py` precisa de `rasterio`, `pystac-client` e `pillow` no venv. O `setup.sh` instala; se faltar, rode `uv pip install --python <venv>/Scripts/python.exe rasterio pystac-client pillow`. O exemplo já vem com as imagens, por isso renderiza sem rede.

O `mapa.json` do exemplo (Brasil → sudeste → região de BH → BH):

```json
{
  "camadas": [
    { "id": "brasil", "fonte": "nasa-relevo", "bbox": [-75, -41, -30, 12], "largura": 3200, "ajuste": { "petroleo": 0.8 } },
    { "id": "sudeste", "fonte": "nasa-modis", "satelite": "aqua", "datas": ["2024-08-30", "2024-08-18", "2024-07-22"], "bbox": [-53.5, -23.3, -41.3, -13.5], "largura": 4096, "casar": "brasil", "forca": 0.5 },
    { "id": "bh-regiao", "fonte": "sentinel2", "periodo": "2024-07-01/2024-08-31", "bbox": [-44.6, -20.45, -43.45, -19.4], "largura": 2048, "casar": "sudeste", "forca": 0.5 },
    { "id": "bh-meio", "fonte": "sentinel2", "periodo": "2024-07-01/2024-08-31", "bbox": [-44.28, -20.30, -43.70, -19.60], "largura": 2560, "casar": "bh-regiao", "forca": 0.6 },
    { "id": "bh", "fonte": "sentinel2", "periodo": "2024-07-01/2024-08-31", "bbox": [-44.10, -20.10, -43.86, -19.80], "largura": 3072, "casar": "bh-meio", "forca": 0.8 }
  ],
  "contornos": [{ "id": "MG", "fonte": "ibge-uf", "uf": "MG" }]
}
```

- `bbox` é `[lon0, lat0, lon1, lat1]` em graus; `largura` em px. Tudo sai em Web Mercator.
- **Escada de resolução:** cada camada deve ter no máximo ~6 a 10 vezes o m/px da seguinte. Pulo maior aparece borrado no meio do mergulho; nesse caso crie uma camada intermediária (o exemplo tem `bh-meio`, Sentinel-2 a 25 m/px).
- `casar: "<id>"` aproxima as cores da camada às da camada mais grossa, o que deixa a troca quase invisível. A camada citada vem antes no arquivo.
- `ajuste`: `brilho`, `gama`, `saturacao`, `petroleo` (0..1, puxa o oceano para azul-petróleo).
- **Nuvens do MODIS:** o litoral quase sempre tem nuvem num dia só. Teste várias `datas` (a primeira manda, as outras só tapam o preto), `satelite: "aqua"`, ou corte o `bbox` para tirar o litoral nublado.

## 6. API do kit

**`kit/mapa/geo.mjs`** (puro). A câmera é `{ x, y, mpp }`: centro em metros Mercator e metros por pixel; mpp menor = mais perto.

```js
cam(lon, lat, mpp)                                  // câmera centrada num lugar
enquadrar(pontos, { margem = 0.12, deslocar })      // câmera que mostra todos os [lon, lat]
voo(p, de, para, { arco })                          // zoom em escala log; arco: salto longo afasta no meio
roteiroDeCamera([[t0, cam0], [t1, cam1], ...])      // -> f(t)
velocidadeZoom(f, t)                                // alimenta o desfoque
merc · lonlat · geoTela · medirRota · pontoNaRota · curva · suavizar · distanciaKm
```

**`kit/mapa/mapa.js`** (canvas 2D):

```js
const mapa = await carregarMapa('mapa');            // no main.js, ANTES de liberar OP.ready
mapa.desenhar(ctx, c, { desfoque })                 // camadas do grosso ao fino, crossfade de nível, terço inferior escuro
mapa.realce(ctx, c, 'MG', k)                        // estado aceso
mapa.rota(ctx, c, pontos, progresso, { cor, tracejado })   // -> ponta { x, y, ang } para um ícone andar
mapa.rotulo(ctx, c, lon, lat, 'Cuiabá', { k })
mapa.marcador(ctx, c, lon, lat, { k, t, cor })
veiculo(ctx, x, y, ang, { tipo: 'trem' | 'navio' | 'caminhao' })
ano(ctx, '1998', k) · rodape(ctx, mapa.creditos, { k })
```

## 7. Anatomia de uma cena

```js
const inicio = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);    // corte um pouco antes da fala
const W = (txt, i) => tempo.palavra(txt, i);
cenaEm(inicio(3), 'L3', '1998: obras começam', (lt, d, t) => {
  const c = camera(t);                                          // câmera do filme inteiro: o corte não pula
  mapa.desenhar(ctx, c, { desfoque: velocidadeZoom(camera, t) });
  mapa.rota(ctx, c, L1, 1, { cor: VERDE });                     // o que já existe
  mapa.rota(ctx, c, L2, 0.4 * eo(seg(t, W('obras', 3), W('começaram', 3) + 0.6)), { cor: OURO });
  documento(ctx, 540, 520, { k: eo(seg(t, W('empréstimo', 3) - 0.2, W('empréstimo', 3) + 0.3)) });
  ano(ctx, '1998', 1);
  rodape(ctx, mapa.creditos, { k: 1 });
});
```

- **O estado do mapa é função do `t` do filme**, não da cena: o que foi desenhado continua desenhado no corte seguinte.
- Sons (`cue(t, tipo, { gain })`): `whoosh` em cada corte (`cenaEm` já põe) e nos voos; `pop` quando um cartão entra; `slide` quando uma linha começa a se desenhar; `thud` em carimbo e martelo; `sparkle` no gancho. Todos na palavra, via `W('palavra', i)`.

## 8. Armadilhas (QA)

- **`carregarMapa` antes do `OP.ready`.** Senão a captura grava quadros sem mapa.
- **Linha fora do trilho:** as rotas são [lon, lat] à mão ou do OSM. Confira sobre a imagem em quadros cheios.
- **Borrado ou em blocos no fim do mergulho** = pulo grande demais na escada de resolução ou desfoque forte perto da cidade. Crie a camada intermediária e confira o trecho a 30 fps (`capture.mjs frames review/f "3.9,3.95,4.0,4.05"`).
- **Nuvem de relance no mergulho:** troque a data ou o satélite, ou corte o `bbox` (5).
- **Cartão por cima de rótulo, trem ou linha:** cartões no terço de cima; mova o rótulo de lado (`lado`).
- **Borda preta:** a camada mais grossa precisa cobrir tudo o que a câmera mostra.
- **Créditos:** confira que o rodapé aparece e que a descrição do post leva `mapa.creditos`.
