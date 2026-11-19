// Ritmos de animação: tudo função pura de t (e de índices), sem contador global.

// Dedos batendo no teclado: ângulos pequenos (±6°) em senos de frequências diferentes.
export function digitacaoNoTempo(t) {
  return {
    elL: 3.5 * Math.sin(t * 17.3) + 2.5 * Math.sin(t * 7.1 + 1),
    elR: 3.5 * Math.sin(t * 14.9 + 2) + 2.5 * Math.sin(t * 8.3 + 4),
    punhoL: 3 * Math.sin(t * 9.7 + 0.5) + 3 * Math.sin(t * 4.3),
    punhoR: 3 * Math.sin(t * 11.1 + 3) + 3 * Math.sin(t * 5.2 + 2),
  };
}

// Hash com semente: (a, b) -> [0, 1).
function hash01(a, b) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// LED i aceso? Muda 8 vezes por segundo; cerca de 70% acesos.
export const ledAceso = (i, t) => hash01(i + 1, Math.floor(t * 8)) < 0.7;

// Lâmpada defeituosa (como corridor().update do Night File): cai em rajadas curtas.
// Devolve 1 (acesa) ou o fator baixo (1/9) na queda; forca 0 nunca pisca.
export function piscaLampada(t, forca = 1) {
  forca = Math.min(1, Math.max(0, forca));
  const cai = Math.sin(t * 37) > 0.6 || Math.sin(t * 11.3) > 0.9;
  return cai ? 1 - forca * (1 - 1 / 9) : 1;
}

// Resto sempre positivo (o % do JS devolve negativo para t < 0).
const modPos = (a, m) => ((a % m) + m) % m;

// Gota de chuva i no instante t, dentro da caixa {x, y, w, h}: cai e reaparece no topo. O vento inclina a queda para a
// esquerda (5% de h ao longo da queda); quem sai pela esquerda volta pela direita, então x e y nunca saem da caixa.
export function gotaDeChuva(i, t, caixa) {
  const vel = 1.6 + hash01(i, 11) * 1.2;              // ciclos de queda por segundo
  const fase = hash01(i, 7);
  const q = modPos(t * vel + fase, 1);                 // 0 = topo, 1 = chão
  const x = caixa.x + modPos(hash01(i, 3) * caixa.w - 0.05 * caixa.h * q, caixa.w);
  return [x, caixa.y + q * caixa.h];
}

// LED i do rack no instante t: 'verde' | 'apagado' pelo ledAceso; com alarme (0..1) uma parte fixa dos LEDs (até 45%,
// crescendo com o alarme) vira 'vermelho' e pisca junto, 3 vezes por segundo.
export function estadoDoLed(i, t, alarme = 0) {
  if (alarme > 0 && hash01(i + 1, 99) < 0.45 * alarme) return modPos(t * 3, 1) < 0.55 ? 'vermelho' : 'apagado';
  return ledAceso(i, t) ? 'verde' : 'apagado';
}

// Quanto do fio j (de n) já apareceu quando o barbante (0..1) está em b: os fios entram um depois do outro, em ordem.
export const trechoDoFio = (j, n, b) => Math.min(1, Math.max(0, b * n - j));
