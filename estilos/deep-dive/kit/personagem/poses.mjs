// Poses do corpo no formato do pose() do Human do v2 (graus). Valores copiados de engolir-chiclete-v2/src/shots.js.
// A base usa os mesmos padrões do Human.pose() (braço 6° para fora, cotovelo 10°, pernas 2°), então uma pose que não
// fala das pernas (emPe, reagir, barriga) fica igual ao hero.pose(P_STAND()) do v2.
// lid: o face() do Human reescreve a pálpebra a cada quadro; o olho fechado do `dormindo` precisa ir também no face
// (h.face(t, { lid: 1, blink: false })).
export const POSE_CORPO_BASE = {
  spine: [0, 0, 0], head: [0, 0, 0], shL: [0, 0, 6], shR: [0, 0, 6], elL: 10, elR: 10,
  hipL: [0, 0, 2], hipR: [0, 0, 2], knL: 2, knR: 2, hipsY: 0.93, hipsZ: 0, lid: 0, look: [0, 0],
};
const EM_PE = { spine: [2, 0, 0], head: [2, 0, 0], shL: [4, 0, 7], shR: [4, 0, 7], elL: 14, elR: 14 }; // P_STAND (l.101)
export const POSES_CORPO = {
  emPe: { ...EM_PE },
  reagir: { ...EM_PE, head: [-4, 0, 0], spine: [-2, 0, 0] }, // P_REACT (l.254)
  barriga: { ...EM_PE, head: [6, 0, 0], spine: [3, 0, 0] }, // P_BELLY (l.284)
  sentado: { hipsY: 0.53, hipL: [86, 0, 6], hipR: [86, 0, 6], knL: 86, knR: 86, spine: [-6, 0, 0], head: [4, 0, 0], shL: [14, 0, 12], shR: [14, 0, 12], elL: 50, elR: 50 }, // S18 l.404
  dormindo: { hipsY: 0.53, hipL: [80, 0, 8], hipR: [80, 0, 10], knL: 84, knR: 80, spine: [-14, 0, -6], head: [14, 0, -24], shL: [8, 0, 14], shR: [10, 0, 14], elL: 60, elR: 55, lid: 1 }, // S18 l.405 (+ pálpebra fechada, l.405 face)
};
const mix = (a, b, k) => (Array.isArray(a) || Array.isArray(b)
  ? (b ?? a ?? []).map((_, i) => mix((a ?? [])[i] ?? 0, (b ?? [])[i] ?? 0, k))
  : a + (b - a) * k);
export function misturarPosesCorpo(a, b, k) {
  const out = {};
  for (const key of Object.keys(POSE_CORPO_BASE)) {
    const base = POSE_CORPO_BASE[key];
    out[key] = mix(a[key] ?? base, b[key] ?? base, k);
  }
  return out;
}
