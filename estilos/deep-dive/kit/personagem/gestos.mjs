// Gestos da mão em coordenadas do OSSO (head ou spine), não do mundo. Cada gesto tem um lado nativo (`lado`);
// gestoNoLado(g, 'L'|'R') espelha x (alvo/dedos/palma/pole) para usar o mesmo gesto com a outra mão.
//   alvo  = ponto de pegada da mão · dedos = para onde os dedos apontam · palma = para onde a palma olha
//   pole  = (opcional) para onde o cotovelo aponta; sem ele vale o padrão do reach() do Human
// repouso/garganta/barriga: de rest/throat/belly (shots.js 105-107, herói na origem, lado L, s=-1), convertidos com a
// pose emPe (spine rx 2°, head rx 4°; hips y 0.93, spine +0.04, head +0.58), pole incluído.
// cocarCabeca/apontar/acenar: ajustados olhando a vitrine (Task 3).
export const GESTOS = {
  repouso: { lado: 'L', preset: 'relax', osso: 'spine', alvo: [-0.2, -0.036, 0.211], dedos: [-0.1, -0.115, 1.005], palma: [0, -1.005, -0.115], pole: [-1, -1.013, -0.365] },
  garganta: { lado: 'L', preset: 'flat', osso: 'spine', alvo: [0, 0.505, 0.04], dedos: [1, 0.3, -0.01], palma: [0, -0.035, -0.999], pole: [-1, -0.389, 0.314] },
  barriga: { lado: 'L', preset: 'flat', osso: 'spine', alvo: [-0.065, 0.16, 0.12], dedos: [1, -0.15, 0.005], palma: [0, -0.035, -0.999], pole: [-1, -0.51, -0.282] },
  cocarCabeca: { lado: 'R', preset: 'scratch', osso: 'head', alvo: [0.06, 0.28, -0.01], dedos: [-1, 0.4, 0], palma: [-0.4, -1, 0], pole: [1, 0.2, 0.3] },
  apontar: { lado: 'R', preset: 'point', osso: 'spine', alvo: [0.14, 0.4, 0.52], dedos: [-0.1, 0, 1], palma: [-1, 0, 0] },
  acenar: { lado: 'R', preset: 'flat', osso: 'spine', alvo: [0.25, 0.65, 0.3], dedos: [0, 1, 0.2], palma: [0, 0, 1] },
};
export const acenoNoTempo = (t) => 0.06 * Math.sin(t * 9);
export const cocadaNoTempo = (t) => 0.02 * Math.sin(t * 14);

const espelharX = (v) => [-v[0], v[1], v[2]];
/** o gesto g para a mão `lado`: igual se for o lado nativo, espelhado em x (no osso) se for o outro. Não altera g. */
export function gestoNoLado(g, lado) {
  if (lado !== 'L' && lado !== 'R') throw new Error(`lado "${lado}" inválido (use 'L' ou 'R')`);
  if (lado === g.lado) return { ...g };
  const out = { ...g, lado, alvo: espelharX(g.alvo), dedos: espelharX(g.dedos), palma: espelharX(g.palma) };
  if (g.pole) out.pole = espelharX(g.pole);
  return out;
}
