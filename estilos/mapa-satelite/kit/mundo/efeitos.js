// Efeitos do voxel: vento nas palmeiras, riscos de areia e a onda gigante (extraídos de teste-lowpoly-v2/src/voxel.js),
// mais objetos voando no vento (voadores) e partículas flutuando (particulas). Tudo função pura das entradas.
import * as THREE from 'three';
import { rnd, clamp, lerp } from '../motor/lib.js';
import { Vox } from './blocos.js';
import { umbrella, towel, beachBall, newspaper } from './props.js';
import { SHIRTS } from './pessoa.js';
import { sorvete } from './elenco.js';

const col = (c) => new THREE.Color(c);

// ================================================================================================
// WIND + WATER helpers for the town (pure functions of the inputs)
// ================================================================================================
/** bend the palms toward -z (the wind). k 0..1 strength, t film time (flutter), slow = flutter speed factor */
export function windPalms(palms, k, t, slow = 1) {
  palms.forEach((p, i) => {
    const fl = Math.sin(t * 9 * slow + i * 1.7) * 0.5 + Math.sin(t * 15 * slow + i) * 0.5;
    p.group.rotation.x = -k * (0.07 + 0.02 * fl);
    p.crown.rotation.x = -k * (0.45 + 0.08 * fl);
    p.leaves.forEach((lf, j) => {
      const yaw = lf.parent.rotation.y, down = Math.sin(yaw);       // > 0 → this leaf points downwind (-z)
      lf.rotation.z = k * ((1 - down) * 0.75 + 0.12 * Math.sin(t * 20 * slow + j * 2 + i));
      lf.rotation.x = k * 0.25 * Math.cos(yaw) * Math.sin(t * 13 * slow + j);
    });
  });
}
export function calmPalms(palms) { palms.forEach((p) => { p.group.rotation.x = 0; p.crown.rotation.x = 0; p.leaves.forEach((lf) => { lf.rotation.z = 0; lf.rotation.x = 0; }); }); }

/** streaks of sand / spray blowing toward -z through a box (centre c, size sz). update(t, k, slow) */
export function windStreaks(n = 260, color = '#F3E3C0') {
  const geo = new THREE.BoxGeometry(1, 1, 1), m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, depthWrite: false, fog: true });
  const mesh = new THREE.InstancedMesh(geo, m, n); mesh.frustumCulled = false; mesh.visible = false;
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), Pp = new THREE.Vector3(), Sc = new THREE.Vector3();
  mesh.update = (t, k, c, sz, speed = 30) => {
    mesh.visible = k > 0; m.opacity = 0.65 * clamp(k);
    for (let i = 0; i < n; i++) {
      const span = sz.z, z = c.z + sz.z / 2 - ((rnd(i * 3 + 1) * span + t * speed * (0.7 + rnd(i * 7) * 0.6)) % span);
      Pp.set(c.x + (rnd(i * 5 + 2) - 0.5) * sz.x, c.y + Math.pow(rnd(i * 11 + 3), 2) * sz.y, z);
      const len = 0.15 + rnd(i * 13) * 0.6 * Math.min(1, speed / 20);
      Sc.set(0.025, 0.025, len); M4.compose(Pp, Q, Sc); mesh.setMatrixAt(i, M4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return mesh;
}

/** the giant wave: a faceted water sheet out at sea whose crest rolls toward the shore (-z).
 *  update(zc, H, t): crest at z = zc, height H (m). Front face steep (toward the town), long back, foam on top. */
export function giantWave() {
  const NX = 110, NZ = 170, X0 = -420, X1 = 420, Z0 = 36, Z1 = 520;
  const g = new THREE.BufferGeometry(), nv = NX * NZ * 6;
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(nv * 3), 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(nv * 3), 3));
  const mesh = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ vertexColors: true, flatShading: true, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide }));
  mesh.frustumCulled = false; mesh.receiveShadow = true; mesh.visible = false;
  const cDeep = col('#0F4E78'), cMid = col('#1E8DB4'), cLip = col('#5FD0DC'), cFoam = col('#F4FAFF'), tmp = new THREE.Color();
  mesh.update = (zc, H, t) => {
    const P = g.attributes.position, C = g.attributes.color; let k = 0;
    const pt = (i, j) => {
      const x = lerp(X0, X1, i / NX), z0 = lerp(Z0, Z1, Math.pow(j / NZ, 1.6));
      const hx = H * (0.82 + 0.18 * Math.sin(x * 0.021 + 1.3) * Math.cos(x * 0.008));
      const dz = z0 - zc, front = dz < 0;
      let h = front ? hx * Math.exp(-Math.pow(dz / (6 + hx * 0.25), 2)) : hx * Math.exp(-Math.pow(dz / (40 + hx * 1.6), 2));
      h += Math.sin(x * 0.13 + z0 * 0.09 + t * 1.5) * 0.35 + Math.sin(x * 0.05 - z0 * 0.15 + t) * 0.4;
      const curl = hx * 0.38 * Math.pow(clamp(h / Math.max(hx, 0.01)), 3);        // the lip leans toward the shore
      return [x, h - 0.2, z0 - curl, h / Math.max(hx, 0.01)];
    };
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
      const A = pt(i, j), B = pt(i + 1, j), Cq = pt(i + 1, j + 1), D = pt(i, j + 1);
      const hm = Math.max(A[3], B[3], Cq[3], D[3]);
      if (hm > 0.8 && H > 6) tmp.copy(cFoam); else if (hm > 0.55) tmp.copy(cMid).lerp(cLip, (hm - 0.55) / 0.31); else tmp.copy(cDeep).lerp(cMid, hm / 0.55);
      for (const p of [A, B, Cq, A, Cq, D]) { C.setXYZ(k, tmp.r, tmp.g, tmp.b); P.setXYZ(k++, p[0], p[1], p[2]); }
    }
    P.needsUpdate = true; C.needsUpdate = true; g.computeVertexNormals();
  };
  return mesh;
}
// ================================================================================================
// OBJETOS VOANDO NO VENTO (no v2 era código solto em shots.js) e PARTÍCULAS
// ================================================================================================
const TIPOS_VOADOR = ['bone', 'jornal', 'toalha', 'bola', 'sorvete', 'guardasol'];
// cada tipo: objeto, altura/rotação de repouso no chão, aceleração, subida e giro (números do v2)
function objetoVoador(tipo, i) {
  switch (tipo) {
    case 'bone': { const v = new Vox(), c = ['#E2483A', '#2C3A68', '#F5F1E8'][i % 3], aba = ['#C2382A', '#1C2A58', '#D5D1C8'][i % 3];
      v.box(0, 0, 0, 0.5, 0.18, 0.5, c, 'base', 0, 0, 0, 0.03); v.box(0, -0.06, 0.32, 0.4, 0.04, 0.22, aba);
      return { obj: v.build(), y0: 0.11, rz: 0, acc: 3.8, lift: 0.8, spin: [2.4, 1.2, 1.8] }; }
    case 'jornal': return { obj: newspaper(), y0: 0.01, rz: 0, acc: 4.4, lift: 0.9, spin: [3, 2, 2.6] };
    case 'toalha': return { obj: towel(SHIRTS[(i * 2 + 1) % SHIRTS.length]), y0: 0, rz: 0, acc: 3.6, lift: 0.7, spin: [2.2, 0.6, 1.4] };
    case 'bola': return { obj: beachBall(), y0: 0.2, rz: 0, acc: 3.2, lift: 0.8, spin: [2, 0, 3] };
    case 'sorvete': return { obj: sorvete(), y0: 0.07, rz: Math.PI / 2, acc: 3.0, lift: 0.7, spin: [2.6, 1, 2] };
    default: { const can = umbrella(i + 2).canopy; can.scale.setScalar(0.4); return { obj: can, y0: 0.03, rz: 0, acc: 2.6, lift: 0.5, spin: [0.6, 0.4, 1.4] }; }
  }
}

/**
 * Objetos leves da orla (bonés, jornais, toalhas, bolas, sorvetes, guarda-sóis pequenos) que o vento arranca do chão.
 * update(t, k, { centro, vento, alcance, chao }): k 0..1 = força/avanço da rajada. Em 0 tudo descansa no chão em volta do
 * centro (um pouco a barlavento). Do centro só contam centro[0] e centro[2] (x, z); a altura do piso é `chao` (padrão 0,18,
 * o calçadão da orla), centro[1] é ignorado. Cada objeto solta num limiar próprio (sorteado por seed), sobe e voa na direção `vento`
 * girando, acelerando, e some depois de `alcance` metros. t só mexe o tremor e o giro.
 */
export function voadores({ n = 14, seed = 1 } = {}) {
  const group = new THREE.Group(), itens = [];
  for (let i = 0; i < n; i++) {
    const r = (k) => rnd(seed * 31.7 + i * 7.3 + k * 1.9);
    const it = { ...objetoVoador(TIPOS_VOADOR[(i + seed) % TIPOS_VOADOR.length], i), ao: r(1), de: r(2), yaw: r(3) * Math.PI * 2, solta: r(4) * 0.55 };
    group.add(it.obj); itens.push(it);
  }
  const dir = new THREE.Vector3(), lado = new THREE.Vector3();
  function update(t, k, { centro = [0, 1, 3], vento = [0, 0.4, -1], alcance = 14, chao = 0.18 } = {}) {
    dir.set(vento[0], 0, vento[2]); if (dir.lengthSq() < 1e-8) dir.set(0, 0, -1); dir.normalize(); lado.set(-dir.z, 0, dir.x);
    const sobe = vento[1];
    itens.forEach((it, i) => {
      const a = clamp((k - it.solta) / 0.45), quase = clamp((k - it.solta + 0.08) / 0.08) * (1 - Math.min(1, a * 6));
      const w = it.acc / 4.4, s = alcance * (w * a * a + (1 - w) * a);                               // acelera com o vento
      const ao = (it.ao - 0.5) * 2 * alcance * 0.3, de = (-0.45 + it.de * 0.6) * alcance * 0.5;
      it.obj.visible = a < 1;
      it.obj.position.set(centro[0], chao + it.y0, centro[2]).addScaledVector(lado, ao + Math.sin(i * 2.1 + t * 3) * 0.3 * a).addScaledVector(dir, de + s);
      it.obj.position.y += sobe * s + it.lift * 4 * a * a + Math.sin(t * 4 + i) * 0.12 * a;
      const g = a * 5 + t * 2.2 * Math.min(1, a * 4);
      it.obj.rotation.set(it.spin[0] * g + Math.sin(t * 23 + i) * 0.12 * quase, it.yaw + it.spin[1] * g, it.rz + it.spin[2] * g);
    });
  }
  return { group, update };
}

/**
 * Partículas (cubinhos de poeira, areia ou faíscas) flutuando em volta do centro: um InstancedMesh, determinístico por seed.
 * update(t, { centro, raio, subida, vento }): numa caixa de meia-largura `raio` em volta do centro, da altura centro.y − 0,9
 * até 0,8·raio acima; sobem `subida` m/s, derivam com `vento` ([x, y, z] m/s) e reaparecem do outro lado (somem nas bordas).
 */
export function particulas({ n = 260, cor = '#FFFFFF', tamanho = 0.05, seed = 2 } = {}) {
  const mat = new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9, depthWrite: false });
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, n); mesh.frustumCulled = false;
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), Eu = new THREE.Euler(), Pp = new THREE.Vector3(), Sc = new THREE.Vector3();
  const r = (i, k) => rnd(seed * 53.1 + i * 3.7 + k * 0.91), wrap = (x, a) => ((x % a) + a) % a;
  function update(t, { centro = [0, 1, 3], raio = 6, subida = 0.3, vento = [0, 0, 0] } = {}) {
    const H = raio * 0.8, D = raio * 2;
    for (let i = 0; i < n; i++) {
      const fx = wrap(r(i, 1) * D + vento[0] * t + Math.sin(t * (0.5 + r(i, 4)) + i) * 0.25, D) - raio;
      const fz = wrap(r(i, 2) * D + vento[2] * t + Math.cos(t * (0.4 + r(i, 5)) + i * 1.3) * 0.25, D) - raio;
      const fy = wrap(r(i, 3) * H + (subida * (0.6 + r(i, 6) * 0.8) + vento[1]) * t, H);
      const borda = Math.sin(Math.PI * fy / H) * clamp((raio - Math.hypot(fx, fz)) / (raio * 0.25));
      Pp.set(centro[0] + fx, centro[1] - 0.9 + fy, centro[2] + fz);
      Q.setFromEuler(Eu.set(t * (1 + r(i, 8) * 2) + i, t * (0.7 + r(i, 9)) + i * 2, 0));
      Sc.setScalar(Math.max(1e-5, tamanho * (0.5 + r(i, 7)) * Math.max(0, borda))); M4.compose(Pp, Q, Sc); mesh.setMatrixAt(i, M4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  return { mesh, update };
}
