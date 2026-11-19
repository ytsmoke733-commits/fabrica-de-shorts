// Dentro de um vaso sanguíneo (novo, na linguagem do intestinoPorDentro): túnel de raio 1,1 ao longo de uma curva suave
// de ~40 m, parede vermelho-escura translúcida com nervuras (estrias longitudinais + anéis leves) que pulsa no ritmo do
// coração (a onda de pulso corre pelo vaso), luz que segue a câmera, hemácias (discos bicôncavos instanciados) fluindo
// pela curva — mais rápidas no meio do vaso, mais lentas perto da parede (perfil parabólico) e com um empurrão a cada
// batida — e um leucócito opcional (esfera branca rugosa) rolando devagar junto da parede.
//   vasoSanguineo(E, { hemacias = 420, leucocito = true })
//     -> { scene, curve, LEN, hemacias, leucocito, ponto(s, off), update(t, { fluxo = 1, bpm = 72, cam }) }
// Tudo determinístico por índice (rnd) e função pura de (t, controles). fluxo e bpm multiplicam o tempo do fluxo/pulso:
// mantenha-os constantes dentro de uma cena para as hemácias não saltarem.
import * as THREE from 'three';
import { sphere, noise3, mesh } from '../motor/sdf.js';
import { rnd } from '../motor/lib.js';
import { normaisLimpas } from '../objetos.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const sm = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const R = 1.1, VMAX = 2.4, V_LEUCO = 0.45, V_ONDA = 10, R_HEMACIA = 0.13, R_LEUCO = 0.36;

/** batida (tum-tum) na fase f do ciclo cardíaco, circular (sem salto na volta): pico 1 em 0,1 e 0,45 em 0,32 */
const batida = (f) => { f -= Math.floor(f); const d = (c) => { const x = Math.abs(f - c); return Math.min(x, 1 - x); }; return Math.exp(-(d(0.1) ** 2) / (2 * 0.045 ** 2)) + 0.45 * Math.exp(-(d(0.32) ** 2) / (2 * 0.05 ** 2)); };

/** hemácia de raio 1: perfil de Evans-Fung (meia espessura √(1−ρ²)·(0,0518 + 0,5007ρ² − 0,2807ρ⁴)) girado em y */
function geoHemacia() {
  const N = 24, top = [], meia = (r) => Math.sqrt(Math.max(0, 1 - r * r)) * (0.0518 + 0.5007 * r * r - 0.2807 * r ** 4);
  for (let i = 0; i <= N; i++) { const r = Math.sin(i / N * Math.PI / 2); top.push(new THREE.Vector2(r, meia(r))); }
  // de baixo-centro até a borda, depois de volta pela face de cima até o centro
  const P = [...top.map((p) => new THREE.Vector2(p.x, -p.y)), ...top.slice(0, -1).reverse()];
  return new THREE.LatheGeometry(P, 28);
}

/**
 * @param E motor (não usado; mantém a assinatura dos mundos)
 * @param o.hemacias quantas hemácias (instâncias)
 * @param o.leucocito cria o leucócito (senão leucocito = null)
 */
export function vasoSanguineo(E, { hemacias = 420, leucocito = true } = {}) {
  const scene = new THREE.Scene(); const FOG = new THREE.Color('#22030A'); scene.background = FOG.clone(); scene.fog = new THREE.FogExp2(FOG.clone(), 0.13);
  const pts = []; for (let i = 0; i <= 16; i++) pts.push(V3(Math.sin(i * 0.6) * 1.1, Math.cos(i * 0.45) * 0.7, -i * 2.5));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), LEN = curve.getLength();
  const NR = 400, NS = 48, C = [], NN = [], BB = [];
  for (let i = 0; i <= NR; i++) { const u = i / NR; C.push(curve.getPointAt(u)); const t = curve.getTangentAt(u); let n = V3(0, 1, 0); n.sub(t.clone().multiplyScalar(t.dot(n))).normalize(); NN.push(n); BB.push(new THREE.Vector3().crossVectors(t, n)); }
  // parede
  const geo = new THREE.BufferGeometry(), pos = new Float32Array((NR + 1) * (NS + 1) * 3), idx = [];
  for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const wallM = new THREE.MeshPhysicalMaterial({ color: '#6E1020', roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.25, side: THREE.BackSide, transparent: true, opacity: 0.88, emissive: '#3A0410', emissiveIntensity: 0.5, sheen: 0.6, sheenColor: new THREE.Color('#FF7A8A') });
  scene.add(new THREE.Mesh(geo, wallM));
  /** raio da parede em s (m), ângulo a, fase cardíaca do coração fc: estrias, anéis a cada 2,4 m e a onda de pulso */
  const raio = (s, a, fc) => R * (1 - 0.05 * Math.pow(Math.abs(Math.sin(a * 8 + s * 0.35)), 3)) * (1 - 0.04 * Math.pow(0.5 + 0.5 * Math.cos(s * Math.PI * 2 / 2.4), 6)) * (1 + 0.07 * batida(fc - s / V_ONDA));
  // hemácias: posição inicial, raio relativo no corte (disco uniforme até 0,6: perto da parede fica a camada de plasma
  // sem células, onde o leucócito rola), ângulo, velocidade (parabólica), giro
  const NH = hemacias, hem = new THREE.InstancedMesh(geoHemacia(), new THREE.MeshPhysicalMaterial({ color: '#D8202E', roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.35, emissive: '#4A0008', emissiveIntensity: 0.45, sheen: 0.5, sheenColor: new THREE.Color('#FF8A90') }), NH);
  scene.add(hem);
  const hs = Array.from({ length: NH }, (_, i) => { const rho = 0.6 * Math.sqrt(rnd(i * 7 + 1)); return { u0: rnd(i * 7 + 2), rho, a: rnd(i * 7 + 3) * Math.PI * 2, v: VMAX * (1 - rho * rho) * (0.85 + 0.3 * rnd(i * 7 + 4)), w: 0.6 + rnd(i * 7 + 5), esc: R_HEMACIA * (0.9 + 0.2 * rnd(i * 7 + 6)) }; });
  let leuco = null;
  if (leucocito) {
    const g = normaisLimpas(mesh((p) => sphere(p, [0, 0, 0], 0.86) + 0.07 * noise3(p[0] * 5, p[1] * 5, p[2] * 5) + 0.035 * noise3(p[0] * 12, p[1] * 12, p[2] * 12), [[-1.15, -1.15, -1.15], [1.15, 1.15, 1.15]], 0.06));
    leuco = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color: '#F4EEE6', roughness: 0.75, sheen: 0.8, sheenColor: new THREE.Color('#FFFFFF'), emissive: '#6A5A60', emissiveIntensity: 0.35 }));
    leuco.scale.setScalar(R_LEUCO); scene.add(leuco);
  }
  const lamp = new THREE.PointLight('#FFC8B8', 9, 9, 1.3); scene.add(lamp);
  const lamp2 = new THREE.PointLight('#FF4A5E', 5, 8, 1.4); scene.add(lamp2);
  scene.add(new THREE.HemisphereLight('#FF7A8A', '#200306', 0.3));
  const L0 = lamp.position.clone(), L20 = lamp2.position.clone();
  const at = (s) => Math.max(0, Math.min(1, s / LEN)), wrap = (s) => ((s % LEN) + LEN) % LEN;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), pv = new THREE.Vector3(), nv = new THREE.Vector3(), bv = new THREE.Vector3();
  /** ponto em s (m) a raio relativo rho e ângulo a no corte do túnel (frames interpolados) → pv */
  const noCorte = (s, rho, a) => {
    const f = at(s) * NR, i0 = Math.min(NR - 1, Math.floor(f)), k = f - i0, cs = Math.cos(a) * rho * R, sn = Math.sin(a) * rho * R;
    nv.copy(NN[i0]).lerp(NN[i0 + 1], k); bv.copy(BB[i0]).lerp(BB[i0 + 1], k);
    return pv.copy(C[i0]).lerp(C[i0 + 1], k).addScaledVector(nv, cs).addScaledVector(bv, sn);
  };
  return {
    scene, curve, LEN, hemacias: hem, leucocito: leuco,
    /** ponto do eixo do vaso a s metros do começo (preso em [0, LEN]), deslocado `off` em y; Vector3 novo */
    ponto: (s, off = 0) => curve.getPointAt(at(s)).add(V3(0, off, 0)),
    /**
     * @param c.fluxo multiplica a velocidade do sangue (0 = parado) · c.bpm batimentos por minuto (pulso da parede e
     *   empurrão das hemácias) · c.cam posição da câmera (Vector3): a luz vai com ela e as hemácias perto dela somem
     */
    update(t, { fluxo = 1, bpm = 72, cam = null } = {}) {
      const fc = t * bpm / 60, w = 2 * Math.PI * bpm / 60;
      for (let i = 0; i <= NR; i++) {
        const s = i / NR * LEN;
        for (let j = 0; j <= NS; j++) { const a = j / NS * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a), r = raio(s, a, fc), k = (i * (NS + 1) + j) * 3; pos[k] = C[i].x + (NN[i].x * cs + BB[i].x * sn) * r; pos[k + 1] = C[i].y + (NN[i].y * cs + BB[i].y * sn) * r; pos[k + 2] = C[i].z + (NN[i].z * cs + BB[i].z * sn) * r; }
      }
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
      // tempo do fluxo: velocidade × (1 + 0,18·cos(ωt)) → deslocamento t + 0,18·sen(ωt)/ω (o empurrão de cada batida)
      const tf = fluxo * (t + 0.18 * Math.sin(w * t) / w);
      for (let i = 0; i < NH; i++) {
        const h = hs[i], s = wrap(h.u0 * LEN + h.v * tf);
        noCorte(s, h.rho, h.a + 0.25 * Math.sin(tf * 0.7 + i));
        e.set(t * h.w + i, t * h.w * 0.7 + i * 2, i * 0.7); q.setFromEuler(e);
        const perto = cam ? sm(0.2, 0.7, pv.distanceTo(cam)) : 1;                // somem perto da lente
        sc.setScalar(h.esc * Math.max(1e-4, perto)); m4.compose(pv, q, sc); hem.setMatrixAt(i, m4);
      }
      hem.instanceMatrix.needsUpdate = true;
      if (leuco) {
        const s = wrap(LEN * 0.3 + V_LEUCO * tf), a = Math.PI + 0.3 * Math.sin(t * 0.4);              // −NN = por baixo, rolando junto da parede
        leuco.position.copy(noCorte(s, (R * 0.98 - R_LEUCO) / R, a)); leuco.rotation.set(-s / R_LEUCO, t * 0.2, 0.3 * Math.sin(t * 0.5));
      }
      if (cam) {                                                         // a 2ª luz vai 2,5 m à frente da câmera no vaso
        let ic = 0, bd = Infinity; for (let i = 0; i <= NR; i++) { const d = C[i].distanceToSquared(cam); if (d < bd) { bd = d; ic = i; } }
        lamp.position.copy(cam).add(V3(0.2, 0.4, 0)); lamp2.position.copy(curve.getPointAt(at(ic / NR * LEN + 2.5)));
      }
      else { lamp.position.copy(L0); lamp2.position.copy(L20); }
    },
  };
}
