// Mundos deste vídeo ("Por que os videogames antigos eram quadradinhos?"): sala dos anos 70 com TV de tubo e console,
// placa do console (chip de RAM + 128 células de memória + celular) e o "construtor" de personagem em cubos.
// Tudo com as peças do kit (box/cyl/sph + toon/glow); nada importa fora de ../kit/.
import * as THREE from 'three';
import { toon, glow, luzes } from '../kit/motor/pixel.js';
import { V, box, cyl, sph, at, texturaCanvas, escrever } from '../kit/mundo/pecas.js';

// ---------- o herói (sprite original 10x10) ----------
export const CORES = { k: '#1A0F0A', o: '#FFB43A', w: '#FFF1C1', r: '#E5533D', c: '#4FD1E8' };
export const HEROI = [
  '....rr....',
  '....kk....',
  '..kkkkkk..',
  '.kooooook.',
  '.kowkwkok.',
  '.kooooook.',
  '.koorrook.',
  '..kkkkkk..',
  '..kw..wk..',
  '.kkk..kkk.',
];
export const PIXELS = [];
HEROI.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') PIXELS.push({ c, r, cor: CORES[ch] }); }));

function pintarSprite(g, x, y, s = 1) {
  for (const p of PIXELS) { g.fillStyle = p.cor; g.fillRect(x + p.c * s, y + p.r * s, s, s); }
}

// ---------- a tela do jogo (64x48, 4:3) ----------
/** textura da TV. pintar(t, { revelar 0..1 = até que linha a imagem já foi desenhada (feixe), semHeroi }) */
export function telaJogo() {
  const T = texturaCanvas(64, 48);
  let ultimo = '';
  const estrelas = [[5, 4], [17, 9], [29, 3], [44, 7], [58, 5], [52, 14], [9, 15]];
  function cena(g, t, semHeroi) {
    g.fillStyle = '#1B1F4A'; g.fillRect(0, 0, 64, 48);
    g.fillStyle = '#FFF1C1'; for (const [x, y] of estrelas) if (((x + Math.floor(t * 3)) % 5) !== 0) g.fillRect(x, y, 1, 1);
    g.fillStyle = '#B5533C'; g.fillRect(0, 40, 64, 8);
    g.fillStyle = '#5E2A1E'; for (let x = 0; x < 64; x += 8) g.fillRect(x, 40, 1, 8); g.fillRect(0, 40, 64, 1); g.fillRect(0, 44, 64, 1);
    g.fillStyle = '#E0A040'; g.fillRect(36, 26, 18, 4); g.fillStyle = '#8A5A2A'; for (let x = 36; x < 54; x += 6) g.fillRect(x, 26, 1, 4);
    const cy = 19 + Math.round(Math.sin(t * 4) * 1.5); g.fillStyle = '#FFD84A'; g.fillRect(44, cy, 3, 3); g.fillStyle = '#FFF1C1'; g.fillRect(44, cy, 1, 1);
    if (!semHeroi) {
      const fase = (t * 0.55) % 1, x = Math.round(4 + fase * 44), pulo = Math.abs(Math.sin(t * 3.1)) * 11;
      pintarSprite(g, x, Math.round(30 - pulo));
    }
  }
  T.pintar2 = function (t, { revelar = 1, semHeroi = false } = {}) {
    const f = Math.floor(t * 12), lin = Math.round(revelar * 48), chave = `${f}|${lin}|${semHeroi}`;
    if (chave === ultimo) return; ultimo = chave;
    T.pintar((g) => {
      cena(g, f / 12, semHeroi);
      if (lin < 48) { g.fillStyle = '#05060C'; g.fillRect(0, lin, 64, 48 - lin); }
    });
  };
  T.pintar2(0);
  return T;
}

// ---------- herói em cubos (3D) ----------
/** herói de cubos: cel = tamanho da célula, fr = fração do cubo (menor que 1 abre fresta entre os cubos) */
export function heroi3D(cel = 0.2, fr = 1) {
  const group = new THREE.Group(), mats = {}, cinza = toon('#8C8273');
  const cubos = PIXELS.map((p) => {
    const m = mats[p.cor] || (mats[p.cor] = toon(p.cor));
    const o = box(cel * fr, cel * fr, cel * fr, m);
    const alvo = V((p.c - 4.5) * cel, (9 - p.r) * cel + cel / 2, 0);
    o.position.copy(alvo); group.add(o);
    return { o, alvo, cor: m, p };
  });
  return {
    group, cubos,
    colorir(sim) { for (const c of cubos) c.o.material = sim ? c.cor : cinza; },
  };
}

// ---------- sala dos anos 70 ----------
export function sala() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2A1A12');
  const L = luzes(scene, { pos: [-5, 8, 7], solI: 1.9, hemiI: 1.25, ceu: '#FFE2C0', chao: '#5A3A28', caixa: 8, alvo: [0, 1.5, -1] });
  // parede com papel listrado, rodapé e chão de taco
  const papel = texturaCanvas(32, 16, (g, w, h) => { g.fillStyle = '#D9A066'; g.fillRect(0, 0, w, h); g.fillStyle = '#C48450'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 3, h); });
  papel.tex.wrapS = papel.tex.wrapT = THREE.RepeatWrapping; papel.tex.repeat.set(6, 2);
  scene.add(at(new THREE.Mesh(new THREE.PlaneGeometry(30, 12), toon('#FFFFFF', { map: papel.tex })), 0, 6, -3.2));
  scene.add(at(box(30, 0.4, 0.15, toon('#6B4028')), 0, 0.2, -3.1));
  const taco = texturaCanvas(32, 32, (g, w, h) => { g.fillStyle = '#7A4B2E'; g.fillRect(0, 0, w, h); g.fillStyle = '#653C24'; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1); for (let y = 0; y < h; y += 4) g.fillRect(((y * 5) % 32), y, 1, 4); });
  taco.tex.wrapS = taco.tex.wrapT = THREE.RepeatWrapping; taco.tex.repeat.set(5, 4);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(30, 24), toon('#FFFFFF', { map: taco.tex })); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; scene.add(chao);
  // tapete
  const tap = texturaCanvas(32, 16, (g, w, h) => { g.fillStyle = '#B5533C'; g.fillRect(0, 0, w, h); g.fillStyle = '#E0A040'; g.fillRect(0, 2, w, 1); g.fillRect(0, h - 3, w, 1); g.fillStyle = '#7E2F22'; for (let x = 2; x < w; x += 6) g.fillRect(x, 6, 2, 4); });
  scene.add(at(box(8, 0.05, 4.6, toon('#FFFFFF', { map: tap.tex })), 0.3, 0.03, 1.2));
  // janela à noite
  scene.add(at(box(3.2, 2.6, 0.1, toon('#6B4028')), -6.2, 5.2, -3.1));
  scene.add(at(box(2.8, 2.2, 0.05, glow('#24305E')), -6.2, 5.2, -3.03));
  scene.add(at(sph(0.28, glow('#FFF1C1'), 10), -5.5, 5.8, -2.99));
  scene.add(at(box(0.1, 2.2, 0.08, toon('#6B4028')), -6.2, 5.2, -2.98), at(box(2.8, 0.1, 0.08, toon('#6B4028')), -6.2, 5.2, -2.98));
  // rack baixo
  const madeira = toon('#8A5A3C'), madeiraE = toon('#5E3B27');
  scene.add(at(box(5.4, 1.4, 2.2, madeira), 0, 0.7, -1.9));
  scene.add(at(box(2.5, 0.9, 0.05, madeiraE), -1.3, 0.7, -0.78), at(box(2.5, 0.9, 0.05, madeiraE), 1.3, 0.7, -0.78));
  // TV de tubo
  const tv = new THREE.Group(); at(tv, 0, 1.4, -1.9); scene.add(tv);
  tv.add(at(box(3.8, 2.9, 2.4, toon('#6E4A30')), 0, 1.45, 0));
  tv.add(at(box(2.95, 2.3, 0.08, toon('#1E1A18')), -0.4, 1.5, 1.21));
  const tela = telaJogo();
  const telaM = new THREE.MeshBasicMaterial({ map: tela.tex });
  const vidro = at(new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.95), telaM), -0.4, 1.5, 1.26); tv.add(vidro);
  tv.add(at(box(0.7, 2.3, 0.05, toon('#3A2A20')), 1.4, 1.5, 1.21));
  for (const y of [2.15, 1.55]) { const b = cyl(0.17, 0.17, 0.14, toon('#C9C2B6'), 12); b.rotation.x = Math.PI / 2; tv.add(at(b, 1.4, y, 1.3)); }
  tv.add(at(box(0.4, 0.06, 0.04, toon('#FFB43A')), 1.4, 0.8, 1.26));
  for (const s of [-1, 1]) { const a = cyl(0.03, 0.03, 1.9, toon('#C9C2B6'), 6); a.rotation.z = s * 0.5; tv.add(at(a, s * 0.45, 3.7, 0)); }
  tv.add(at(sph(0.22, toon('#3A2A20'), 10), 0, 2.95, 0));
  // brilho da tela no ambiente
  const luzTela = new THREE.PointLight('#7C8CFF', 2.2, 7, 2); luzTela.position.set(-0.4, 2.9, 0.4); scene.add(luzTela);
  // console no chão + cartucho + controle com fio
  const cons = new THREE.Group(); at(cons, 1.7, 0, 0.9); scene.add(cons);
  cons.add(at(box(1.8, 0.38, 1.1, toon('#2A2420')), 0, 0.19, 0));
  cons.add(at(box(1.82, 0.14, 0.04, toon('#8A5A3C')), 0, 0.19, 0.56));
  cons.add(at(box(0.6, 0.04, 0.3, toon('#141010')), 0, 0.4, -0.15));
  const cart = at(box(0.56, 0.55, 0.16, toon('#3A3A3A')), 0, 0.62, -0.15); cons.add(cart);
  cart.add(at(box(0.44, 0.3, 0.02, toon('#FFB43A')), 0, 0.06, 0.09));
  for (const x of [-0.6, -0.35]) cons.add(at(box(0.14, 0.06, 0.14, toon('#C9C2B6')), x, 0.41, 0.25));
  const joy = new THREE.Group(); at(joy, 0.1, 0, 1.6); joy.rotation.y = 0.4; scene.add(joy);
  joy.add(at(box(0.55, 0.2, 0.55, toon('#1E1A18')), 0, 0.1, 0));
  joy.add(at(cyl(0.05, 0.05, 0.5, toon('#1E1A18'), 8), 0.05, 0.45, 0.05));
  joy.add(at(sph(0.09, toon('#1E1A18'), 8), 0.05, 0.72, 0.05));
  joy.add(at(cyl(0.08, 0.08, 0.06, toon('#E5533D'), 10), -0.17, 0.22, -0.17));
  const fio = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0.3, 0.05, 1.45), V(0.8, 0.03, 1.3), V(1.1, 0.03, 0.9), V(1.2, 0.1, 0.6)]), new THREE.LineBasicMaterial({ color: '#141010' }));
  scene.add(fio);
  // abajur e planta
  const ab = new THREE.Group(); at(ab, 4.4, 0, -1.8); scene.add(ab);
  ab.add(at(cyl(0.4, 0.5, 0.15, toon('#3A2A20')), 0, 0.08, 0), at(cyl(0.05, 0.05, 3.6, toon('#3A2A20'), 8), 0, 1.9, 0));
  ab.add(at(cyl(0.45, 0.85, 0.9, toon('#F2C27A', { emissive: '#FFB43A', emissiveIntensity: 0.45 })), 0, 3.9, 0));
  const luzAb = new THREE.PointLight('#FFC27A', 2.5, 8, 2); luzAb.position.set(4.4, 3.4, -1.4); scene.add(luzAb);
  const pl = new THREE.Group(); at(pl, -4.2, 0, -1.9); scene.add(pl);
  pl.add(at(cyl(0.55, 0.4, 0.9, toon('#B5533C')), 0, 0.45, 0));
  for (let i = 0; i < 6; i++) { const f = at(box(0.14, 1.7, 0.45, toon('#4E9A4A')), Math.cos(i * 1.1) * 0.2, 1.6, Math.sin(i * 1.1) * 0.2); f.rotation.z = (i - 2.5) * 0.28; pl.add(f); }
  // herói 3D (sai da TV no fim), feixe do tubo
  const h3 = heroi3D(0.2); h3.group.visible = false; scene.add(h3.group);
  const feixe = at(box(2.6, 0.035, 0.01, glow('#FFF6D8', 0.95)), -0.4, 1.5, 1.28); feixe.userData.noEdge = true; tv.add(feixe);
  const ponto = at(box(0.12, 0.08, 0.01, glow('#FFFFFF')), 0, 0, 0.005); feixe.add(ponto);
  return {
    scene, L, tv, vidro, tela, cons, cart, joy, h3, feixe, ponto,
    reset(t) { tela.pintar2(t); h3.group.visible = false; feixe.visible = false; },
  };
}

// ---------- placa do console ----------
export function placa() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#120C0A');
  luzes(scene, { pos: [-4, 9, 6], solI: 2.0, hemiI: 1.3, ceu: '#FFE6C8', chao: '#2A1A12', caixa: 8, alvo: [1, 0, 0] });
  scene.add(at(box(14, 0.3, 9, toon('#2F6B3A')), 0, -0.15, 0));
  const ouro = toon('#D9A441');
  const trilhas = [[-5, 2.2, 10, 'x'], [-5, -1.6, 9, 'x'], [-1, -3.5, 7, 'z'], [3.6, -3.5, 7.5, 'z'], [-5.5, 3.4, 4, 'x'], [0.5, 1.6, 4.5, 'x'], [-3, 3, 4, 'z'], [5.2, -2, 5, 'z']];
  for (const [x, z, len, eixo] of trilhas) scene.add(eixo === 'x' ? at(box(len, 0.03, 0.08, ouro), x + len / 2, 0.01, z) : at(box(0.08, 0.03, len, ouro), x, 0.01, z + len / 2));
  for (let i = 0; i < 9; i++) scene.add(at(box(0.08, 0.03, 0.9, ouro), -4.6 + i * 0.3, 0.01, -2.8));
  const preto = toon('#1E1E22'), pino = toon('#B9B4AA');
  const chip = (w, d, x, z, rot = 0) => {
    const g = new THREE.Group(); at(g, x, 0, z); g.rotation.y = rot; scene.add(g);
    g.add(at(box(w, 0.32, d, preto), 0, 0.16, 0));
    const n = Math.round(w / 0.25);
    for (let i = 0; i < n; i++) for (const s of [-1, 1]) g.add(at(box(0.08, 0.1, 0.22, pino), -w / 2 + 0.15 + i * ((w - 0.3) / Math.max(1, n - 1)), 0.08, s * (d / 2 + 0.08)));
    return g;
  };
  chip(3.0, 1.2, -2.6, 0.4);
  chip(1.6, 0.9, -3.4, -2.6);
  const ram = chip(1.8, 1.0, 2.0, 0.6);
  const rotulo = texturaCanvas(36, 20, (g) => { g.fillStyle = '#1E1E22'; g.fillRect(0, 0, 36, 20); escrever(g, 'RAM', 18, 4, 2, '#FFB43A'); });
  const rot = at(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.88), toon('#FFFFFF', { map: rotulo.tex })), 0, 0.33, 0); rot.rotation.x = -Math.PI / 2; ram.add(rot);
  for (const [x, z, c] of [[4.6, 2.6, '#3E7C8C'], [5.2, 2.6, '#3E7C8C'], [-0.4, 3.2, '#C9C2B6'], [0.2, 3.2, '#C9C2B6'], [4.8, -2.4, '#E5533D']]) scene.add(at(cyl(0.22, 0.22, 0.6, toon(c), 12), x, 0.3, z));
  for (let i = 0; i < 4; i++) { const r = at(cyl(0.09, 0.09, 0.6, toon('#D8B48A'), 8), 1.2 + i * 0.4, 0.12, 2.6); r.rotation.z = Math.PI / 2; scene.add(r); }
  // conector do cartucho (borda)
  scene.add(at(box(5, 0.5, 0.6, toon('#1E1A18')), 0.5, 0.25, -4.1));
  // 128 células de memória (16 x 8) num painel em cima da RAM
  const mem = new THREE.Group(); at(mem, 2.0, 2.0, 0.6); scene.add(mem);
  mem.add(at(box(3.7, 2.0, 0.06, toon('#140C08')), 0, 0, -0.06));
  const vazio = toon('#4A3628'), cheio = glow('#FFB43A'), alarme = glow('#FF4646');
  const cels = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 16; c++) { const o = at(box(0.17, 0.17, 0.06, vazio), -1.6 + c * 0.213, 0.75 - r * 0.213, 0); mem.add(o); cels.push(o); }
  // celular (tela: SMS ou ícones)
  const cel = new THREE.Group(); scene.add(cel);
  cel.add(at(box(1.6, 3.2, 0.22, toon('#24242C')), 0, 0, 0));
  const telaCel = texturaCanvas(40, 80);
  const telaCelM = new THREE.MeshBasicMaterial({ map: telaCel.tex });
  cel.add(at(new THREE.Mesh(new THREE.PlaneGeometry(1.44, 2.88), telaCelM), 0, 0, 0.115));
  let modoCel = '';
  const pintarCel = (modo) => {
    if (modo === modoCel) return; modoCel = modo;
    telaCel.pintar((g) => {
      g.fillStyle = '#10141C'; g.fillRect(0, 0, 40, 80);
      if (modo === 'sms') {
        g.fillStyle = '#2A3140'; g.fillRect(0, 0, 40, 9); escrever(g, 'SMS', 20, 1, 1, '#FFF1C1');
        g.fillStyle = '#FFB43A'; g.fillRect(4, 16, 32, 26); g.fillRect(6, 42, 4, 3);
        escrever(g, 'OI!', 20, 19, 1, '#1A0F0A'); escrever(g, 'BORA', 20, 27, 1, '#1A0F0A'); escrever(g, 'JOGAR', 20, 35, 1, '#1A0F0A');
        g.fillStyle = '#3A4458'; g.fillRect(4, 66, 32, 8);
      } else {
        const cores = ['#E5533D', '#FFB43A', '#4E9A4A', '#4FD1E8', '#8E6CFF', '#FFF1C1', '#E07AB0', '#3E7C8C'];
        for (let i = 0; i < 16; i++) { g.fillStyle = cores[i % 8]; g.fillRect(5 + (i % 4) * 8, 10 + Math.floor(i / 4) * 10, 6, 6); }
        g.fillStyle = '#2A3140'; g.fillRect(4, 66, 32, 8);
      }
    });
  };
  pintarCel('sms');
  return {
    scene, ram, mem, cels, cel,
    /** n células acesas (0..128); alarmeK > 0,5 deixa todas vermelhas */
    memoria(n, alarmeK = 0) { cels.forEach((o, i) => { o.material = alarmeK > 0.5 ? alarme : i < n ? cheio : vazio; }); },
    reset() { pintarCel('sms'); cel.visible = false; cel.scale.setScalar(1); cel.rotation.set(0, 0, 0); mem.visible = true; this.memoria(0); },
    pintarCel,
  };
}

// ---------- construtor: o herói montado cubo a cubo ----------
export function construtor() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#1A110C');
  luzes(scene, { pos: [-4, 8, 8], solI: 2.1, hemiI: 1.35, ceu: '#FFE6C8', chao: '#3A2418', caixa: 7, alvo: [0, 2.5, 0] });
  const grade = texturaCanvas(32, 32, (g) => { g.fillStyle = '#24170F'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#4A2E1E'; for (let i = 0; i < 32; i += 8) { g.fillRect(i, 0, 1, 32); g.fillRect(0, i, 32, 1); } });
  grade.tex.wrapS = grade.tex.wrapT = THREE.RepeatWrapping; grade.tex.repeat.set(6, 6);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), toon('#FFFFFF', { map: grade.tex })); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; scene.add(chao);
  const parede = at(new THREE.Mesh(new THREE.PlaneGeometry(24, 14), toon('#FFFFFF', { map: grade.tex })), 0, 7, -5); scene.add(parede);
  const h = heroi3D(0.5, 0.9); h.group.position.set(0, 0.05, 0); scene.add(h.group);
  // origem de cada cubo: espalhados em volta (determinístico)
  h.cubos.forEach((c, i) => {
    const a = i * 2.399, r = 5 + (i % 5);
    c.de = V(c.alvo.x + Math.cos(a) * r, c.alvo.y + 4 + (i % 7) * 0.8, c.alvo.z + Math.sin(a) * r * 0.6 + 2);
    c.giro = (i % 3) + 1;
  });
  return { scene, h };
}
