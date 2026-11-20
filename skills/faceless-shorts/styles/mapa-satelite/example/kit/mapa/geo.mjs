// Geometria do mapa de satélite (puro, sem DOM; testes em tests/mapa-geo.test.mjs).
// Tudo em Web Mercator (EPSG:3857, metros). Uma câmera é { x, y, mpp }: o centro da tela em metros Mercator e quantos
// metros Mercator cabem num pixel da tela 1080x1920. mpp menor = mais perto. Os metros Mercator crescem com a latitude
// (1 m de chão = 1/cos(lat) m Mercator); por isso as distâncias de rota de verdade saem de distanciaKm (haversine).
export const R = 6378137;
export const TELA = { W: 1080, H: 1920 };
const DEG = Math.PI / 180;
const LAT_MAX = 85.05112878;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
/** easing padrão (cúbico entra-e-sai, o mesmo eio do motor) */
export const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const liso = (t) => t * t * (3 - 2 * t);

/** [lon, lat] em graus → [x, y] em metros Mercator */
export function merc(lon, lat) {
  const la = clamp(lat, -LAT_MAX, LAT_MAX) * DEG;
  return [R * lon * DEG, R * Math.log(Math.tan(Math.PI / 4 + la / 2))];
}

/** [x, y] Mercator → [lon, lat] em graus */
export function lonlat(x, y) {
  return [x / R / DEG, (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) / DEG];
}

/** câmera centrada em (lon, lat) com mpp metros Mercator por pixel */
export function cam(lon, lat, mpp) {
  const [x, y] = merc(lon, lat);
  return { x, y, mpp };
}

/** ponto Mercator → pixel da tela */
export function paraTela(c, x, y, tela = TELA) {
  return [tela.W / 2 + (x - c.x) / c.mpp, tela.H / 2 - (y - c.y) / c.mpp];
}

/** pixel da tela → ponto Mercator */
export function daTela(c, px, py, tela = TELA) {
  return [c.x + (px - tela.W / 2) * c.mpp, c.y - (py - tela.H / 2) * c.mpp];
}

/** (lon, lat) → pixel da tela */
export function geoTela(c, lon, lat, tela = TELA) {
  const [x, y] = merc(lon, lat);
  return paraTela(c, x, y, tela);
}

/** limites Mercator [x0, y0, x1, y1] que a tela mostra */
export function limitesDaVista(c, tela = TELA) {
  const mx = (tela.W / 2) * c.mpp, my = (tela.H / 2) * c.mpp;
  return [c.x - mx, c.y - my, c.x + mx, c.y + my];
}

/** retângulo da tela ocupado por limites Mercator [x0, y0, x1, y1] */
export function retanguloTela(c, lim, tela = TELA) {
  const [ax, ay] = paraTela(c, lim[0], lim[3], tela), [bx, by] = paraTela(c, lim[2], lim[1], tela);
  return { x: ax, y: ay, w: bx - ax, h: by - ay };
}

/** os limites cruzam a tela? */
export function intersecta(c, lim, tela = TELA) {
  const v = limitesDaVista(c, tela);
  return lim[0] < v[2] && lim[2] > v[0] && lim[1] < v[3] && lim[3] > v[1];
}

/** fração da tela (0..1) ocupada pelos limites Mercator */
export function fracaoDaTela(c, lim, tela = TELA) {
  const v = limitesDaVista(c, tela);
  const w = Math.max(0, Math.min(lim[2], v[2]) - Math.max(lim[0], v[0])), h = Math.max(0, Math.min(lim[3], v[3]) - Math.max(lim[1], v[1]));
  return (w * h) / ((v[2] - v[0]) * (v[3] - v[1]));
}

/** peso de entrada de uma camada fina pela fração da tela que ela ocupa: uma camada que ainda é um retângulo pequeno
 *  no meio da tela (bordas e nuvens diferentes da de baixo à mostra) fica escondida; entra quando já domina a tela. */
export function pesoCobertura(fracao, { de = 0.3, ate = 0.75 } = {}) {
  return liso(clamp((fracao - de) / (ate - de)));
}

/** os limites (encolhidos de `margem` metros em cada lado) cobrem a tela inteira? */
export function cobre(c, lim, margem = 0, tela = TELA) {
  const v = limitesDaVista(c, tela);
  return lim[0] + margem <= v[0] && lim[2] - margem >= v[2] && lim[1] + margem <= v[1] && lim[3] - margem >= v[3];
}

/** câmera que enquadra uma lista de [lon, lat] com folga (margem = fração da tela livre em cada lado).
 *  `deslocar` = [dx, dy] em fração da tela: desloca o enquadramento (ex.: [0, -0.1] sobe o conteúdo, para fugir da legenda). */
export function enquadrar(pontos, { margem = 0.12, deslocar = [0, 0], mppMin = 0, tela = TELA } = {}) {
  const xy = pontos.map(([lon, lat]) => merc(lon, lat));
  const xs = xy.map((p) => p[0]), ys = xy.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const util = 1 - 2 * margem;
  const mpp = Math.max(mppMin, (x1 - x0) / (tela.W * util), (y1 - y0) / (tela.H * util), 1e-6);
  return { x: (x0 + x1) / 2 - deslocar[0] * tela.W * mpp, y: (y0 + y1) / 2 + deslocar[1] * tela.H * mpp, mpp };
}

/**
 * Voo de câmera: p (0..1) de `de` até `para`.
 * - Zoom interpolado em escala log (ln mpp), com o easing `facil` (padrão: suave, cúbico entra-e-sai).
 * - Posição suavizada: aproximando, o destino desliza na tela até o centro enquanto o zoom acontece (não "escorrega"
 *   para fora); afastando, é o ponto de partida que desliza do centro para o seu lugar final (o voo de volta é o
 *   espelho do de ida). Sem diferença de zoom, vira um pan simples.
 * - `arco`: afasta no meio do caminho e reaproxima (saltos longos). true = automático (no meio do voo os dois pontos
 *   cabem na tela); número = quantas vezes mais longe que a reta em escala log, no meio (ex.: 3).
 */
export function voo(p, de, para, { arco = 0, facil = suave, tela = TELA } = {}) {
  const e = facil(clamp(p));
  const l0 = Math.log(de.mpp), l1 = Math.log(para.mpp);
  let extra = 0;
  if (arco === true) {
    const dist = Math.max(Math.abs(para.x - de.x) / (tela.W * 0.8), Math.abs(para.y - de.y) / (tela.H * 0.8));
    extra = Math.max(0, Math.log(Math.max(dist, 1e-9)) - (l0 + l1) / 2);
  } else if (arco > 0) extra = Math.log(Math.max(1, arco));
  const mpp = Math.exp(lerp(l0, l1, e) + extra * 4 * e * (1 - e));
  if (extra > 0) return { x: lerp(de.x, para.x, e), y: lerp(de.y, para.y, e), mpp };
  let x, y;
  if (para.mpp <= de.mpp) {           // aproximando: âncora no destino
    const f = (mpp / de.mpp) * (1 - e);
    x = para.x - (para.x - de.x) * f; y = para.y - (para.y - de.y) * f;
  } else {                            // afastando: âncora na partida
    const f = (mpp / para.mpp) * e;
    x = de.x + (para.x - de.x) * f; y = de.y + (para.y - de.y) * f;
  }
  return { x, y, mpp };
}

/** câmera por trechos: [[t0, cam0], [t1, cam1], ...] com voo entre cada par (opções por trecho no 3º item: [t, cam, opcoes]).
 *  Antes do 1º instante devolve cam0; depois do último, o último. */
export function roteiroDeCamera(chaves) {
  return (t) => {
    if (t <= chaves[0][0]) return { ...chaves[0][1] };
    for (let i = 1; i < chaves.length; i++) {
      const [ta, ca] = chaves[i - 1], [tb, cb, op] = chaves[i];
      if (t <= tb) return voo((t - ta) / (tb - ta || 1e-9), ca, cb, op);
    }
    return { ...chaves[chaves.length - 1][1] };
  };
}

/** velocidade de zoom: d(ln mpp)/dt em 1/s (positivo afastando, negativo aproximando), por diferença central.
 *  `f(t)` devolve a câmera no instante t. É o que alimenta o desfoque de movimento. */
export function velocidadeZoom(f, t, dt = 1 / 60) {
  return (Math.log(f(t + dt).mpp) - Math.log(f(t - dt).mpp)) / (2 * dt);
}

/**
 * Peso (opacidade 0..1) de cada camada para a vista com `mpp`. `camadas` vem do mais grosso ao mais fino (como no
 * índice), cada uma com mppEfetivo (ou mpp). A mais grossa vale sempre 1 (preenche o fundo); cada camada mais fina entra
 * com fade quando o mpp da vista fica perto do nativo dela: some com mpp >= some·nativo, cheia com mpp <= cheio·nativo.
 */
export function pesosLOD(camadas, mpp, { cheio = 2, some = 4 } = {}) {
  const lm = Math.log(mpp), span = Math.log(some / cheio);
  return camadas.map((c, i) => {
    if (i === 0) return 1;
    const m = c.mppEfetivo ?? c.mpp;
    return liso(clamp((Math.log(some * m) - lm) / span));
  });
}

/** distância de chão em km entre dois [lon, lat] (haversine) */
export function distanciaKm(a, b) {
  const la1 = a[1] * DEG, la2 = b[1] * DEG, dla = la2 - la1, dlo = (b[0] - a[0]) * DEG;
  const h = Math.sin(dla / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dlo / 2) ** 2;
  return (2 * R * Math.asin(Math.min(1, Math.sqrt(h)))) / 1000;
}

/** rota pronta para desenhar: pontos Mercator e comprimento acumulado (em metros Mercator, que é o que a tela vê) */
export function medirRota(pontos) {
  const xy = pontos.map(([lon, lat]) => merc(lon, lat));
  const acc = [0];
  for (let i = 1; i < xy.length; i++) acc.push(acc[i - 1] + Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]));
  const km = pontos.reduce((s, p, i) => (i ? s + distanciaKm(pontos[i - 1], p) : 0), 0);
  return { xy, acc, total: acc[acc.length - 1], km };
}

/** ponto da rota na fração `frac` (0..1) do comprimento: { x, y } Mercator, `ang` na tela (rad, y para baixo),
 *  `i` = índice do segmento e `pts` = o trecho já percorrido (Mercator, terminando no ponto). */
export function pontoNaRota(rota, frac) {
  const { xy, acc, total } = rota;
  if (xy.length === 1) return { x: xy[0][0], y: xy[0][1], ang: 0, i: 0, pts: [xy[0]] };
  const alvo = clamp(frac) * total;
  let i = 1;
  while (i < xy.length - 1 && acc[i] < alvo) i++;
  const a = xy[i - 1], b = xy[i], s = acc[i] - acc[i - 1];
  const k = s > 0 ? clamp((alvo - acc[i - 1]) / s) : 0;
  const x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k);
  return { x, y, ang: Math.atan2(-(b[1] - a[1]), b[0] - a[0]), i, pts: [...xy.slice(0, i), [x, y]] };
}

/** arco entre dois [lon, lat] (bezier quadrática em Mercator); curvatura > 0 curva para a esquerda de quem vai de a a b */
export function curva(a, b, { curvatura = 0.18, n = 40 } = {}) {
  const [ax, ay] = merc(...a), [bx, by] = merc(...b);
  const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay;
  const cx = mx - dy * curvatura, cy = my + dx * curvatura;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push(lonlat(u * u * ax + 2 * u * t * cx + t * t * bx, u * u * ay + 2 * u * t * cy + t * t * by));
  }
  return out;
}

/** passa uma curva suave (Catmull-Rom em Mercator) pelos [lon, lat] dados; `n` pontos por trecho */
export function suavizar(pontos, n = 12) {
  if (pontos.length < 3) return pontos.map((p) => [...p]);
  const xy = pontos.map(([lon, lat]) => merc(lon, lat));
  const P = (i) => xy[clamp(i, 0, xy.length - 1)];
  const out = [];
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      const f = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push(lonlat(f(0), f(1)));
    }
  }
  out.push([...pontos[pontos.length - 1]]);
  return out;
}
