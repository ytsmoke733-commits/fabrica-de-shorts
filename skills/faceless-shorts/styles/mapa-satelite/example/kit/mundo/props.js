// Objetos da cidade (extraído de teste-lowpoly-v2/src/voxel.js): prédios, palmeiras, postes, carros, guarda-sóis, céu, estrelas.
import * as THREE from 'three';
import { rnd, lerp } from '../motor/lib.js';
import { vox, shade } from './blocos.js';
import { SHIRTS } from './pessoa.js';

const col = (c) => new THREE.Color(c);

// ================================================================================================
// TOWN PROPS
// ================================================================================================
export const PASTEL = ['#F6D7A7', '#F4B9A0', '#A8D8C8', '#F7E7B4', '#B9D3F0', '#F2C1CF', '#E8E1D0', '#C8E0A8', '#FFD9A0'];
const AWN = [['#E2483A', '#F5F1E8'], ['#2BA6A0', '#F5F1E8'], ['#F2C14E', '#E86A4A'], ['#4C7DDC', '#F5F1E8'], ['#5DB86A', '#F7E7B4']];

/** a low building facing +z; front at z 0, x centred, base at y 0 */
export function building(seed, w = 10, floors = 3, d = 8) {
  const v = vox(), r = (k) => rnd(seed * 13.1 + k * 2.3), wall = PASTEL[Math.floor(r(1) * PASTEL.length)], wallD = shade(wall, -0.12).getStyle(), trim = shade(wall, 0.45).getStyle();
  const fh = 3.1, H = 0.6 + floors * fh;
  v.up(0, 0, -d / 2, w, H, d, wall);
  // ground floor: shop with glass front + awning + sign
  v.up(0, 0, 0.02, w - 0.2, 0.35, 0.1, wallD);
  const aw = AWN[Math.floor(r(2) * AWN.length)], nStr = Math.max(4, Math.round(w / 0.9));
  v.up(0, 0.35, 0.03, w - 1.2, 2.3, 0.08, '#3E5A70', 'glassDark');
  for (let k = 0; k < 3; k++) v.up(-w / 2 + 0.6 + k * (w - 1.2) / 2, 0.35, 0.08, 0.12, 2.3, 0.1, trim);
  for (let i = 0; i < nStr; i++) { const sw = (w - 0.6) / nStr; v.box(-w / 2 + 0.3 + sw * (i + 0.5), 3.0, 0.75, sw, 0.12, 1.6, aw[i % 2], 'base', -0.32, 0, 0); }
  v.box(0, 3.55, 0.08, Math.min(w * 0.55, 5), 0.5, 0.12, aw[0]); v.box(0, 3.55, 0.15, Math.min(w * 0.55, 5) - 0.4, 0.22, 0.02, '#F5F1E8');
  // upper floors
  const nWin = Math.max(2, Math.floor(w / 2.2));
  for (let f = 1; f < floors; f++) {
    const y0 = 0.6 + f * fh;
    v.up(0, y0 - 0.12, 0.02, w + 0.1, 0.18, 0.12, trim);
    for (let i = 0; i < nWin; i++) {
      const x = -w / 2 + (w / nWin) * (i + 0.5), lit = r(10 + f * 7 + i) > 0.45;
      v.up(x, y0 + 0.65, 0.01, 1.1, 1.5, 0.06, '#35546E', lit ? 'glass' : 'glassDark');
      v.up(x, y0 + 0.5, 0.06, 1.35, 0.12, 0.2, trim); v.up(x, y0 + 2.15, 0.05, 1.35, 0.1, 0.12, trim);
      v.up(x - 0.62, y0 + 0.6, 0.04, 0.08, 1.6, 0.1, trim); v.up(x + 0.62, y0 + 0.6, 0.04, 0.08, 1.6, 0.1, trim);
      if (r(30 + f * 5 + i) > 0.62) {                                             // balcony
        v.up(x, y0 + 0.35, 0.45, 1.8, 0.12, 0.9, trim);
        for (let b = 0; b < 6; b++) v.up(x - 0.8 + b * 0.32, y0 + 0.47, 0.86, 0.05, 0.75, 0.05, '#4A4A52');
        v.up(x, y0 + 1.2, 0.86, 1.8, 0.06, 0.08, '#4A4A52');
        if (r(50 + i) > 0.5) v.up(x + 0.5, y0 + 0.47, 0.6, 0.35, 0.3, 0.35, ['#E86A4A', '#5DB86A', '#F2C14E'][i % 3]);   // plant pot / chair
      } else if (r(70 + f + i) > 0.7) v.up(x + 0.3, y0 + 0.2, 0.3, 0.7, 0.45, 0.45, '#D8D8DC');   // AC unit
    }
  }
  // roof
  v.up(0, H, -d / 2, w + 0.2, 0.4, d + 0.2, trim); v.up(0, H + 0.4, -d / 2, w - 0.4, 0.05, d - 0.4, wallD);
  if (r(5) > 0.4) { v.up(w * 0.2, H + 0.4, -d / 2, 1.6, 1.4, 1.6, '#3E6E8E'); v.up(w * 0.2, H + 1.8, -d / 2, 1.7, 0.1, 1.7, '#2E5470'); }
  if (r(6) > 0.5) v.up(-w * 0.25, H + 0.4, -d * 0.6, 0.08, 2.5, 0.08, '#6A6A72');
  const g = v.build(); g.userData.h = H; return g;
}

/** a palm: { group, crown, leaves[] } (crown pivot at the top of the trunk, leaves droop; bend them for wind) */
export function palm(seed = 0, hgt = 7) {
  const g = new THREE.Group(), v = vox(), n = 11, segH = hgt / n, r = (k) => rnd(seed * 7.7 + k);
  const lean = (r(1) - 0.5) * 0.9, top = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const k = i / n, x = lean * k * k * hgt * 0.25, s = lerp(0.4, 0.28, k);
    v.box(x, segH * (i + 0.5), 0, s, segH * 0.9, s, i % 2 ? '#9A7350' : '#8A6444', 'base', 0, i * 0.35, 0); v.box(x, segH * (i + 0.97), 0, s * 1.12, segH * 0.12, s * 1.12, '#6E4E34', 'base', 0, i * 0.35 + 0.4, 0);
    top.set(x, segH * (i + 1), 0);
  }
  g.add(v.build());
  const crown = new THREE.Group(); crown.position.copy(top); g.add(crown);
  { const cv = vox(); for (let i = 0; i < 4; i++) cv.box(Math.cos(i * 1.6) * 0.18, -0.15, Math.sin(i * 1.6) * 0.18, 0.2, 0.2, 0.2, '#6B4A2A'); cv.box(0, 0, 0, 0.5, 0.3, 0.5, '#7A8A3A'); crown.add(cv.build()); }
  const leaves = [], NL = 8;
  for (let i = 0; i < NL; i++) {
    const piv = new THREE.Group(); piv.rotation.y = i / NL * Math.PI * 2 + r(i + 4) * 0.4; crown.add(piv);
    const tilt = new THREE.Group(); tilt.rotation.z = 0; piv.add(tilt);
    const lv = vox(), c = ['#3F9A44', '#57B04A', '#2F8A3E'][i % 3];
    let x = 0, y = 0;
    for (let k = 0; k < 6; k++) { const L = 0.66, a = -(0.12 + k * 0.2), wd = lerp(0.62, 0.14, k / 6), cx = x + Math.cos(a) * L / 2, cy = y + Math.sin(a) * L / 2;
      lv.box(cx, cy, 0, L, 0.06, wd, k % 2 ? c : shade(c, 0.1).getStyle(), 'base', 0, 0, a); lv.box(cx, cy + 0.035, 0, L, 0.02, 0.05, shade(c, -0.25).getStyle(), 'base', 0, 0, a);
      x += Math.cos(a) * L * 0.96; y += Math.sin(a) * L * 0.96; }
    tilt.add(lv.build()); leaves.push(tilt);
  }
  return { group: g, crown, leaves, top };
}
export function lampPost() {
  const v = vox(); v.up(0, 0, 0, 0.3, 0.3, 0.3, '#3A3A44'); v.up(0, 0.3, 0, 0.14, 4.7, 0.14, '#4A4A56'); v.box(0, 5.0, 0.45, 0.1, 0.1, 1.0, '#4A4A56');
  v.box(0, 4.88, 0.9, 0.36, 0.14, 0.36, '#3A3A44'); v.box(0, 4.78, 0.9, 0.28, 0.08, 0.28, '#FFF0C8', 'lamp');
  return v.build();
}
export function car(color = '#E2483A', seed = 0, van = false) {
  const v = vox(), cD = shade(color, -0.25).getStyle(), L = van ? 4.6 : 4.0, ch = van ? 1.1 : 0.6;
  v.box(0, 0.28 + ch / 2 + 0.05, 0, L, ch, 1.8, color, 'shiny');
  v.box(0, 0.36, 0, L + 0.06, 0.14, 1.84, '#2A2A30');
  const cl = van ? L * 0.62 : 2.2, cx = van ? 0.25 : -0.15, cy = 0.33 + ch + (van ? 0.3 : 0.27);
  v.box(cx, cy, 0, cl, van ? 0.6 : 0.55, 1.62, color, 'shiny');
  v.box(cx, cy + 0.02, 0, cl - 0.25, (van ? 0.45 : 0.42), 1.66, '#2E4A60', 'glassDark');
  v.box(cx + cl / 2 + 0.01, cy + 0.02, 0, 0.06, 0.42, 1.45, '#2E4A60', 'glassDark');
  v.box(cx - cl / 2 - 0.01, cy + 0.02, 0, 0.06, 0.42, 1.45, '#2E4A60', 'glassDark');
  v.box(0, cy + (van ? 0.31 : 0.285), 0, cl - 0.1, 0.04, 1.5, cD, 'shiny');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { v.box(sx * L * 0.32, 0.3, sz * 0.86, 0.62, 0.62, 0.26, '#1C1C20'); v.box(sx * L * 0.32, 0.3, sz * 0.995, 0.3, 0.3, 0.02, '#B8B8C0'); }
  v.box(L / 2 + 0.02, 0.62, 0.62, 0.05, 0.14, 0.3, '#FFF6D8', 'glow'); v.box(L / 2 + 0.02, 0.62, -0.62, 0.05, 0.14, 0.3, '#FFF6D8', 'glow');
  v.box(-L / 2 - 0.02, 0.62, 0.65, 0.05, 0.12, 0.25, '#E0302A', 'shiny'); v.box(-L / 2 - 0.02, 0.62, -0.65, 0.05, 0.12, 0.25, '#E0302A', 'shiny');
  v.box(0.1, 0.62, 0.905, 0.25, 0.04, 0.02, cD);
  return v.build();
}
export function umbrella(seed = 0) {
  const g = new THREE.Group(), v = vox(), cs = AWN[seed % AWN.length];
  v.up(0, 0, 0, 0.07, 2.4, 0.07, '#E8E1D0'); g.add(v.build());
  const can = new THREE.Group(); can.position.y = 2.3; g.add(can);
  const cv = vox();
  [[2.6, 0], [1.9, 0.13], [1.2, 0.26], [0.5, 0.39]].forEach(([s, y]) => { const n = 6, sw = s / n; for (let i = 0; i < n; i++) cv.box(-s / 2 + sw * (i + 0.5), y, 0, sw, 0.13, s, cs[i % 2]); });
  cv.box(0, 0.5, 0, 0.12, 0.12, 0.12, '#E8E1D0'); can.add(cv.build());
  return { group: g, canopy: can };
}
export function beachChair(color = '#2BA6A0') {
  const v = vox();
  for (const sx of [-0.3, 0.3]) { v.box(sx, 0.18, 0.2, 0.05, 0.05, 0.9, '#E8E1D0', 'base', 0.0); v.box(sx, 0.45, -0.25, 0.05, 0.75, 0.05, '#E8E1D0', 'base', -0.5); }
  v.box(0, 0.22, 0.2, 0.58, 0.04, 0.8, color); v.box(0, 0.5, -0.2, 0.58, 0.6, 0.04, color, 'base', -0.5); v.box(0, 0.5, -0.19, 0.2, 0.6, 0.042, '#F5F1E8', 'base', -0.5);
  return v.build();
}
export function towel(c1 = '#E2557B', c2 = '#F5F1E8') { const v = vox(); for (let i = 0; i < 6; i++) v.box(0, 0.015, -0.75 + i * 0.25 + 0.125, 0.8, 0.03, 0.25, i % 2 ? c1 : c2); return v.build(); }
export function cooler() { const v = vox(); v.up(0, 0, 0, 0.6, 0.4, 0.4, '#3FB8D9'); v.up(0, 0.4, 0, 0.62, 0.08, 0.42, '#F5F1E8'); v.up(0, 0.48, 0, 0.3, 0.05, 0.05, '#F5F1E8'); return v.build(); }
export function beachBall() { const v = vox(), c = ['#E2483A', '#F5F1E8', '#F2C14E', '#4C7DDC']; for (let i = 0; i < 4; i++) v.box(0, 0, -0.15 + i * 0.1 + 0.05, 0.4, 0.4, 0.1, c[i], 'base', 0, 0, 0, 0.03); return v.build(); }
export function surfboard(c = '#F2C14E') { const v = vox(); v.box(0, 0, 0, 0.5, 0.07, 2.0, c, 'shiny', 0, 0, 0, 0.02); v.box(0, 0.04, 0, 0.08, 0.01, 1.9, '#E2483A', 'shiny'); return v.build(); }
export function newspaper() { const v = vox(); v.box(0, 0, 0, 0.45, 0.012, 0.32, '#F1EEE6'); v.box(0, 0.007, -0.08, 0.38, 0.004, 0.06, '#3A3A40'); v.box(0.08, 0.007, 0.05, 0.18, 0.004, 0.12, '#9A9AA4'); return v.build(); }
export function bench() { const v = vox(); for (const sx of [-0.8, 0.8]) v.up(sx, 0, 0, 0.1, 0.45, 0.5, '#4A4A56'); v.up(0, 0.45, 0, 2.0, 0.08, 0.5, '#B07A48'); v.box(0, 0.8, -0.22, 2.0, 0.3, 0.06, '#B07A48'); return v.build(); }
export function kiosk() {
  const v = vox(); v.up(0, 0, 0, 3.2, 1.1, 2.2, '#F5F1E8'); v.up(0, 1.1, 0, 3.4, 0.08, 2.4, '#B07A48');
  for (const [x, z] of [[-1.5, -1], [1.5, -1], [-1.5, 1], [1.5, 1]]) v.up(x, 1.18, z, 0.14, 1.5, 0.14, '#8A6444');
  for (let i = 0; i < 5; i++) v.up(0, 2.68 + i * 0.16, 0, 4.2 - i * 0.75, 0.16, 3.2 - i * 0.6, i % 2 ? '#D9B070' : '#C99E5C');
  v.up(0, 0.3, 1.11, 2.6, 0.5, 0.02, '#2BA6A0'); for (let i = 0; i < 5; i++) v.up(-1.2 + i * 0.6, 1.18, 0.6, 0.12, 0.3, 0.12, ['#5DB86A', '#F2C14E', '#E2483A', '#F08C3A', '#5DB86A'][i]);
  for (let i = 0; i < 3; i++) v.up(-1 + i, 0, 1.6, 0.4, 0.75, 0.4, '#E86A4A');
  return v.build();
}
export function newsstand() {
  const v = vox(); v.up(0, 0, 0, 2.8, 2.5, 1.8, '#2F7A5A'); v.up(0, 2.5, 0.2, 3.2, 0.15, 2.4, '#235E46');
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) v.up(-1.1 + i * 0.44, 0.7 + r * 0.55, 0.91, 0.34, 0.45, 0.04, SHIRTS[(r * 6 + i * 7) % SHIRTS.length]);
  v.up(0, 0, 1.0, 2.6, 0.6, 0.3, '#235E46'); v.up(0, 2.7, 0.92, 1.8, 0.35, 0.05, '#F2C14E'); v.up(0, 2.74, 0.95, 1.4, 0.18, 0.02, '#235E46');
  return v.build();
}
export function cloudVox(seed = 0, s = 1) {
  const v = vox(), n = 5 + Math.floor(rnd(seed) * 4);
  for (let i = 0; i < n; i++) { const w = 3 + rnd(seed + i) * 4; v.box((i - n / 2) * 2.4 + rnd(seed + i * 3) * 1.5, rnd(seed + i * 5) * 1.6 + (i % 2) * 0.8, (rnd(seed + i * 7) - 0.5) * 3, w, w * 0.55, w * 0.8, '#FFFFFF', 'matte'); }
  const g = v.build(false, false); g.scale.setScalar(s); return g;
}
export function seagull() {
  const g = new THREE.Group(), v = vox(); v.box(0, 0, 0, 0.45, 0.14, 0.14, '#F5F5F5'); v.box(0.26, 0.04, 0, 0.12, 0.1, 0.1, '#F5F5F5'); v.box(0.34, 0.03, 0, 0.07, 0.03, 0.04, '#F2B33A'); v.box(-0.27, 0.01, 0, 0.12, 0.05, 0.12, '#5A5A62'); g.add(v.build(false, false));
  const wing = (s) => { const p = new THREE.Group(); const w = vox(); w.box(0, 0, s * 0.3, 0.2, 0.03, 0.6, '#EDEDED'); w.box(-0.02, 0, s * 0.65, 0.16, 0.03, 0.2, '#4A4A52'); p.add(w.build(false, false)); g.add(p); return p; };
  const wl = wing(1), wr = wing(-1); g.userData.flap = (ph) => { wl.rotation.x = -Math.sin(ph) * 0.7; wr.rotation.x = Math.sin(ph) * 0.7; };
  return g;
}

// ---------- sky: a gradient dome with the sun disc and glow (HDR, feeds the bloom) ----------
export function skyDome(r = 900) {
  const u = { top: { value: col('#1F5FC8') }, mid: { value: col('#5FA4E6') }, hor: { value: col('#B4DCF6') }, sunDir: { value: new THREE.Vector3(0, 0.5, 1).normalize() }, sunI: { value: 1 }, night: { value: 0 } };
  const m = new THREE.ShaderMaterial({ uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 top, mid, hor, sunDir; uniform float sunI, night; varying vec3 vD;
      void main(){ float y = vD.y; vec3 c = y > 0.0 ? mix(mix(hor, mid, smoothstep(0.0, 0.18, y)), top, smoothstep(0.15, 0.75, y)) : hor * 0.9;
        float s = max(dot(normalize(vD), sunDir), 0.0);
        c += vec3(1.0, 0.86, 0.62) * (pow(s, 6.0) * 0.35 + pow(s, 60.0) * 0.6) * sunI;
        c += vec3(1.0, 0.95, 0.85) * smoothstep(0.9993, 0.9996, s) * 14.0 * sunI;
        gl_FragColor = vec4(c, 1.0); }` });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24), m); mesh.renderOrder = -1; mesh.frustumCulled = false; mesh.userData.u = u; return mesh;
}
export function starField(n = 700, r = 800, seed = 2) {
  const g = new THREE.BufferGeometry(), a = [];
  for (let i = 0; i < n; i++) { const th = rnd(i * 3 + seed) * Math.PI * 2, y = rnd(i * 7 + seed + 1) * 0.95 + 0.03, rr = Math.sqrt(1 - y * y); a.push(Math.cos(th) * rr * r, y * r, Math.sin(th) * rr * r); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: '#FFF6E0', size: 2.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.95, toneMapped: false }));
}

// ---------- the promenade floor: two-tone wave tiles in a pixel texture ----------
export function tileTexture(w, h, px, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { g.fillStyle = fn(x, y); g.fillRect(x, y, 1, 1); }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
