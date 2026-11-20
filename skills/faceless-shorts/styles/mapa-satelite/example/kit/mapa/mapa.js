// Mapa de satélite com zoom contínuo (canvas 2D, no navegador). Todo desenho é função pura da câmera e dos parâmetros:
// nada aqui guarda estado entre quadros (as telas de rascunho são só área de trabalho, refeitas a cada chamada).
//
//   const mapa = await carregarMapa('mapa');            // lê mapa/indice.json (gerado por kit/mapa/baixar.py) e as imagens
//   mapa.desenhar(ctx, c, { desfoque: velocidadeZoom(camDe, lt) });   // c = { x, y, mpp } (kit/mapa/geo.mjs)
//   mapa.realce(ctx, c, 'MT', k);                         // estado aceso: fora escurece, dentro clareia, contorno com brilho
//   const ponta = mapa.rota(ctx, c, pontos, k, { cor: '#3DFF7A' });   // linha que se desenha; devolve a ponta
//   mapa.veiculo(ctx, ponta.x, ponta.y, ponta.ang, { tipo: 'trem' });
//   mapa.rotulo(ctx, c, lon, lat, 'Cuiabá', { k });  mapa.marcador(ctx, c, lon, lat, { t });  mapa.ano(ctx, '2024', k);
import { TELA, merc, lonlat, paraTela, retanguloTela, intersecta, cobre, fracaoDaTela, pesoCobertura, pesosLOD, medirRota, pontoNaRota } from './geo.mjs';

const { W, H } = TELA;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const FUNDO = '#0A2630';             // cor do "nada" fora da camada mais grossa (azul-petróleo escuro, igual ao oceano fundo)
const PENA = 0.08;                   // borda esfumada das camadas finas (fração do menor lado), para não aparecer retângulo

function tela(w = W, h = H) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}

async function carregarImagem(url) {
  const img = new Image();
  img.src = url;
  try { await img.decode(); } catch (e) { throw new Error(`mapa: não consegui carregar ${url} (rode kit/mapa/baixar.py)`); }
  return img;
}

/** cópia com borda esfumada (alfa → 0 nas bordas) e a pirâmide de reduções (mip) para desenhar longe sem serrilhado */
function prepararCamada(img, esfumar) {
  const base = tela(img.naturalWidth, img.naturalHeight), g = base.getContext('2d');
  g.drawImage(img, 0, 0);
  if (esfumar) {
    const f = Math.max(2, Math.round(Math.min(base.width, base.height) * PENA));
    g.globalCompositeOperation = 'destination-out';
    const borda = (x0, y0, x1, y1, rx, ry, rw, rh) => {
      const gr = g.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(rx, ry, rw, rh);
    };
    borda(0, 0, f, 0, 0, 0, f, base.height);
    borda(base.width, 0, base.width - f, 0, base.width - f, 0, f, base.height);
    borda(0, 0, 0, f, 0, 0, base.width, f);
    borda(0, base.height, 0, base.height - f, 0, base.height - f, base.width, f);
    g.globalCompositeOperation = 'source-over';
  }
  const mips = [base];
  while (Math.max(mips.at(-1).width, mips.at(-1).height) > 384) {
    const a = mips.at(-1), b = tela(Math.max(1, Math.round(a.width / 2)), Math.max(1, Math.round(a.height / 2)));
    const gb = b.getContext('2d'); gb.imageSmoothingEnabled = true; gb.imageSmoothingQuality = 'high';
    gb.drawImage(a, 0, 0, b.width, b.height);
    mips.push(b);
  }
  return mips;
}

/** carrega o índice e as imagens; resolve com o objeto do mapa. O main.js espera esta promessa antes de liberar o OP. */
export async function carregarMapa(pasta = 'mapa') {
  const r = await fetch(`${pasta}/indice.json`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`mapa: ${pasta}/indice.json não existe (rode: python kit/mapa/baixar.py .)`);
  const indice = await r.json();
  const camadas = await Promise.all(indice.camadas.map(async (c, i) => ({ ...c, mips: prepararCamada(await carregarImagem(`${pasta}/${c.arquivo}`), i > 0) })));
  return criarMapa(indice, camadas);
}

function criarMapa(indice, camadas) {
  const base = tela(), gBase = base.getContext('2d');
  const contornos = indice.contornos || {};

  /** desenha uma camada (já com o peso em globalAlpha) recortando a imagem ao que aparece na tela */
  function desenharCamada(g, c, cam) {
    const r = retanguloTela(cam, c.limites);
    const pxPorTela = cam.mpp / c.mpp;                       // px da imagem por px da tela
    const nivel = clamp(Math.floor(Math.log2(Math.max(1, pxPorTela))), 0, c.mips.length - 1);
    const img = c.mips[nivel], sx = img.width / r.w, sy = img.height / r.h;
    const dx0 = Math.max(-2, r.x), dy0 = Math.max(-2, r.y), dx1 = Math.min(W + 2, r.x + r.w), dy1 = Math.min(H + 2, r.y + r.h);
    if (dx1 <= dx0 || dy1 <= dy0) return;
    const s0x = (dx0 - r.x) * sx, s0y = (dy0 - r.y) * sy, s1x = (dx1 - r.x) * sx, s1y = (dy1 - r.y) * sy;
    g.drawImage(img, s0x, s0y, s1x - s0x, s1y - s0y, dx0, dy0, dx1 - dx0, dy1 - dy0);
  }

  /** compõe as camadas (grossa → fina, com o crossfade de LOD) na tela g */
  function compor(g, cam) {
    const pesos = pesosLOD(camadas, cam.mpp);
    let ini = 0;                                                // a partir da mais fina que já cobre a tela inteira, cheia
    for (let i = camadas.length - 1; i > 0; i--) {
      const c = camadas[i], pena = PENA * Math.min(c.limites[2] - c.limites[0], c.limites[3] - c.limites[1]);
      if (pesos[i] > 0.999 && cobre(cam, c.limites, pena)) { ini = i; break; }
    }
    g.save();
    g.globalAlpha = 1; g.filter = 'none'; g.globalCompositeOperation = 'source-over';
    g.fillStyle = FUNDO; g.fillRect(0, 0, W, H);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    for (let i = ini; i < camadas.length; i++) {
      const p = i === ini ? 1 : pesos[i] * pesoCobertura(fracaoDaTela(cam, camadas[i].limites));
      if (p < 0.003 || !intersecta(cam, camadas[i].limites)) continue;
      g.globalAlpha = p;
      desenharCamada(g, camadas[i], cam);
    }
    g.restore();
  }

  /**
   * O mapa inteiro na câmera `cam`.
   * desfoque: velocidade de zoom (d ln mpp / dt, de velocidadeZoom). Vira desfoque radial (várias cópias em escalas um
   *   pouco diferentes, como um obturador aberto) + um leve desfoque gaussiano; é o que esconde a troca de nível.
   * obturador: fração de quadro (30 fps) que o "obturador" fica aberto. escurecerBase: opacidade do gradiente escuro
   *   no terço de baixo (legenda). vinheta: escurece as bordas.
   */
  function desenhar(g, cam, { desfoque = 0, obturador = 0.35, escurecerBase = 0.6, vinheta = 0.28 } = {}) {
    const abertura = Math.abs(desfoque) * obturador / 30;     // variação de ln(escala) durante o obturador
    if (abertura < 0.004) compor(g, cam);
    else {
      compor(gBase, cam);
      const n = clamp(Math.ceil(abertura * 60), 3, 12);
      g.save();
      g.fillStyle = FUNDO; g.fillRect(0, 0, W, H);
      const gauss = Math.min(4, abertura * 14);
      if (gauss > 0.4) g.filter = `blur(${gauss.toFixed(2)}px)`;
      for (let i = 0; i < n; i++) {                              // média das n cópias: a i-ésima entra com alfa 1/(i+1)
        const s = Math.exp(abertura * (i / (n - 1) - 0.5));
        g.globalAlpha = 1 / (i + 1);
        g.setTransform(s, 0, 0, s, (W / 2) * (1 - s), (H / 2) * (1 - s));
        g.drawImage(base, 0, 0);
      }
      g.restore();
    }
    g.save();
    if (vinheta > 0) {
      const v = g.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.45, H * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${vinheta})`);
      g.fillStyle = v; g.fillRect(0, 0, W, H);
    }
    if (escurecerBase > 0) {
      const gr = g.createLinearGradient(0, H * 0.6, 0, H);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.55, `rgba(0,0,0,${escurecerBase * 0.75})`); gr.addColorStop(1, `rgba(0,0,0,${escurecerBase})`);
      g.fillStyle = gr; g.fillRect(0, H * 0.6, W, H * 0.4);
    }
    g.restore();
  }

  function caminhoContorno(g, cam, id) {
    const ct = contornos[id];
    if (!ct) throw new Error(`mapa: contorno "${id}" não está no índice (ponha em "contornos" do mapa.json e rode baixar.py)`);
    let comp = 0;
    for (const anel of ct.aneis) {
      let ax, ay;
      anel.forEach(([x, y], i) => {
        const [px, py] = paraTela(cam, x, y);
        if (i) { g.lineTo(px, py); comp += Math.hypot(px - ax, py - ay); } else g.moveTo(px, py);
        ax = px; ay = py;
      });
      g.closePath();
    }
    return comp;
  }

  /**
   * Estado aceso (k 0..1 = entrada): fora escurece, dentro clareia, contorno branco com brilho.
   * tracado (0..1): quanto do contorno já foi riscado (padrão = k: o contorno "corre" em volta enquanto acende).
   */
  function realce(g, cam, id, k, { escurecer = 0.5, preencher = 0.16, cor = '#FFFFFF', largura = 4, brilho = 22, tracado = null } = {}) {
    if (k <= 0) return;
    g.save();
    g.beginPath(); g.rect(-10, -10, W + 20, H + 20); caminhoContorno(g, cam, id);
    g.fillStyle = `rgba(0,0,0,${escurecer * k})`; g.fill('evenodd');
    g.beginPath(); const comp = caminhoContorno(g, cam, id);
    g.fillStyle = `rgba(255,255,255,${preencher * k})`; g.fill('evenodd');
    const tr = tracado == null ? clamp(k * 1.25) : clamp(tracado);
    if (tr < 1) g.setLineDash([comp * tr, comp * 2]);
    g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = cor;
    g.shadowColor = cor; g.shadowBlur = brilho; g.globalAlpha = clamp(k * 1.5);
    g.lineWidth = largura * 1.8; g.globalAlpha = clamp(k * 1.5) * 0.35; g.stroke();
    g.shadowBlur = brilho * 0.5; g.lineWidth = largura; g.globalAlpha = clamp(k * 1.5); g.stroke();
    g.restore();
  }

  /**
   * Rota que se desenha: pontos [lon, lat], progresso 0..1 (fração do comprimento). Devolve a ponta na tela
   * { x, y, ang, lon, lat } (ang em rad, para um ícone andar por ela). cor: linha; brilho: halo (px); nucleo: linha clara
   * fina no meio (neon); tracejado: [traço, vão] em px; fase: deslocamento do tracejado (anime com t).
   */
  function rota(g, cam, pontos, progresso, { cor = '#3DFF7A', largura = 7, brilho = 26, nucleo = true, tracejado = null, fase = 0, alfa = 1 } = {}) {
    const r = medirRota(pontos), p = pontoNaRota(r, progresso);
    const [tx, ty] = paraTela(cam, p.x, p.y);
    if (progresso > 0 && alfa > 0) {
      const pts = p.pts.map(([x, y]) => paraTela(cam, x, y));
      g.save();
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.lineJoin = 'round'; g.lineCap = 'round';
      if (tracejado) { g.setLineDash(tracejado); g.lineDashOffset = -fase; }
      g.strokeStyle = cor; g.shadowColor = cor;
      g.globalAlpha = 0.45 * alfa; g.shadowBlur = brilho; g.lineWidth = largura * 2.2; g.stroke();
      g.globalAlpha = alfa; g.shadowBlur = brilho * 0.5; g.lineWidth = largura; g.stroke();
      if (nucleo) { g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = Math.max(1.5, largura * 0.3); g.stroke(); }
      g.restore();
    }
    const [lon, lat] = lonlat(p.x, p.y);
    return { x: tx, y: ty, ang: p.ang, lon, lat, km: r.km };
  }

  /** rótulo pequeno branco com sombra, preso ao terreno (lado: 'direita' | 'esquerda' | 'acima' | 'abaixo') */
  function rotulo(g, cam, lon, lat, texto, { k = 1, tamanho = 32, ponto = true, lado = 'direita', cor = '#FFFFFF', peso = 800 } = {}) {
    if (k <= 0) return;
    const [x, y] = paraTela(cam, ...merc(lon, lat));
    g.save();
    g.globalAlpha = clamp(k);
    g.font = `${peso} ${tamanho}px Inter, sans-serif`; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 8; g.shadowOffsetY = 2;
    const sob = (1 - clamp(k)) * 10;
    if (ponto) { g.fillStyle = cor; g.beginPath(); g.arc(x, y, tamanho * 0.17, 0, Math.PI * 2); g.fill(); }
    const d = ponto ? tamanho * 0.45 : 0;
    const pos = { direita: [x + d, y + sob, 'left'], esquerda: [x - d, y + sob, 'right'], acima: [x, y - d - tamanho * 0.5 + sob, 'center'], abaixo: [x, y + d + tamanho * 0.5 + sob, 'center'] }[lado];
    g.textAlign = pos[2]; g.fillStyle = cor; g.fillText(texto, pos[0], pos[1]);
    g.restore();
  }

  /** ponto com halo que pulsa (t em segundos; puro em t) */
  function marcador(g, cam, lon, lat, { k = 1, t = 0, cor = '#FFFFFF', raio = 9, periodo = 1.4 } = {}) {
    if (k <= 0) return;
    const [x, y] = paraTela(cam, ...merc(lon, lat));
    const f = (((t / periodo) % 1) + 1) % 1;
    g.save();
    g.globalAlpha = clamp(k) * (1 - f) * 0.8;
    g.strokeStyle = cor; g.lineWidth = 3; g.beginPath(); g.arc(x, y, raio * (1.2 + 2.6 * f), 0, Math.PI * 2); g.stroke();
    g.globalAlpha = clamp(k);
    g.shadowColor = cor; g.shadowBlur = 16; g.fillStyle = cor;
    g.beginPath(); g.arc(x, y, raio * (0.6 + 0.4 * clamp(k)), 0, Math.PI * 2); g.fill();
    g.restore();
  }

  return { indice, camadas, creditos: indice.creditos || '', desenhar, realce, rota, rotulo, marcador, veiculo, ano, rodape };
}

/** ícone simples desenhado em código, apontando para `ang` (rad, na tela): 'trem' | 'navio' | 'caminhao' */
export function veiculo(g, x, y, ang, { tipo = 'trem', cor = '#FFFFFF', detalhe = '#1B2A35', escala = 1, k = 1 } = {}) {
  if (k <= 0) return;
  g.save();
  g.translate(x, y); g.rotate(ang); g.scale(escala * (0.6 + 0.4 * clamp(k)), escala * (0.6 + 0.4 * clamp(k)));
  g.globalAlpha = clamp(k);
  g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 10; g.shadowOffsetY = 3;
  g.lineWidth = 2.5; g.strokeStyle = detalhe; g.fillStyle = cor; g.lineJoin = 'round';
  const caixa = (x0, y0, w, h, r) => { g.beginPath(); g.roundRect(x0, y0, w, h, r); g.fill(); g.stroke(); };
  if (tipo === 'navio') {
    g.beginPath(); g.moveTo(28, 0); g.lineTo(14, -11); g.lineTo(-24, -11); g.lineTo(-26, 0); g.lineTo(-24, 11); g.lineTo(14, 11); g.closePath();
    g.fill(); g.stroke();
    g.shadowBlur = 0; g.fillStyle = detalhe;
    for (let i = 0; i < 3; i++) g.fillRect(-18 + i * 10, -6, 7, 12);
    g.fillStyle = cor; g.fillRect(-23, -5, 5, 10);
  } else if (tipo === 'caminhao') {
    caixa(-26, -10, 34, 20, 3);
    caixa(10, -9, 16, 18, 4);
    g.shadowBlur = 0; g.fillStyle = detalhe; g.fillRect(19, -7, 4, 14);
  } else {
    caixa(-4, -9, 30, 18, 7);
    caixa(-34, -9, 27, 18, 4);
    g.shadowBlur = 0; g.fillStyle = detalhe;
    g.fillRect(18, -6, 4, 12);
    for (const x0 of [-30, -21, -12, 2, 10]) g.fillRect(x0, -4, 5, 8);
  }
  g.restore();
}

/** ano no canto superior esquerdo, serif itálica dourada (k 0..1 = entrada) */
export function ano(g, texto, k = 1, { x = 64, y = 200, tamanho = 104, cor = '#E9C46A' } = {}) {
  if (k <= 0) return;
  g.save();
  g.globalAlpha = clamp(k);
  g.font = `italic 700 ${tamanho}px Georgia, 'Times New Roman', serif`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  const gr = g.createLinearGradient(0, y - tamanho, 0, y);
  gr.addColorStop(0, '#FFE7A3'); gr.addColorStop(1, cor);
  g.shadowColor = 'rgba(0,0,0,0.75)'; g.shadowBlur = 14; g.shadowOffsetY = 4;
  g.fillStyle = gr; g.fillText(texto, x - (1 - clamp(k)) * 30, y);
  g.restore();
}

/** nota de rodapé pequena (créditos das imagens), no alto da tela à direita do ano, fora da área da legenda */
export function rodape(g, texto, { k = 1, x = W - 36, y = 64, tamanho = 19, alfa = 0.6 } = {}) {
  if (k <= 0 || !texto) return;
  g.save();
  g.globalAlpha = clamp(k) * alfa;
  g.font = `600 ${tamanho}px Inter, sans-serif`; g.textAlign = 'right'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 4; g.fillStyle = '#FFFFFF';
  const maxW = W - 72;
  let linhas = [texto];
  if (g.measureText(texto).width > maxW) linhas = texto.split('; ').reduce((acc, p) => {
    const ult = acc.at(-1);
    if (ult && g.measureText(`${ult}; ${p}`).width <= maxW) acc[acc.length - 1] = `${ult}; ${p}`; else acc.push(p);
    return acc;
  }, []);
  linhas.forEach((l, i) => g.fillText(l, x, y + i * tamanho * 1.3));
  g.restore();
}
