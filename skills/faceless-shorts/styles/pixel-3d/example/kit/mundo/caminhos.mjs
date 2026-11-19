// Lógica pura dos efeitos que andam no tempo (sem three.js; testada em tests/caminhos.test.mjs).
//   posicaoNoFluxo(i, n, t, vel, fechado) -> u em [0, 1) (ou null)   ·   raioDaOnda(j, n, t, vel, alcance) -> { r, alfa }
//   fracoesDoCaminho(pontos, fechado) -> u de cada ponto (comprimento acumulado), para as paradas do gradiente
//   pontosSerpentina(x0, x1, y0, y1, n, z) -> pontos [x, y, z] de uma serpentina (condensador, evaporador)
// vel é em "voltas por segundo": o caminho inteiro (u de 0 a 1) ou um ciclo da onda (r de 0 ao alcance) leva 1 / vel s.

const frac = (x) => ((x % 1) + 1) % 1;

/**
 * Posição u (0 = começo, 1 = fim do caminho) da partícula i de n, no tempo t.
 * Em t = 0 as n partículas estão igualmente espaçadas (u = i / n) e todas andam vel por segundo.
 * fechado: dá a volta (u sempre em [0, 1)); aberto: a partícula sai de cena no fim (u >= 1 -> null) e não volta
 * (antes de entrar, u < 0, também é null).
 */
export function posicaoNoFluxo(i, n, t, vel, fechado = true) {
  const u = i / n + t * vel;
  if (fechado) return frac(u);
  return u < 0 || u >= 1 ? null : u;
}

/**
 * Casca j de n de uma onda esférica: raio r de 0 ao alcance, periódico (período 1 / vel), cascas igualmente
 * espaçadas; alfa = 1 na origem e cai até 0 no alcance.
 */
export function raioDaOnda(j, n, t, vel, alcance) {
  const ph = frac(t * vel + j / n);
  return { r: ph * alcance, alfa: Math.pow(1 - ph, 1.4) };
}

/**
 * u (0 = começo, 1 = fim) de cada ponto de um caminho pelo comprimento acumulado da poligonal, para pôr as paradas
 * de um `gradiente` exatamente nos pontos do caminho (ex.: a cor do gás muda na válvula). Pontos [x, y, z] ou
 * { x, y, z }. fechado: o perímetro inclui a volta do último ao primeiro (o último ponto fica < 1).
 * Numa CatmullRom centrípeta com pontos próximos o comprimento da curva é quase o da poligonal.
 */
export function fracoesDoCaminho(pontos, fechado = false) {
  const p = pontos.map((q) => (Array.isArray(q) ? q : [q.x, q.y, q.z]));
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const acc = [0];
  for (let i = 1; i < p.length; i++) acc.push(acc[i - 1] + dist(p[i - 1], p[i]));
  const total = acc[acc.length - 1] + (fechado && p.length > 1 ? dist(p[p.length - 1], p[0]) : 0);
  return acc.map((a) => (total > 0 ? a / total : 0));
}

/**
 * pontos [x, y, z] de uma serpentina no plano z: n trechos retos alternando entre x0 e x1, de y0 até y1, com um
 * ponto no meio de cada volta (a CatmullRom centrípeta arredonda sem estourar). Começa em x0.
 */
export function pontosSerpentina(x0, x1, y0, y1, n, z) {
  const pts = [], dy = n > 1 ? (y1 - y0) / (n - 1) : 0, r = Math.abs(dy) / 2;
  for (let i = 0; i < n; i++) {
    const y = y0 + i * dy, a = i % 2 ? x1 : x0, b = i % 2 ? x0 : x1, s = Math.sign(b - a);
    pts.push([a, y, z], [b - s * r * 0.4, y, z]);
    if (i < n - 1) pts.push([b + s * r * 0.6, y + dy / 2, z]);   // meio da volta, um pouco para fora
  }
  return pts;
}
