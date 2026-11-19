// O intestino delgado por dentro (porte de engolir-chiclete-v2/src/gum.js 183-239, gutInside, generalizado): túnel ao
// longo de uma curva de 15 pontos (~42 m), com pregas em anel, 3000 vilosidades instanciadas que balançam, um anel de
// contração que aperta a parede, luz que segue a câmera e alarme vermelho. O objeto que passa (qualquer THREE.Object3D;
// padrão uma bolinha clara de raio 0,3; null = nenhum) e o bolo de 11 bolinhas que entope (bolo: true) são opcionais.
//   intestinoPorDentro(E, { objeto, bolo = false })
//     -> { scene, curve, LEN, objeto, bolo, ponto(s, off), update(t, { s, anel, bloqueio, vermelho, cam }) }
// Geometria e cores do v2. Todo quadro é função pura de (t, controles): o update reescreve parede, vilosidades, objeto,
// bolo, cores e luzes.
import * as THREE from 'three';
import { rnd } from '../motor/lib.js';
import { bolinha } from '../objetos.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const ROSA = new THREE.Color('#FF7AAE'), CLARA = new THREE.Color('#EBC6D2');      // a bolinha do kit e o GUM_PALE do v2
/** bolinha sem brilho (o wad(r, 0) do v2) */
const bolinhaFosca = (raio, cor) => { const m = bolinha({ raio, cor }).mesh; m.material.emissiveIntensity = 0; return m; };

/**
 * @param E motor (não usado; mantém a assinatura dos mundos)
 * @param o.objeto THREE.Object3D que anda pelo túnel (padrão: bolinha clara de raio 0,3; null = nenhum)
 * @param o.bolo cria o bolo de 11 bolinhas (rosa → clara) que aparece no bloqueio
 */
export function intestinoPorDentro(E, { objeto, bolo = false } = {}) {
  const scene = new THREE.Scene(); const FOG = new THREE.Color('#2A0610'); scene.background = FOG.clone(); scene.fog = new THREE.FogExp2(FOG.clone(), 0.16);
  const pts = []; for (let i = 0; i <= 14; i++) pts.push(V3(Math.sin(i * 0.8) * 0.9, Math.cos(i * 0.55) * 0.5, -i * 3));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), LEN = curve.getLength();
  const NR = 420, NS = 56, R = 1.3, C = [], NN = [], BB = [], TT = [];
  for (let i = 0; i <= NR; i++) { const u = i / NR; C.push(curve.getPointAt(u)); const t = curve.getTangentAt(u); TT.push(t); let n = V3(0, 1, 0); n.sub(t.clone().multiplyScalar(t.dot(n))).normalize(); NN.push(n); BB.push(new THREE.Vector3().crossVectors(t, n)); }
  const geo = new THREE.BufferGeometry(), pos = new Float32Array((NR + 1) * (NS + 1) * 3), idx = [];
  for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const wallM = new THREE.MeshPhysicalMaterial({ color: '#C9506A', roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.3, side: THREE.BackSide, emissive: '#4A0A18', emissiveIntensity: 0.45, sheen: 0.6, sheenColor: new THREE.Color('#FFA0B4') });
  scene.add(new THREE.Mesh(geo, wallM));
  const NV = 3000, vGeo = new THREE.CapsuleGeometry(0.034, 0.13, 4, 8); vGeo.translate(0, 0.08, 0);
  const villM = new THREE.MeshPhysicalMaterial({ color: '#EC7F93', roughness: 0.35, clearcoat: 0.6, emissive: '#5A1020', emissiveIntensity: 0.35, sheen: 0.7, sheenColor: new THREE.Color('#FFC0CC') });
  const vill = new THREE.InstancedMesh(vGeo, villM, NV); scene.add(vill);
  const vs = Array.from({ length: NV }, (_, i) => [rnd(i * 3 + 1), rnd(i * 3 + 2) * Math.PI * 2, 0.8 + rnd(i * 3 + 3) * 0.5]);
  if (objeto === undefined) objeto = bolinhaFosca(0.3, CLARA);
  if (objeto) scene.add(objeto);
  let clump = null;
  if (bolo) {
    clump = new THREE.Group(); scene.add(clump); clump.visible = false;
    for (let i = 0; i < 11; i++) { const m = bolinhaFosca(0.34 + rnd(i + 70) * 0.08, ROSA.clone().lerp(CLARA, 0.55 + rnd(i) * 0.4)); const a = rnd(i + 5) * Math.PI * 2, b = Math.acos(2 * rnd(i + 9) - 1); m.position.set(Math.sin(b) * Math.cos(a) * 0.45, Math.sin(b) * Math.sin(a) * 0.4, Math.cos(b) * 0.4); m.rotation.set(i, i * 2, i * 3); clump.add(m); }
  }
  const lamp = new THREE.PointLight('#FFC2B0', 9, 9, 1.3); scene.add(lamp);
  const lamp2 = new THREE.PointLight('#FF6F86', 4, 7, 1.4); scene.add(lamp2);
  scene.add(new THREE.HemisphereLight('#FF8A9C', '#2A0508', 0.3));
  const RED = new THREE.Color('#FF2A3A'), RED_E = new THREE.Color('#A00A18'), W0 = wallM.color.clone(), V0 = villM.color.clone(), E0 = wallM.emissive.clone();
  const L0 = lamp.position.clone(), L20 = lamp2.position.clone();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), up = V3(0, 1, 0), nv = new THREE.Vector3(), pv = new THREE.Vector3();
  const radius = (s, a, t, anel, bloqueio) => {
    let r = R * (1 - 0.09 * Math.pow(0.5 + 0.5 * Math.cos(s * Math.PI * 2 / 1.15), 4)) * (1 + 0.04 * Math.sin(a * 3 + s * 0.7));
    if (anel != null) r *= 1 - 0.42 * Math.exp(-((s - anel) ** 2) / (2 * 0.55 * 0.55));
    if (bloqueio != null) r *= 1 - 0.12 * Math.exp(-((s - bloqueio) ** 2) / (2 * 1.2 * 1.2)) * (0.5 + 0.5 * Math.sin(t * 7));
    return r;
  };
  const at = (s) => Math.max(0, Math.min(1, s / LEN));
  return {
    scene, curve, LEN, objeto: objeto || null, bolo: clump,
    /** ponto do eixo do túnel a s metros do começo (preso em [0, LEN]), deslocado `off` em y; Vector3 novo */
    ponto: (s, off = 0) => curve.getPointAt(at(s)).add(V3(0, off, 0)),
    /**
     * @param c.s posição do objeto (m ao longo do túnel; null = escondido) — fica em ponto(s, -0,28) (gs do v2)
     * @param c.anel posição do anel de contração (m; null = nenhum) (ring) · c.bloqueio posição do bolo/entupimento,
     *   a parede pulsa ali (block) · c.vermelho 0..1 alarme (red) · c.cam posição da câmera (Vector3): a luz vai com
     *   ela e as vilosidades a menos de 0,75 somem
     */
    update(t, { s = null, anel = null, bloqueio = null, vermelho = 0, cam = null } = {}) {
      for (let i = 0; i <= NR; i++) {
        const si = i / NR * LEN;
        for (let j = 0; j <= NS; j++) { const a = j / NS * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a), r = radius(si, a, t, anel, bloqueio), k = (i * (NS + 1) + j) * 3; pos[k] = C[i].x + (NN[i].x * cs + BB[i].x * sn) * r; pos[k + 1] = C[i].y + (NN[i].y * cs + BB[i].y * sn) * r; pos[k + 2] = C[i].z + (NN[i].z * cs + BB[i].z * sn) * r; }
      }
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
      for (let i = 0; i < NV; i++) {
        const [u, a, s0] = vs[i], sv = u * LEN, ii = Math.round(u * NR), cs = Math.cos(a), sn = Math.sin(a), r = radius(sv, a, t, anel, bloqueio) * 0.985;
        nv.set(NN[ii].x * cs + BB[ii].x * sn, NN[ii].y * cs + BB[ii].y * sn, NN[ii].z * cs + BB[ii].z * sn);
        pv.copy(C[ii]).addScaledVector(nv, r);
        const sway = 0.25 * Math.sin(t * 2.2 + i * 1.7 + sv * 0.8);
        q.setFromUnitVectors(up, nv.clone().negate().addScaledVector(TT[ii], sway).normalize());
        let k = s0; if (cam && pv.distanceTo(cam) < 0.75) k = 0.0001;
        sc.set(k, k * (1 + 0.15 * Math.sin(t * 3 + i)), k); m4.compose(pv, q, sc); vill.setMatrixAt(i, m4);
      }
      vill.instanceMatrix.needsUpdate = true;
      if (objeto) { objeto.visible = s != null; if (s != null) { objeto.position.copy(curve.getPointAt(at(s))).add(V3(0, -0.28, 0)); objeto.rotation.set(s * 1.2, t * 0.3, 0.2); } }
      if (clump) { clump.visible = bloqueio != null; if (bloqueio != null) { clump.position.copy(curve.getPointAt(at(bloqueio))); clump.scale.setScalar(1 + 0.04 * Math.sin(t * 7)); } }
      wallM.color.copy(W0).lerp(RED, vermelho * 0.7); villM.color.copy(V0).lerp(RED, vermelho * 0.6); wallM.emissive.copy(E0).lerp(RED_E, vermelho);
      if (cam) { lamp.position.copy(cam).add(V3(0.2, 0.4, 0)); lamp2.position.copy(curve.getPointAt(at((s ?? bloqueio ?? 0) + 2.5))); }
      else { lamp.position.copy(L0); lamp2.position.copy(L20); }
    },
  };
}
