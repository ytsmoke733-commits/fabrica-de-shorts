// Lógica pura da junção P-N do chipLED() (sem three.js; testada em tests/led.test.mjs).
//   parDoEncontro(i, n, t, { periodo, yN, yP, yTopo, k }) -> { fase, x, eletron, lacuna, foton, flash }
//   parAtivo(i, n, k) -> boolean          quais pares conduzem com a corrente k (0..1)
//   heroiDaFase(t, n, periodo, janela, f0, f1, k) -> i   par que fica na fase [f0, f1) a janela inteira (para etiquetas)
//   corDoFoton(y, y0, y1) -> 0..1          0 = azul (saiu da junção), 1 = branco (passou pela camada de fósforo)
// Cada par = um elétron (camada N, embaixo) e uma lacuna (camada P, em cima) na mesma coluna. O ciclo de cada par
// dura `periodo` s; os n pares estão defasados (fase i / n). Na 1ª metade os dois andam até a junção (y = 0), cada vez
// mais rápido (a lacuna "puxa" o elétron); no encontro (fase 0,5) somem os dois e nasce um fóton que sobe em
// velocidade constante até yTopo, com um clarão curto no ponto do encontro.

export const FASE_ENCONTRO = 0.5;
const frac = (x) => x - Math.floor(x);

/** passo que embaralha as colunas (coprimo com n, para visitar todas) */
function passoEmbaralha(n) {
  const mdc = (a, b) => (b ? mdc(b, a % b) : a);
  for (const p of [5, 3, 7, 11, 13]) if (p < n && mdc(p, n) === 1) return p;
  return 1;
}

/** o par i conduz com a corrente k? (k 0 = nenhum, 1 = todos; quem entra fica, em ordem embaralhada) */
export function parAtivo(i, n, k) {
  if (k >= 1) return true;
  return ((i * passoEmbaralha(n)) % n) / n < k;
}

/**
 * Estado do par i de n no tempo t. y em unidades da cena (junção em y = 0, N embaixo, P em cima).
 * -> { fase (0..1), x (coluna, 0..1), eletron: { y, vis, escala }, lacuna: { y, vis, escala }, foton: { y, vis }, flash (0..1) }
 * Par inativo (k): elétron parado em yN e lacuna em yP, sem fóton.
 */
export function parDoEncontro(i, n, t, { periodo = 2.4, yN = -2, yP = 1.5, yTopo = 5, k = 1 } = {}) {
  const fase = frac(t / periodo + i / n);
  const x = (((i * passoEmbaralha(n)) % n) + 0.5) / n;
  if (!parAtivo(i, n, k)) {
    return { fase, x, eletron: { y: yN, vis: true, escala: 1 }, lacuna: { y: yP, vis: true, escala: 1 }, foton: { y: 0, vis: false }, flash: 0 };
  }
  if (fase < FASE_ENCONTRO) {
    const s = fase / FASE_ENCONTRO, e = s * s;                 // acelera para a junção
    const escala = Math.min(1, fase / 0.05);                   // nasce sem salto
    return { fase, x, eletron: { y: yN * (1 - e), vis: true, escala }, lacuna: { y: yP * (1 - e), vis: true, escala }, foton: { y: 0, vis: false }, flash: 0 };
  }
  const q = (fase - FASE_ENCONTRO) / (1 - FASE_ENCONTRO);
  return { fase, x, eletron: { y: 0, vis: false, escala: 0 }, lacuna: { y: 0, vis: false, escala: 0 }, foton: { y: yTopo * q, vis: true }, flash: Math.max(0, 1 - q / 0.15) };
}

/**
 * Par "herói" para uma etiqueta: no começo de cada janela (t0 = floor(t / janela) · janela) escolhe, entre os pares
 * ativos, o de menor fase que fica dentro de [f0, f1) de t0 até t0 + janela (o mais novo). Troca só na virada da
 * janela. -1 se nenhum serve. Ex.: fóton = [FASE_ENCONTRO, 1); elétron/lacuna andando = [0, FASE_ENCONTRO).
 * Com janela <= periodo · (f1 - f0) - periodo / n sempre existe um (com todos ativos).
 */
export function heroiDaFase(t, n, periodo, janela, f0, f1, k = 1) {
  const t0 = Math.floor(t / janela) * janela, dur = janela / periodo, eps = 1e-9;
  let melhor = -1, fm = Infinity;
  for (let i = 0; i < n; i++) {
    if (!parAtivo(i, n, k)) continue;
    const f = frac(t0 / periodo + i / n);
    if (f >= f0 - eps && f + dur < f1 + eps && f < fm) { fm = f; melhor = i; }
  }
  return melhor;
}

/** cor do fóton pela altura: 0 (azul) até y0 (base do fósforo), 1 (branco) a partir de y1 (topo), reta entre eles */
export function corDoFoton(y, y0, y1) {
  return Math.max(0, Math.min(1, (y - y0) / (y1 - y0)));
}
