// Objetos genéricos do deep-dive (generalizam as peças do chiclete do v2, src/gum.js 24-44):
//   bolinha({ cor, raio })                 -> { mesh, setCor(cor) }    massinha irregular (chiclete mastigado, comprimido, bala…)
//   barraEmbalada({ corEmbalagem, corDentro }) -> { group, unwrap(k) }  barra fina numa embalagem que desliza (k 0..1)
//   normaisLimpas(geo)                     -> geo                       conserta normais nulas de malhas SDF (mundos internos)
// Medidas em metros (mundo da casa). A malha da bolinha é única e compartilhada (cache); cada bolinha tem material próprio.
import * as THREE from 'three';
import { rbox, sphere, noise3, mesh } from './motor/sdf.js';
import { canvasTex } from './casa.js';

let BOLINHA = null;
/** troca normais nulas/NaN de uma malha SDF pela direção radial (o clean() do v2); devolve a própria geometria */
export function normaisLimpas(geo) {
  const n = geo.attributes.normal, p = geo.attributes.position;
  for (let i = 0; i < n.count; i++) {
    let x = n.getX(i), y = n.getY(i), z = n.getZ(i), l = Math.hypot(x, y, z);
    if (!(l > 1e-6)) { x = p.getX(i); y = p.getY(i); z = p.getZ(i); l = Math.hypot(x, y, z) || 1; if (!(l > 1e-9)) { x = 0; y = 1; z = 0; l = 1; } }
    n.setXYZ(i, x / l, y / l, z / l);
  }
  n.needsUpdate = true; return geo;
}
/** a massinha: bolha irregular de raio ~1 (escale para o mundo) */
const geoBolinha = () => (BOLINHA ||= normaisLimpas(mesh((p) => sphere(p, [0, 0, 0], 0.82) + 0.16 * noise3(p[0] * 2.6, p[1] * 2.6, p[2] * 2.6) + 0.05 * noise3(p[0] * 7, p[1] * 7, p[2] * 7), [[-1.25, -1.25, -1.25], [1.25, 1.25, 1.25]], 0.06)));

/**
 * tons da bolinha a partir da cor (no sRGB, mesmo matiz e saturação): brilho (emissive) mais escuro e sheen mais claro.
 * Os deslocamentos de luminosidade reproduzem os tons fixos do v2 para o rosa #FF7AAE (emissive #FF4F94, sheen #FFD0E2).
 */
function tonsDaBolinha(cor, emissive, sheen) {
  const c = new THREE.Color(cor), hsl = c.getHSL({}, THREE.SRGBColorSpace), L = (l) => Math.max(0, Math.min(1, l));
  emissive.setHSL(hsl.h, hsl.s, L(hsl.l - 0.084), THREE.SRGBColorSpace);
  sheen.setHSL(hsl.h, hsl.s, L(hsl.l + 0.169), THREE.SRGBColorSpace);
  return c;
}
/** bolinha de raio `raio` (m) e cor `cor`; setCor(cor) troca a cor (string css ou THREE.Color) e com ela o brilho e o sheen */
export function bolinha({ cor = '#FF7AAE', raio = 0.0095 } = {}) {
  const mat = new THREE.MeshPhysicalMaterial({ roughness: 0.45, clearcoat: 0.5, clearcoatRoughness: 0.4, sheen: 0.4, emissiveIntensity: 0.05 });
  const setCor = (c) => { mat.color.copy(tonsDaBolinha(c, mat.emissive, mat.sheenColor)); };
  setCor(cor);
  const m = new THREE.Mesh(geoBolinha(), mat);
  m.scale.setScalar(raio); m.castShadow = true; m.userData.r = raio;
  return { mesh: m, setCor };
}

/**
 * barra embalada: a origem do group é a ponta segura pelos dedos e a barra corre em +x. unwrap(k) desliza a embalagem
 * para fora (0 = fechada … 1 = some). group.userData = { dentro, embalagem } (as malhas, se quiser esconder uma delas).
 */
export function barraEmbalada({ corEmbalagem = '#7FD8C4', corDentro = '#FF7AAE' } = {}) {
  const group = new THREE.Group();
  const dentro = new THREE.Mesh(mesh((p) => rbox(p, [0.036, 0, 0], [0.034, 0.0014, 0.0092], 0.0012), [[-0.002, -0.004, -0.012], [0.074, 0.004, 0.012]], 0.0011), new THREE.MeshPhysicalMaterial({ color: new THREE.Color(corDentro), roughness: 0.6, sheen: 0.5, sheenColor: new THREE.Color('#FFD0E2') }));
  normaisLimpas(dentro.geometry); dentro.castShadow = true; group.add(dentro);
  const embalagem = new THREE.Group(); group.add(embalagem);
  const papelTex = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#F3F6F7'; c.fillRect(0, 0, w, h); c.fillStyle = corEmbalagem; c.fillRect(0, 0, w * 0.62, h); c.fillStyle = corDentro; c.fillRect(w * 0.1, h * 0.38, w * 0.4, h * 0.24); });
  const liso = () => new THREE.MeshStandardMaterial({ color: corEmbalagem, roughness: 0.6 }), estampa = () => new THREE.MeshStandardMaterial({ map: papelTex, roughness: 0.6 });
  const papel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.0042, 0.0215), [liso(), liso(), estampa(), estampa(), liso(), liso()]);
  papel.position.x = 0.042; papel.castShadow = true; embalagem.add(papel);
  const folha = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.0034, 0.0205), new THREE.MeshStandardMaterial({ color: '#D9DEE3', roughness: 0.25, metalness: 0.85 })); folha.position.x = 0.0365; embalagem.add(folha);
  group.userData = { dentro, embalagem };
  const unwrap = (k) => { embalagem.position.x = k * 0.09; embalagem.visible = k < 1; };
  return { group, unwrap };
}
