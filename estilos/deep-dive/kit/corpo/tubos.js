// Tubos dentro do corpo de raio-x (porte de engolir-chiclete-v2/src/gum.js 46-86). Ponha a malha em humano.spine: as
// coordenadas são do referencial do spine, em metros. Os pontos padrão são os do v2 e podem ser trocados.
//   esofago({ pontos })   -> { curve, mesh, mat, update(u, amt, t), U1 }  boca → estômago, com onda peristáltica
//   intestino({ pontos, opacidade }) -> { curve, mesh, mat }              intestino delgado enrolado na barriga
//   ENTRADA_ESTOMAGO      onde o esôfago chega no estômago (último ponto padrão do esôfago; STOMACH_IN do v2)
import * as THREE from 'three';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const organ = (col, op = 1) => new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.3, emissive: col, emissiveIntensity: 0.22, transparent: op < 1, opacity: op, depthWrite: op >= 1 });

export const ENTRADA_ESTOMAGO = V3(0.012, 0.215, 0.04);
const PONTOS_ESOFAGO = [V3(0, 0.624, 0.095), V3(0, 0.61, 0.06), V3(0, 0.565, 0.03), V3(0, 0.5, 0.0), V3(0.008, 0.42, -0.008), V3(0.02, 0.36, 0.0), V3(0.012, 0.27, 0.03), ENTRADA_ESTOMAGO.clone()];

/**
 * esôfago: tubo de 160 anéis × 18 lados sobre a curva (até U1 = 0,94 dela, o resto entra no estômago), reescrito
 * inteiro a cada update(u, amt, t): u = posição do objeto 0..1 na curva (u < 0 = sem objeto, tubo liso), amt 0..1 =
 * força da onda (incha no objeto, aperta logo atrás e um pouco mais atrás), t = ondulação lenta da parede.
 */
export function esofago({ pontos = PONTOS_ESOFAGO } = {}) {
  const curve = new THREE.CatmullRomCurve3(pontos.map((p) => p.clone()), false, 'centripetal');
  const NR = 160, NS = 18, U1 = 0.94, C = [], NN = [], BB = [];
  for (let i = 0; i <= NR; i++) { const u = i / NR * U1; C.push(curve.getPointAt(u)); const t = curve.getTangentAt(u); let n = new THREE.Vector3(1, 0, 0); n.sub(t.clone().multiplyScalar(t.dot(n))).normalize(); NN.push(n); BB.push(new THREE.Vector3().crossVectors(t, n)); }
  const geo = new THREE.BufferGeometry(), pos = new Float32Array((NR + 1) * (NS + 1) * 3), nrm = new Float32Array(pos.length), idx = [];
  for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); geo.setIndex(idx);
  const mat = organ('#F08A9C', 0.78), tube = new THREE.Mesh(geo, mat); mat.emissiveIntensity = 0.5;
  const R0 = 0.0108;
  const update = (ug = -1, amt = 1, t = 0) => {
    const ugU = ug / U1;
    for (let i = 0; i <= NR; i++) {
      const u = i / NR, dg = u - ugU;
      let r = R0 * (1 + 0.05 * Math.sin(u * 40 + t * 2));
      if (ug >= 0) { r *= 1 + 0.32 * Math.exp(-(dg * dg) / (2 * 0.028 * 0.028)) * amt; r *= 1 - 0.55 * Math.exp(-((dg + 0.075) ** 2) / (2 * 0.022 * 0.022)) * amt; r *= 1 - 0.3 * Math.exp(-((dg + 0.2) ** 2) / (2 * 0.03 * 0.03)) * amt; }
      for (let j = 0; j <= NS; j++) { const a = j / NS * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a), k = (i * (NS + 1) + j) * 3; const nx = NN[i].x * cs + BB[i].x * sn, ny = NN[i].y * cs + BB[i].y * sn, nz = NN[i].z * cs + BB[i].z * sn; pos[k] = C[i].x + nx * r; pos[k + 1] = C[i].y + ny * r; pos[k + 2] = C[i].z + nz * r; nrm[k] = nx; nrm[k + 1] = ny; nrm[k + 2] = nz; }
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.normal.needsUpdate = true; geo.computeBoundingSphere();
  };
  update();
  return { curve, mesh: tube, mat, update, U1 };
}

/** os pontos do v2: da saída do estômago, 4 fileiras em serpentina descendo pela barriga, até a pelve */
function pontosIntestino() {
  const P = [V3(0.075, 0.115, 0.045), V3(0.1, 0.11, 0.05), V3(0.112, 0.1, 0.052), V3(0.09, 0.082, 0.055)];
  const rows = [0.082, 0.05, 0.018, -0.014]; let dir = -1;
  rows.forEach((y, r) => {
    const x0 = -dir * 0.09, x1 = dir * 0.09;
    if (r > 0) P.push(V3(x0 * 1.12, y + 0.016, 0.05));
    P.push(V3(x0, y, 0.055), V3(x0 * 0.5, y + 0.003, 0.065), V3(0, y, 0.068), V3(x1 * 0.5, y - 0.003, 0.065), V3(x1, y, 0.055));
    dir = -dir;
  });
  P.push(V3(0.105, -0.04, 0.045), V3(0.06, -0.06, 0.03));
  return P;
}

/**
 * intestino delgado: tubo fixo (600 × 16, raio 11,8 mm) sobre a curva; mat é próprio (mude a cor por quadro se quiser).
 * opacidade 1 (padrão) = opaco como no v2. O tubo é mais largo que a bolinha (11,8 mm × 9,5 mm): para ver um objeto
 * andando dentro dele (noCaminho), use opacidade < 1 (ex.: 0,6), que também desliga a escrita de profundidade.
 */
export function intestino({ pontos = pontosIntestino(), opacidade = 1 } = {}) {
  const curve = new THREE.CatmullRomCurve3(pontos.map((p) => p.clone()), false, 'centripetal');
  const mat = organ('#E87A8C', opacidade);
  return { curve, mat, mesh: new THREE.Mesh(new THREE.TubeGeometry(curve, 600, 0.0118, 16), mat) };
}
