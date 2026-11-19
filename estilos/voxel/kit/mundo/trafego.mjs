// Tráfego da rua (puro, sem three): ciclo do semáforo, posição de cada carro (anda no verde, para na retenção e forma fila
// no vermelho) e de cada pedestre, tudo função de t. Usado por rua.js; testado em tests/trafego.test.mjs.
//
// Coordenada s: ao longo da mão, no sentido em que os carros andam (mão +x: s = x; mão −x: s = −x). A faixa de pedestres
// ocupa s ∈ FAIXA e a linha de retenção fica em s = RETENCAO. Cada carro k pertence a um grupo g = k mod grupos e tem
// a vaga q = ⌊k / grupos⌋ na fila. O grupo g sai da fila no começo do verde dos ciclos g, g + grupos, … (o da vaga q com
// atraso q·atraso), dá uma volta de `volta` metros (acelera, roda, freia: perfil trapezoidal) e para de novo na mesma
// vaga no vermelho do ciclo anterior à sua próxima saída. Com mais de um grupo, a volta dura vários ciclos e pode ser
// longa — o salto do wrap (s = ±volta/2) fica longe da faixa, fora do que a câmera vê.

export const CICLO = 12, FIM_VERDE = 7, FIM_AMARELO = 8.5;   // s: verde 0–7 · amarelo 7–8,5 · vermelho 8,5–12
export const RETENCAO = -2.6;                                 // linha de retenção (s)
export const FAIXA = [-2.5, 2.5];                             // trecho da faixa de pedestres (s), zebra de x −2 a 2 com folga
export const CARRO_MAX = 4.6;                                 // comprimento do maior carro (a van)
export const VAGA = CARRO_MAX + 1.4;                          // distância entre vagas da fila
export const MAX_POR_GRUPO = 4;                               // fila maior: o grupo que chega alcançaria a cauda do que sai

const mod = (x, m) => ((x % m) + m) % m;
const wrap = (x, L) => mod(x + L / 2, L) - L / 2;

/** estado do semáforo dos carros no instante t ('verde' | 'amarelo' | 'vermelho'); o dos pedestres abre só no vermelho */
export function estadoSemaforo(t) {
  const u = mod(t, CICLO);
  return u < FIM_VERDE ? 'verde' : u < FIM_AMARELO ? 'amarelo' : 'vermelho';
}

/** parâmetros de uma mão: v (m/s), a (m/s²), grupos, atraso entre saídas da fila (s), chegada = instante do ciclo em que o
 *  primeiro da fila para (s, no vermelho). A volta sai do tempo: a chegada cai `grupos − 1` ciclos depois da saída. */
export function mao({ v = 12, a = 3, grupos = 2, atraso = 0.5, chegada = 9.5 } = {}) {
  const volta = ((grupos - 1) * CICLO + chegada - v / a) * v;
  if (volta < (v * v) / a) throw new Error('volta curta demais para acelerar e frear');
  return { v, a, grupos, atraso, chegada, volta };
}
export const maxCarros = (M) => M.grupos * MAX_POR_GRUPO;
/** as duas mãos da rua: parâmetros diferentes para uma não ser o espelho da outra */
export const MAOS = [mao(), mao({ v: 11, atraso: 0.6, chegada: 10 })];

/** centro do carro parado na vaga q da fila (s) */
export const vagaFila = (q) => RETENCAO - CARRO_MAX / 2 - 0.3 - q * VAGA;

/** distância andada u segundos depois de sair da fila: acelera até v, roda, freia até parar a `volta` metros */
export function percurso(u, { v, a, volta }) {
  if (u <= 0) return 0;
  const ta = v / a, da = (v * v) / (2 * a), T = volta / v + ta;
  if (u >= T) return volta;
  if (u < ta) return 0.5 * a * u * u;
  if (u > T - ta) { const r = T - u; return volta - 0.5 * a * r * r; }
  return da + v * (u - ta);
}

/** posição s (centro) do carro k da mão M no instante t, em [−volta/2, volta/2) */
export function posicaoCarro(t, k, M) {
  if (k >= maxCarros(M)) throw new Error(`no máximo ${maxCarros(M)} carros por mão`);
  const g = k % M.grupos, q = Math.floor(k / M.grupos), periodo = M.grupos * CICLO;
  const u = mod(t - g * CICLO - q * M.atraso, periodo);
  return wrap(vagaFila(q) + percurso(u, M), M.volta);
}

/** x de um pedestre { x0, v } no instante t, numa volta de `volta` metros centrada em 0 */
export const posicaoPedestre = (t, { x0, v }, volta) => wrap(x0 + v * t, volta);
