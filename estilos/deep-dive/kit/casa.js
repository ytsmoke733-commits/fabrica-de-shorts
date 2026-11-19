// Casa do deep-dive: cozinha com ilha + sala no mesmo apartamento, com ciclo dia/noite. É o home(E) do
// engolir-chiclete-v2 (src/core/sets.js 23-153) sem mudança de geometria, chamado casa(E).
//   const K = casa(E) -> { scene, lights, props: { pack, phone, bin, sofa, clock, island }, setDay(h, t), setPhone(on, t) }
//   SPOT: posições nomeadas (herói na ilha olhando +z, celular, pacote, lixeira, sofá, abajur, TV)
//   canvasTex(w, h, desenho, rep) e sdfMesh(f, limites, passo, material, cor): utilitários reaproveitados pelo kit
import * as THREE from 'three';
import { rbox, ellipsoid, capsule, smin, smax, sphere, mesh, rgb, noise3 } from './motor/sdf.js';
import { lightRig } from './motor/engine.js';
import { rnd } from './motor/lib.js';

const std = (color, rough = 0.7, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const phys = (color, rough = 0.4, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: rough, ...extra });
export function canvasTex(w, h, draw, rep = [1, 1]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; t.userData.canvas = c; return t; }
const shadowed = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
export function sdfMesh(f, b, step, mat, color) { return shadowed(new THREE.Mesh(mesh(f, b, step, color), mat)); }
const box = (w, h, d, mat, x, y, z, parent) => { const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); m.position.set(x, y, z); parent.add(m); return m; };
const C3 = (h) => new THREE.Color(h);
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ═════════════════════════ HOME: kitchen + living room ═════════════════════════
export const SPOT = {
  hero: new THREE.Vector3(0, 0, 0),             // stands at the island, facing +z (the camera side)
  phone: new THREE.Vector3(0.3, 0.936, 0.33), pack: new THREE.Vector3(-0.27, 0.936, 0.3), wrapper: new THREE.Vector3(-0.12, 0.937, 0.36),
  bin: new THREE.Vector3(-0.56, 0, -0.08), sofa: new THREE.Vector3(3.6, 0, -1.05), lamp: new THREE.Vector3(4.42, 0, -1.33), tv: new THREE.Vector3(3.6, 0, 3.4),
};
export function casa(E) {
  const scene = new THREE.Scene(); scene.environment = E.envMap; scene.environmentIntensity = 0.3;
  const BG = C3('#E8DCCB'); scene.background = BG.clone(); scene.fog = new THREE.Fog(BG.clone(), 9, 22);
  const planks = canvasTex(1024, 1024, (g, w, h) => { for (let i = 0; i < 8; i++) { const l = 150 + (i * 37) % 30; g.fillStyle = `rgb(${l + 20},${l - 18},${l - 60})`; g.fillRect(0, i * h / 8, w, h / 8); g.fillStyle = 'rgba(60,35,15,0.35)'; g.fillRect(0, i * h / 8, w, 3); for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(80,50,25,0.08)'; g.fillRect(rnd(i * 50 + k) * w, i * h / 8 + rnd(i * 77 + k + 3) * h / 8, 120 + rnd(k + i * 9) * 200, 2); } } }, [7, 7]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), std('#ffffff', 0.55, { map: planks })); floor.rotation.x = -Math.PI / 2; floor.position.x = 1.5; floor.receiveShadow = true; scene.add(floor);
  const wallM = std('#EFE3D0', 0.9), wall2 = std('#DCE6E0', 0.9);
  // back wall with two window holes (kitchen window x 0.95, living window x 3.6)
  const back = new THREE.Group(); scene.add(back);
  const WZ = -1.6;
  const holes = [[0.95, 1.75, 1.3, 1.1], [3.85, 1.95, 1.5, 0.95]];
  const segs = [[-3.5, 0.3], [1.6, 3.1], [4.6, 6.5]];
  for (const [a, b] of segs) box(b - a, 3, 0.2, b < 2 ? wallM : wall2, (a + b) / 2, 1.5, WZ, back);
  box(1.3, 1.2, 0.2, wallM, 0.95, 0.6, WZ, back); box(1.3, 0.7, 0.2, wallM, 0.95, 2.65, WZ, back);
  box(1.5, 1.475, 0.2, wall2, 3.85, 0.7375, WZ, back); box(1.5, 0.575, 0.2, wall2, 3.85, 2.7125, WZ, back);
  const side = box(0.2, 3, 8, wallM, -3.0, 1.5, 2.2, scene);
  // windows: sky panels (colour set by setDay) + white frames
  const skyM = new THREE.MeshBasicMaterial({ color: '#DDEEFF', fog: false }), skies = [];
  const frM = std('#FFFFFF', 0.4);
  for (const [x, y, w, h] of holes) {
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(w, h), skyM); sky.position.set(x, y, WZ - 0.12); scene.add(sky); skies.push(sky);
    for (const [bw, bh, bx, by] of [[w + 0.12, 0.07, x, y + h / 2], [w + 0.12, 0.07, x, y - h / 2], [0.07, h, x - w / 2, y], [0.07, h, x + w / 2, y], [0.045, h, x, y], [w, 0.04, x, y + h * 0.12]]) box(bw, bh, 0.14, frM, bx, by, WZ + 0.02, scene);
    box(w + 0.2, 0.05, 0.2, frM, x, y - h / 2 - 0.05, WZ + 0.1, scene);                                     // sill
  }
  // a tree outside the kitchen window (silhouette, gives the sky depth)
  const treeM = new THREE.MeshBasicMaterial({ color: '#7FA88A', fog: false });
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.28 + rnd(i) * 0.15, 16, 12), treeM); b.position.set(0.6 + rnd(i + 3) * 0.8, 1.95 + rnd(i + 5) * 0.5, WZ - 0.6); scene.add(b); }
  // kitchen counter run along the back wall
  const cab = std('#5F8F7E', 0.55), top = phys('#F2EEE6', 0.25, { clearcoat: 0.6 });
  const run = sdfMesh((p) => rbox(p, [0, 0.45, 0], [1.5, 0.45, 0.31], 0.03), [[-1.6, -0.02, -0.4], [1.6, 0.94, 0.4]], 0.02, cab); run.position.set(0.2, 0, -1.19); scene.add(run);
  for (let i = 0; i < 5; i++) { box(0.56, 0.7, 0.02, std('#6FA08E', 0.5), -1.0 + i * 0.6, 0.47, -0.87, scene); const k = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), std('#E2C27A', 0.3, { metalness: 0.8 })); k.position.set(-0.8 + i * 0.6, 0.74, -0.85); scene.add(k); }
  box(3.2, 0.05, 0.7, top, 0.2, 0.93, -1.19, scene);
  for (let i = 0; i < 3; i++) { const u = box(0.5, 0.62, 0.36, std('#6FA08E', 0.5), -1.05 + i * 0.52, 1.85, -1.4, scene); }
  const sink = box(0.55, 0.02, 0.4, std('#C9CED2', 0.25, { metalness: 0.6 }), 0.95, 0.955, -1.2, scene);
  const tap = sdfMesh((p) => smin(capsule(p, [0, 0, 0], [0, 0.26, 0], 0.014), capsule(p, [0, 0.26, 0], [0, 0.26, 0.15], 0.013), 0.02), [[-0.04, -0.02, -0.04], [0.04, 0.3, 0.19]], 0.006, std('#D9DDE0', 0.2, { metalness: 0.9 })); tap.position.set(0.95, 0.955, -1.42); scene.add(tap);
  const kettle = sdfMesh((p) => smin(ellipsoid(p, [0, 0.12, 0], [0.11, 0.12, 0.11]), capsule(p, [0.09, 0.12, 0], [0.17, 0.2, 0], 0.018), 0.03), [[-0.15, -0.02, -0.15], [0.22, 0.28, 0.15]], 0.008, phys('#D9534F', 0.3, { clearcoat: 1 })); kettle.position.set(-0.75, 0.955, -1.25); scene.add(kettle);
  const pot = sdfMesh((p) => capsule(p, [0, 0, 0], [0, 0.16, 0], 0.09, 0.11), [[-0.13, -0.1, -0.13], [0.13, 0.28, 0.13]], 0.01, std('#C8734A', 0.6)); pot.position.set(1.55, 1.04, -1.25); scene.add(pot);
  for (let i = 0; i < 9; i++) { const l = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), std('#5E9A50', 0.6))); l.scale.set(0.6, 1.6, 0.4); l.position.set(1.55 + Math.sin(i * 2.4) * 0.08, 1.33 + (i % 3) * 0.04, -1.25 + Math.cos(i * 2.4) * 0.08); l.rotation.z = Math.sin(i * 2.4) * 0.7; scene.add(l); }
  for (let i = 0; i < 3; i++) { const j = sdfMesh((p) => capsule(p, [0, 0, 0], [0, 0.12, 0], 0.045), [[-0.06, -0.06, -0.06], [0.06, 0.18, 0.06]], 0.008, phys(['#F2C14E', '#E86A5A', '#7FB685'][i], 0.35, { clearcoat: 0.6 })); j.position.set(-0.3 + i * 0.13, 1.0, -1.35); scene.add(j); }
  // fridge
  const fridgeM = phys('#E9EEF0', 0.35, { clearcoat: 0.5 });
  const fridge = sdfMesh((p) => rbox(p, [0, 0.93, 0], [0.38, 0.93, 0.35], 0.05), [[-0.42, -0.02, -0.4], [0.42, 1.9, 0.4]], 0.02, fridgeM); fridge.position.set(-2.1, 0, -1.15); scene.add(fridge);
  box(0.74, 0.012, 0.01, std('#B9C2C6', 0.4), -2.1, 1.22, -0.795, scene);
  for (const [y, h] of [[1.55, 0.4], [0.75, 0.5]]) { const hd = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.014, h, 4, 10), std('#AEB8BD', 0.25, { metalness: 0.7 }))); hd.position.set(-1.8, y, -0.76); scene.add(hd); }
  for (let i = 0; i < 4; i++) { const mg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 16), std(['#F2C14E', '#E86A5A', '#4FA3D1', '#7FB685'][i], 0.4)); mg.rotation.x = Math.PI / 2; mg.position.set(-2.32 + (i % 2) * 0.12, 1.45 + Math.floor(i / 2) * 0.14, -0.795); scene.add(mg); }
  // island (the hero stands behind it, facing the camera)
  const islandM = std('#3F6E86', 0.55), islandTop = phys('#F4F0E8', 0.22, { clearcoat: 0.7 });
  const island = sdfMesh((p) => rbox(p, [0, 0.45, 0], [0.72, 0.45, 0.31], 0.03), [[-0.8, -0.02, -0.38], [0.8, 0.93, 0.38]], 0.02, islandM); island.position.set(0, 0, 0.52); scene.add(island);
  for (let i = 0; i < 3; i++) box(0.44, 0.66, 0.02, std('#477C96', 0.5), -0.48 + i * 0.48, 0.46, 0.84, scene);
  box(1.62, 0.05, 0.78, islandTop, 0, 0.91, 0.52, scene);
  // fruit bowl
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(Array.from({ length: 12 }, (_, i) => new THREE.Vector2(0.03 + Math.sin(i / 11 * Math.PI / 2) * 0.14, i / 11 * 0.08)), 32), phys('#F6F1E7', 0.3, { clearcoat: 0.8, side: THREE.DoubleSide })); bowl.position.set(-0.5, 0.936, 0.6); shadowed(bowl); scene.add(bowl);
  const fruit = [['#F28C28', 0.045, -0.53, 1.01, 0.58], ['#F28C28', 0.044, -0.45, 1.0, 0.64], ['#D9343A', 0.043, -0.56, 1.0, 0.66], ['#8CC152', 0.042, -0.44, 1.01, 0.54], ['#F28C28', 0.043, -0.5, 1.06, 0.61]];
  for (const [c, r, x, y, z] of fruit) { const f = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), phys(c, 0.45, { clearcoat: 0.4 }))); f.position.set(x, y, z); scene.add(f); }
  const banana = sdfMesh((p) => { let d = 1e9; for (let i = 0; i < 6; i++) { const a = -0.9 + i * 0.36, b = a + 0.36; d = smin(d, capsule(p, [Math.sin(a) * 0.12, -Math.cos(a) * 0.12 + 0.12, 0], [Math.sin(b) * 0.12, -Math.cos(b) * 0.12 + 0.12, 0], 0.018 - Math.abs(i - 2.5) * 0.002), 0.01); } return d; }, [[-0.13, -0.02, -0.03], [0.13, 0.12, 0.03]], 0.005, phys('#F5D547', 0.5)); banana.position.set(-0.48, 1.0, 0.6); banana.rotation.set(-0.3, 0.6, 0.2); scene.add(banana);
  // mug
  const mug = sdfMesh((p) => smax(smin(capsule(p, [0, 0, 0], [0, 0.085, 0], 0.04), capsule(p, [0.045, 0.02, 0], [0.045, 0.065, 0], 0.012), 0.012), -(capsule(p, [0, 0.03, 0], [0, 0.2, 0], 0.031)), 0.004), [[-0.06, -0.05, -0.06], [0.07, 0.14, 0.06]], 0.004, phys('#F2C14E', 0.35, { clearcoat: 0.6 })); mug.position.set(0.55, 0.976, 0.68); mug.rotation.y = 2.2; scene.add(mug);
  // gum pack (no brand: mint pack with a pink stripe)
  const packTex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#7FD8C4'; g.fillRect(0, 0, w, h); g.fillStyle = '#FFFFFF'; g.fillRect(0, h * 0.36, w, h * 0.28); g.fillStyle = '#FF7AAE'; g.fillRect(0, h * 0.42, w, h * 0.16); g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(w * 0.8, h * 0.5, 22, 0, 7); g.fill(); g.fillStyle = '#FF7AAE'; g.beginPath(); g.arc(w * 0.8, h * 0.5, 14, 0, 7); g.fill(); });
  const pack = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.022, 0.05), [std('#7FD8C4', 0.5), std('#7FD8C4', 0.5), std('#ffffff', 0.45, { map: packTex }), std('#7FD8C4', 0.5), std('#ffffff', 0.45, { map: packTex }), std('#ffffff', 0.45, { map: packTex })]));
  pack.position.copy(SPOT.pack).add(new THREE.Vector3(0, 0.011, 0)); pack.rotation.y = 0.35; scene.add(pack);
  // phone (screen canvas redrawn by setPhone)
  const phoneCv = document.createElement('canvas'); phoneCv.width = 180; phoneCv.height = 360; const phoneTex = new THREE.CanvasTexture(phoneCv); phoneTex.colorSpace = THREE.SRGBColorSpace;
  const phone = new THREE.Group();
  phone.add(shadowed(new THREE.Mesh(mesh((p) => rbox(p, [0, 0, 0], [0.036, 0.0045, 0.074], 0.004), [[-0.042, -0.008, -0.08], [0.042, 0.008, 0.08]], 0.0016), phys('#1E2430', 0.3, { clearcoat: 1 }))));
  const scrM = new THREE.MeshBasicMaterial({ map: phoneTex, toneMapped: true }); const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.138), scrM); scr.rotation.x = -Math.PI / 2; scr.position.y = 0.0047; phone.add(scr);
  phone.position.copy(SPOT.phone).add(new THREE.Vector3(0, 0.0045, 0)); phone.rotation.y = -0.25; scene.add(phone);
  const drawPhone = (on, t) => { const g = phoneCv.getContext('2d'); g.fillStyle = on ? '#F4F6FA' : '#0B0E14'; g.fillRect(0, 0, 180, 360); if (!on) return; g.fillStyle = '#4FA3D1'; g.fillRect(0, 0, 180, 40); const off = (t * 70) % 120;
    for (let i = -1; i < 4; i++) { const y = 54 + i * 120 - off; g.fillStyle = ['#FFD43B', '#FF7AAE', '#7FD8C4', '#9B8CFF'][(i + 8 + Math.floor(t * 70 / 120)) % 4]; g.beginPath(); g.roundRect(12, y, 156, 80, 12); g.fill(); g.fillStyle = '#C9CED8'; g.fillRect(12, y + 88, 120, 10); g.fillRect(12, y + 102, 80, 8); }
    phoneTex.needsUpdate = true; };
  drawPhone(false, 0);
  // trash bin (open top, dark liner)
  const binM = phys('#4E8C7A', 0.35, { clearcoat: 0.5, metalness: 0.2 });
  const bin = new THREE.Group(); bin.position.copy(SPOT.bin); scene.add(bin);
  const binBody = new THREE.Mesh(new THREE.LatheGeometry([[0.13, 0], [0.145, 0.02], [0.16, 0.5], [0.172, 0.515], [0.172, 0.53], [0.15, 0.53], [0.14, 0.05]].map(([r, y]) => new THREE.Vector2(r, y)), 48), binM); shadowed(binBody); binBody.material.side = THREE.DoubleSide; bin.add(binBody);
  const liner = new THREE.Mesh(new THREE.CircleGeometry(0.148, 40), std('#1B1F24', 0.9)); liner.rotation.x = -Math.PI / 2; liner.position.y = 0.42; bin.add(liner);
  // ── living room ──
  const sofaM = std('#D8A94A', 0.85), sofaD = std('#C4953C', 0.85);
  const sofa = new THREE.Group(); sofa.position.copy(SPOT.sofa); scene.add(sofa);
  sofa.add(sdfMesh((p) => { let d = rbox(p, [0, 0.21, 0], [1.0, 0.17, 0.42], 0.06); d = smin(d, rbox(p, [0, 0.55, -0.32], [1.0, 0.3, 0.12], 0.08), 0.05); for (const s of [-1, 1]) d = smin(d, rbox(p, [s * 0.92, 0.42, 0], [0.11, 0.24, 0.42], 0.07), 0.04); return d; }, [[-1.1, -0.02, -0.5], [1.1, 0.9, 0.5]], 0.02, sofaM));
  for (const s of [-1, 1]) { const c = sdfMesh((p) => rbox(p, [0, 0, 0], [0.4, 0.07, 0.34], 0.06), [[-0.45, -0.1, -0.4], [0.45, 0.1, 0.4]], 0.015, sofaD); c.position.set(s * 0.41, 0.43, 0.06); sofa.add(c); const b = sdfMesh((p) => rbox(p, [0, 0, 0], [0.38, 0.2, 0.07], 0.07), [[-0.42, -0.24, -0.1], [0.42, 0.24, 0.1]], 0.015, sofaD); b.position.set(s * 0.41, 0.7, -0.18); b.rotation.x = -0.12; sofa.add(b); }
  const pillow = sdfMesh((p) => rbox(p, [0, 0, 0], [0.16, 0.15, 0.05], 0.05), [[-0.2, -0.2, -0.08], [0.2, 0.2, 0.08]], 0.012, std('#3E7F86', 0.8)); pillow.position.set(-0.72, 0.62, -0.08); pillow.rotation.set(-0.2, 0.3, 0.15); sofa.add(pillow);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.25, 64), std('#C9B9A6', 0.95)); rug.rotation.x = -Math.PI / 2; rug.position.set(3.6, 0.005, 0.1); rug.receiveShadow = true; scene.add(rug);
  const ctab = sdfMesh((p) => smin(rbox(p, [0, 0.38, 0], [0.5, 0.03, 0.3], 0.025), Math.min(...[[-0.42, -0.22], [0.42, -0.22], [-0.42, 0.22], [0.42, 0.22]].map(([x, z]) => capsule(p, [x, 0.02, z], [x, 0.38, z], 0.02))), 0.01), [[-0.55, -0.02, -0.35], [0.55, 0.43, 0.35]], 0.012, std('#9A6B45', 0.5)); ctab.position.set(3.6, 0, 0.15); scene.add(ctab);
  const lampG = new THREE.Group(); lampG.position.copy(SPOT.lamp); scene.add(lampG);
  lampG.add(sdfMesh((p) => smin(capsule(p, [0, 0.02, 0], [0, 1.45, 0], 0.014), capsule(p, [0, 0.0, 0], [0, 0.02, 0], 0.13), 0.02), [[-0.16, -0.03, -0.16], [0.16, 1.5, 0.16]], 0.012, std('#2E3138', 0.4, { metalness: 0.5 })));
  const shadeM = std('#F6E7C8', 0.8, { emissive: '#FFC27A', emissiveIntensity: 0, side: THREE.DoubleSide });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.3, 32, 1, true), shadeM); shade.position.y = 1.5; lampG.add(shade);
  const plant2 = new THREE.Group(); plant2.position.set(2.3, 0, -1.25); scene.add(plant2);
  plant2.add(sdfMesh((p) => capsule(p, [0, 0, 0], [0, 0.3, 0], 0.15, 0.17), [[-0.2, -0.17, -0.2], [0.2, 0.5, 0.2]], 0.012, std('#E3E0D8', 0.6)));
  for (let i = 0; i < 12; i++) { const l = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), std('#4E8A4A', 0.6))); l.scale.set(0.5, 2.2, 0.25); const a = i * 2.39; l.position.set(Math.cos(a) * 0.12, 0.65 + rnd(i) * 0.35, Math.sin(a) * 0.12); l.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5); plant2.add(l); }
  // wall clock (hands follow the time of day)
  const clock = new THREE.Group(); clock.position.set(2.8, 2.05, WZ + 0.13); scene.add(clock);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 48), std('#FFFFFF', 0.4)); face.rotation.x = Math.PI / 2; clock.add(face);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.015, 10, 48), std('#2E3138', 0.4)); clock.add(rim);
  for (let i = 0; i < 12; i++) { const tk = new THREE.Mesh(new THREE.BoxGeometry(0.008, i % 3 ? 0.02 : 0.035, 0.005), std('#2E3138', 0.5)); const a = i / 12 * Math.PI * 2; tk.position.set(Math.sin(a) * 0.14, Math.cos(a) * 0.14, 0.018); tk.rotation.z = -a; clock.add(tk); }
  const handH = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.09, 0.006), std('#2E3138', 0.4)); handH.geometry.translate(0, 0.04, 0); handH.position.z = 0.022; clock.add(handH);
  const handM = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.13, 0.006), std('#D62839', 0.4)); handM.geometry.translate(0, 0.055, 0); handM.position.z = 0.026; clock.add(handM);
  // TV (faces the sofa) + its light
  const tvG = new THREE.Group(); tvG.position.copy(SPOT.tv); tvG.rotation.y = Math.PI; scene.add(tvG);
  tvG.add(sdfMesh((p) => rbox(p, [0, 0.25, 0], [0.7, 0.25, 0.2], 0.03), [[-0.75, -0.02, -0.25], [0.75, 0.55, 0.25]], 0.02, std('#9A6B45', 0.5)));
  const tvScr = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.62), new THREE.MeshBasicMaterial({ color: '#203040' })); tvScr.position.set(0, 0.92, 0.03); tvG.add(tvScr); tvG.add(box(1.2, 0.68, 0.05, std('#15171C', 0.3), 0, 0.92, 0, tvG));
  // ── lights ──
  const L = lightRig(scene, { key: '#FFD9AE', keyI: 4.0, keyPos: [2.6, 3.4, -4.5], target: [0.3, 0.9, 0], rimCol: '#CFE0FF', rimI: 1.0, hemiI: 0.75, shadowBox: 3.4 });
  const hemi = L.group.children.find((c) => c.isHemisphereLight);
  const fill = new THREE.DirectionalLight('#FFF1E2', 1.0); fill.position.set(-1, 2.5, 4); scene.add(fill);
  const lampL = new THREE.PointLight('#FFB66E', 0, 7, 1.6); lampL.position.set(SPOT.lamp.x, 1.45, SPOT.lamp.z + 0.1); lampL.castShadow = false; scene.add(lampL);
  const tvL = new THREE.PointLight('#8FB8FF', 0, 6, 1.5); tvL.position.set(SPOT.tv.x, 0.95, SPOT.tv.z - 0.3); scene.add(tvL);
  const ceilL = new THREE.PointLight('#FFD9B0', 0, 8, 1.5); ceilL.position.set(0.2, 2.6, 0.4); scene.add(ceilL);
  const keyBase = L.key.position.clone();
  const SKY = { night: C3('#1B2744'), dawn: C3('#FFC994'), day: C3('#DDEEFF'), dusk: C3('#FF9466') };
  return {
    scene, lights: L, props: { pack, phone, bin, sofa, clock, island },
    /** time of day h (0-24, e.g. 7.5 = morning) and film time t (TV flicker). Sets sun, sky, lamps, clock. */
    setDay(h, t = 0) {
      h = ((h % 24) + 24) % 24;
      const day = sm(5.6, 7.4, h) * (1 - sm(18.2, 19.6, h)), warm = Math.max(1 - sm(7, 10, h), sm(16, 18.6, h)) * day;
      const sky = SKY.night.clone().lerp(h < 12 ? SKY.dawn : SKY.dusk, sm(5.3, 6.8, h) * (1 - sm(19.2, 20.2, h))).lerp(SKY.day, sm(7.5, 10, h) * (1 - sm(15.5, 18, h)));
      skyM.color.copy(sky).multiplyScalar(0.35 + 1.25 * Math.max(day, 0.15));
      L.key.intensity = 4.0 * day; L.key.color.set('#FFF3E2').lerp(C3('#FFB777'), warm);
      const sweep = (h - 12) / 7; L.key.position.set(keyBase.x - sweep * 2.2, keyBase.y - Math.abs(sweep) * 1.2, keyBase.z);
      L.rim.intensity = 1.0 * day + 0.25; hemi.intensity = 0.2 + 0.58 * day; hemi.color.set('#FFF4E6').lerp(C3('#6F86C8'), 1 - day);
      fill.intensity = 0.3 + 0.7 * day; fill.color.set('#FFF1E2').lerp(C3('#8EA2D8'), 1 - day);
      const night = 1 - day; lampL.intensity = 7.5 * night; shadeM.emissiveIntensity = 1.6 * night; ceilL.intensity = 3.2 * night;
      const fl = 0.6 + 0.25 * Math.sin(t * 13.1) + 0.15 * Math.sin(t * 29.7 + 1); tvL.intensity = (h > 17 || h < 2 ? 2.2 : 0.6) * fl; tvScr.material.color.set('#3A5A80').multiplyScalar(0.6 + fl * 0.8);
      const bg = C3('#E8DCCB').lerp(C3('#2A2E3E'), night * 0.85); scene.background.copy(bg); scene.fog.color.copy(bg);
      handH.rotation.z = -(h % 12) / 12 * Math.PI * 2; handM.rotation.z = -(h % 1) * Math.PI * 2;
      scene.environmentIntensity = 0.12 + 0.2 * day;
    },
    setPhone: drawPhone,
  };
}
