// A cidade litorânea (extraído de teste-lowpoly-v2/src/voxel.js): beachTown(E).
import * as THREE from 'three';
import { rnd, clamp, lerp } from '../motor/lib.js';
import { SHADOW } from '../motor/engine.js';
import { MAT, vox } from './blocos.js';
import { SHIRTS } from './pessoa.js';
import { figurante } from './elenco.js';
import { building, palm, lampPost, car, umbrella, beachChair, towel, cooler, bench, kiosk, newsstand, cloudVox, seagull, skyDome, starField, tileTexture } from './props.js';

const col = (c) => new THREE.Color(c);
const DEG = Math.PI / 180;

// ================================================================================================
// THE SEASIDE TOWN
// Street along x. z: buildings (front at -10) · sidewalk -10..-7 · road -7..0 · promenade 0..7 · sand 7..42 · sea > 40.
// The beach faces west (+z = west), so the afternoon sun is over the sea and the "east wind" blows from the sea (+z) to
// the buildings (-z): with the camera looking down the street (-x), the wind goes left → right on screen.
// ================================================================================================
export function beachTown(E) {
  const scene = new THREE.Scene();
  scene.environment = E.envMap; scene.environmentIntensity = 0.35;
  const sky = skyDome(); scene.add(sky);
  const stars = starField(); stars.visible = false; scene.add(stars);
  const moon = (() => { const v = vox(); v.box(0, 0, 0, 30, 30, 30, '#F4F1E2', 'glow', 0, 0, 0, 3); v.box(-6, 5, 15.2, 7, 7, 1, '#D8D2BC', 'glow'); v.box(7, -6, 15.2, 5, 5, 1, '#D8D2BC', 'glow'); const g = v.build(false, false); g.position.set(-220, 330, 520); g.lookAt(0, 0, 0); g.visible = false; return g; })(); scene.add(moon);
  scene.fog = new THREE.Fog(col('#BFDDF5'), 160, 1500);

  // lights: the sun (soft shadows that follow the action), sky/ground bounce, a cool fill from the land side
  const sun = new THREE.DirectionalLight('#FFE7C4', 2.8); sun.castShadow = true;
  sun.shadow.mapSize.set(Math.max(4096, SHADOW), Math.max(4096, SHADOW)); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03; sun.shadow.radius = 5;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#BFDFFF', '#C9B48A', 0.8); scene.add(hemi);
  const fill = new THREE.DirectionalLight('#B8D4FF', 0.45); fill.position.set(10, 8, -30); scene.add(fill);
  const sunDir = new THREE.Vector3();
  /** sun direction by elevation / azimuth (deg; az 0 = +z over the sea, 90 = +x) */
  const setSun = (elev, az) => { sunDir.set(Math.sin(az * DEG) * Math.cos(elev * DEG), Math.sin(elev * DEG), Math.cos(az * DEG) * Math.cos(elev * DEG)); sky.userData.u.sunDir.value.copy(sunDir); };
  /** aim the shadow camera around a spot (x, z) with half-size s */
  const shadowAt = (x, z, s = 14, y = 0) => {
    sun.target.position.set(x, y, z); sun.position.copy(sun.target.position).addScaledVector(sunDir, 80);
    Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 200 }); sun.shadow.camera.updateProjectionMatrix();
  };
  setSun(38, -18); shadowAt(0, 0);

  // ground: sand, road, sidewalk, promenade (pixel wave tiles), the low sea wall
  const ground = vox();
  ground.up(0, -0.5, 16, 700, 0.5, 52, '#E2C48E');                                  // sand
  ground.up(0, -0.5, -3.5, 700, 0.52, 7, '#55555E');                                // road
  for (let x = -300; x < 300; x += 6) ground.up(x, 0.02, -3.5, 3, 0.01, 0.16, '#F1EEE6');
  ground.up(0, 0.02, -6.6, 700, 0.01, 0.14, '#F1EEE6'); ground.up(0, 0.02, -0.4, 700, 0.01, 0.14, '#F1EEE6');
  ground.up(0, -0.5, -8.6, 700, 0.68, 3.2, '#D9D4C8'); ground.up(0, -0.5, -7.05, 700, 0.7, 0.18, '#BDB6A8');   // sidewalk + kerb
  ground.up(0, -0.5, 0.05, 700, 0.7, 0.18, '#BDB6A8');
  ground.up(0, -0.5, -50, 700, 0.5, 80, '#C9C2B2');                                 // behind the buildings
  ground.up(0, -0.6, 7.1, 700, 0.8, 0.4, '#E3DCCB');                                // sea wall
  scene.add(ground.build(false, true));
  const promTex = tileTexture(256, 32, 1, (x, y) => { const v = Math.sin(x * 0.1 + Math.sin(y * 0.2) * 1.6); return v > 0.55 ? '#2F3A44' : '#F2EBDD'; });
  promTex.wrapS = THREE.RepeatWrapping; promTex.repeat.set(10, 1);
  const prom = new THREE.Mesh(new THREE.BoxGeometry(700, 0.2, 7), new THREE.MeshPhysicalMaterial({ map: promTex, roughness: 0.55, clearcoat: 0.15 }));
  prom.position.set(0, 0.08, 3.6); prom.receiveShadow = true; scene.add(prom);
  prom.material.map.repeat.set(700 / 8, 1);

  // buildings along the street (front at z -10), hills behind
  const blds = []; let bx = -150;
  for (let i = 0; bx < 150; i++) { const w = 7 + rnd(i * 3.3) * 7, fl = 2 + Math.floor(rnd(i * 5.1) * 4), b = building(i + 1, w, fl, 9); b.position.set(bx + w / 2, 0.18, -10.2); scene.add(b); blds.push(b); bx += w + 0.3 + rnd(i) * 0.6; }
  const hills = vox();
  for (let i = 0; i < 40; i++) { const x = -400 + i * 21 + rnd(i) * 10, h = 25 + rnd(i * 3) * 55, w = 30 + rnd(i * 7) * 40;
    for (let k = 0; k < 4; k++) hills.up(x + (rnd(i + k) - 0.5) * 10, 0, -150 - rnd(i * 2 + k) * 60, w * (1 - k * 0.2), h * (0.4 + k * 0.22), w * (1 - k * 0.2), ['#5E9E58', '#6FAE5E', '#4F8E4E', '#7DB86A'][k], 'matte'); }
  scene.add(hills.build(false, false));
  // a headland of rocks + green out at sea on the left, for depth
  const head = vox(); for (let i = 0; i < 18; i++) head.up(-260 + i * 9, -1, 260 + rnd(i) * 30 - i * 4, 18, 8 + rnd(i * 3) * 30, 18, i % 3 ? '#6FAE5E' : '#9C8F7A', 'matte'); scene.add(head.build(false, false));

  // promenade furniture: palms, lamp posts, benches, kiosk; newsstand on the sidewalk
  const palms = [], lamps = [];
  for (let x = -96; x <= 96; x += 9) { const p = palm(Math.round(x), 6.5 + rnd(x) * 2); p.group.position.set(x + 2, 0.18, 1.3); scene.add(p.group); palms.push(p); }
  for (let x = -100; x <= 100; x += 18) { const l = lampPost(); l.position.set(x + 6.5, 0.18, 6.4); l.rotation.y = Math.PI; scene.add(l); lamps.push(l); }
  for (let x = -90; x <= 90; x += 18) { const b = bench(); b.position.set(x + 11, 0.18, 6.0); b.rotation.y = Math.PI; scene.add(b); }
  const kio = kiosk(); kio.position.set(20, 0.18, 4.4); kio.rotation.y = Math.PI; scene.add(kio);
  const kio2 = kiosk(); kio2.position.set(-38, 0.18, 4.4); kio2.rotation.y = Math.PI; scene.add(kio2);
  const stand = newsstand(); stand.position.set(-9, 0.18, -8.9); scene.add(stand);
  // street lamps on the building side too
  for (let x = -96; x <= 96; x += 16) { const l = lampPost(); l.position.set(x, 0.18, -7.6); scene.add(l); lamps.push(l); }

  // beach: umbrellas, chairs, towels, coolers, balls, boards
  const umbrellas = [], chairs = [], beachStuff = [];
  for (let i = 0; i < 26; i++) {
    const x = -70 + i * 5.6 + rnd(i * 9) * 2.5, z = 12 + rnd(i * 4) * 18;
    const u = umbrella(i); u.group.position.set(x, 0, z); scene.add(u.group); umbrellas.push(u);
    const ch = beachChair(SHIRTS[i % SHIRTS.length]); ch.position.set(x + 0.8, 0, z + 0.6); ch.rotation.y = Math.PI + (rnd(i) - 0.5) * 0.6; scene.add(ch); chairs.push(ch);
    if (i % 2) { const tw = towel(SHIRTS[(i * 3) % SHIRTS.length]); tw.position.set(x - 1.2, 0, z + 0.4); tw.rotation.y = rnd(i * 2) * 0.6; scene.add(tw); beachStuff.push(tw); }
    if (i % 4 === 1) { const c = cooler(); c.position.set(x + 0.2, 0, z - 0.9); scene.add(c); beachStuff.push(c); }
  }

  // the sea: a faceted plane with small waves (update(t)), shore foam
  const seaGeo = new THREE.PlaneGeometry(1400, 700, 140, 50); seaGeo.rotateX(-Math.PI / 2); seaGeo.translate(0, 0, 391);
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshPhysicalMaterial({ color: '#1F8DB4', roughness: 0.18, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08, flatShading: true }));
  sea.receiveShadow = true; scene.add(sea);
  const seaBase = Float32Array.from(seaGeo.attributes.position.array);
  const shallow = new THREE.Mesh(new THREE.BoxGeometry(1400, 0.1, 8), new THREE.MeshPhysicalMaterial({ color: '#57C6D2', roughness: 0.2, clearcoat: 1, transparent: true, opacity: 0.85 }));
  shallow.position.set(0, -0.12, 43); scene.add(shallow);
  const foam = vox(); for (let i = 0; i < 160; i++) foam.box(-560 + i * 7 + rnd(i) * 3, -0.04, 39.2 + rnd(i * 3) * 1.4, 3 + rnd(i * 5) * 4, 0.08, 0.5 + rnd(i * 7) * 0.6, '#F7FBFF', 'matte');
  const foamM = foam.build(false, false); scene.add(foamM);
  function seaUpdate(t, amp = 1) {
    const P = seaGeo.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = seaBase[i * 3], z = seaBase[i * 3 + 2];
      P.setY(i, (Math.sin(x * 0.11 + t * 1.1) * 0.25 + Math.sin(z * 0.17 - t * 1.6 + x * 0.03) * 0.3 + Math.sin((x + z) * 0.31 + t * 2.2) * 0.1) * amp * clamp((z - 40) / 30) - 0.15); }
    P.needsUpdate = true; seaGeo.computeVertexNormals();
    foamM.position.z = Math.sin(t * 0.9) * 0.6;
  }
  seaUpdate(0);

  // sky life: voxel clouds, gulls
  const clouds = [];
  for (let i = 0; i < 22; i++) { const c = cloudVox(i * 5, 1.4 + rnd(i) * 1.8), a = rnd(i * 11) * Math.PI * 2, rr = 260 + rnd(i * 13) * 300; c.position.set(Math.cos(a) * rr, 60 + rnd(i * 17) * 90, Math.sin(a) * rr); c.rotation.y = a; scene.add(c); clouds.push(c); }
  const gulls = Array.from({ length: 5 }, (_, i) => { const g = seagull(); g.scale.setScalar(1.4); scene.add(g); return g; });

  // cars on the road (x = x0 + v t, wrapped far away)
  const CARC = ['#E2483A', '#F2C14E', '#4C7DDC', '#F5F1E8', '#2BA6A0', '#E86A4A', '#5DB86A', '#8E6CCF', '#3D3A3A'];
  const cars = Array.from({ length: 14 }, (_, i) => { const c = car(CARC[i % CARC.length], i, i % 5 === 3); const dir = i % 2 ? 1 : -1; c.userData = { x0: -150 + rnd(i * 7) * 300, v: dir * (7 + rnd(i * 3) * 4), z: dir > 0 ? -1.9 : -5.1 }; c.rotation.y = dir > 0 ? 0 : Math.PI; scene.add(c); return c; });

  // the background crowd: walkers on the promenade and sidewalk (wrapped at ±120 m, far in the fog)
  const crowd = Array.from({ length: 34 }, (_, i) => { const p = figurante(i + 101); const side = i % 3; p.userData = { x0: -120 + rnd(i * 5 + 2) * 240, v: (rnd(i * 3 + 1) > 0.5 ? 1 : -1) * (0.9 + rnd(i * 9) * 0.6), z: side === 0 ? -8.4 + rnd(i) * 1.6 : 1.8 + rnd(i * 2) * 4.2, ph: rnd(i * 13) * 6 }; scene.add(p.group); return p; });
  // people lying / sitting on the beach
  const sunbathers = Array.from({ length: 12 }, (_, i) => { const p = figurante(i + 301); const u = umbrellas[(i * 2 + 1) % umbrellas.length].group.position;
    p.group.position.set(u.x - 1.2, 0.05, u.z + 0.4); p.group.rotation.set(-Math.PI / 2, 0, 0); p.group.rotation.order = 'YXZ'; p.group.rotation.y = rnd(i) * 6; p.pose({ armL: [170, 10], armR: [170, 10] }); scene.add(p.group); return p; });

  const winMats = [MAT.glass];
  const T = {
    scene, sky, stars, moon, sun, hemi, fill, sunDir, setSun, shadowAt, sea, seaUpdate, palms, lamps, umbrellas, chairs, beachStuff, cars, crowd, sunbathers, clouds, gulls, blds, kiosk: kio, stand,
    /** move cars, walkers, gulls to film time t (skip = set of people to leave alone) */
    life(t, { carsOn = true, crowdOn = true, freeze = false } = {}) {
      const tt = freeze ? 0 : t;
      cars.forEach((c) => { const u = c.userData; let x = u.x0 + u.v * tt; x = ((x + 160) % 320 + 320) % 320 - 160; c.position.set(x, 0, u.z); c.visible = carsOn; });
      crowd.forEach((p) => { const u = p.userData; let x = u.x0 + u.v * tt; x = ((x + 120) % 240 + 240) % 240 - 120; p.group.position.set(x, 0.18, u.z); p.group.rotation.set(0, u.v > 0 ? Math.PI / 2 : -Math.PI / 2, 0); p.walk(u.ph + tt * 6.2 * Math.abs(u.v) / 1.2, freeze ? 0 : 1); p.group.visible = crowdOn; });
      gulls.forEach((g, i) => { const a = tt * 0.12 + i * 1.3; g.position.set(Math.cos(a) * (30 + i * 6) - 10, 18 + i * 3 + Math.sin(tt * 0.7 + i) * 1.5, 30 + Math.sin(a) * 20); g.rotation.y = -a - Math.PI / 2; g.userData.flap(tt * 9 + i); });
      seaUpdate(tt);
    },
    /** 0 = sunny day, 1 = night (stars, lit windows and lamps, moonlight) */
    night(k) {
      k = clamp(k);
      const u = sky.userData.u;
      u.top.value.copy(col('#1F5FC8')).lerp(col('#040818'), k); u.mid.value.copy(col('#5FA4E6')).lerp(col('#0B1634'), k); u.hor.value.copy(col('#B4DCF6')).lerp(col('#1E2C56'), k); moon.visible = k > 0.5;
      u.sunI.value = 1 - k; stars.visible = k > 0.5;
      scene.fog.color.copy(col('#BFDDF5')).lerp(col('#141C38'), k);
      sun.intensity = lerp(2.8, 0.5, k); sun.color.copy(col('#FFE7C4')).lerp(col('#9DB4FF'), k);
      hemi.intensity = lerp(0.8, 0.45, k); hemi.color.copy(col('#BFDFFF')).lerp(col('#4A5AA0'), k); hemi.groundColor.copy(col('#C9B48A')).lerp(col('#2A2A40'), k);
      fill.intensity = lerp(0.45, 0.15, k);
      MAT.glass.emissiveIntensity = k * 2.4; MAT.lamp.emissiveIntensity = k * 6; scene.environmentIntensity = lerp(0.35, 0.12, k);
      sea.material.color.copy(col('#1F8DB4')).lerp(col('#0C2A48'), k);
    },
  };
  T.night(0); T.life(0);
  return T;
}
