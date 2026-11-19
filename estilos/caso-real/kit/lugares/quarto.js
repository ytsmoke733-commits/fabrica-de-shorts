// Quarto pequeno e escuro, de madrugada: mesa com o computador encostada na parede do fundo (z −1,8), cadeira de
// escritório, cama no canto oposto com a janela de persiana em cima da cabeceira (parede x +1,8, luz fria e fraca da rua)
// e a porta (parede x −1,8) com a fresta de luz do corredor.
// A luz principal é a tela do monitor (verde; vermelha no alerta). O abajur do criado-mudo é opcional e fraco.
//   const Q = quarto() → { scene, monitor, cadeira, pontos: { mesa, porta, janela }, atualizar(t, { tela, abajur }) }
//   pontos.mesa: onde vai a pessoa sentada (mesma posição e rotação da cadeira: de frente para a tela, olhando −z)
//   pontos.porta: em pé na frente da porta (parede x −1,8) · pontos.janela: centro da janela (parede x +1,8)
//   Q.atualizar(t, { tela: opcoesDaTela, abajur: 0..1 })   tela = opções do desenharTela; abajur 0 = apagado
// Também exporta os móveis que o escritório reaproveita: mesa(), cadeira(), teclado().
//   mesa({ w, d }): origem no chão, no centro; tampo a ALTURA_MESA; a frente (lado de quem senta) é +z
//   cadeira(): a pessoa sentada vai na MESMA posição e rotação da cadeira (assento a ALTURA_ASSENTO, encosto em −z)
import * as THREE from 'three';
import { rbox, mesh } from '../motor/sdf.js';
import { monitor as criarMonitor } from '../monitor.js';
import { rnd } from '../motor/lib.js';

export const ALTURA_MESA = 0.74, ALTURA_ASSENTO = 0.43;
const PAREDE = '#2B3343', PISO = '#151A24';
const std = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const sombra = (o) => { o.castShadow = o.receiveShadow = true; return o; };
const caixa = (w, h, d, m, x, y, z, pai) => { const o = sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); o.position.set(x, y, z); pai.add(o); return o; };
const geos = new Map();
const sdf = (chave, f, limites, passo, m) => { if (!geos.has(chave)) geos.set(chave, mesh(f, limites, passo)); return sombra(new THREE.Mesh(geos.get(chave), m)); };
function texturaCanvas(w, h, desenho) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; desenho(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ─────────── móveis (o escritório usa os mesmos) ───────────
/** mesa de tampo fino com duas laterais e painel de fundo (as pernas de quem senta cabem embaixo) */
export function mesa({ w = 1.3, d = 0.72, cor = '#2A2420' } = {}) {
  const g = new THREE.Group(), m = std(cor, 0.55), lado = std('#1A1715', 0.7);
  caixa(w, 0.035, d, m, 0, ALTURA_MESA - 0.0175, 0, g);
  for (const s of [-1, 1]) caixa(0.03, ALTURA_MESA - 0.035, d - 0.04, lado, s * (w / 2 - 0.04), (ALTURA_MESA - 0.035) / 2, 0, g);
  caixa(w - 0.1, 0.32, 0.02, lado, 0, ALTURA_MESA - 0.2, -d / 2 + 0.05, g);
  return g;
}
/** teclado com as teclas desenhadas (o topo recebe a luz da tela) */
let texTeclas = null;
export function teclado() {
  texTeclas ??= texturaCanvas(512, 160, (g, w, h) => {
    g.fillStyle = '#121419'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) {
      const x = 10 + c * 33 + (r % 2) * 8, y = 10 + r * 29, larg = r === 4 && c > 3 && c < 10 ? 0 : 28;
      if (larg) { g.fillStyle = '#2C303A'; g.fillRect(x, y, larg, 24); }
    }
    g.fillStyle = '#2C303A'; g.fillRect(150, 126, 200, 24);
  });
  const g = new THREE.Group(), corpo = std('#121419', 0.5);
  const topo = new THREE.MeshStandardMaterial({ map: texTeclas, roughness: 0.6 });
  const k = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.022, 0.14), [corpo, corpo, topo, corpo, corpo, corpo])); k.position.y = 0.011; g.add(k);
  return g;
}
/** cadeira de escritório: assento, encosto, coluna e base em estrela */
export function cadeira({ cor = '#1B1E26' } = {}) {
  const g = new THREE.Group(), m = std(cor, 0.75), metal = std('#30343D', 0.4, { metalness: 0.6 });
  const assento = sdf('assento', (p) => rbox(p, [0, 0, 0], [0.235, 0.04, 0.225], 0.04), [[-0.29, -0.06, -0.28], [0.29, 0.06, 0.28]], 0.012, m);
  assento.position.set(0, ALTURA_ASSENTO - 0.045, 0.1); g.add(assento);
  // encosto baixo (até ~0,9 m): de costas, os ombros e a cabeça de quem senta ficam à vista
  const encosto = sdf('encosto', (p) => rbox(p, [0, 0, 0], [0.2, 0.15, 0.035], 0.035), [[-0.25, -0.2, -0.08], [0.25, 0.2, 0.08]], 0.012, m);
  encosto.position.set(0, ALTURA_ASSENTO + 0.3, -0.21); encosto.rotation.x = -0.1; g.add(encosto);
  caixa(0.04, 0.22, 0.03, metal, 0, ALTURA_ASSENTO + 0.06, -0.18, g);
  const coluna = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, ALTURA_ASSENTO - 0.12, 16), metal)); coluna.position.set(0, (ALTURA_ASSENTO - 0.12) / 2 + 0.07, 0.1); g.add(coluna);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5 + 0.3, pe = caixa(0.3, 0.03, 0.04, metal, 0, 0.07, 0.1, g); pe.rotation.y = a; pe.position.x = Math.cos(a) * 0.15; pe.position.z = 0.1 - Math.sin(a) * 0.15;
    const roda = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), metal)); roda.position.set(Math.cos(a) * 0.29, 0.03, 0.1 - Math.sin(a) * 0.29); g.add(roda);
  }
  return g;
}

// ─────────── o quarto ───────────
export function quarto() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#050608'); scene.fog = new THREE.Fog('#050608', 4, 9);
  const parede = std(PAREDE, 0.9), piso = std(PISO, 0.6), teto = std('#1A1F2A', 0.95);
  const A = 1.8, ALTO = 2.6;
  caixa(2 * A, 0.1, 2 * A, piso, 0, -0.05, 0, scene);
  caixa(2 * A, 0.1, 2 * A, teto, 0, ALTO + 0.05, 0, scene);
  caixa(2 * A, ALTO, 0.1, parede, 0, ALTO / 2, -A - 0.05, scene);                                   // fundo (mesa)
  caixa(2 * A, ALTO, 0.1, parede, 0, ALTO / 2, A + 0.05, scene);                                    // frente (atrás de quem senta)
  // parede da porta (x −1,8): vão de 0,9 m entre z 0,15 e 1,05
  caixa(0.1, ALTO, 1.95, parede, -A - 0.05, ALTO / 2, -A + 0.975, scene);
  caixa(0.1, ALTO, 0.75, parede, -A - 0.05, ALTO / 2, A - 0.375, scene);
  caixa(0.1, ALTO - 2.05, 0.9, parede, -A - 0.05, 2.05 + (ALTO - 2.05) / 2, 0.6, scene);
  // parede da janela (x +1,8, a da cabeceira da cama): vão de 0,9 m (em z) × 1,1 m centrado em z 0,45, y 1,35–2,45,
  // em cima do criado-mudo: de frente para a pessoa sentada, a janela fica ao lado da cabeça e a luz fria recorta o ombro
  const J = { z: 0.45, y0: 1.35, y1: 2.45, w: 0.9 }, za = J.z - J.w / 2, zb = J.z + J.w / 2;
  caixa(0.1, ALTO, za + A, parede, A + 0.05, ALTO / 2, (za - A) / 2, scene);
  caixa(0.1, ALTO, A - zb, parede, A + 0.05, ALTO / 2, (zb + A) / 2, scene);
  caixa(0.1, J.y0, J.w, parede, A + 0.05, J.y0 / 2, J.z, scene);
  caixa(0.1, ALTO - J.y1, J.w, parede, A + 0.05, J.y1 + (ALTO - J.y1) / 2, J.z, scene);
  // rodapé escuro
  const rod = std('#0E1016', 0.6);
  caixa(2 * A, 0.08, 0.02, rod, 0, 0.04, -A + 0.01, scene); caixa(2 * A, 0.08, 0.02, rod, 0, 0.04, A - 0.01, scene);

  // janela: noite azul-escura com a rua lá fora, persiana de lâminas e a luz fria fraca entrando
  const rua = texturaCanvas(256, 256, (g, w, h) => {
    const ceu = g.createLinearGradient(0, 0, 0, h); ceu.addColorStop(0, '#16223C'); ceu.addColorStop(1, '#3A5080'); g.fillStyle = ceu; g.fillRect(0, 0, w, h);
    const poste = g.createRadialGradient(w * 0.3, h * 0.35, 0, w * 0.3, h * 0.35, w * 0.45); poste.addColorStop(0, 'rgba(190,210,250,0.85)'); poste.addColorStop(1, 'rgba(150,175,230,0)');
    g.fillStyle = poste; g.fillRect(0, 0, w, h);
    g.fillStyle = '#070A12'; for (let i = 0; i < 6; i++) { const x = i * 46 - 10, alt = 60 + rnd(i + 3) * 70; g.fillRect(x, h - alt, 40, alt); }
  });
  const vidro = new THREE.Mesh(new THREE.PlaneGeometry(J.w, J.y1 - J.y0), new THREE.MeshBasicMaterial({ map: rua, fog: false }));
  vidro.position.set(A + 0.08, (J.y0 + J.y1) / 2, J.z); vidro.rotation.y = -Math.PI / 2; scene.add(vidro);
  const moldura = std('#1C2029', 0.6);
  caixa(0.12, 0.05, J.w + 0.08, moldura, A, J.y0, J.z, scene); caixa(0.12, 0.05, J.w + 0.08, moldura, A, J.y1, J.z, scene);
  for (const s of [-1, 1]) caixa(0.12, J.y1 - J.y0, 0.05, moldura, A, (J.y0 + J.y1) / 2, J.z + s * J.w / 2, scene);
  const lamina = std('#3A4256', 0.7);
  for (let i = 0; i < 20; i++) { const l = caixa(0.05, 0.008, J.w - 0.04, lamina, A - 0.04, J.y0 + 0.06 + i * 0.053, J.z, scene); l.rotation.z = -0.9; l.castShadow = false; }
  const fria = new THREE.SpotLight('#8FA8E0', 3, 7, 0.6, 0.9, 1.6); fria.position.set(A + 0.6, 2.3, J.z); fria.target.position.set(0, 0.9, -0.6); scene.add(fria, fria.target);

  // porta (fechada) com a fresta de luz do corredor embaixo
  const porta = caixa(0.04, 2.0, 0.86, std('#2A2522', 0.6), -A + 0.02, 1.0, 0.6, scene);
  caixa(0.06, 2.06, 0.06, moldura, -A + 0.03, 1.03, 0.15, scene); caixa(0.06, 2.06, 0.06, moldura, -A + 0.03, 1.03, 1.05, scene); caixa(0.06, 0.06, 0.96, moldura, -A + 0.03, 2.05, 0.6, scene);
  const mac = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), std('#9A8A6A', 0.3, { metalness: 0.8 }))); mac.position.set(-A + 0.07, 1.0, 0.95); scene.add(mac);
  const fresta = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.012), new THREE.MeshBasicMaterial({ color: new THREE.Color('#F1D9A6').multiplyScalar(0.7) }));
  fresta.position.set(-A + 0.045, 0.008, 0.6); fresta.rotation.y = Math.PI / 2; scene.add(fresta);

  // cama no canto (cabeceira na parede da janela), criado-mudo e abajur
  const cama = new THREE.Group(); cama.position.set(0.85, 0, 1.3); scene.add(cama);
  caixa(1.95, 0.3, 0.95, std('#1C1F28', 0.8), 0, 0.15, 0, cama);
  const colchao = sdf('colchao', (p) => rbox(p, [0, 0, 0], [0.95, 0.09, 0.45], 0.06), [[-1.0, -0.12, -0.5], [1.0, 0.12, 0.5]], 0.02, std('#3A4152', 0.9));
  colchao.position.y = 0.39; cama.add(colchao);
  const coberta = sdf('coberta', (p) => rbox(p, [0, 0, 0], [0.62, 0.05, 0.48], 0.05), [[-0.7, -0.1, -0.55], [0.7, 0.1, 0.55]], 0.02, std('#28344F', 0.95));
  coberta.position.set(-0.3, 0.47, 0); coberta.rotation.z = 0.02; cama.add(coberta);
  const trav = sdf('travesseiro', (p) => rbox(p, [0, 0, 0], [0.16, 0.05, 0.3], 0.05), [[-0.22, -0.1, -0.36], [0.22, 0.1, 0.36]], 0.015, std('#4A5164', 0.9));
  trav.position.set(0.72, 0.52, 0); cama.add(trav);
  caixa(0.06, 0.8, 1.0, std('#1A1D25', 0.7), 0.99, 0.4, 0, cama);
  caixa(0.42, 0.52, 0.4, std('#221E1B', 0.6), 1.5, 0.26, 0.35, scene);
  const abajur = new THREE.Group(); abajur.position.set(1.5, 0.52, 0.35); scene.add(abajur);
  caixa(0.03, 0.2, 0.03, std('#30343D', 0.5), 0, 0.1, 0, abajur);
  const cupula = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.15, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#3A3128', emissive: '#F1C88A', emissiveIntensity: 0, side: THREE.DoubleSide, roughness: 0.9 }));
  cupula.position.y = 0.25; abajur.add(cupula);
  const luzAbajur = new THREE.PointLight('#F1C88A', 0, 3.2, 2); luzAbajur.position.set(1.5, 0.72, 0.35); scene.add(luzAbajur);

  // a mesa do computador na parede do fundo, com teclado, mouse, caneca e papéis
  const mz = -A + 0.37;
  const m = mesa({ w: 1.3, d: 0.72 }); m.position.set(0, 0, mz); scene.add(m);
  const mon = criarMonitor({ w: 0.62, h: 0.38, seed: 3 }); mon.group.position.set(0, ALTURA_MESA, mz - 0.17); scene.add(mon.group);
  const pontos = { mesa: new THREE.Vector3(0, 0, mz + 0.76), porta: new THREE.Vector3(-A + 0.6, 0, 0.6), janela: new THREE.Vector3(A, (J.y0 + J.y1) / 2, J.z) };
  const kb = teclado(); kb.position.set(-0.01, ALTURA_MESA, pontos.mesa.z - 0.5); scene.add(kb);
  const rato = sdf('mouse', (p) => rbox(p, [0, 0, 0], [0.028, 0.012, 0.05], 0.012), [[-0.04, -0.02, -0.06], [0.04, 0.02, 0.06]], 0.004, std('#121419', 0.4));
  rato.position.set(0.36, ALTURA_MESA + 0.012, pontos.mesa.z - 0.5); scene.add(rato);
  const caneca = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.037, 0.1, 20), std('#5A5F6B', 0.5))); caneca.position.set(-0.3, ALTURA_MESA + 0.05, mz - 0.12); scene.add(caneca);
  const folhas = std('#8E897C', 0.95);
  for (let i = 0; i < 3; i++) { const f = caixa(0.21, 0.004, 0.297, folhas, 0.47 + i * 0.01, ALTURA_MESA + 0.003 + i * 0.004, mz - 0.05, scene); f.rotation.y = 0.15 - i * 0.12; }
  const cad = cadeira(); cad.position.copy(pontos.mesa); cad.rotation.y = Math.PI; scene.add(cad);
  // quadro escuro e prateleira na parede da mesa, para a luz da tela ter onde bater
  caixa(0.5, 0.36, 0.02, std('#181B22', 0.8), -0.95, 1.65, -A + 0.01, scene);
  caixa(0.7, 0.025, 0.2, std('#221E1B', 0.6), 0.95, 1.55, -A + 0.1, scene);
  for (let i = 0; i < 5; i++) caixa(0.04, 0.2 + rnd(i) * 0.06, 0.15, std(['#2E3445', '#3A2E2A', '#26303A'][i % 3], 0.8), 0.72 + i * 0.05, 1.67 + rnd(i) * 0.03, -A + 0.1, scene);

  scene.add(new THREE.HemisphereLight('#2A3A60', '#05070C', 0.5));
  return {
    scene, monitor: mon, cadeira: cad, pontos,
    /** tela = opções do desenharTela no instante t; abajur 0..1 (0 = apagado, o padrão 1 é uma luz fraca e quente) */
    atualizar(t, { tela = {}, abajur = 1 } = {}) {
      mon.atualizar(t, tela);
      luzAbajur.intensity = 1.2 * abajur; cupula.material.emissiveIntensity = 1.4 * abajur;
    },
  };
}
