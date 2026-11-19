// Poses de mão nomeadas (graus, mesmo formato do pose() da pessoa de blocos) + dedo de apontar.
export const POSE_BASE = { lean: [0, 0, 0], bend: 0, head: [0, 0, 0], armL: [0, 4], armR: [0, 4], legL: [0, 0], legR: [0, 0], lift: 0, dedo: null };
export const POSES = {
  neutro: {},
  apontar: { armR: [88, 32], head: [0, -20, 0], dedo: 'R' },
  apontarChao: { armR: [42, 12], head: [18, -6, 0], bend: 6, dedo: 'R' },
  acenar: { armR: [165, 26], head: [0, 6, 5] },
  maoNaCabeca: { armR: [150, -12], armL: [0, 6], head: [6, 0, -7] },
  segurar: { armR: [38, 4] },
  bracosAbertos: { armL: [92, 58], armR: [92, 58], head: [-6, 0, 0] },
  susto: { armL: [62, 38], armR: [62, 38], lean: [-6, 0, 0], head: [-12, 0, 0] },
};
const cheia = (p) => ({ ...POSE_BASE, ...p });
const mix = (a, b, k) => (Array.isArray(a) ? a.map((v, i) => v + ((b[i] ?? 0) - v) * k) : a + (b - a) * k);

export function misturarPoses(a, b, k) {
  const A = cheia(a), B = cheia(b), out = {};
  for (const key of Object.keys(POSE_BASE)) out[key] = key === 'dedo' ? (k >= 0.5 ? B.dedo : A.dedo) : mix(A[key], B[key], k);
  return out;
}

export function acenarNoTempo(t, k = 1) {
  const p = misturarPoses(POSES.neutro, POSES.acenar, k);
  p.armR = [p.armR[0], p.armR[1] + 22 * Math.sin(t * 9) * k];
  return p;
}
