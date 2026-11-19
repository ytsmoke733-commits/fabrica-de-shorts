// A stylized 3D person sculpted from SDFs (smooth, clay-like), split into rigid parts on a simple skeleton so it can
// be posed every frame. v2: a living face (jaw + drawn mouth that chews / talks / smiles, animated brows, auto blink,
// cheeks), real hands (palm + 4 fingers + thumb, presets, hold props), 2-bone arm IK (reach a world point), breathing.
//   h.pose({ spine, head, shL, elL, shR, elR, hipL, knL, hipR, knR, look })      body (degrees)
//   h.face(t, { open, wide, smile, round, chew, talk, brow, browL, browR, furrow, lid, blink, look, cheek })
//   h.reach('L'|'R', worldVec3, { pole, twist, flex, dev })                     wrist to a point (call after pose)
//   h.hand('L'|'R', preset | {curl:[4], thumb, spread}, presetB, k)             fingers
//   h.hold('L'|'R', object3d)  (object goes to that hand's grip point)  ·  h.breathe(t, amt)
//   h.setBodyMaterial(m) (x-ray glass; head stays) · h.walk(ph, amt)
// Kit deep-dive: o Human do engolir-chiclete-v2 sem mudança, mais (chame depois do pose/posar e do breathe):
//   h.posar('emPe' | pose, k, extra)       pose do POSES_CORPO (ou uma pose solta) misturada a partir da base por k
//   h.engolir(k)                           volume de pele descendo pelo pescoço (k 0..1; invisível fora de 0 < k < 1;
//                                          o reset() por quadro do vídeo chama engolir(0))
//   h.gesto(nome, k, t, { lado })          gesto do GESTOS, misturado a partir do repouso por k (lado padrão = o do gesto)
//   h.segurar('L'|'R', obj)                = hold: o objeto vai para o ponto de pegada da mão
import * as THREE from 'three';
import { sphere, ellipsoid, capsule, rbox, smin, smax, ssub, noise3, mesh, rgb } from '../motor/sdf.js';
import { lerp } from '../motor/lib.js';
import { GESTOS, gestoNoLado, acenoNoTempo, cocadaNoTempo } from './gestos.mjs';
import { POSE_CORPO_BASE, POSES_CORPO, misturarPosesCorpo } from './poses.mjs';

const D = THREE.MathUtils.degToRad;
const cache = new Map();
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function sculpt(key, f, bounds, step, color) { if (!cache.has(key)) cache.set(key, mesh(f, bounds, step, color)); return cache.get(key); }
function fixNormals(geo) {
  const n = geo.attributes.normal; for (let i = 0; i < n.count; i++) { const x = n.getX(i), y = n.getY(i), z = n.getZ(i), l = Math.hypot(x, y, z); if (!(l > 1e-6)) n.setXYZ(i, 0, 1, 0); else n.setXYZ(i, x / l, y / l, z / l); }
  return geo;
}

export const SKIN_MAT = () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, sheen: 0.35, sheenRoughness: 0.7, sheenColor: new THREE.Color('#ffd6c2') });
const SKIN_FLAT = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, sheen: 0.35, sheenRoughness: 0.7, sheenColor: new THREE.Color('#ffd6c2') });

/** the head with a face (no carved mouth: the mouth is a drawn, animated patch) */
function headFace(p) {
  let d = ellipsoid(p, [0, 0.15, -0.005], [0.108, 0.128, 0.118]);
  d = smin(d, ellipsoid(p, [0, 0.072, 0.03], [0.094, 0.082, 0.092]), 0.05);
  d = smin(d, ellipsoid(p, [0, 0.018, 0.058], [0.043, 0.033, 0.038]), 0.04);
  for (const s of [-1, 1]) { d = smin(d, ellipsoid(p, [s * 0.052, 0.075, 0.068], [0.038, 0.032, 0.032]), 0.03); d = smin(d, ellipsoid(p, [s * 0.108, 0.105, -0.005], [0.017, 0.033, 0.024]), 0.012); d = ssub(d, sphere(p, [s * 0.041, 0.124, 0.112], 0.026), 0.018); }
  d = smin(d, capsule(p, [0, 0.12, 0.104], [0, 0.088, 0.117], 0.009, 0.013), 0.02);
  d = smin(d, sphere(p, [0, 0.082, 0.113], 0.016), 0.016);
  d = smin(d, ellipsoid(p, [0, 0.043, 0.104], [0.026, 0.011, 0.012]), 0.012);
  return smin(d, capsule(p, [0, -0.04, -0.005], [0, 0.05, 0.005], 0.048), 0.04);
}
// jaw: front-lower part of the head rotates about a hinge under the ears (smooth weights, no seams)
const HINGE = [0, 0.062, -0.012];
const jawW = (x, y, z) => sstep(0.047, 0.03, y) * sstep(-0.035, 0.02, z) * sstep(-0.038, -0.006, y);
// mouth patch (drawn texture glued onto the face)
const MB = { x0: -0.042, x1: 0.042, y0: 0.006, y1: 0.064 }, MTW = 288, MTH = 200;

// hand presets: curl per finger (index, middle, ring, pinky) in radians per joint, thumb 0 open … 1 across the palm
const HANDS = {
  relax: { curl: [0.32, 0.4, 0.46, 0.52], thumb: 0.25, spread: 0.35 },
  flat: { curl: [0.04, 0.04, 0.05, 0.06], thumb: 0.05, spread: 1 },
  grip: { curl: [1.0, 1.08, 1.12, 1.16], thumb: 0.7, spread: 0.1 },
  hold: { curl: [0.62, 0.7, 0.78, 0.85], thumb: 0.55, spread: 0.15 },
  pinch: { curl: [0.78, 0.95, 1.25, 1.35], thumb: 0.92, spread: 0.1 },
  fist: { curl: [1.45, 1.5, 1.5, 1.5], thumb: 1, spread: 0 },
  point: { curl: [0.04, 1.45, 1.5, 1.5], thumb: 0.9, spread: 0.2 },
  scratch: { curl: [0.55, 0.6, 0.7, 0.8], thumb: 0.3, spread: 0.5 },
};

// trajeto do gole no referencial do spine: y/z do queixo (k 0) ao colo (k 1). O neckBump do v2 (shots.js 237, y 0.585→0.47)
// só aparecia perto do meio: acima de y 0.57 fica dentro do queixo e abaixo de 0.51 dentro do torso (o colo alarga para
// z 0.08). Aqui ele corre pela garganta, cuja frente está em z 0.047-0.058 entre y 0.57 e 0.51: largo e raso (salta ~6 mm)
// para fundir com a pele em vez de parecer uma bola colada.
const GOLE = { y0: 0.575, y1: 0.505, z0: 0.043, z1: 0.049, esc: [1.35, 1.6, 0.6] };

export class Human {
  constructor(o = {}) {
    const c = { skin: '#E3A988', shirt: '#3E7CC9', pants: '#2B3550', shoes: '#F2F2F2', hair: '#3A2618', iris: '#4A3426', ...o };
    this.o = c; const face = c.face !== false, K = JSON.stringify(c);
    const S = rgb(c.skin), SH = rgb(c.shirt), PA = rgb(c.pants), SO = rgb(c.shoes);
    this.mat = SKIN_MAT(); this.parts = [];
    const add = (parent, geo, pos = [0, 0, 0], mat = this.mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; m.position.set(...pos); m.userData.mat0 = mat; parent.add(m); this.parts.push(m); return m; };
    const G = (parent, pos) => { const g = new THREE.Group(); g.position.set(...pos); parent.add(g); return g; };
    this.skinFlat = SKIN_FLAT(c.skin);

    this.group = new THREE.Group(); this.group.scale.setScalar(c.scale || 1);
    this.hips = G(this.group, [0, 0.93, 0]);
    this.spine = G(this.hips, [0, 0.04, 0]);
    this.torso = add(this.spine, sculpt('torso' + K, (p) => {
      let d = ellipsoid(p, [0, 0.34, 0], [0.185, 0.165, 0.118]);
      d = smin(d, ellipsoid(p, [0, 0.13, 0.008], [0.162, 0.17, 0.112]), 0.08);
      d = smin(d, ellipsoid(p, [0, -0.04, 0], [0.165, 0.11, 0.108]), 0.07);
      d = smin(d, capsule(p, [-0.165, 0.43, -0.005], [0.165, 0.43, -0.005], 0.062), 0.07);
      d = smin(d, capsule(p, [0, 0.46, -0.005], [0, 0.6, 0.0], 0.05, 0.047), 0.05);
      return d;
    }, [[-0.27, -0.17, -0.16], [0.27, 0.64, 0.17]], 0.0065, (p) => { const collar = ellipsoid(p, [0, 0.555, 0.03], [0.078, 0.085, 0.085]); const top = mixc(SH, S, sstep(0.006, -0.006, collar)); return mixc(PA, top, sstep(0.0, 0.03, p[1])); }));
    // head (own geometry copy: the jaw and cheeks deform it every frame)
    this.head = G(this.spine, [0, 0.58, 0]);
    const hgeo = fixNormals(sculpt('head2' + face + c.skin, face ? headFace : (p) => smin(ellipsoid(p, [0, 0.15, -0.005], [0.108, 0.128, 0.118]), capsule(p, [0, -0.02, 0], [0, 0.06, 0.01], 0.05), 0.05),
      [[-0.14, -0.06, -0.14], [0.14, 0.3, 0.16]], 0.0036, () => S)).clone();
    this.headMesh = add(this.head, hgeo);
    this._h0 = Float32Array.from(hgeo.attributes.position.array); this._n0 = Float32Array.from(hgeo.attributes.normal.array);
    this._hw = new Float32Array(hgeo.attributes.position.count); this._hc = new Float32Array(hgeo.attributes.position.count * 2);
    for (let i = 0; i < this._hw.length; i++) {
      const x = this._h0[i * 3], y = this._h0[i * 3 + 1], z = this._h0[i * 3 + 2]; this._hw[i] = face ? jawW(x, y, z) : 0;
      for (const [k, s] of [[0, -1], [1, 1]]) { const dx = x - s * 0.056, dy = y - 0.05, dz = z - 0.07; this._hc[i * 2 + k] = face ? Math.exp(-(dx * dx + dy * dy * 1.4 + dz * dz) / (2 * 0.02 * 0.02)) : 0; }
    }
    this._jaw = 0; this._cheek = [0, 0]; this._faceKey = '';
    if (face) {
      const white = new THREE.MeshPhysicalMaterial({ color: '#F7F4EF', roughness: 0.2, clearcoat: 1 });
      const iris = new THREE.MeshStandardMaterial({ color: c.iris, roughness: 0.3 }), pupil = new THREE.MeshBasicMaterial({ color: '#0B0907' });
      this.eyes = []; this.lids = [];
      const lidM = new THREE.MeshPhysicalMaterial({ color: c.skin, roughness: 0.55, sheen: 0.35, sheenColor: new THREE.Color('#ffd6c2') });
      for (const s of [-1, 1]) {
        const e = new THREE.Group(); e.position.set(s * 0.041, 0.124, 0.091); this.head.add(e); this.eyes.push(e);
        e.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 32, 24), white));
        const ir = new THREE.Mesh(new THREE.CircleGeometry(0.0108, 32), iris); ir.position.z = 0.0222; e.add(ir);
        const pu = new THREE.Mesh(new THREE.CircleGeometry(0.0052, 24), pupil); pu.position.z = 0.0224; e.add(pu);
        const hl = new THREE.Mesh(new THREE.CircleGeometry(0.0022, 12), new THREE.MeshBasicMaterial({ color: '#FFFFFF' })); hl.position.set(0.0035, 0.004, 0.0226); e.add(hl);
        const lid = new THREE.Mesh(new THREE.SphereGeometry(0.0236, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.36), lidM); lid.position.set(s * 0.041, 0.124, 0.091); lid.rotation.x = 0.12; this.head.add(lid);
        const low = new THREE.Mesh(new THREE.SphereGeometry(0.0234, 32, 16, 0, Math.PI * 2, Math.PI * 0.78, Math.PI * 0.22), lidM); low.rotation.x = -0.25; low.position.copy(lid.position); this.head.add(low);
        this.lids.push(lid);
      }
      const HA = rgb(c.hair);
      add(this.head, sculpt('hair2' + c.hair, (p) => {
        let d = ellipsoid(p, [0, 0.168, -0.014], [0.118, 0.138, 0.13]);
        const line = 0.05 + 0.16 * Math.min(1, Math.max(0, (p[2] + 0.04) / 0.14));
        d = smax(d, -(p[1] - line), 0.02);
        d = smin(d, ellipsoid(p, [0.02, 0.262, 0.05], [0.085, 0.045, 0.075]), 0.04);
        return d + 0.006 * noise3(p[0] * 45, p[1] * 25, p[2] * 45);
      }, [[-0.15, 0.02, -0.16], [0.15, 0.33, 0.16]], 0.004, () => HA));
      // brows: separate so they can move
      const browM = new THREE.MeshStandardMaterial({ color: c.hair, roughness: 0.8 }), bgeo = new THREE.CapsuleGeometry(0.0058, 0.032, 6, 12); bgeo.rotateZ(Math.PI / 2);
      this.brows = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.042, 0.1605, 0.1135); g.rotation.order = 'YZX'; this.head.add(g); const m = new THREE.Mesh(bgeo, browM); g.add(m); g.userData.s = s; return g; });
      // mouth: a patch that hugs the face, with a canvas texture redrawn when the mouth changes
      this.mcv = document.createElement('canvas'); this.mcv.width = MTW; this.mcv.height = MTH; this.mtex = new THREE.CanvasTexture(this.mcv); this.mtex.colorSpace = THREE.SRGBColorSpace; this.mtex.anisotropy = 4;
      const NX = 28, NY = 20, pos = [], uv = [], idx = [], q = [0, 0, 0];
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
        const x = MB.x0 + (MB.x1 - MB.x0) * i / NX, y = MB.y0 + (MB.y1 - MB.y0) * j / NY;
        let z = 0.2; q[0] = x; q[1] = y; while (z > 0.0) { q[2] = z; if (headFace(q) < 0) break; z -= 0.0015; }
        let a = z, b = z + 0.0015; for (let k = 0; k < 20; k++) { const m = (a + b) / 2; q[2] = m; if (headFace(q) < 0) a = m; else b = m; }
        q[2] = b; const e = 0.0008, f0 = headFace(q); q[0] = x + e; const gx = headFace(q) - f0; q[0] = x; q[1] = y + e; const gy = headFace(q) - f0; q[1] = y; q[2] = b + e; const gz = headFace(q) - f0; const l = Math.hypot(gx, gy, gz) || 1;
        pos.push(x + gx / l * 0.0011, y + gy / l * 0.0011, b + gz / l * 0.0011); uv.push(i / NX, j / NY);
      }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b2 = a + 1, c2 = a + NX + 1, d2 = c2 + 1; idx.push(a, b2, d2, a, d2, c2); }
      const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); mg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); mg.setIndex(idx); mg.computeVertexNormals();
      this._m0 = Float32Array.from(pos); this._mw = new Float32Array(pos.length / 3).map((_, i) => jawW(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));
      this.mouth = new THREE.Mesh(mg, new THREE.MeshStandardMaterial({ map: this.mtex, transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      this.mouth.renderOrder = 2; this.head.add(this.mouth);
    }
    // arms (forearm ends at the wrist; the hand is its own rig)
    this.arm = {};
    for (const s of [-1, 1]) {
      const k = s < 0 ? 'L' : 'R', sh = G(this.spine, [s * 0.2, 0.43, -0.005]);
      add(sh, sculpt('uarm' + K, (p) => smin(capsule(p, [0, 0, 0], [0, -0.27, 0], 0.048, 0.04), capsule(p, [0, 0.0, 0], [0, -0.13, 0], 0.062, 0.056), 0.02),
        [[-0.08, -0.33, -0.08], [0.08, 0.07, 0.08]], 0.005, (p) => mixc(S, SH, sstep(-0.142, -0.128, p[1]))));
      const el = G(sh, [0, -0.27, 0]);
      add(el, sculpt('farm2' + c.skin, (p) => smin(capsule(p, [0, 0, 0], [0, -0.228, 0.004], 0.039, 0.028), ellipsoid(p, [0, -0.236, 0.005], [0.022, 0.016, 0.028]), 0.02), [[-0.07, -0.27, -0.06], [0.07, 0.06, 0.07]], 0.005, () => S));
      const hand = G(el, [0, -0.243, 0.005]); hand.rotation.order = 'YZX';
      add(hand, sculpt('palm' + s + c.skin, (p) => {
        let d = rbox(p, [0, -0.046, 0.001], [0.0115, 0.034, 0.03], 0.0105);
        d = smin(d, ellipsoid(p, [0, -0.006, 0.003], [0.019, 0.02, 0.027]), 0.014);
        d = smin(d, ellipsoid(p, [-s * 0.005, -0.036, 0.022], [0.013, 0.024, 0.014]), 0.012);
        return d;
      }, [[-0.035, -0.095, -0.045], [0.035, 0.03, 0.05]], 0.0022, () => S));
      const fingers = [], FZ = [0.0215, 0.0072, -0.0072, -0.021], FY = [-0.074, -0.077, -0.075, -0.07], L1 = [0.026, 0.029, 0.027, 0.021], L2 = [0.025, 0.027, 0.025, 0.02], R = [0.0074, 0.0076, 0.0072, 0.0064];
      for (let f = 0; f < 4; f++) {
        const base = G(hand, [0, FY[f], FZ[f]]); base.rotation.order = 'XZY';
        const g1 = new THREE.CapsuleGeometry(R[f], L1[f], 6, 14); g1.translate(0, -L1[f] / 2, 0); add(base, g1, [0, 0, 0], this.skinFlat);
        const mid = G(base, [0, -L1[f], 0]);
        const g2 = new THREE.CapsuleGeometry(R[f] * 0.9, L2[f] - 0.004, 6, 14); g2.translate(0, -(L2[f] - 0.004) / 2, 0); add(mid, g2, [0, 0, 0], this.skinFlat);
        fingers.push({ base, mid, spreadA: [-0.13, -0.04, 0.05, 0.14][f] });
      }
      const tb = G(hand, [-s * 0.008, -0.024, 0.027]);
      const t1 = new THREE.CapsuleGeometry(0.0084, 0.022, 6, 14); t1.translate(0, -0.011, 0); add(tb, t1, [0, 0, 0], this.skinFlat);
      const tm = G(tb, [0, -0.022, 0]); const t2 = new THREE.CapsuleGeometry(0.0078, 0.016, 6, 14); t2.translate(0, -0.008, 0); add(tm, t2, [0, 0, 0], this.skinFlat);
      const grip = G(hand, [-s * 0.024, -0.066, 0.008]);
      this.arm[k] = { sh, el, hand, fingers, thumb: { base: tb, mid: tm }, grip, s };
    }
    // legs
    this.leg = {};
    for (const s of [-1, 1]) {
      const k = s < 0 ? 'L' : 'R', hip = G(this.hips, [s * 0.088, -0.03, 0]);
      add(hip, sculpt('thigh' + c.pants, (p) => capsule(p, [0, 0, 0], [0, -0.42, 0.005], 0.082, 0.06), [[-0.1, -0.5, -0.1], [0.1, 0.1, 0.1]], 0.007, () => PA));
      const kn = G(hip, [0, -0.42, 0.005]);
      add(kn, sculpt('shin' + c.pants + c.shoes, (p) => {
        let d = capsule(p, [0, 0, 0], [0, -0.38, -0.005], 0.058, 0.045);
        d = smin(d, ellipsoid(p, [0, -0.43, 0.045], [0.056, 0.05, 0.12]), 0.04);
        return smax(d, -(p[1] + 0.475), 0.01);
      }, [[-0.09, -0.5, -0.1], [0.09, 0.07, 0.19]], 0.006, (p) => (p[1] > -0.36 ? PA : SO)));
      this.leg[k] = { hip, kn };
    }
    // engolir: volume de pele na frente do pescoço (elipsoide no SKIN_MAT do corpo, com a cor da pele em cor de vértice;
    // filho do spine; substitui o neckBump do v2, shots.js 72)
    const goleGeo = new THREE.SphereGeometry(0.02, 20, 14); goleGeo.setAttribute('color', new THREE.Float32BufferAttribute(new Array(goleGeo.attributes.position.count).fill(S).flat(), 3));
    this.gole = add(this.spine, goleGeo, [0, GOLE.y0, GOLE.z0]); this.gole.castShadow = false; this.gole.visible = false;
    this.pose({}); this.hand('L', 'relax'); this.hand('R', 'relax'); if (face) this.face(0, {});
  }
  /** pose in degrees: spine/head [x, y, z]; shL/shR [x (forward +), y, z (out +)]; elL/elR bend; hipL/hipR; knL/knR */
  pose(q) {
    const r3 = (g, a = [0, 0, 0]) => g.rotation.set(D(a[0]), D(a[1]), D(a[2]));
    r3(this.spine, q.spine); r3(this.head, q.head);
    r3(this.arm.L.sh, [-(q.shL?.[0] ?? 0), q.shL?.[1] ?? 0, -(q.shL?.[2] ?? 6)]); this.arm.L.el.rotation.set(-D(q.elL ?? 10), 0, 0);
    r3(this.arm.R.sh, [-(q.shR?.[0] ?? 0), q.shR?.[1] ?? 0, q.shR?.[2] ?? 6]); this.arm.R.el.rotation.set(-D(q.elR ?? 10), 0, 0);
    this.arm.L.hand.rotation.set(0, 0, 0); this.arm.R.hand.rotation.set(0, 0, 0);
    r3(this.leg.L.hip, [-(q.hipL?.[0] ?? 0), q.hipL?.[1] ?? 0, -(q.hipL?.[2] ?? 2)]); this.leg.L.kn.rotation.set(D(q.knL ?? 2), 0, 0);
    r3(this.leg.R.hip, [-(q.hipR?.[0] ?? 0), q.hipR?.[1] ?? 0, q.hipR?.[2] ?? 2]); this.leg.R.kn.rotation.set(D(q.knR ?? 2), 0, 0);
    this.hips.position.set(0, q.hipsY ?? 0.93, q.hipsZ ?? 0);
    if (q.lid != null && this.lids) this.lids.forEach((l) => (l.rotation.x = 0.12 + q.lid * 1.25));
    if (q.look && this.eyes) this.eyes.forEach((e) => e.rotation.set(D(q.look[1] || 0), D(q.look[0] || 0), 0));
    this.group.updateMatrixWorld(true);
    return this;
  }
  /** walking pose at phase ph (radians) */
  walk(ph, amt = 1, extra = {}) { const s = Math.sin(ph) * amt; this.pose({ hipL: [s * 26, 0, 2], hipR: [-s * 26, 0, 2], knL: Math.max(0, -Math.sin(ph + 0.6)) * 40 * amt + 4, knR: Math.max(0, Math.sin(ph + 0.6)) * 40 * amt + 4, shL: [-s * 20, 0, 6], shR: [s * 20, 0, 6], elL: 18, elR: 18, spine: [3, s * 4, 0], ...extra, hipsY: 0.93 - Math.abs(Math.cos(ph)) * 0.014 * amt }); return this; }
  /** gentle breathing: chest swells (call after pose) */
  breathe(t, amt = 1) { const b = 0.5 - 0.5 * Math.cos(t * 2 * Math.PI / 3.6); this.torso.scale.set(1 + 0.012 * b * amt, 1 + 0.006 * b * amt, 1 + 0.02 * b * amt); this.spine.rotation.x += D(-0.8 * b * amt); this.group.updateMatrixWorld(true); return this; }
  /**
   * the face at film time t. open 0..1 · wide -1..1 · smile -1..1 · round 0..1 ("O") · chew 0..1 (auto jaw cycle)
   * talk 0..1 (mouth amplitude, e.g. from the narration envelope) · brow -1..1 (both up/down) · browL/browR extra per side
   * furrow 0..1 (inner ends down: doubt/anger) · lid -0.4 wide … 1 closed · blink (default true) · look [yaw, pitch] deg
   */
  face(t, q = {}) {
    if (!this.mouth) return this;
    let open = q.open ?? 0, jaw = 0, cheekL = q.cheek ?? 0, cheekR = q.cheek ?? 0;
    if (q.chew) { const ph = t * 2 * Math.PI * 1.55, c = 0.5 - 0.5 * Math.cos(ph); jaw += c * 0.11 * q.chew; open += c * 0.12 * q.chew; const side = Math.sin(ph * 0.5) > 0; (side ? (cheekL += c * q.chew) : (cheekR += c * q.chew)); }
    if (q.talk) { open += q.talk * 0.75; jaw += q.talk * 0.13; }
    jaw += open * 0.1 + (q.jaw ?? 0);
    // auto blink: one quick blink every ~2.6-4 s (pure function of t)
    let lid = q.lid ?? 0;
    if (q.blink !== false) { const P = 3.2, n = Math.floor(t / P), st = n * P + hash(n + 7) * 1.6, ph = (t - st) / 0.16; if (ph > 0 && ph < 1) lid = lid + (1 - lid) * Math.sin(ph * Math.PI); }
    this.lids.forEach((l) => (l.rotation.x = 0.12 + lid * 1.25));
    if (q.look) this.eyes.forEach((e) => e.rotation.set(D(q.look[1] || 0), D(q.look[0] || 0), 0));
    const brow = q.brow ?? 0, fur = q.furrow ?? 0;
    this.brows.forEach((g) => { const s = g.userData.s, b = brow + (s < 0 ? q.browL ?? 0 : q.browR ?? 0); g.position.set(s * 0.042, 0.1605 + b * 0.0085 - fur * 0.003, 0.1135 - Math.max(0, b) * 0.0022); g.rotation.set(0, -s * 0.27, s * (-0.02 + fur * 0.36 - Math.max(0, b) * 0.1)); });
    this.drawMouth(Math.max(0, open), q.wide ?? 0, q.smile ?? 0, q.round ?? 0);
    this.deform(Math.min(0.24, jaw), cheekL, cheekR);
    this.group.updateMatrixWorld(true);
    return this;
  }
  drawMouth(open, wide, smile, round) {
    const key = [open, wide, smile, round].map((v) => v.toFixed(3)).join(); if (key === this._faceKey) return; this._faceKey = key;
    const g = this.mcv.getContext('2d'); g.clearRect(0, 0, MTW, MTH);
    const X = (x) => (x - MB.x0) / (MB.x1 - MB.x0) * MTW, Y = (y) => (1 - (y - MB.y0) / (MB.y1 - MB.y0)) * MTH;   // uv v=0 is the bottom row
    const hw = 0.0195 * (1 + 0.22 * wide - 0.42 * round), yc = 0.0438, cy = yc + smile * 0.0052;
    const op = open * 0.0185 * (1 + 0.25 * round), yU = yc + 0.0006 + round * op * 0.18, yL = yc - 0.0008 - op;
    const N = 40, top = [], bot = [];
    for (let i = 0; i <= N; i++) { const u = -1 + 2 * i / N, k = 1 - u * u, x = u * hw; top.push([x, cy + (yU - cy) * Math.pow(k, 0.45 + 0.4 * round)]); bot.push([x, cy + (yL - cy) * Math.pow(k, 0.55 + 0.35 * round)]); }
    const path = () => { g.beginPath(); top.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); for (let i = N; i >= 0; i--) g.lineTo(X(bot[i][0]), Y(bot[i][1])); g.closePath(); };
    // lips tint (soft)
    g.save(); g.globalAlpha = 0.32; g.fillStyle = '#B9615C'; g.beginPath(); top.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y + 0.0032 * Math.sqrt(1 - (x / hw) ** 2))) : g.moveTo(X(x), Y(y)))); for (let i = N; i >= 0; i--) g.lineTo(X(bot[i][0]), Y(bot[i][1] - 0.004 * Math.sqrt(1 - (bot[i][0] / hw) ** 2))); g.closePath(); g.filter = 'blur(2px)'; g.fill(); g.restore();
    if (op > 0.0006) {
      path(); g.fillStyle = '#3A0E13'; g.fill();
      g.save(); path(); g.clip();
      g.fillStyle = '#F4EFE8'; g.fillRect(X(-hw), Y(yU + 0.002), X(hw) - X(-hw), Y(yU - 0.0042) - Y(yU + 0.002));
      g.fillStyle = '#C9505E'; g.beginPath(); g.ellipse(X(0), Y(yL + 0.0012), (X(hw * 0.62) - X(0)), Y(yL) - Y(yL + 0.0055), 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    g.strokeStyle = '#5E2422'; g.lineWidth = 5.2; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); top.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke();
    if (op > 0.0006) { g.lineWidth = 2.6; g.beginPath(); bot.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.stroke(); }
    if (smile > 0.3) { g.lineWidth = 2.4; g.globalAlpha = Math.min(1, (smile - 0.3) * 2) * 0.6; for (const s of [-1, 1]) { g.beginPath(); g.arc(X(s * (hw + 0.0022)), Y(cy - 0.0004), 5, s < 0 ? -0.6 : Math.PI - 0.9, s < 0 ? 0.9 : Math.PI + 0.6); g.stroke(); } g.globalAlpha = 1; }
    this.mtex.needsUpdate = true;
  }
  deform(jaw, cl, cr) {
    if (Math.abs(jaw - this._jaw) < 1e-4 && Math.abs(cl - this._cheek[0]) < 1e-3 && Math.abs(cr - this._cheek[1]) < 1e-3) return;
    this._jaw = jaw; this._cheek = [cl, cr];
    const P = this.headMesh.geometry.attributes.position, Nn = this.headMesh.geometry.attributes.normal, a = this._h0, n0 = this._n0, w = this._hw, hc = this._hc;
    for (let i = 0, N = w.length; i < N; i++) {
      let x = a[i * 3], y = a[i * 3 + 1], z = a[i * 3 + 2], nx = n0[i * 3], ny = n0[i * 3 + 1], nz = n0[i * 3 + 2];
      const bump = (hc[i * 2] * cl + hc[i * 2 + 1] * cr) * 0.0045; if (bump) { x += nx * bump; y += ny * bump; z += nz * bump; }
      const ang = jaw * w[i];
      if (ang) { const c = Math.cos(ang), s = Math.sin(ang), yy = y - HINGE[1], zz = z - HINGE[2]; y = HINGE[1] + yy * c - zz * s; z = HINGE[2] + yy * s + zz * c; const ny2 = ny * c - nz * s, nz2 = ny * s + nz * c; ny = ny2; nz = nz2; }
      P.array[i * 3] = x; P.array[i * 3 + 1] = y; P.array[i * 3 + 2] = z; Nn.array[i * 3] = nx; Nn.array[i * 3 + 1] = ny; Nn.array[i * 3 + 2] = nz;
    }
    P.needsUpdate = true; Nn.needsUpdate = true;
    const MP = this.mouth.geometry.attributes.position, m0 = this._m0, mw = this._mw;
    for (let i = 0; i < mw.length; i++) { const ang = jaw * mw[i], y = m0[i * 3 + 1], z = m0[i * 3 + 2]; const c = Math.cos(ang), s = Math.sin(ang), yy = y - HINGE[1], zz = z - HINGE[2]; MP.array[i * 3 + 1] = HINGE[1] + yy * c - zz * s; MP.array[i * 3 + 2] = HINGE[2] + yy * s + zz * c; }
    MP.needsUpdate = true;
  }
  /** fingers: preset name or {curl, thumb, spread}; blend to preset b by k */
  hand(side, a = 'relax', b = null, k = 0) {
    const A = typeof a === 'string' ? HANDS[a] : a, B = b ? (typeof b === 'string' ? HANDS[b] : b) : A, m = (x, y) => x + (y - x) * k;
    const H = this.arm[side], s = H.s;
    H.fingers.forEach((f, i) => { const cu = m(A.curl[i], B.curl[i]); f.base.rotation.set(f.spreadA * m(A.spread, B.spread), 0, -s * cu); f.mid.rotation.set(0, 0, -s * cu * 1.15); });
    const th = m(A.thumb, B.thumb);
    // thumb swings from pointing forward-down (open) to across the palm (closed)
    const open = new THREE.Vector3(-s * 0.2, -0.55, 0.8).normalize(), closed = new THREE.Vector3(-s * 0.85, -0.52, 0.05).normalize(), dir = open.clone().lerp(closed, th).normalize();
    H.thumb.base.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir); H.thumb.mid.rotation.set(0, 0, -s * th * 0.7);
    return this;
  }
  /** put an object in a hand (keeps the object's own local position/rotation relative to the grip point) */
  hold(side, obj) { if (obj.parent !== this.arm[side].grip) this.arm[side].grip.add(obj); return this; }
  /** world position of a hand's grip point */
  gripPos(side, v = new THREE.Vector3()) { this.group.updateMatrixWorld(true); return this.arm[side].grip.getWorldPosition(v); }
  /** 2-bone IK: put the wrist at world point T. pole = elbow direction in the body's frame; twist/flex/dev = wrist (deg) */
  reach(side, T, { pole = null, twist = 0, flex = 0, dev = 0 } = {}) {
    const A = this.arm[side], s = A.s, V = THREE.Vector3; this.group.updateMatrixWorld(true);
    const sc = this.group.scale.x, l1 = 0.27 * sc, l2 = 0.243 * sc;
    const S = A.sh.getWorldPosition(new V()), Dv = new V().subVectors(T, S); let d = Dv.length();
    d = Math.max(0.04, Math.min((l1 + l2) * 0.998, d)); const u = Dv.normalize();
    const gq = this.group.getWorldQuaternion(new THREE.Quaternion());
    const P = new V(...(pole || [s * 0.55, -1, -0.25])).normalize().applyQuaternion(gq);
    const p = P.clone().sub(u.clone().multiplyScalar(u.dot(P))); if (p.lengthSq() < 1e-8) p.set(0, -1, 0); p.normalize();
    const ca = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))), al = Math.acos(ca);
    const a = u.clone().multiplyScalar(Math.cos(al)).add(p.clone().multiplyScalar(Math.sin(al)));
    const E = S.clone().add(a.clone().multiplyScalar(l1)), Tt = S.clone().add(u.clone().multiplyScalar(d));
    const f = Tt.sub(E).normalize(), bend = Math.acos(Math.max(-1, Math.min(1, a.dot(f))));
    let z = f.clone().sub(a.clone().multiplyScalar(a.dot(f))); if (z.lengthSq() < 1e-8) z = p.clone().negate(); z.normalize();
    const y = a.clone().negate(), x = new V().crossVectors(y, z);
    const qW = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    const pq = A.sh.parent.getWorldQuaternion(new THREE.Quaternion());
    A.sh.quaternion.copy(pq.invert().multiply(qW)); A.el.rotation.set(-bend, 0, 0);
    A.hand.rotation.set(D(dev), D(twist), D(flex));
    this.group.updateMatrixWorld(true);
    return this;
  }
  /**
   * put a hand's grip point at world point Gp with the fingers pointing along F and the palm facing N (both in the body's
   * frame, they follow the body if it is turned); the arm solves itself (IK, pole = elbow direction)
   */
  place(side, Gp, F, N, o = {}) {
    const A = this.arm[side], s = A.s, V = THREE.Vector3; this.group.updateMatrixWorld(true);
    const gq = this.group.getWorldQuaternion(new THREE.Quaternion());
    const y = new V(...F).normalize().negate().applyQuaternion(gq);
    const x = new V(...N).normalize().multiplyScalar(-s).applyQuaternion(gq); x.sub(y.clone().multiplyScalar(x.dot(y))).normalize();
    const z = new V().crossVectors(x, y);
    const qW = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    const wrist = Gp.clone().sub(A.grip.position.clone().multiplyScalar(this.group.scale.x).applyQuaternion(qW));
    this.reach(side, wrist, o);
    const pq = A.hand.parent.getWorldQuaternion(new THREE.Quaternion());
    A.hand.quaternion.copy(pq.invert().multiply(qW)); this.group.updateMatrixWorld(true);
    return this;
  }
  /** swap the body (not the head) to another material, e.g. x-ray glass; null restores */
  setBodyMaterial(m) { this.parts.forEach((p) => { if (p.parent !== this.head) p.material = m || p.userData.mat0; p.castShadow = !m && p !== this.gole; }); }   // kit: o gole nunca faz sombra
  setAllMaterial(m) { this.parts.forEach((p) => (p.material = m)); }

  // ─────────── acréscimos do kit deep-dive ───────────
  /** pose do POSES_CORPO pelo nome (ou uma pose solta no formato do pose()), misturada a partir de POSE_CORPO_BASE por k;
   *  `extra` sobrescreve chaves no fim. A pálpebra da pose é reescrita pelo face(): olho fechado vai também no face. */
  posar(nomeOuPose, k = 1, extra = {}) {
    const alvo = typeof nomeOuPose === 'string' ? POSES_CORPO[nomeOuPose] : nomeOuPose;
    if (!alvo) throw new Error(`pose "${nomeOuPose}" não existe`);
    return this.pose({ ...misturarPosesCorpo(POSE_CORPO_BASE, alvo, k), ...extra });
  }
  /**
   * engolir: k 0..1 leva o volume do queixo até a clavícula, com escala em sino; invisível em k <= 0 ou k >= 1.
   * O volume é estado do Human: o reset() por quadro do vídeo precisa chamar engolir(0), senão um gole de um quadro
   * aparece nos seguintes (todo quadro = função pura de t).
   */
  engolir(k) {
    const g = this.gole; g.visible = k > 0 && k < 1;
    if (!g.visible) return this;
    g.position.set(0, lerp(GOLE.y0, GOLE.y1, k), lerp(GOLE.z0, GOLE.z1, k));
    g.scale.set(GOLE.esc[0], GOLE.esc[1], GOLE.esc[2]).multiplyScalar(Math.sin(Math.PI * k));
    this.group.updateMatrixWorld(true);
    return this;
  }
  /** um gesto do GESTOS em coordenadas do mundo agora (osso -> mundo; direções -> referencial do corpo, como o place pede) */
  _gestoNoCorpo(g) {
    this.group.updateMatrixWorld(true);
    const osso = this[g.osso], qc = this.group.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(osso.getWorldQuaternion(new THREE.Quaternion()));
    const dir = (v) => new THREE.Vector3(...v).applyQuaternion(qc);
    return { p: osso.localToWorld(new THREE.Vector3(...g.alvo)), F: dir(g.dedos), N: dir(g.palma), pole: g.pole ? dir(g.pole) : null };
  }
  /**
   * gesto `nome` do GESTOS (repouso, garganta, barriga, cocarCabeca, apontar, acenar) com força k 0..1, misturado a partir
   * do repouso (mesmo padrão do placeK do v2, shots.js 104). t = tempo do filme (aceno / coçada). lado: a mão; padrão =
   * o lado do gesto; o outro lado espelha o gesto. Chame depois do pose/posar e do breathe.
   */
  gesto(nome, k = 1, t = 0, { lado } = {}) {
    const G0 = GESTOS[nome]; if (!G0) throw new Error(`gesto "${nome}" não existe`);
    const L = lado ?? G0.lado, s = L === 'L' ? -1 : 1;
    const A = this._gestoNoCorpo(gestoNoLado(GESTOS.repouso, L)), g = gestoNoLado(G0, L), B = this._gestoNoCorpo(g);
    if (nome === 'acenar') { const a = acenoNoTempo(t); B.F.x += s * a * 6; B.p.add(new THREE.Vector3(s * a, 0, 0).applyQuaternion(this.group.getWorldQuaternion(new THREE.Quaternion()))); }
    if (nome === 'cocarCabeca') B.p.add(new THREE.Vector3(0, 0, cocadaNoTempo(t)).applyQuaternion(this[g.osso].getWorldQuaternion(new THREE.Quaternion())));
    const poleA = A.pole ?? new THREE.Vector3(s * 0.55, -1, -0.25), poleB = B.pole ?? new THREE.Vector3(s * 0.55, -1, -0.25);   // sem pole: o padrão do reach()
    const pole = poleA.lerp(poleB, k).toArray();
    this.place(L, A.p.clone().lerp(B.p, k), A.F.clone().lerp(B.F, k).toArray(), A.N.clone().lerp(B.N, k).toArray(), { pole });
    this.hand(L, 'relax', g.preset, k);
    return this;
  }
  /** segurar: alias documentado de hold() — o objeto vira filho do ponto de pegada (mantém posição/rotação locais) */
  segurar(lado, obj) { return this.hold(lado, obj); }
}

