// Pessoa de blocos (extraído de teste-lowpoly-v2/src/voxel.js) + piscar (rosto), dedo de apontar e poses nomeadas (posar).
import * as THREE from 'three';
import { rnd } from '../motor/lib.js';
import { vox, shade } from './blocos.js';
import { FACES, FACECOL, rostoNoTempo } from './rostos.mjs';
import { POSES, misturarPoses } from './poses.mjs';

const col = (c) => new THREE.Color(c);
const DEG = Math.PI / 180;

// ================================================================================================
// PEOPLE
// ================================================================================================
export const SKINS = ['#F3CDB0', '#E5B08C', '#CF9468', '#A9714B', '#7E5136', '#5E3C28'];
export const HAIRS = ['#2B1D16', '#4B3020', '#7B4E2C', '#C79A5A', '#1B1B1D', '#A8A4A0', '#8E3B22'];
export const SHIRTS = ['#2BA6A0', '#F2C14E', '#E86A4A', '#4C7DDC', '#F5F1E8', '#8E6CCF', '#E2557B', '#5DB86A', '#F08C3A', '#3FB8D9'];
export const PANTS = ['#2C3A68', '#3D3A3A', '#C9B48A', '#5C7FA8', '#7A5A44', '#2F5D50', '#E9E2D2'];
/**
 * A block person. o = { skin, shirt, shirt2, pants, shoes, hair, hairStyle: short|buzz|long|bun|curly|bald|pony,
 *   beard: bool, shirtStyle: collar|tee|tank|floral, shorts: bool, accessory: 'cap'|'sunhat'|'glasses'|'backpack'|'camera' or array,
 *   capColor, hatColor, bagColor }
 */
export function VoxelPerson(o = {}) {
  const P = { skin: SKINS[2], shirt: SHIRTS[0], shirt2: '#FFFFFF', pants: PANTS[0], shoes: '#F1EEE6', hair: HAIRS[0], hairStyle: 'short', beard: false,
    shirtStyle: 'tee', shorts: false, accessory: [], capColor: '#E2483A', hatColor: '#E9CF8E', bagColor: '#E8913A', ...o };
  const acc = new Set([].concat(P.accessory || []));
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const sk = P.skin, shirtD = shade(P.shirt, -0.18).getStyle(), shirtL = shade(P.shirt, 0.35).getStyle(), pantsD = shade(P.pants, -0.25).getStyle();

  // legs (pivot at the hip)
  const leg = (sx) => {
    const piv = new THREE.Group(); piv.position.set(sx * 0.11, 0.8, 0);
    const v = vox(), L = 0.71;
    if (P.shorts) { v.box(0, -0.16, 0, 0.17, 0.32, 0.2, P.pants); v.box(0, -0.31, 0, 0.175, 0.03, 0.205, pantsD); v.box(0, -0.52, 0, 0.14, 0.4, 0.16, sk); }
    else { v.box(0, -L / 2, 0, 0.165, L, 0.19, P.pants); v.box(0, -L + 0.06, 0, 0.17, 0.04, 0.195, pantsD); }
    v.box(0, -0.755, 0.04, 0.18, 0.09, 0.28, P.shoes); v.box(0, -0.79, 0.04, 0.185, 0.025, 0.285, '#3A3A3E');
    piv.add(v.build()); return piv;
  };
  const legL = leg(1), legR = leg(-1);

  // pelvis + torso (one mesh, rides on `torso` so it can bend forward a little)
  const torso = new THREE.Group(); torso.position.y = 0.8;
  { const v = vox();
    v.box(0, 0.02, 0, 0.4, 0.13, 0.24, P.pants); v.box(0, 0.07, 0, 0.405, 0.03, 0.245, '#3A2E2A'); v.box(0.0, 0.07, 0.124, 0.05, 0.035, 0.01, '#D9C27A');
    const top = P.shirtStyle === 'tank' ? 0.5 : 0.5;
    v.box(0, 0.08 + top / 2, 0, 0.42, top, 0.24, P.shirt);                        // chest block
    v.box(0, 0.1, 0, 0.425, 0.04, 0.245, shirtD);                                  // hem
    if (P.shirtStyle === 'collar' || P.shirtStyle === 'floral') {
      const cc = P.shirtStyle === 'floral' ? P.shirt2 : shirtL;
      v.box(-0.055, 0.545, 0.122, 0.09, 0.05, 0.02, cc, 'base', 0, 0, -0.45); v.box(0.055, 0.545, 0.122, 0.09, 0.05, 0.02, cc, 'base', 0, 0, 0.45);
      v.box(0, 0.5, 0.121, 0.07, 0.07, 0.01, sk);                                  // open neck
      for (let k = 0; k < 3; k++) v.box(0, 0.42 - k * 0.1, 0.123, 0.025, 0.025, 0.012, P.shirtStyle === 'floral' ? '#F5F1E8' : shirtD);
      v.box(0.11, 0.42, 0.122, 0.09, 0.08, 0.012, shirtD); v.box(0.11, 0.455, 0.124, 0.092, 0.015, 0.012, shirtL);   // pocket
    } else if (P.shirtStyle === 'tee') {
      v.box(0, 0.565, 0.0, 0.17, 0.03, 0.15, shirtD);
      v.box(0, 0.38, 0.122, 0.12, 0.1, 0.01, P.shirt2);                             // chest print
    } else if (P.shirtStyle === 'tank') { v.box(0, 0.56, 0.0, 0.2, 0.04, 0.16, sk); }
    if (P.shirtStyle === 'floral') {                                               // pixel flowers
      for (let i = 0; i < 26; i++) { const fx = (rnd(i * 3 + 1) - 0.5) * 0.36, fy = 0.15 + rnd(i * 5 + 2) * 0.38, side = i % 2 ? 0.122 : -0.122;
        if (Math.abs(fx) < 0.04 && side > 0) continue; v.box(fx, fy, side, 0.03, 0.03, 0.012, i % 3 ? P.shirt2 : '#F5F1E8'); }
    }
    torso.add(v.build()); }
  body.add(torso);

  // arms (pivot at the shoulder, on the torso). handR / handL = groups at the hands for props
  const arm = (sx) => {
    const piv = new THREE.Group(); piv.position.set(sx * 0.28, 0.53, 0);
    const v = vox(), sleeve = P.shirtStyle === 'tank' ? 0 : 0.2;
    if (sleeve) { v.box(0, -0.1, 0, 0.145, 0.2, 0.16, P.shirt); v.box(0, -0.19, 0, 0.15, 0.03, 0.165, shirtD); }
    v.box(0, -(sleeve + (0.5 - sleeve) / 2), 0, 0.12, 0.5 - sleeve, 0.13, sk);
    v.box(0, -0.555, 0.005, 0.125, 0.11, 0.14, shade(sk, -0.06).getStyle());
    piv.add(v.build());
    const hand = new THREE.Group(); hand.position.set(0, -0.56, 0.02); piv.add(hand); piv.userData.hand = hand; return piv;
  };
  const armL = arm(1), armR = arm(-1); torso.add(armL, armR);

  // dedo indicador (um por mão, escondido): sai da base da mão ao longo do braço (-y local)
  const dedos = {};
  for (const [lado, piv] of [['L', armL], ['R', armR]]) {
    const v = vox(); v.box(0, -0.125, 0.03, 0.055, 0.15, 0.055, sk);
    const d = v.build(); d.visible = false; piv.userData.hand.add(d); dedos[lado] = d;
  }

  // head (pivot at the neck)
  const head = new THREE.Group(); head.position.set(0, 0.6, 0); torso.add(head);
  { const v = vox(); v.box(0, -0.01, 0, 0.15, 0.08, 0.14, shade(sk, -0.08).getStyle());
    v.box(0, 0.23, 0, 0.46, 0.44, 0.42, sk, 'base', 0, 0, 0, 0.035);
    v.box(0.235, 0.22, 0.0, 0.03, 0.09, 0.07, shade(sk, -0.08).getStyle()); v.box(-0.235, 0.22, 0.0, 0.03, 0.09, 0.07, shade(sk, -0.08).getStyle());   // ears
    v.box(0, 0.2, 0.218, 0.06, 0.07, 0.03, shade(sk, -0.05).getStyle());           // nose block
    const hc = P.hair, hs = P.hairStyle;
    if (hs !== 'bald') {
      const thick = hs === 'buzz' ? 0.035 : hs === 'curly' ? 0.13 : 0.07;
      v.box(0, 0.45 + thick / 2 - 0.01, -0.01, 0.48 + (hs === 'curly' ? 0.06 : 0), thick, 0.44 + (hs === 'curly' ? 0.06 : 0), hc);
      v.box(0, 0.3, -0.215, 0.48, 0.32, 0.05, hc);                                  // back
      v.box(0.237, 0.36, -0.06, 0.04, 0.16, 0.3, hc); v.box(-0.237, 0.36, -0.06, 0.04, 0.16, 0.3, hc);   // sides
      if (hs !== 'buzz') { v.box(-0.08, 0.425, 0.205, 0.3, 0.06, 0.05, hc); v.box(0.15, 0.435, 0.205, 0.14, 0.04, 0.05, hc); }   // fringe
      if (hs === 'long' || hs === 'pony') { v.box(0, 0.05, -0.225, 0.48, 0.5, 0.06, hc); if (hs === 'long') { v.box(0.24, 0.15, 0.06, 0.05, 0.42, 0.14, hc); v.box(-0.24, 0.15, 0.06, 0.05, 0.42, 0.14, hc); } }
      if (hs === 'pony') v.box(0, 0.25, -0.3, 0.1, 0.32, 0.1, hc);
      if (hs === 'bun') v.box(0, 0.56, -0.12, 0.17, 0.14, 0.17, hc);
      if (hs === 'curly') for (let i = 0; i < 7; i++) v.box((rnd(i + 3) - 0.5) * 0.46, 0.57 + rnd(i + 9) * 0.05, (rnd(i + 5) - 0.5) * 0.4, 0.12, 0.08, 0.12, shade(hc, 0.08).getStyle());
    }
    if (P.beard) { v.box(0.215, 0.13, 0.08, 0.04, 0.2, 0.22, P.hair); v.box(-0.215, 0.13, 0.08, 0.04, 0.2, 0.22, P.hair); v.box(0, 0.0, 0.12, 0.4, 0.04, 0.2, P.hair); }
    head.add(v.build()); }

  // expressions: one merged mesh per face, toggled
  const faces = {}, browC = P.hairStyle === 'bald' ? '#3A2A22' : P.hair, beardC = shade(P.hair, 0.12).getStyle();
  const cell = 0.048, fx0 = -3.5 * cell, fy0 = 0.4, fz = 0.211;
  for (const [name, map] of Object.entries(FACES)) {
    const v = vox();
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const ch = map[r][c], x = fx0 + c * cell, y = fy0 - r * cell;
      const beardCell = P.beard && ((r === 7 && c >= 1 && c <= 6) || (r === 6 && (c <= 1 || c >= 6)) || (r === 5 && (c === 0 || c === 7)));
      if (ch === '.') { if (beardCell) v.box(x, y, fz + 0.008, cell, cell, 0.016, beardC); continue; }
      const cc = ch === 'b' ? browC : ch === 'c' ? shade(sk, -0.0).lerp(col('#FF7A7A'), 0.45).getStyle() : FACECOL[ch];
      const d = ch === 'b' ? 0.026 : ch === 'c' ? 0.006 : ch === 's' ? 0.03 : 0.024, hh = ch === 'b' ? cell * 0.6 : cell;
      v.box(x, y + (ch === 'b' ? cell * 0.15 : 0), fz + d / 2, cell * 0.98, hh, d, cc);
    }
    const m = v.build(false, false); m.visible = name === 'neutral'; head.add(m); faces[name] = m;
  }

  // accessories (groups on the head / torso, so a shot can hide them and fly a loose copy)
  const A = {};
  if (acc.has('cap')) { const v = vox(), c = P.capColor;
    v.box(0, 0.5, -0.01, 0.5, 0.12, 0.46, c, 'base', 0, 0, 0, 0.02); v.box(0, 0.47, 0.3, 0.44, 0.03, 0.22, shade(c, -0.15).getStyle()); v.box(0, 0.56, -0.01, 0.06, 0.03, 0.06, shade(c, -0.15).getStyle());
    v.box(0.0, 0.51, 0.226, 0.1, 0.06, 0.01, '#FFFFFF');
    A.cap = v.build(); head.add(A.cap); }
  if (acc.has('sunhat')) { const v = vox(), c = P.hatColor;
    v.box(0, 0.47, 0, 0.82, 0.03, 0.8, c); v.box(0, 0.555, 0, 0.44, 0.15, 0.42, c, 'base', 0, 0, 0, 0.02); v.box(0, 0.5, 0, 0.45, 0.04, 0.43, '#C2493A');
    A.sunhat = v.build(); head.add(A.sunhat); }
  if (acc.has('glasses')) { const v = vox();
    v.box(-0.1, 0.235, 0.236, 0.16, 0.1, 0.022, '#141418', 'shiny'); v.box(0.1, 0.235, 0.236, 0.16, 0.1, 0.022, '#141418', 'shiny'); v.box(0, 0.255, 0.236, 0.06, 0.025, 0.02, '#141418', 'shiny');
    v.box(0.232, 0.255, 0.1, 0.02, 0.025, 0.26, '#141418', 'shiny'); v.box(-0.232, 0.255, 0.1, 0.02, 0.025, 0.26, '#141418', 'shiny');
    v.box(-0.13, 0.26, 0.248, 0.04, 0.02, 0.004, '#6E8CA8', 'shiny'); v.box(0.07, 0.26, 0.248, 0.04, 0.02, 0.004, '#6E8CA8', 'shiny');   // glints
    A.glasses = v.build(); head.add(A.glasses); }
  if (acc.has('backpack')) { const v = vox(), c = P.bagColor;
    v.box(0, 0.36, -0.21, 0.34, 0.4, 0.17, c, 'base', 0, 0, 0, 0.02); v.box(0, 0.27, -0.3, 0.24, 0.14, 0.04, shade(c, -0.15).getStyle()); v.box(0, 0.58, -0.21, 0.1, 0.04, 0.05, shade(c, -0.25).getStyle());
    v.box(0.11, 0.38, 0.124, 0.05, 0.32, 0.015, shade(c, -0.25).getStyle()); v.box(-0.11, 0.38, 0.124, 0.05, 0.32, 0.015, shade(c, -0.25).getStyle());
    A.backpack = v.build(); torso.add(A.backpack); }
  if (acc.has('camera')) { const v = vox();
    v.box(0, 0.33, 0.15, 0.16, 0.1, 0.06, '#202024', 'shiny'); v.box(0, 0.33, 0.19, 0.06, 0.06, 0.04, '#3A3A40', 'shiny'); v.box(0.05, 0.34, 0.211, 0.03, 0.03, 0.005, '#7FA6C8', 'shiny');
    v.box(0.07, 0.45, 0.123, 0.02, 0.2, 0.01, '#202024'); v.box(-0.07, 0.45, 0.123, 0.02, 0.2, 0.01, '#202024');
    A.camera = v.build(); torso.add(A.camera); }

  body.add(legL, legR);
  const api = {
    group: root, body, torso, head, armL, armR, legL, legR, faces, acc: A, handL: armL.userData.hand, handR: armR.userData.hand, look: P,
    _face: 'neutral',
    face(name) { if (!faces[name]) name = 'neutral'; for (const k in faces) faces[k].visible = k === name; api._face = name; return api; },
    /** all angles in degrees. lean = [fwd, turn, side] whole body (pivot at the feet) · bend = torso forward ·
     *  head = [down, turn, tilt] · armL/armR = [fwd, out] · legL/legR = [fwd, out] · lift = body raised (m) */
    pose({ lean = [0, 0, 0], bend = 0, head: hd = [0, 0, 0], armL: aL = [0, 4], armR: aR = [0, 4], legL: lL = [0, 0], legR: lR = [0, 0], lift = 0 } = {}) {
      body.rotation.set(lean[0] * DEG, (lean[1] || 0) * DEG, (lean[2] || 0) * DEG); body.position.y = lift;
      torso.rotation.set(bend * DEG, 0, 0);
      head.rotation.set(hd[0] * DEG, (hd[1] || 0) * DEG, (hd[2] || 0) * DEG);
      armL.rotation.set(-aL[0] * DEG, 0, (aL[1] || 0) * DEG); armR.rotation.set(-aR[0] * DEG, 0, -(aR[1] || 0) * DEG);
      legL.rotation.set(-(lL[0] || 0) * DEG, 0, (lL[1] || 0) * DEG); legR.rotation.set(-(lR[0] || 0) * DEG, 0, -(lR[1] || 0) * DEG);
      return api;
    },
    /** a walk cycle at phase (radians), amt 0..1; extra = pose overrides */
    walk(ph, amt = 1, extra = {}) {
      const s = Math.sin(ph), c = Math.cos(ph);
      api.pose({ armL: [-22 * s * amt, 5], armR: [22 * s * amt, 5], legL: [26 * s * amt, 0], legR: [-26 * s * amt, 0], lift: Math.abs(c) * 0.035 * amt, head: [0, 0, 2 * s * amt], ...extra });
      return api;
    },
    /** mostra/esconde o dedo indicador da mão 'L' ou 'R' */
    dedo(lado = 'R', on = true) { if (!dedos[lado]) throw new Error(`dedo "${lado}" não existe (use 'L' ou 'R')`); dedos[lado].visible = !!on; return api; },
    /** pose nomeada (POSES de poses.mjs) ou objeto de pose, misturada a partir do neutro por k; extra sobrescreve campos */
    posar(nomeOuPose, k = 1, extra = {}) {
      const alvo = typeof nomeOuPose === 'string' ? POSES[nomeOuPose] : nomeOuPose;
      if (!alvo) throw new Error(`pose "${nomeOuPose}" não existe`);
      const p = { ...misturarPoses(POSES.neutro, alvo, k), ...extra };
      api.pose(p); api.dedo('L', p.dedo === 'L'); api.dedo('R', p.dedo === 'R');
      return api;
    },
    /** expressão no tempo t, com piscada automática nas expressões calmas */
    rosto(nome, t, opcoes) { return api.face(rostoNoTempo(nome, t, opcoes)); },
    reset() { api.pose({}); api.face('neutral'); for (const k in A) { A[k].visible = true; } for (const k in dedos) dedos[k].visible = false; root.visible = true; return api; },
  };
  api.pose({});
  return api;
}