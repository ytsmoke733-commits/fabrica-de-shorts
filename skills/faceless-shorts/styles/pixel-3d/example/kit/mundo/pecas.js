// Peças básicas do mundo pixel: primitivas com material já pronto, texturas de canvas sem suavização e projeção 3D->tela.
import * as THREE from 'three';
import { rasterizar } from '../pixelfonte.mjs';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
/** caixa, cilindro e esfera que projetam e recebem sombra */
export const box = (w, h, d, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.castShadow = o.receiveShadow = true; return o; };
export const cyl = (rt, rb, h, m, seg = 20) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.castShadow = o.receiveShadow = true; return o; };
export const sph = (r, m, seg = 16) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75)), m); o.castShadow = true; return o; };
/** posiciona e devolve o objeto (para encadear em .add) */
export const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
export const lerpN = (a, b, k) => a + (b - a) * k;
export const L3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

/** textura pequena desenhada em canvas, sem suavização */
export function texturaCanvas(w, h, pintar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
  const api = { tex: t, g, w, h, pintar(fn) { g.clearRect(0, 0, w, h); fn(g, w, h); t.needsUpdate = true; } };
  if (pintar) api.pintar(pintar);
  return api;
}
/** escreve texto da fonte pixel dentro de um canvas pequeno (s = tamanho do pixel) */
export function escrever(g, txt, x, y, s, cor) {
  const { px, w } = rasterizar(txt); g.fillStyle = cor;
  const x0 = Math.round(x - (w * s) / 2);
  for (const [i, j] of px) g.fillRect(x0 + i * s, y + j * s, s, s);
}

/** ponto 3D (Vector3, coordenadas do mundo) -> pixels da tela 1080x1920. Chame cam.updateMatrixWorld() antes. */
export function projetar(v, cam) { const p = v.clone().project(cam); return [(p.x * 0.5 + 0.5) * 1080, (0.5 - p.y * 0.5) * 1920]; }
/** ponto local de um objeto -> mundo */
export function noMundo(obj, local = V(0, 0, 0)) { obj.updateWorldMatrix(true, false); return obj.localToWorld(local.clone()); }
/** câmera em pos olhando para alvo (atualiza fov e matrizes) */
export function olhar(cam, pos, alvo, fov = cam.fov) {
  cam.position.set(...pos); cam.up.set(0, 1, 0); cam.lookAt(...alvo);
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  cam.updateMatrixWorld();
}
