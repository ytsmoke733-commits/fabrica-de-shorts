// Cópia de estilos/voxel/kit/cameras.mjs — manter igual. Câmeras nomeadas (puras): cada uma devolve { pos, look, roll } para aplicarCamera.
const lerp = (a, b, k) => a + (b - a) * k;
const lv = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const add = (a, b) => a.map((v, i) => v + b[i]);

export const CAMERA_LENTA = 0.32;
export const tempoLento = (lt, fator = CAMERA_LENTA) => lt * fator;

export function travelling({ de, para, olharDe, olharPara = olharDe, roll = 0 }, k) {
  return { pos: lv(de, para, k), look: lv(olharDe, olharPara, k), roll };
}

export function closeBaixo({ alvo, angulo = 1.33, dist = 4.2, altura = -0.35, empurrao = 0.12, roll = 0 }, k) {
  const d = dist * (1 - empurrao * k);
  return { pos: add(alvo, [Math.sin(angulo) * d, altura, Math.cos(angulo) * d]), look: add(alvo, [0, 0.05, 0]), roll };
}

export function drone({ centro, altura = 34, dist = 110, angulo = -0.15, deriva = 8 }, k) {
  const d = dist - deriva * k;
  return { pos: add(centro, [Math.sin(angulo) * d, altura - deriva * 0.35 * k, Math.cos(angulo) * d]), look: [...centro], roll: 0 };
}

export function orbita({ alvo, raio = 3.8, de = -0.55, ate = 0.25, altura = 0.2 }, k) {
  const a = lerp(de, ate, k);
  return { pos: add(alvo, [Math.sin(a) * raio, altura, Math.cos(a) * raio]), look: [...alvo], roll: 0 };
}
