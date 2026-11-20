// Rua da cidade do voxel: ruaDaCidade(E, { carros, pedestres, noite }). Mesma linguagem do v2 e no molde de orla.js
// (cenário → objeto com scene, life(t) e night(k)). Rua reta ao longo de x; z: prédios (frente em ±12) · calçada ±6..±12 ·
// pista −6..6 (mão +x em z = +3, mão −x em z = −3) com faixa central tracejada e faixa de pedestres em x = 0.
// O tráfego é puro e testado (trafego.mjs): ciclo do semáforo, carros que saem no verde, param na retenção e formam
// fila no vermelho, pedestres nas calçadas. O salto do wrap fica a ±volta/2 (> 100 m) dos dois lados da faixa.
import * as THREE from 'three';
import { rnd, clamp, lerp } from '../motor/lib.js';
import { SHADOW } from '../motor/engine.js';
import { MAT, vox, shade } from './blocos.js';
import { figurante } from './elenco.js';
import { CICLO, estadoSemaforo, MAOS as TRANSITO, maxCarros, posicaoCarro, posicaoPedestre } from './trafego.mjs';
import { building, lampPost, car, bench, newsstand, cloudVox, skyDome, starField, PASTEL } from './props.js';

const col = (c) => new THREE.Color(c);
const DEG = Math.PI / 180;
const LEN = 240;                                         // comprimento modelado da rua (x −120..120): o wrap dos carros cai na pista
const VOLTA_PED = 200;                                   // m: os pedestres circulam em x ±100
const MAOS = [{ z: 3, dir: 1 }, { z: -3, dir: -1 }];     // mão +x (z = +3) e mão −x (z = −3); s = dir · x; tráfego em TRANSITO[mão]
export { CICLO, estadoSemaforo };

/** semáforo de braço: poste em (0,0,0), braço ao longo de +z com o grupo focal dos carros virado para +x no fim,
 *  e o grupo focal dos pedestres no poste virado para +z. set(estado) acende as luzes. */
function semaforo() {
  const g = new THREE.Group(), v = vox(), POS = '#4A4A56', CX = '#2A2A30';
  v.up(0, 0, 0, 0.34, 0.25, 0.34, '#3A3A44'); v.up(0, 0.25, 0, 0.16, 4.5, 0.16, POS); v.box(0, 4.6, 1.6, 0.12, 0.12, 3.3, POS);
  v.box(0, 4.15, 3.2, 0.34, 1.0, 0.38, CX); v.box(0, 4.68, 3.2, 0.06, 0.06, 0.06, POS);                    // grupo focal dos carros
  for (let i = 0; i < 3; i++) v.box(0.22, 4.47 - i * 0.31, 3.2, 0.12, 0.04, 0.3, CX);                       // palas
  v.box(0, 2.45, 0.2, 0.3, 0.66, 0.26, CX);                                                                  // grupo focal dos pedestres
  g.add(v.build());
  const luz = (x, y, z, sx, sz, cor) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.22, sz), new THREE.MeshBasicMaterial({ toneMapped: false })); m.position.set(x, y, z); m.userData.cor = col(cor); g.add(m); return m; };
  const L = { vermelho: luz(0.175, 4.45, 3.2, 0.02, 0.22, '#FF3B2E'), amarelo: luz(0.175, 4.15, 3.2, 0.02, 0.22, '#FFB627'), verde: luz(0.175, 3.85, 3.2, 0.02, 0.22, '#3BE26A') };
  const P = { pare: luz(0, 2.6, 0.335, 0.2, 0.02, '#FF3B2E'), siga: luz(0, 2.3, 0.335, 0.2, 0.02, '#3BE26A') };
  const acende = (m, on) => m.material.color.copy(m.userData.cor).multiplyScalar(on ? 2.6 : 0.12);
  const api = { group: g, luzes: L, pedestre: P, estado: null,
    set(estado) { api.estado = estado; for (const k in L) acende(L[k], k === estado); acende(P.siga, estado === 'vermelho'); acende(P.pare, estado !== 'vermelho'); return api; } };
  return api.set('verde');
}

/** árvore de calçada (canteiro + tronco + copa de blocos chanfrados) */
function arvore(seed) {
  const v = vox(), r = (k) => rnd(seed * 5.7 + k), h = 2.2 + r(1) * 0.6, G = ['#3F9A44', '#57B04A', '#2F8A3E', '#6FAE5E'];
  v.up(0, 0, 0, 1.1, 0.06, 1.1, '#6B4A2A');
  v.up(0, 0, 0, 0.24, h, 0.24, '#8A6444');
  for (let i = 0; i < 5; i++) { const s = 1.0 + r(i + 2) * 0.7; v.box((r(i + 9) - 0.5) * 0.9, h + 0.4 + i * 0.32, (r(i + 15) - 0.5) * 0.9, s, s * 0.8, s, G[i % 4], 'base', 0, r(i) * 1.5, 0, 0.08); }
  return v.build();
}

export function ruaDaCidade(E, { carros: nCarros = 10, pedestres: nPed = 18, noite = false } = {}) {
  const scene = new THREE.Scene();
  scene.environment = E.envMap; scene.environmentIntensity = 0.35;
  const sky = skyDome(); scene.add(sky);
  const stars = starField(); stars.visible = false; scene.add(stars);
  scene.fog = new THREE.Fog(col('#BFDDF5'), 70, 600);

  // luz: sol (sombra que segue a ação, como na orla), céu/chão, preenchimento frio
  const sun = new THREE.DirectionalLight('#FFE7C4', 2.8); sun.castShadow = true;
  sun.shadow.mapSize.set(Math.max(4096, SHADOW), Math.max(4096, SHADOW)); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03; sun.shadow.radius = 5;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight('#BFDFFF', '#B8AE9C', 0.8); scene.add(hemi);
  const fill = new THREE.DirectionalLight('#B8D4FF', 0.45); fill.position.set(-10, 8, -30); scene.add(fill);
  const sunDir = new THREE.Vector3();
  /** sol por elevação / azimute (graus; az 0 = +z, 90 = +x) */
  const setSun = (elev, az) => { sunDir.set(Math.sin(az * DEG) * Math.cos(elev * DEG), Math.sin(elev * DEG), Math.cos(az * DEG) * Math.cos(elev * DEG)); sky.userData.u.sunDir.value.copy(sunDir); };
  /** câmera de sombra em volta de (x, z), meia largura s */
  const shadowAt = (x, z, s = 16, y = 0) => {
    sun.target.position.set(x, y, z); sun.position.copy(sun.target.position).addScaledVector(sunDir, 90);
    Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 220 }); sun.shadow.camera.updateProjectionMatrix();
  };
  setSun(42, 35); shadowAt(0, 0);

  // chão: pista, faixas, faixa de pedestres, linhas de retenção, calçadas com meio-fio e juntas, piso tátil, fundo
  const G = vox(), BR = '#F1EEE6', AM = '#F2C14E';
  G.up(0, -0.5, 0, LEN, 0.52, 12, '#55555E');
  for (let x = -LEN / 2; x < LEN / 2; x += 6) if (Math.abs(x + 1.5) > 4) G.up(x + 1.5, 0.02, 0, 3, 0.01, 0.16, AM);
  for (const s of [-1, 1]) G.up(0, 0.02, s * 5.6, LEN, 0.01, 0.14, BR);
  for (let k = 0; k < 11; k++) G.up(0, 0.02, -5 + k * 1.0, 4, 0.012, 0.55, BR);                               // zebra
  G.up(-2.6, 0.02, 2.85, 0.4, 0.012, 5.5, BR); G.up(2.6, 0.02, -2.85, 0.4, 0.012, 5.5, BR);                 // retenção
  for (const s of [-1, 1]) {
    G.up(0, -0.5, s * 9.1, LEN, 0.68, 6.2, '#D9D4C8'); G.up(0, -0.5, s * 6.05, LEN, 0.7, 0.18, '#BDB6A8');
    for (let x = -LEN / 2; x <= LEN / 2; x += 2) G.up(x, 0.18, s * 9.1, 0.04, 0.005, 6.2, '#C6C0B2');
    G.up(0, 0.18, s * 10.05, LEN, 0.005, 0.06, '#C6C0B2');
    G.up(0, 0.18, s * 6.6, 4, 0.012, 0.6, AM);
    G.up(0, -0.5, s * 42, LEN + 200, 0.5, 60, '#C9C2B2');
  }
  scene.add(G.build(false, true));

  // prédios dos dois lados (frente na calçada, z = ±12,2), alturas variadas; silhueta de torres ao fundo
  const predios = [];
  for (const lado of [-1, 1]) {
    let bx = -LEN / 2;
    for (let i = 0; bx < LEN / 2; i++) {
      const s = i * 2 + (lado > 0 ? 1 : 0) + 7, w = 8 + rnd(s * 3.3) * 6, fl = 2 + Math.floor(rnd(s * 5.1) * 5), b = building(s, w, fl, 10);
      b.position.set(bx + w / 2, 0.18, lado * 12.2); if (lado > 0) b.rotation.y = Math.PI;
      scene.add(b); predios.push(b); bx += w + 0.2 + rnd(s) * 0.4;
    }
  }
  const torres = vox();
  for (const lado of [-1, 1]) for (let i = 0; i < 26; i++) { const s = i + (lado > 0 ? 50 : 0), w = 10 + rnd(s * 3) * 12, h = 22 + rnd(s * 7) * 40, c = shade(PASTEL[i % PASTEL.length], -0.08).getStyle();
    torres.up(-125 + i * 10 + rnd(s) * 6, 0, lado * (48 + rnd(s * 11) * 30), w, h, w, c, 'matte'); }
  scene.add(torres.build(false, false));

  // mobiliário: postes (braço sobre a pista), árvores, bancos virados para a rua, uma banca
  const lamps = [], arvores = [], luzesRua = [];
  for (const lado of [-1, 1]) {
    for (let x = -88; x <= 88; x += 16) {                                    // postes em x ≡ 8 (mód 16), árvores entre eles
      const l = lampPost(); l.position.set(x, 0.18, lado * 6.5); if (lado > 0) l.rotation.y = Math.PI; scene.add(l); lamps.push(l);
      if (Math.abs(x) < 26) { const pl = new THREE.PointLight('#FFC27A', 0, 14, 1.5); pl.position.set(x, 4.6, lado * 5.6); scene.add(pl); luzesRua.push(pl); }
      if (Math.abs(x + 8) > 4 && Math.abs(x + 8) < 92) { const a = arvore(Math.round(x * 3 + lado)); a.position.set(x + 8, 0.18, lado * 6.7); scene.add(a); arvores.push(a); }
    }
    for (let x = -84 + (lado > 0 ? 12 : 0); x <= 84; x += 24) { const b = bench(); b.position.set(x, 0.18, lado * 9.75); if (lado > 0) b.rotation.y = Math.PI; scene.add(b); }
  }
  const banca = newsstand(); banca.position.set(-9, 0.18, -10.8); scene.add(banca);

  // semáforos na faixa: um para cada mão, antes da faixa, com o grupo focal virado para quem vem
  const s1 = semaforo(); s1.group.position.set(-3.0, 0.18, 6.4); s1.group.rotation.y = Math.PI; scene.add(s1.group);   // mão +x (z = +3)
  const s2 = semaforo(); s2.group.position.set(3.0, 0.18, -6.4); scene.add(s2.group);                                    // mão −x (z = −3)
  const semaforos = [s1, s2];

  // céu: nuvens de blocos
  const clouds = [];
  for (let i = 0; i < 18; i++) { const c = cloudVox(i * 5 + 3, 1.4 + rnd(i) * 1.6), a = rnd(i * 11) * Math.PI * 2, rr = 240 + rnd(i * 13) * 280; c.position.set(Math.cos(a) * rr, 60 + rnd(i * 17) * 90, Math.sin(a) * rr); c.rotation.y = a; scene.add(c); clouds.push(c); }

  // carros: metade em cada mão, cada um com seu índice na mão (grupo e vaga na fila: ver trafego.mjs)
  const CARC = ['#E2483A', '#F2C14E', '#4C7DDC', '#F5F1E8', '#2BA6A0', '#E86A4A', '#5DB86A', '#8E6CCF', '#3D3A3A'];
  const porMao = [Math.ceil(nCarros / 2), Math.floor(nCarros / 2)];
  porMao.forEach((n, mi) => { if (n > maxCarros(TRANSITO[mi])) throw new Error(`ruaDaCidade: no máximo ${maxCarros(TRANSITO[mi])} carros por mão`); });
  const carros = [];
  MAOS.forEach((m, mi) => { for (let k = 0; k < porMao[mi]; k++) {
    const i = carros.length, c = car(CARC[(i * 4 + mi) % CARC.length], i, i % 5 === 3);
    c.userData = { mao: mi, k, z: m.z, dir: m.dir }; c.rotation.y = m.dir > 0 ? 0 : Math.PI; scene.add(c); carros.push(c);
  } });

  // pedestres nas calçadas (faixa livre z ±7,6..±9,0), indo e vindo, numa volta de VOLTA_PED m
  const pedestres = Array.from({ length: nPed }, (_, i) => {
    const p = figurante(i + 401), lado = i % 2 ? 1 : -1;
    p.userData = { x0: -VOLTA_PED / 2 + rnd(i * 5 + 2) * VOLTA_PED, v: (rnd(i * 3 + 1) > 0.5 ? 1 : -1) * (1.0 + rnd(i * 9) * 0.5), z: lado * (7.6 + rnd(i * 2 + 7) * 1.4), ph: rnd(i * 13) * 6 };
    scene.add(p.group); return p;
  });

  // a rua usa cópias de glass e lamp (como a sala): acender a rua não acende as janelas da orla, que usa o MAT compartilhado
  const vidroRua = MAT.glass.clone(), lampRua = MAT.lamp.clone();
  scene.traverse((o) => { if (o.isMesh) { if (o.material === MAT.glass) o.material = vidroRua; else if (o.material === MAT.lamp) o.material = lampRua; } });

  const T = {
    scene, sky, stars, sun, hemi, fill, sunDir, setSun, shadowAt, transito: TRANSITO, predios, carros, pedestres, semaforos, lamps, arvores, banca, clouds, luzesRua,
    /** carros, pedestres e semáforos no instante t */
    life(t, { carrosOn = true, pedestresOn = true } = {}) {
      carros.forEach((c) => { const u = c.userData; c.position.set(u.dir * posicaoCarro(t, u.k, TRANSITO[u.mao]), 0, u.z); c.visible = carrosOn; });
      pedestres.forEach((p) => { const u = p.userData; p.group.position.set(posicaoPedestre(t, u, VOLTA_PED), 0.18, u.z); p.group.rotation.set(0, u.v > 0 ? Math.PI / 2 : -Math.PI / 2, 0); p.walk(u.ph + t * 6.2 * Math.abs(u.v) / 1.2, 1); p.group.visible = pedestresOn; });
      const e = estadoSemaforo(t); semaforos.forEach((s) => s.set(e));
    },
    /** 0 = dia de sol, 1 = noite (estrelas, janelas e postes acesos) */
    night(k) {
      k = clamp(k);
      const u = sky.userData.u;
      u.top.value.copy(col('#1F5FC8')).lerp(col('#040818'), k); u.mid.value.copy(col('#5FA4E6')).lerp(col('#0B1634'), k); u.hor.value.copy(col('#B4DCF6')).lerp(col('#1E2C56'), k);
      u.sunI.value = 1 - k; stars.visible = k > 0.5;
      scene.fog.color.copy(col('#BFDDF5')).lerp(col('#141C38'), k);
      sun.intensity = lerp(2.8, 0.45, k); sun.color.copy(col('#FFE7C4')).lerp(col('#9DB4FF'), k);
      hemi.intensity = lerp(0.8, 0.4, k); hemi.color.copy(col('#BFDFFF')).lerp(col('#4A5AA0'), k); hemi.groundColor.copy(col('#B8AE9C')).lerp(col('#2A2A40'), k);
      fill.intensity = lerp(0.45, 0.12, k);
      vidroRua.emissiveIntensity = k * 2.4; lampRua.emissiveIntensity = k * 6; scene.environmentIntensity = lerp(0.35, 0.12, k);
      luzesRua.forEach((l) => { l.intensity = k * 14; });
    },
  };
  T.night(noite ? 1 : 0); T.life(0);
  return T;
}
