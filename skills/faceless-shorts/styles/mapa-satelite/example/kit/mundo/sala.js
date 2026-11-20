// Sala de aula do voxel: salaDeAula(E, { alunos, noite }). Mesma linguagem de blocos do v2 (Vox, MAT, PASTEL).
// Sala de 12 m (x −6..6) × 9 m (z −4,5..4,5) × 3,4 m. Quadro-negro na parede do fundo (z = −4,4), mesa do professor na frente
// dele, 4 fileiras × 3 carteiras voltadas para o quadro (−z), 3 janelas na parede x = +6 (o sol entra por elas, com sombra),
// estante e mural na parede x = −6, relógio acima do quadro, 4 luminárias no teto. Tudo determinístico (sem sorteio fora de rnd).
import * as THREE from 'three';
import { rnd } from '../motor/lib.js';
import { SHADOW } from '../motor/engine.js';
import { MAT, vox, shade } from './blocos.js';
import { SHIRTS } from './pessoa.js';
import { figurante } from './elenco.js';
import { PASTEL } from './props.js';

const col = (c) => new THREE.Color(c);
const LX = 6, LZ = 4.5, ALT = 3.4;                       // meia largura, meia profundidade, pé-direito
const ZQ = -4.4, QW = 4, QH = 1.4, QY = 1.65;           // quadro: plano, largura, altura, centro
const JZ = [-2.6, 0, 2.6], JW = 1.8, PEIT = 1.0, VERGA = 2.65;   // janelas (parede x = +6): centros em z, largura, peitoril, verga
const COLS = [-3.2, 0, 3.2], FILAS = [-1.6, -0.2, 1.2, 2.6];     // carteiras: x das colunas, z das mesas (cadeira 0,5 atrás)
const TELA = { w: 512, h: 180 };                        // canvas do quadro

/** troca o material de uma camada de um grupo do Vox.build() (a sala usa cópias, para não mexer no MAT compartilhado) */
const trocarMat = (g, de, para) => g.traverse((o) => { if (o.isMesh && o.material === de) o.material = para; });

/** pose sentada de um aluno (índice → variação determinística): pernas a 90°, corpo baixado até o assento */
export const SENTADO = { legL: [90, 0], legR: [90, 0], lift: -0.285, armL: [64, 6], armR: [64, 6] };
function poseAluno(i) {
  const r = (k) => rnd(i * 9.7 + k * 4.1), v = r(1);
  if (v < 0.14) return { ...SENTADO, armR: [168, 12], head: [-6, 0, 4] };                         // mão levantada
  if (v < 0.4) return { ...SENTADO, bend: 10, head: [20, 0, 0], armR: [70, 2] };                  // escrevendo
  if (v < 0.55) return { ...SENTADO, head: [0, (r(2) > 0.5 ? 1 : -1) * 28, 0] };                  // olhando o colega
  return { ...SENTADO, head: [-4 + r(3) * 6, (r(4) - 0.5) * 10, (r(5) - 0.5) * 6] };              // prestando atenção
}

export function salaDeAula(E, { alunos: nAlunos = 12, noite = false } = {}) {
  const scene = new THREE.Scene();
  scene.environment = E.envMap; scene.environmentIntensity = noite ? 0.15 : 0.3;
  scene.background = col(noite ? '#0E1630' : '#CFE6F5');

  // ── piso de taco: tábuas em quadrados de 0,6 m alternando a direção, sobre uma base escura (as juntas) ──
  const TACO = ['#C99E5C', '#B8894A', '#D4A866', '#BE8F52'], Q = 0.6;
  const piso = vox();
  piso.up(0, -0.2, 0, LX * 2 + 0.4, 0.2, LZ * 2 + 0.4, '#6E4A2C', 'matte');
  for (let i = 0; i < (LX * 2) / Q; i++) for (let j = 0; j < (LZ * 2) / Q; j++) {
    const cx = -LX + Q * (i + 0.5), cz = -LZ + Q * (j + 0.5), deitado = (i + j) % 2 === 0;
    for (let k = 0; k < 3; k++) {
      const o = (k - 1) * Q / 3, c = TACO[Math.floor(rnd(i * 31 + j * 7 + k) * TACO.length)];
      if (deitado) piso.up(cx, 0, cz + o, Q - 0.02, 0.02, Q / 3 - 0.02, c);
      else piso.up(cx + o, 0, cz, Q / 3 - 0.02, 0.02, Q - 0.02, c);
    }
  }
  scene.add(piso.build(false, true));

  // ── paredes (barra mais escura até 1 m, pintura pastel acima, friso e rodapé), teto ──
  const tinta = PASTEL[2], barra = shade(tinta, -0.16).getStyle(), friso = shade(tinta, 0.45).getStyle(), RODAPE = '#7A5A44';
  const W = vox();
  const trecho = (x, z, w, d, y0, y1) => {
    if (y0 < 1) W.up(x, y0, z, w, Math.min(1, y1) - y0, d, barra, 'matte');
    if (y1 > 1) W.up(x, Math.max(1, y0), z, w, y1 - Math.max(1, y0), d, tinta, 'matte');
  };
  trecho(0, -LZ - 0.1, LX * 2 + 0.4, 0.2, 0, ALT);                      // fundo (quadro)
  trecho(0, LZ + 0.1, LX * 2 + 0.4, 0.2, 0, ALT);                       // frente
  trecho(-LX - 0.1, 0, 0.2, LZ * 2, 0, ALT);                            // esquerda
  const pilares = [[-LZ, JZ[0] - JW / 2], [JZ[0] + JW / 2, JZ[1] - JW / 2], [JZ[1] + JW / 2, JZ[2] - JW / 2], [JZ[2] + JW / 2, LZ]];
  for (const [a, b] of pilares) { trecho(LX + 0.1, (a + b) / 2, 0.2, b - a, 0, ALT); W.up(LX - 0.015, 0.97, (a + b) / 2, 0.03, 0.06, b - a, friso); }
  for (const z of JZ) { trecho(LX + 0.1, z, 0.2, JW, 0, PEIT); trecho(LX + 0.1, z, 0.2, JW, VERGA, ALT); }
  for (const s of [-1, 1]) { W.up(0, 0.97, s * (LZ - 0.015), LX * 2, 0.06, 0.03, friso); W.up(0, 0, s * (LZ - 0.015), LX * 2, 0.12, 0.03, RODAPE); }
  W.up(-LX + 0.015, 0.97, 0, 0.03, 0.06, LZ * 2, friso); W.up(-LX + 0.015, 0, 0, 0.03, 0.12, LZ * 2, RODAPE); W.up(LX - 0.015, 0, 0, 0.03, 0.12, LZ * 2, RODAPE);
  W.up(0, ALT, 0, LX * 2 + 0.4, 0.2, LZ * 2 + 0.4, '#F5F1E8', 'matte');   // teto
  scene.add(W.build(true, true));

  // ── janelas: caixilhos brancos (fazem sombra) + vidro (não faz sombra: o sol passa) ──
  const caix = vox(), vid = vox(), BR = '#F5F1E8';
  for (const z of JZ) {
    const ym = (PEIT + VERGA) / 2, hj = VERGA - PEIT;
    caix.up(LX - 0.08, PEIT - 0.04, z, 0.36, 0.08, JW + 0.2, BR);                                   // peitoril
    caix.box(LX + 0.1, ym, z - JW / 2 + 0.04, 0.22, hj, 0.08, BR); caix.box(LX + 0.1, ym, z + JW / 2 - 0.04, 0.22, hj, 0.08, BR);
    caix.box(LX + 0.1, VERGA - 0.04, z, 0.22, 0.08, JW, BR);
    caix.box(LX + 0.1, ym, z, 0.12, hj, 0.06, BR); caix.box(LX + 0.1, PEIT + hj * 0.66, z, 0.12, 0.06, JW, BR);   // travessas
    vid.box(LX + 0.1, ym, z, 0.03, hj, JW, noite ? '#1C2C4C' : '#D6EEFA', 'glass');
  }
  const caixilhos = caix.build(true, true);
  const vidroMat = MAT.glass.clone(); vidroMat.emissive = col('#EAF6FF'); vidroMat.emissiveIntensity = noite ? 0 : 1.1;
  const vidros = vid.build(false, false); trocarMat(vidros, MAT.glass, vidroMat);
  const janelaG = new THREE.Group(); janelaG.add(caixilhos, vidros); scene.add(janelaG);

  // ── quadro-negro: moldura de madeira, calha de giz, tela (CanvasTexture 512 × 180) ──
  const Qv = vox(), MAD = '#9A6B40';
  Qv.box(0, QY + QH / 2 + 0.05, -LZ + 0.07, QW + 0.2, 0.1, 0.14, MAD); Qv.box(0, QY - QH / 2 - 0.05, -LZ + 0.07, QW + 0.2, 0.1, 0.14, MAD);
  Qv.box(-QW / 2 - 0.05, QY, -LZ + 0.07, 0.1, QH, 0.14, MAD); Qv.box(QW / 2 + 0.05, QY, -LZ + 0.07, 0.1, QH, 0.14, MAD);
  Qv.box(0, QY - QH / 2 - 0.12, -LZ + 0.12, QW, 0.04, 0.14, shade(MAD, -0.15).getStyle());           // calha
  for (let i = 0; i < 4; i++) Qv.box(-1.2 + i * 0.12 + (i > 1 ? 1.6 : 0), QY - QH / 2 - 0.085, -LZ + 0.13, 0.08, 0.025, 0.025, ['#F5F1E8', '#F5F1E8', '#F2C1CF', '#F7E7B4'][i]);
  Qv.box(1.5, QY - QH / 2 - 0.08, -LZ + 0.13, 0.22, 0.05, 0.08, '#4A4A56');                           // apagador
  const quadro = new THREE.Group(); quadro.add(Qv.build(true, true));
  const tela = document.createElement('canvas'); tela.width = TELA.w; tela.height = TELA.h;
  const g2 = tela.getContext('2d'), tex = new THREE.CanvasTexture(tela); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const quadroM = new THREE.Mesh(new THREE.PlaneGeometry(QW, QH), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  quadroM.position.set(0, QY, ZQ); quadroM.receiveShadow = true; quadro.add(quadroM); quadro.userData = { tela: quadroM, canvas: tela, tex };
  scene.add(quadro);
  const limpar = () => {
    g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalAlpha = 1; g2.fillStyle = '#2E5A43'; g2.fillRect(0, 0, TELA.w, TELA.h);
    g2.fillStyle = '#F1EEE6';                                                                         // restos de giz apagado
    for (let i = 0; i < 14; i++) { g2.globalAlpha = 0.03 + rnd(i * 5) * 0.04; g2.beginPath(); g2.ellipse(rnd(i * 3) * TELA.w, rnd(i * 7) * TELA.h, 30 + rnd(i * 11) * 70, 8 + rnd(i * 13) * 16, (rnd(i) - 0.5) * 0.6, 0, Math.PI * 2); g2.fill(); }
    g2.globalAlpha = 1;
  };
  /** desenha no quadro: fn(ctx2d, w, h) sobre o quadro limpo (sem fn = só limpa). Chame a cada quadro que mudar o texto. */
  const setTexto = (fn) => { limpar(); if (fn) { g2.save(); fn(g2, TELA.w, TELA.h); g2.restore(); } tex.needsUpdate = true; };

  // ── relógio de parede (acima do quadro, à direita), estante com livros, mural e porta (parede esquerda) ──
  const D = vox();
  { const cx = 2.9, cy = 2.85, z = -LZ + 0.03;
    D.box(cx, cy, z, 0.5, 0.5, 0.05, '#2A2A30'); D.box(cx, cy, z, 0.5, 0.5, 0.05, '#2A2A30', 'base', 0, 0, Math.PI / 4);
    D.box(cx, cy, z + 0.02, 0.42, 0.42, 0.05, '#F5F1E8'); D.box(cx, cy, z + 0.02, 0.42, 0.42, 0.05, '#F5F1E8', 'base', 0, 0, Math.PI / 4);
    for (let h = 0; h < 12; h++) { const a = h / 12 * Math.PI * 2; D.box(cx + Math.sin(a) * 0.17, cy + Math.cos(a) * 0.17, z + 0.05, 0.025, h % 3 ? 0.025 : 0.05, 0.01, '#2A2A30', 'base', 0, 0, -a); }
    const hora = (10 + 10 / 60) / 12 * Math.PI * 2, min = 10 / 60 * Math.PI * 2;
    D.box(cx + Math.sin(hora) * 0.05, cy + Math.cos(hora) * 0.05, z + 0.06, 0.025, 0.11, 0.01, '#2A2A30', 'base', 0, 0, -hora);
    D.box(cx + Math.sin(min) * 0.075, cy + Math.cos(min) * 0.075, z + 0.065, 0.018, 0.16, 0.01, '#2A2A30', 'base', 0, 0, -min);
    D.box(cx, cy, z + 0.07, 0.03, 0.03, 0.01, '#E2483A'); }
  { const x = -LX + 0.25, z0 = -2.3, w = 2.0, h = 1.9, d = 0.45, MOV = '#B07A48', MOVD = shade(MOV, -0.2).getStyle();
    D.up(x - d / 2 + 0.02, 0, z0, 0.04, h, w, MOVD);                                                   // fundo
    D.up(x, 0, z0 - w / 2, d, h, 0.05, MOV); D.up(x, 0, z0 + w / 2, d, h, 0.05, MOV);                   // laterais
    for (let s = 0; s < 5; s++) D.up(x, s * (h - 0.04) / 4, z0, d, 0.04, w, MOV);                       // prateleiras
    for (let s = 0; s < 4; s++) { let z = z0 - w / 2 + 0.06; const y0 = s * (h - 0.04) / 4 + 0.04;
      for (let b = 0; z < z0 + w / 2 - 0.1; b++) { const r = (k) => rnd(s * 97 + b * 13 + k), bw = 0.05 + r(1) * 0.06, bh = 0.24 + r(2) * 0.14;
        if (r(3) > 0.9) { z += 0.12; continue; }
        D.up(x + 0.02, y0, z + bw / 2, 0.3, bh, bw, SHIRTS[Math.floor(r(4) * SHIRTS.length)]); D.up(x + 0.172, y0 + bh * 0.7, z + bw / 2, 0.005, 0.03, bw * 0.8, '#F5F1E8'); z += bw + 0.005; } }
    D.up(x, h, z0 + 0.5, 0.26, 0.22, 0.26, '#E86A4A');                                                  // vaso com planta
    for (let i = 0; i < 5; i++) D.box(x + (rnd(i) - 0.5) * 0.2, h + 0.36 + rnd(i * 3) * 0.16, z0 + 0.5 + (rnd(i * 5) - 0.5) * 0.2, 0.18, 0.18, 0.18, ['#3F9A44', '#57B04A', '#2F8A3E'][i % 3], 'base', 0, i, 0, 0.03);
    D.up(x, h, z0 - 0.4, 0.3, 0.2, 0.36, '#4C7DDC'); D.up(x, h + 0.2, z0 - 0.4, 0.28, 0.14, 0.34, '#F2C14E'); }
  { const x = -LX + 0.03, z0 = 1.2;                                                                    // mural de cortiça
    D.box(x, 1.85, z0, 0.04, 1.1, 2.3, '#8A6444'); D.box(x + 0.02, 1.85, z0, 0.03, 0.96, 2.16, '#D2A46C');
    for (let i = 0; i < 9; i++) { const r = (k) => rnd(i * 23 + k), pw = 0.3 + r(1) * 0.25, ph = 0.22 + r(2) * 0.25;
      D.box(x + 0.045, 1.5 + r(3) * 0.7, z0 - 0.9 + (i / 8) * 1.8, 0.01, ph, pw, ['#F5F1E8', '#F7E7B4', '#F2C1CF', '#B9D3F0', '#C8E0A8'][i % 5], 'base', (r(4) - 0.5) * 0.25, 0, 0);
      D.box(x + 0.055, 1.5 + r(3) * 0.7 + ph / 2 - 0.04, z0 - 0.9 + (i / 8) * 1.8, 0.012, 0.035, 0.035, '#E2483A'); } }
  { const x = -LX + 0.04, z0 = 3.5;                                                                    // porta
    D.up(x, 0, z0, 0.1, 2.2, 1.12, '#F5F1E8'); D.up(x + 0.03, 0, z0, 0.08, 2.12, 1.0, '#8A5A3A');
    D.box(x + 0.09, 1.2, z0 + 0.38, 0.06, 0.05, 0.14, '#C9C3B6', 'shiny'); D.box(x + 0.075, 1.75, z0, 0.02, 0.36, 0.5, '#D6EEFA', 'glassDark'); }
  scene.add(D.build(true, true));

  // ── mesa do professor (frente do quadro, de frente para os alunos) e a cadeira dele ──
  const mesaProf = new THREE.Group(); mesaProf.position.set(0, 0, -3.0);
  { const v = vox(), M = '#B07A48', MD = shade(M, -0.2).getStyle();
    v.up(0, 0.73, 0, 1.8, 0.05, 0.8, M); v.up(0, 0.725, 0, 1.82, 0.012, 0.82, MD);
    v.up(-0.86, 0, 0, 0.06, 0.73, 0.76, MD); v.up(0.86, 0, 0, 0.06, 0.73, 0.76, MD); v.up(0, 0.22, 0.36, 1.66, 0.51, 0.04, M);
    v.up(0.55, 0.42, -0.02, 0.56, 0.31, 0.7, MD); v.box(0.55, 0.58, -0.38, 0.14, 0.03, 0.02, '#C9C3B6', 'shiny');
    [['#E2483A', 0.06], ['#4C7DDC', 0.05], ['#F2C14E', 0.07]].forEach(([c, hh], i) => v.up(-0.55 + i * 0.02, 0.78 + [0, 0.06, 0.11][i], -0.05, 0.42, hh, 0.3, c));
    v.up(0.05, 0.78, 0.05, 0.36, 0.015, 0.26, '#F5F1E8'); v.up(0.05, 0.795, 0.05, 0.02, 0.004, 0.2, '#3A3A40');
    v.box(0.6, 0.86, 0.12, 0.13, 0.13, 0.13, '#D93A30', 'shiny', 0, 0.3, 0, 0.03); v.box(0.6, 0.945, 0.12, 0.015, 0.04, 0.015, '#6B4A2A'); v.box(0.63, 0.95, 0.12, 0.05, 0.02, 0.03, '#57B04A');
    v.up(0.32, 0.78, -0.2, 0.09, 0.14, 0.09, '#2BA6A0'); for (let i = 0; i < 3; i++) v.box(0.3 + i * 0.02, 0.97, -0.2, 0.012, 0.12, 0.012, ['#F2C14E', '#E2483A', '#4C7DDC'][i], 'base', 0, 0, (i - 1) * 0.15);
    // cadeira do professor (atrás da mesa)
    v.up(-0.35, 0, -0.75, 0.06, 0.48, 0.06, '#4A4A56'); v.up(-0.35, 0.46, -0.75, 0.5, 0.06, 0.48, '#3D3A3A'); v.up(-0.35, 0.52, -1.0, 0.5, 0.5, 0.06, '#3D3A3A');
    for (const a of [0, 1, 2, 3]) v.box(-0.35 + Math.cos(a * 1.57) * 0.22, 0.04, -0.75 + Math.sin(a * 1.57) * 0.22, 0.06, 0.04, 0.06, '#2A2A30');
    mesaProf.add(v.build()); }
  scene.add(mesaProf);

  // ── carteiras (mesa + cadeira de blocos, viradas para o quadro) ──
  const carteiras = [], CAD = '#4C7DDC', MET = '#4A4A56', TAMPO = '#D9B070';
  FILAS.forEach((z, fi) => COLS.forEach((x, ci) => {
    const g = new THREE.Group(), v = vox(), i = fi * COLS.length + ci;
    g.position.set(x, 0, z);
    v.up(0, 0.74, 0, 0.76, 0.04, 0.5, TAMPO); v.up(0, 0.735, 0, 0.77, 0.01, 0.51, shade(TAMPO, -0.22).getStyle());
    v.up(0, 0.615, -0.03, 0.66, 0.03, 0.38, '#8A8A94');                                                // porta-livros
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) v.up(sx * 0.34, 0, sz * 0.21, 0.04, 0.74, 0.04, MET);
    if (rnd(i * 3.1) > 0.3) { v.up(0.08 + (rnd(i) - 0.5) * 0.2, 0.78, 0.02, 0.3, 0.02, 0.22, SHIRTS[(i * 3) % SHIRTS.length]); v.box(-0.2, 0.795, 0.06, 0.16, 0.015, 0.015, '#F2C14E', 'base', 0, 0.5, 0); }
    v.up(0, 0.45, 0.5, 0.44, 0.04, 0.42, CAD);                                                          // assento
    v.up(0, 0.6, 0.71, 0.44, 0.3, 0.04, CAD); v.up(0, 0.72, 0.725, 0.3, 0.06, 0.02, shade(CAD, 0.3).getStyle());   // encosto
    for (const sx of [-1, 1]) { for (const sz of [0.32, 0.68]) v.up(sx * 0.19, 0, sz, 0.035, 0.45, 0.035, MET); v.up(sx * 0.19, 0.45, 0.7, 0.035, 0.3, 0.035, MET); }
    g.add(v.build()); g.userData.assento = new THREE.Vector3(x, 0, z + 0.53); scene.add(g); carteiras.push(g);
  }));

  // ── alunos sentados (figurantes; nas carteiras numa ordem fixa quando há menos de 12) ──
  const ordem = carteiras.map((_, i) => i).sort((a, b) => rnd(a * 5.3 + 1) - rnd(b * 5.3 + 1));
  const alunos = ordem.slice(0, Math.max(0, Math.min(nAlunos, carteiras.length))).sort((a, b) => a - b).map((ci, k) => {
    const p = figurante(201 + ci);
    for (const a of ['sunhat', 'camera', 'backpack']) if (p.acc[a]) p.acc[a].visible = false;      // dentro da sala, sentado
    p.group.position.copy(carteiras[ci].userData.assento); p.group.rotation.y = Math.PI;
    p.pose(poseAluno(ci)); p.group.userData.carteira = ci; scene.add(p.group); return p;
  });

  // ── luz: céu (hemisfério), sol pelas janelas (com sombra), claridade fria da janela, 4 luminárias com luz pontual ──
  const hemi = new THREE.HemisphereLight('#FFF4E2', '#9C7A58', noite ? 0.35 : 0.65); scene.add(hemi);
  const sol = new THREE.DirectionalLight('#FFE7C4', noite ? 0 : 6); sol.castShadow = !noite;
  sol.position.set(LX + 10, 7, -1.5); sol.target.position.set(0, 0, 0);
  sol.shadow.mapSize.set(SHADOW, SHADOW); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.03; sol.shadow.radius = 4;
  Object.assign(sol.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sol.shadow.camera.updateProjectionMatrix();
  scene.add(sol, sol.target);
  const claridade = new THREE.DirectionalLight('#CFE4FF', noite ? 0 : 0.3); claridade.position.set(10, 4, 0); scene.add(claridade);
  const lampMat = MAT.lamp.clone(); lampMat.emissiveIntensity = noite ? 4 : 2;
  const lum = vox(), pontos = [];
  for (const x of [-2.6, 2.6]) for (const z of [-2.0, 1.8]) {
    lum.box(x, ALT - 0.05, z, 0.38, 0.1, 1.7, '#E8E8EC'); lum.box(x, ALT - 0.105, z, 0.3, 0.02, 1.6, '#FFF6E0', 'lamp');
    const pl = new THREE.PointLight('#FFF1D6', noite ? 7 : 2.2, 9, 1.6); pl.position.set(x, ALT - 0.4, z); scene.add(pl); pontos.push(pl);
  }
  const luminarias = lum.build(false, false); trocarMat(luminarias, MAT.lamp, lampMat); scene.add(luminarias);

  setTexto(null);
  return {
    scene, quadro, mesaProf, carteiras, alunos, setTexto,
    janela: { grupo: janelaG, vidro: vidroMat, sol },
    luzes: { luminarias, material: lampMat, pontos, hemi, sol, claridade },
  };
}
