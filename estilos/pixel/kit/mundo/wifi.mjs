// Lógica pura do roteador e do Wi-Fi (sem three.js; testada em tests/wifi.test.mjs).
//   ledDoRoteador(i, t) -> 0 | 1          LEDs da frente: 0 energia (fixo), 1 internet (pisca raro), 2 Wi-Fi 2,4 e 3 Wi-Fi 5 (tráfego)
//   comprimentoDeOnda(ghz) -> metros      c / f (2,4 GHz ~ 12,5 cm; 5 GHz ~ 6 cm)
//   ondaDaPlanta(x, t, { ghz, amp, vel })  a senoide da planta(): número de onda proporcional a ghz, mesma velocidade
//   perdaNaParede(ghz) -> dB · fatorDaParede(dB) -> fator de amplitude · forcaDoSinal(d, ...) · barrasDeSinal(dBm)
// Os números de perda são didáticos (ordem de grandeza de uma parede interna de alvenaria); na vida real variam muito
// com o material e a espessura. Servem para a cena "perder força" de forma coerente, não para medir rede.

export const N_LEDS = 4;
export const GHZ_MICROONDAS = 2.45;
const C = 0.299792458;                                     // velocidade da luz em m por ns: λ (m) = C / f (GHz)
const frac = (x) => x - Math.floor(x);
/** semente determinística 0..1 por (i, k) */
const sem = (i, k) => frac(Math.sin(i * 12.9898 + k * 78.233) * 43758.5453);

/**
 * Estado (0 apagado / 1 aceso) do LED i do roteador no tempo t. Puro em t; muda no máximo 12 vezes por segundo
 * (fatias de 1/12 s). LED 0 = energia (sempre aceso), 1 = internet (aceso, apaga numa fatia em ~6%),
 * 2 e 3 = Wi-Fi 2,4 e 5 GHz (piscam com o tráfego, em rajadas: a chance de aceso sobe e desce devagar).
 */
export function ledDoRoteador(i, t) {
  if (i === 0) return 1;
  const fatia = Math.floor(t * 12), ts = fatia / 12;
  if (i === 1) return sem(31, fatia) > 0.94 ? 0 : 1;
  const chance = 0.56 + 0.22 * Math.sin(ts * 1.3 + i * 2.1);
  return sem(i * 7 + 3, fatia) < chance ? 1 : 0;
}

/** comprimento de onda em metros (λ = c / f) */
export const comprimentoDeOnda = (ghz) => C / ghz;

/** fator de escala da onda na planta: 1 em 2,45 GHz (a senoide antiga da planta) */
const escalaGhz = (ghz) => ghz / GHZ_MICROONDAS;

/**
 * Altura da senoide da planta() em x, no tempo t: sin(1,6·g·x - 2π·vel·g·t)·amp, com g = ghz / 2,45.
 * Em 2,45 GHz e vel 1 é exatamente a senoide antiga (freq 1). Frequência maior = onda mais curta e oscilação mais
 * rápida, com a crista andando na mesma velocidade (2π / 1,6 por segundo, como a luz: c é a mesma).
 */
export function ondaDaPlanta(x, t, { ghz = GHZ_MICROONDAS, amp = 0.9, vel = 1 } = {}) {
  const g = escalaGhz(ghz);
  return Math.sin(x * 1.6 * g - t * vel * g * 2 * Math.PI) * amp;
}
/** distância entre duas cristas na planta (unidades da planta) */
export const periodoNaPlanta = (ghz) => (2 * Math.PI) / (1.6 * escalaGhz(ghz));

/** perda de uma parede interna em dB (didático): 6 dB em 2,4 GHz, 10 dB em 5 GHz, reta entre eles (nunca negativa) */
export const perdaNaParede = (ghz) => Math.max(0, 6 + ((ghz - 2.4) * 4) / 2.6);
/** fator de amplitude depois de perder `db` decibéis (6 dB ~ metade) */
export const fatorDaParede = (db) => Math.pow(10, -db / 20);

/**
 * Sinal recebido a `d` metros do roteador: perda no espaço livre (FSPL = 20·log10(d) + 20·log10(f em MHz) - 27,55)
 * mais `paredes` x perdaNaParede(ghz), partindo de `potencia` dBm (20 dBm = 100 mW).
 * -> { dbm, forca } com forca = (dbm + 90) / 60 limitado a 0..1 (-90 dBm = nada, -30 dBm = cheio).
 */
export function forcaDoSinal(d, { ghz = 2.4, paredes = 0, potencia = 20 } = {}) {
  const fspl = 20 * Math.log10(Math.max(d, 0.01)) + 20 * Math.log10(ghz * 1000) - 27.55;
  const dbm = potencia - fspl - paredes * perdaNaParede(ghz);
  return { dbm, forca: Math.max(0, Math.min(1, (dbm + 90) / 60)) };
}

/** barrinhas de sinal (0..4) pelo dBm: >= -55 quatro, >= -65 três, >= -75 duas, >= -85 uma */
export function barrasDeSinal(dbm) {
  if (dbm >= -55) return 4;
  if (dbm >= -65) return 3;
  if (dbm >= -75) return 2;
  if (dbm >= -85) return 1;
  return 0;
}
