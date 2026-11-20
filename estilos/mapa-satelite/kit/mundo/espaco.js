// Espaço (extraído de teste-lowpoly-v2/src/voxel.js): planeta low poly com atmosfera, sol e estrelas.
import * as THREE from 'three';
import { rnd } from '../motor/lib.js';
import { starField } from './props.js';

const col = (c) => new THREE.Color(c);

// ================================================================================================
// SPACE: a low poly planet with atmosphere glow, clouds, the sun and stars
// ================================================================================================
const PPAL = { sea: '#1D63B5', seaLt: '#2F93D6', sand: '#EAD49A', grass: '#5DAA48', leaf: '#3B8A3E', rock: '#9C8A6E', snow: '#F4F8FC' };
const h3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf), L = (a, b, t) => a + (b - a) * t, c = (i, j, k) => h3(xi + i, yi + j, zi + k);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w) * 2 - 1;
}
const fbm = (x, y, z) => vnoise(x, y, z) * 0.6 + vnoise(x * 2.1, y * 2.1, z * 2.1) * 0.28 + vnoise(x * 4.3, y * 4.3, z * 4.3) * 0.12;

export function planet(detail = 12) {
  const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position, n = p.count;
  const dir = new Float32Array(n * 3), hh = new Float32Array(n);
  for (let i = 0; i < n; i++) { const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)).normalize(); dir.set([v.x, v.y, v.z], i * 3); hh[i] = fbm(v.x * 1.7 + 3.1, v.y * 1.7 - 1.3, v.z * 1.7 + 0.7) * 1.55 + 0.02; }
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
  const mesh = new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ vertexColors: true, flatShading: true, roughness: 0.62, clearcoat: 0.35, clearcoatRoughness: 0.4 }));
  const C = Object.fromEntries(Object.entries(PPAL).map(([k, v]) => [k, col(v)]));
  const seaAt = (y, k) => k * (2.6 * y * y - 0.6);
  function update(k = 0) {
    const pos = g.attributes.position, cc = g.attributes.color;
    for (let i = 0; i < n; i++) { const y = dir[i * 3 + 1], s = seaAt(y, k), r = 1 + 0.06 * Math.max(hh[i], s) + (hh[i] > s ? 0.01 : 0); pos.setXYZ(i, dir[i * 3] * r, y * r, dir[i * 3 + 2] * r); }
    for (let f = 0; f < n; f += 3) {
      let hc = 0, sc = 0, yc = 0; for (let j = 0; j < 3; j++) { const y = dir[(f + j) * 3 + 1]; hc += hh[f + j] / 3; sc += seaAt(y, k) / 3; yc += Math.abs(y) / 3; }
      let c; if (yc > 0.93 - 0.2 * k && k < 0.5) c = C.snow; else if (hc < sc) c = sc - hc > 0.18 ? C.sea : C.seaLt;
      else { const e = hc - sc; c = e < 0.07 || hc < 0.02 ? C.sand : hc < 0.3 ? C.grass : hc < 0.55 ? C.leaf : hc < 0.8 ? C.rock : C.snow; }
      for (let j = 0; j < 3; j++) cc.setXYZ(f + j, c.r, c.g, c.b);
    }
    pos.needsUpdate = true; cc.needsUpdate = true; g.computeVertexNormals();
  }
  update(0);
  const spin = new THREE.Group(); spin.add(mesh);
  const tilt = new THREE.Group(); tilt.rotation.z = 0.41; tilt.add(spin);
  // clouds: flat low poly puffs hugging the surface
  const clouds = new THREE.Group(); spin.add(clouds);
  const cm = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.9, flatShading: true, transparent: true, opacity: 0.92 });
  for (let i = 0; i < 26; i++) { const c = new THREE.Group(), th = rnd(i + 40) * Math.PI * 2, la = (rnd(i + 70) - 0.5) * 2.4;
    for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035 + rnd(i * 4 + k) * 0.03, 0), cm); b.position.set((k - 1.5) * 0.045, 0, (rnd(i + k * 3) - 0.5) * 0.05); b.scale.y = 0.28; c.add(b); }
    c.position.set(Math.cos(la) * Math.cos(th) * 1.085, Math.sin(la) * 1.085, Math.cos(la) * Math.sin(th) * 1.085); c.lookAt(0, 0, 0); c.rotateX(Math.PI / 2); clouds.add(c); }
  // atmosphere: fresnel rim (front) + soft halo (back)
  const atmU = { c: { value: col('#6FC3FF') }, sunDir: { value: new THREE.Vector3(1, 0, 0) } };
  const atm = new THREE.Mesh(new THREE.SphereGeometry(1.085, 64, 32), new THREE.ShaderMaterial({ uniforms: atmU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); vW = normalize((modelMatrix * vec4(position,1.0)).xyz - (modelMatrix * vec4(0.,0.,0.,1.)).xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 c, sunDir; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.6); float lit = 0.25 + 0.75 * smoothstep(-0.35, 0.5, dot(vW, sunDir)); gl_FragColor = vec4(c * f * 1.6 * lit, 1.0); }' }));
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 32), new THREE.ShaderMaterial({ uniforms: atmU, transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); vW = normalize((modelMatrix * vec4(position,1.0)).xyz - (modelMatrix * vec4(0.,0.,0.,1.)).xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 c, sunDir; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ float d = max(dot(-vN, vV), 0.0); float f = pow(d, 5.0) ; float lit = 0.2 + 0.8 * smoothstep(-0.4, 0.5, dot(vW, sunDir)); gl_FragColor = vec4(c * f * 0.9 * lit, 1.0); }' }));
  const root = new THREE.Group(); root.add(tilt, atm, halo);
  // the equator ring and a pin on our town
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.075, 0.005, 4, 128), new THREE.MeshBasicMaterial({ color: '#4FD1E8', transparent: true, opacity: 0, toneMapped: false })); ring.rotation.x = Math.PI / 2; spin.add(ring);
  const pin = new THREE.Group(); const pm = new THREE.MeshBasicMaterial({ color: '#FFD43B', toneMapped: false });
  const pc = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 6), pm); pc.rotation.x = Math.PI; pc.position.y = 0.05; const pb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035, 1), pm); pb.position.y = 0.12; pin.add(pc, pb);
  pin.position.set(0, 0, 1.06); pin.rotation.x = Math.PI / 2; spin.add(pin);
  return { group: root, tilt, spin, mesh, clouds, ring, pin, atmU, update };
}

export function space(E) {
  const scene = new THREE.Scene();
  const bg = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vD; void main(){ float y = vD.y; vec3 c = mix(vec3(0.004,0.008,0.03), vec3(0.012,0.02,0.07), smoothstep(-0.6, 0.8, y)); gl_FragColor = vec4(c,1.0); }' }));
  scene.add(bg);
  const st = starField(1400, 800, 7); st.material.size = 2.2; scene.add(st);
  const st2 = new THREE.Points(st.geometry.clone().rotateX(2.2).rotateY(1.1), st.material); scene.add(st2);
  const P = planet(); scene.add(P.group);
  const sun = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 7.6, 5.4), toneMapped: true })); scene.add(sun);
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,240,210,1)'); gr.addColorStop(0.15, 'rgba(255,214,150,0.55)'); gr.addColorStop(0.45, 'rgba(255,170,90,0.12)'); gr.addColorStop(1, 'rgba(255,150,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); })();
  const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); flare.scale.setScalar(6); sun.add(flare);
  const key = new THREE.DirectionalLight('#FFF1DC', 3.6); scene.add(key, key.target);
  scene.add(new THREE.AmbientLight('#2A3A6A', 0.35));
  const setSun = (x, y, z) => { sun.position.set(x, y, z); key.position.set(x, y, z); P.atmU.sunDir.value.set(x, y, z).normalize(); };
  setSun(-9, 3, -8);
  return { scene, P, sun, flare, key, setSun };
}
