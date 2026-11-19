// Lógica pura do chuveiro elétrico e da resistência por dentro (sem three.js; testada em tests/chuveiro.test.mjs).
//   trechoDaChave(pos) -> fração da resistência no circuito (0 desligado, 1 verão = inteira, TRECHO_INVERNO no inverno)
//   calorDaChave(pos)  -> potência (e corrente) relativa, 0..1 (1 = inverno)
//   dentroDoTrecho(u, trecho, borda) -> 0..1: o ponto u (0 = borne de entrada, 1 = fim do fio) está no trecho usado?
//   amplitudeDaVibracao(calor) · vibracaoDoAtomo(i, t, calor) -> [dx, dy, dz]   (átomos da rede tremendo com o calor)
//   pontoDaGota(i, n, t, { raio, altura, vel, abre }) -> { x, y, z, fase }      (água caindo dos furos do crivo)
//   pontosEspiral(voltas, raio, y0, y1, porVolta) -> [[x, y, z], ...]            (a resistência em espiral)
// O chuveiro elétrico brasileiro tem 3 bornes na resistência: no verão a corrente passa pelo fio inteiro; no inverno a
// chave pula para o borne do meio e usa só um trecho. Fio mais curto = resistência menor; com a mesma tensão,
// P = V²/R: passa mais corrente e esquenta mais (ex.: 3.200 W no verão e 5.500 W no inverno: 3200 / 5500 ≈ 0,58).

/** fração da resistência usada no inverno (o resto do fio fica fora do circuito) */
export const TRECHO_INVERNO = 0.58;

const lim = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const suave = (x) => x * x * (3 - 2 * x);
/** semente determinística 0..1 */
const sem = (i, k = 0) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

/**
 * Trecho da resistência no circuito para a posição da chave (0 desligado, 1 verão, 2 inverno; valores no meio servem
 * para animar a chave virando). Desligado = 0; de 0 a 1 o fio inteiro (1); de 1 a 2 encolhe até TRECHO_INVERNO.
 */
export function trechoDaChave(pos) {
  if (pos <= 0) return 0;
  if (pos <= 1) return 1;
  return 1 + (TRECHO_INVERNO - 1) * lim(pos - 1);
}

/**
 * Calor (potência) relativo para a posição da chave, normalizado para 1 no inverno. Com a mesma tensão, P = V²/R e
 * R é proporcional ao trecho: calor = TRECHO_INVERNO / trecho (a corrente relativa é a mesma conta, I = V/R).
 * De 0 a 1 sobe em linha reta até o verão (TRECHO_INVERNO), para a chave poder ser animada sem saltos.
 */
export function calorDaChave(pos) {
  if (pos <= 0) return 0;
  if (pos <= 1) return TRECHO_INVERNO * pos;
  return TRECHO_INVERNO / trechoDaChave(pos);
}

/**
 * Quanto o ponto u do fio (0 = borne de entrada, 1 = ponta) está dentro do trecho usado: 1 até trecho - borda, 0 de
 * trecho em diante, suave entre os dois. trecho >= 1 = fio inteiro (1 até a ponta); trecho <= 0 = nada (0).
 */
export function dentroDoTrecho(u, trecho, borda = 0.03) {
  if (trecho <= 0) return 0;
  if (trecho >= 1) return 1;
  const x = (trecho - u) / borda;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return suave(x);
}

/** amplitude da vibração de um átomo (em espaçamentos da rede): frio já treme um pouco; satura em calor 1 */
export function amplitudeDaVibracao(calor) { return 0.04 + 0.26 * lim(calor); }

/**
 * Deslocamento [dx, dy, dz] do átomo i no tempo t (em espaçamentos da rede; multiplique pelo passo). Cada componente
 * é uma soma de dois senos de frequência fixa (4 a 11 Hz, fase própria por átomo), com |componente| <= amplitude.
 * Só a amplitude depende do calor: uma rampa de calor não faz o átomo pular.
 */
export function vibracaoDoAtomo(i, t, calor) {
  const A = amplitudeDaVibracao(calor);
  return [0, 1, 2].map((k) => {
    const f1 = 4 + 4 * sem(i, k + 1), f2 = 7 + 4 * sem(i, k + 4);
    const p1 = 6.2832 * sem(i, k + 7), p2 = 6.2832 * sem(i, k + 10);
    return A * (0.6 * Math.sin(6.2832 * f1 * t + p1) + 0.4 * Math.sin(6.2832 * f2 * t + p2));
  });
}

/**
 * Gota i de n saindo do crivo (centro na origem, crivo no plano y = 0, água caindo para -y). Os furos ficam espalhados
 * no disco de raio `raio` (girassol: r = raio·√((i + 0,5)/n), ângulo de ouro). fase = (t·vel + semente) mod 1: a gota
 * cai `altura` num ciclo, acelerando (y = -altura·(0,55·f + 0,45·f²)), e se afasta do eixo (r·(1 + abre·f)).
 * -> { x, y, z, fase }  (fase 0 = saindo do furo, perto de 1 = chegando no chão)
 */
export function pontoDaGota(i, n, t, { raio = 0.08, altura = 2, vel = 1.2, abre = 0.35 } = {}) {
  const s = t * vel + sem(i, 3);
  const fase = s - Math.floor(s);
  const r = raio * Math.sqrt((i + 0.5) / n) * (1 + abre * fase), a = i * 2.39996323;
  return { x: r * Math.cos(a), y: -altura * (0.55 * fase + 0.45 * fase * fase), z: r * Math.sin(a), fase };
}

/** hélice vertical de `voltas` voltas inteiras, raio fixo, de y0 a y1 (porVolta pontos por volta, mais o último) */
export function pontosEspiral(voltas, raio, y0, y1, porVolta = 12) {
  const N = Math.round(voltas * porVolta), p = [];
  for (let k = 0; k <= N; k++) {
    const a = (2 * Math.PI * k) / porVolta;
    p.push([raio * Math.cos(a), y0 + ((y1 - y0) * k) / N, raio * Math.sin(a)]);
  }
  return p;
}
