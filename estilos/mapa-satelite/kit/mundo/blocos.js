// Blocos do voxel (extraído de teste-lowpoly-v2/src/voxel.js): materiais, caixa chanfrada e o construtor Vox.
import * as THREE from 'three';

const col = (c) => new THREE.Color(c);
export const shade = (c, k) => { const x = col(c); return k >= 0 ? x.lerp(col('#FFFFFF'), k) : x.multiplyScalar(1 + k); };

// ---------- materials (shared) ----------
export const MAT = {
  base: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.62, metalness: 0, clearcoat: 0.22, clearcoatRoughness: 0.5 }),
  matte: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 }),
  shiny: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.05, clearcoat: 0.9, clearcoatRoughness: 0.12 }),
  glass: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.1, metalness: 0.35, clearcoat: 1, emissive: '#FFC27A', emissiveIntensity: 0 }),
  glassDark: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.1, metalness: 0.35, clearcoat: 1 }),
  lamp: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, emissive: '#FFE2A8', emissiveIntensity: 0 }),
  glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
};

// ---------- geometry: a box with chamfered (faceted) edges ----------
export function chamferGeo(w, h, d, e) {
  const a = w / 2, b = h / 2, c = d / 2, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const vx = (sx, sy, sz) => V(sx * a, sy * (b - e), sz * (c - e)), vy = (sx, sy, sz) => V(sx * (a - e), sy * b, sz * (c - e)), vz = (sx, sy, sz) => V(sx * (a - e), sy * (b - e), sz * c);
  const S = [-1, 1], polys = [];
  for (const s of S) {
    polys.push([vx(s, -1, -1), vx(s, 1, -1), vx(s, 1, 1), vx(s, -1, 1)], [vy(-1, s, -1), vy(1, s, -1), vy(1, s, 1), vy(-1, s, 1)], [vz(-1, -1, s), vz(1, -1, s), vz(1, 1, s), vz(-1, 1, s)]);
    for (const t of S) {
      polys.push([vx(s, t, -1), vx(s, t, 1), vy(s, t, 1), vy(s, t, -1)], [vx(s, -1, t), vx(s, 1, t), vz(s, 1, t), vz(s, -1, t)], [vy(-1, s, t), vy(1, s, t), vz(1, s, t), vz(-1, s, t)]);
      for (const u of S) polys.push([vx(s, t, u), vy(s, t, u), vz(s, t, u)]);
    }
  }
  const pos = [];
  for (const P of polys) {
    const C = P.reduce((m, p) => m.add(p), V(0, 0, 0)).multiplyScalar(1 / P.length);
    const n = C.clone().normalize(), u = P[0].clone().sub(C).normalize(), v = n.clone().cross(u);
    P.sort((p, q) => Math.atan2(p.clone().sub(C).dot(v), p.clone().sub(C).dot(u)) - Math.atan2(q.clone().sub(C).dot(v), q.clone().sub(C).dot(u)));
    const fn = P[1].clone().sub(P[0]).cross(P[2].clone().sub(P[0])); if (fn.dot(C) < 0) P.reverse();
    for (let i = 1; i < P.length - 1; i++) pos.push(...P[0].toArray(), ...P[i].toArray(), ...P[i + 1].toArray());
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
const BOX = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(); BOX.deleteAttribute('uv');
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();

/** box builder: add boxes (centre x,y,z, size w,h,d, colour, layer = material key), then .build() → a Group (one mesh per layer) */
export class Vox {
  constructor() { this.L = {}; }
  _push(g, m, c, layer) {
    const L = (this.L[layer] ||= { p: [], n: [], c: [] }), P = g.attributes.position, N = g.attributes.normal, cc = col(c);
    const nm = new THREE.Matrix3().getNormalMatrix(m), v = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(m); L.p.push(v.x, v.y, v.z);
      v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); L.n.push(v.x, v.y, v.z); L.c.push(cc.r, cc.g, cc.b);
    }
  }
  /** centre box */
  box(x, y, z, w, h, d, c, layer = 'base', rx = 0, ry = 0, rz = 0, bevel = 0) {
    if (bevel > 0) { _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(1, 1, 1)); this._push(chamferGeo(w, h, d, bevel), _m, c, layer); }
    else { _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(w, h, d)); this._push(BOX, _m, c, layer); }
    return this;
  }
  /** bottom-anchored box (y0 = bottom) */
  up(x, y0, z, w, h, d, c, layer = 'base', ry = 0) { return this.box(x, y0 + h / 2, z, w, h, d, c, layer, 0, ry, 0); }
  build(cast = true, recv = true) {
    const g = new THREE.Group();
    for (const [k, L] of Object.entries(this.L)) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(L.p, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(L.n, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(L.c, 3));
      geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, MAT[k] || MAT.base); m.castShadow = cast && k !== 'glow'; m.receiveShadow = recv; g.add(m);
    }
    return g;
  }
}
export const vox = () => new Vox();
