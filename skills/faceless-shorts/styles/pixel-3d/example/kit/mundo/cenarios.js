// Cenários do mundo pixel. Cada um devolve a sua { scene, ... } para E.render(scene, cam).
import * as THREE from 'three';
import { toon, glow, luzes } from '../motor/pixel.js';
import { V, box, cyl, sph, at, lerpN, texturaCanvas, escrever } from './pecas.js';
import { microondas, lasanha, molecula, ima, geladeira, celular, chuveiro, corResistencia, roteador, lampada } from './props.js';
import { fluxo, gradiente } from './efeitos.js';
import { fracoesDoCaminho, pontosSerpentina, posicaoNoFluxo } from './caminhos.mjs';
import { vagaDoIon, progressoDoIon, pontoDoIon } from './ions.mjs';
import { dentroDoTrecho, vibracaoDoAtomo } from './chuveiro.mjs';
import { GHZ_MICROONDAS, ondaDaPlanta } from './wifi.mjs';
import { parDoEncontro, heroiDaFase, corDoFoton, FASE_ENCONTRO } from './led.mjs';

// ---------------- cozinha ----------------
/**
 * cozinha em ~10 cm por unidade (micro-ondas de 5 de largura no centro, tampo da bancada em y = 0, parede em z = -2,6).
 * cozinha({ geladeira: true }): bancada e armários encurtados à esquerda (começam em x = -7,4), geladeira(escala 10)
 * em pé no chão à esquerda (centro x = -11,1, piso em y = -9, porta em z = +4,6), parede descendo até o chão e piso.
 * -> { scene, mw, L, gel (ou null), piso (ou null) }
 */
export function cozinha({ geladeira: comGeladeira = false } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#E7C9A2');
  const L = luzes(scene, { pos: [-6, 9, 7], solI: 2.2, hemiI: 1.4, caixa: comGeladeira ? 15 : 9, alvo: [comGeladeira ? -3 : 0, comGeladeira ? -1 : 1, 0] });
  const parede = at(box(40, 16, 0.4, toon('#E9D4B4')), 0, 6, -2.6); scene.add(parede);
  const x0 = comGeladeira ? -7.4 : -13, x1 = 13, xm = (x0 + x1) / 2, lb = x1 - x0;   // trecho da bancada
  // azulejos (textura pixel)
  const az = texturaCanvas(64, 16, (c, w, h) => { c.fillStyle = '#DCE8E4'; c.fillRect(0, 0, w, h); c.fillStyle = '#B9CCC6'; for (let x = 0; x < w; x += 8) c.fillRect(x, 0, 1, h); for (let y = 0; y < h; y += 8) c.fillRect(0, y, w, 1); });
  az.tex.wrapS = az.tex.wrapT = THREE.RepeatWrapping; az.tex.repeat.set(3 * lb / 26, 1);
  scene.add(at(new THREE.Mesh(new THREE.PlaneGeometry(lb, 4.2), new THREE.MeshToonMaterial({ map: az.tex })), xm, 2.1, -2.38));
  // bancada (com geladeira, o gabinete desce até o chão)
  const hg = comGeladeira ? 8.8 : 5;
  scene.add(at(box(lb, 0.35, 5.2, toon('#CFC2AE')), xm, -0.18, 0));
  scene.add(at(box(lb - 0.4, hg, 4.8, toon('#8A5A3C')), xm, -0.2 - hg / 2, -0.1));
  for (let i = -3; i <= 3; i++) {
    if (i * 3.6 < x0 + 0.5) continue;
    scene.add(at(box(0.08, hg - 0.4, 0.05, toon('#5E3B27')), i * 3.6, -0.2 - hg / 2, 2.33), at(box(0.7, 0.12, 0.12, toon('#C9C2B6')), i * 3.6 + 0.9, -1, 2.38));
  }
  // armário de cima
  scene.add(at(box(lb, 3.6, 2.6, toon('#9A6646')), xm, 7.2, -1.3));
  for (let i = -3; i <= 3; i++) if (i * 3.6 >= x0 + 0.5) scene.add(at(box(0.08, 3.2, 0.05, toon('#5E3B27')), i * 3.6, 7.2, 0.0));
  // objetos da bancada
  const chaleira = new THREE.Group(); at(chaleira, -5.6, 0, 0.2); scene.add(chaleira);
  chaleira.add(at(cyl(0.7, 0.9, 1.2, toon('#D8553E')), 0, 0.6, 0), at(cyl(0.3, 0.5, 0.25, toon('#D8553E')), 0, 1.3, 0), at(sph(0.14, toon('#2B2B2B')), 0, 1.5, 0));
  const bico = at(cyl(0.08, 0.16, 0.8, toon('#D8553E')), 0.85, 0.85, 0); bico.rotation.z = -0.9; chaleira.add(bico);
  const fruteira = new THREE.Group(); at(fruteira, 5.4, 0, 0.5); scene.add(fruteira);
  fruteira.add(at(cyl(1.0, 0.6, 0.45, toon('#E9E3D6')), 0, 0.22, 0));
  [['#E5533D', -0.35, 0.1], ['#F2B233', 0.3, -0.2], ['#7DB343', 0.05, 0.35], ['#E5533D', 0.4, 0.3]].forEach(([c, x, z]) => fruteira.add(at(sph(0.32, toon(c), 10), x, 0.62, z)));
  const vaso = new THREE.Group(); at(vaso, 9, 0, -0.6); scene.add(vaso);
  vaso.add(at(cyl(0.45, 0.35, 0.8, toon('#3E7C8C')), 0, 0.4, 0));
  for (let i = 0; i < 5; i++) { const f = at(box(0.12, 1.4, 0.4, toon('#4E9A4A')), Math.cos(i * 1.3) * 0.2, 1.3, Math.sin(i * 1.3) * 0.2); f.rotation.z = (i - 2) * 0.25; vaso.add(f); }
  const mw = microondas(); scene.add(mw.group);
  let gel = null, piso = null;
  if (comGeladeira) {
    // parede até o chão e piso de lajotas (o chão fica em y = -9: bancada de 90 cm)
    scene.add(at(box(40, 9, 0.4, toon('#E9D4B4')), 0, -6.5, -2.6));
    const laj = texturaCanvas(16, 16, (c, w, h) => { c.fillStyle = '#C98F68'; c.fillRect(0, 0, w, h); c.fillStyle = '#B57C57'; c.fillRect(8, 0, 8, 8); c.fillRect(0, 8, 8, 8); c.fillStyle = '#8E5E42'; c.fillRect(0, 0, w, 1); c.fillRect(0, 0, 1, h); });
    laj.tex.wrapS = laj.tex.wrapT = THREE.RepeatWrapping; laj.tex.repeat.set(10, 4);
    piso = at(box(40, 0.4, 16, toon('#FFFFFF', { map: laj.tex })), 0, -9.2, 5.4); piso.castShadow = false; scene.add(piso);
    gel = geladeira({ escala: 10 }); at(gel.group, -11.1, -9, 1.0); scene.add(gel.group);
  }
  return { scene, mw, L, gel, piso };
}

// ---------------- vazio "planta técnica" (campo elétrico / onda) ----------------
/**
 * planta({ aparelho = 'microondas' }): fundo azul-noite, grade polar ciano, aparelho em arestas (holograma) e a onda
 * (senoide laranja, 2 pixels) correndo na frente dele, em z = 2,3, de x = -6 a 6.
 *   aparelho 'microondas': caixa 5 x 3 x 3,8 + cavidade e a seta do campo elétrico virando com o sinal da onda; onda
 *     em y = 1,5 (no meio da caixa).
 *   aparelho 'roteador': caixa baixa 3,2 x 0,55 x 2 com 3 antenas (até y ~2,7) e 4 LEDs; a seta fica escondida e a
 *     onda passa por cima, em y = 3,8.
 * -> { scene, seta, holo, onda, onda2, pontos: { onda, onda2, aparelho }, atualizar }
 *   atualizar(t, freq = 4, amp = 0.9)                   forma antiga (só número): senoide sin(1,6x - 2π·freq·t)
 *   atualizar(t, { ghz = 2.45, amp = 0.9, vel = 1, ghz2 = null })   a frequência de verdade: em 2,45 GHz é a mesma
 *     senoide (freq = vel); 5 GHz tem a onda mais curta (λ x 2,45/5) e a crista anda na mesma velocidade (wifi.mjs:
 *     ondaDaPlanta). ghz2 = segunda onda (ciano-claro) para comparar, as duas com 60% da amplitude: a 1ª em y = 2,5 e
 *     a 2ª em 0,5 (micro-ondas) ou 4,6 e 3,4 (roteador). pontos.onda / onda2 = pontos das linhas em x = -1,2.
 */
export function planta({ aparelho = 'microondas' } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0D1520');
  scene.add(new THREE.HemisphereLight('#BFE3FF', '#0D1520', 1.6));
  const sol = new THREE.DirectionalLight('#FFFFFF', 1.6); sol.position.set(3, 6, 4); scene.add(sol);
  const linha = new THREE.LineBasicMaterial({ color: '#2E6E8E' });
  for (let r = 1; r <= 9; r++) {
    const pts = []; for (let a = 0; a <= 64; a++) pts.push(V(Math.cos((a / 64) * Math.PI * 2) * r * 1.4, 0, Math.sin((a / 64) * Math.PI * 2) * r * 1.4));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), linha));
  }
  for (let a = 0; a < 16; a++) { const an = (a / 16) * Math.PI * 2; scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(Math.cos(an) * 13, 0, Math.sin(an) * 13)]), linha)); }
  const arestas = (geo, cor) => new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: cor }));
  const holo = new THREE.Group(); scene.add(holo);
  // seta do campo elétrico (micro-ondas)
  const seta = new THREE.Group(); at(seta, -0.65, 1.5, 0.05); scene.add(seta);
  const sm = toon('#FFB43A', { emissive: '#FF8A1E', emissiveIntensity: 0.5 });
  seta.add(at(cyl(0.12, 0.12, 1.6, sm), 0, -0.2, 0), at(cyl(0, 0.34, 0.6, sm), 0, 0.85, 0));
  if (aparelho === 'roteador') {
    // roteador em holograma: caixa baixa, 3 antenas (as dos lados abertas) e os LEDs na frente
    holo.add(at(arestas(new THREE.BoxGeometry(3.2, 0.55, 2), '#4FB6FF'), 0, 0.35, 0));
    [[-1.25, 0.2], [0, 0], [1.25, -0.2]].forEach(([x, giro]) => {
      const a = at(arestas(new THREE.BoxGeometry(0.16, 2.1, 0.16), '#4FB6FF'), x - Math.sin(giro) * 1.05, 0.62 + Math.cos(giro) * 1.05, -0.75);
      a.rotation.z = giro; holo.add(a);
    });
    for (let i = 0; i < 4; i++) holo.add(at(box(0.16, 0.08, 0.04, glow('#8BE36A')), -0.9 + i * 0.5, 0.35, 1.02));
    seta.visible = false;
  } else {
    // micro-ondas em holograma (arestas)
    holo.add(at(arestas(new THREE.BoxGeometry(5, 3, 3.8), '#4FB6FF'), 0, 1.5, 0), at(arestas(new THREE.BoxGeometry(3.3, 2.5, 3.3), '#2A7FC2'), -0.65, 1.5, 0.05));
  }
  // onda senoidal que corre na frente do aparelho (e a 2ª, para comparar frequências). Cada onda são 2 linhas
  // coladas (0,03 acima): a linha de 1 pixel some no quantizador e no vídeo comprimido.
  const N = 180;
  const novaOnda = (cor) => {
    const pos = new Float32Array(N * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const l = new THREE.Group(), m = new THREE.LineBasicMaterial({ color: cor });
    l.add(new THREE.Line(geo, m), at(new THREE.Line(geo, m), 0, 0.03, 0)); scene.add(l); return { l, pos, geo };
  };
  const o1 = novaOnda('#FFB43A'), o2 = novaOnda('#9BEFFF'); o2.l.visible = false;
  const tracar = (o, y0, f) => {
    for (let i = 0; i < N; i++) { const x = -6 + (i / (N - 1)) * 12; o.pos[i * 3] = x; o.pos[i * 3 + 1] = y0 + f(x); o.pos[i * 3 + 2] = 2.3; }
    o.geo.attributes.position.needsUpdate = true; o.geo.computeBoundingSphere();
  };
  // altura das ondas: na frente do micro-ondas (meio da caixa); acima do roteador (as antenas vão até ~2,7)
  const R = aparelho === 'roteador', yUma = R ? 3.8 : 1.5, yDuas = R ? [4.6, 3.4] : [2.5, 0.5];
  const pontos = { onda: V(-1.2, yUma, 2.3), onda2: V(-1.2, yDuas[1], 2.3), aparelho: V(0, R ? 0.35 : 1.5, 0) };
  return {
    scene, seta, holo, onda: o1.l, onda2: o2.l, pontos,
    atualizar(t, freq = 4, amp = 0.9) {
      let s;
      if (freq !== null && typeof freq === 'object') {
        const { ghz = GHZ_MICROONDAS, amp: a = 0.9, vel = 1, ghz2 = null } = freq;
        const dois = Number.isFinite(ghz2), aa = dois ? a * 0.6 : a;
        tracar(o1, dois ? yDuas[0] : yUma, (x) => ondaDaPlanta(x, t, { ghz, amp: aa, vel }));
        o2.l.visible = dois;
        if (dois) tracar(o2, yDuas[1], (x) => ondaDaPlanta(x, t, { ghz: ghz2, amp: aa, vel }));
        pontos.onda.y = dois ? yDuas[0] : yUma;
        s = Math.sin(t * vel * (ghz / GHZ_MICROONDAS) * Math.PI * 2);
      } else {
        tracar(o1, yUma, (x) => Math.sin(x * 1.6 - t * freq * Math.PI * 2) * amp);
        o2.l.visible = false; pontos.onda.y = yUma;
        s = Math.sin(t * freq * Math.PI * 2);
      }
      seta.rotation.z = s >= 0 ? 0 : Math.PI;
      seta.scale.setScalar(0.8 + 0.2 * Math.abs(s));
    },
  };
}

// ---------------- ciclo do frio (planta técnica da geladeira) ----------------
/** seta 3D apontando para +y (haste + ponta), material dado; base em y = 0, comprimento ~0,85 */
function seta3d(mat) {
  const g = new THREE.Group();
  g.add(at(cyl(0.08, 0.08, 0.5, mat, 8), 0, 0.25, 0), at(cyl(0, 0.22, 0.35, mat, 10), 0, 0.67, 0));
  return g;
}

/**
 * "planta técnica" do circuito da geladeira, num plano de frente para a câmera (x para a direita, y para cima, z = 0):
 *   condensador em cima (serpentina com aletas vermelhas; setas de calor saem para cima, para a cozinha),
 *   válvula de expansão à esquerda (estreitamento), caixa embaixo (o lado de dentro da geladeira, em arestas ciano)
 *   com o evaporador no alto e a comida no fundo (setas de calor sobem da comida e entram nele) e o compressor à
 *   direita, fora da caixa (pulsa: aperta o gás).
 * O gás (fluxo com cano) sai do compressor laranja, vai a âmbar no condensador, vira azul na válvula, clareia no
 * evaporador e volta ao compressor. Ocupa x de -3,1 a 4,1 e y de -3,6 a ~6,5 (com as setas):
 * câmera em (0.4, -0.2, 23.8) olhando para (0.4, -0.2, 0) põe tudo acima da faixa da legenda.
 * -> { scene, pontos: { compressor, condensador, valvula, evaporador, caixa, calorSai, calorEntra, centro },
 *      gas, corGas, compressor, valvula, caixa, atualizar(t, { k = 1, quente = 1, frio = 1 }) }
 *   k: gás correndo e compressor pulsando (0 = só o cano, sem bolinhas); quente: setas e brilho do condensador;
 *   frio: setas da comida para o evaporador, brilho azul do evaporador e fundo da caixa esfriando.
 */
export function cicloFrio() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0D1520');
  scene.add(new THREE.HemisphereLight('#BFE3FF', '#0D1520', 1.6));
  const sol = new THREE.DirectionalLight('#FFFFFF', 1.7); sol.position.set(3, 6, 8); scene.add(sol);
  // grade da planta, atrás de tudo
  const gpts = [];
  for (let x = -7; x <= 8; x++) gpts.push(V(x, -9, -1.6), V(x, 10, -1.6));
  for (let y = -9; y <= 10; y++) gpts.push(V(-7, y, -1.6), V(8, y, -1.6));
  scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gpts), new THREE.LineBasicMaterial({ color: '#173247' })));
  // ----- caixa (o lado de dentro da geladeira) -----
  const cx0 = -2.35, cx1 = 2.2, cy0 = -3.6, cy1 = 0.65, cz = 0.8;
  const caixa = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(cx1 - cx0, cy1 - cy0, 2 * cz)), new THREE.LineBasicMaterial({ color: '#4FB6FF' }));
  at(caixa, (cx0 + cx1) / 2, (cy0 + cy1) / 2, 0); scene.add(caixa);
  const fundoM = glow('#13293C'), fundoBase = new THREE.Color('#13293C'), fundoFrio = new THREE.Color('#1D4470');
  scene.add(at(new THREE.Mesh(new THREE.PlaneGeometry(cx1 - cx0, cy1 - cy0), fundoM), (cx0 + cx1) / 2, (cy0 + cy1) / 2, -cz));
  // comida no fundo da caixa (é dela que sai o calor)
  const comida = new THREE.Group(); scene.add(comida);
  const verde = toon('#3F7A3A');
  comida.add(at(cyl(0.26, 0.26, 0.9, verde, 12), -1.35, cy0 + 0.45, 0.1), at(cyl(0.09, 0.22, 0.36, verde, 10), -1.35, cy0 + 1.08, 0.1));
  comida.add(at(sph(0.4, toon('#E5533D'), 14), -0.1, cy0 + 0.4, 0.2), at(box(0.06, 0.2, 0.06, toon('#5E3B27')), -0.08, cy0 + 0.88, 0.2));
  comida.add(at(cyl(0.58, 0.58, 0.45, toon('#F1DC9A'), 16), 1.3, cy0 + 0.225, 0), at(cyl(0.6, 0.6, 0.12, toon('#B8432E'), 16), 1.3, cy0 + 0.5, 0));
  // ----- caminho do gás -----
  const xd = 3.3, xe = -2.8, yComp = -2.5, yValv = 1.75;   // colunas: compressor (direita) e válvula (esquerda)
  const cond = pontosSerpentina(2.2, -2.0, 4.5, 3.3, 3, 0);
  const evap = pontosSerpentina(-2.0, 1.8, 0.05, -1.05, 3, 0);
  const sobe = [[xd, yComp + 0.8, 0], [xd, yComp + 1.3, 0], [xd, 4.1, 0], [2.9, 4.5, 0]];
  const desce = [[-2.55, 3.3, 0], [xe, 2.95, 0], [xe, yValv + 0.62, 0], [xe, yValv - 0.62, 0], [xe, 0.45, 0], [-2.55, 0.05, 0]];
  const volta = [[2.35, -1.05, 0], [2.6, -1.35, 0], [2.6, yComp - 0.05, 0], [2.75, yComp - 0.2, 0], [xd, yComp - 0.2, 0]];
  const caminho = [...sobe, ...cond, ...desce, ...evap, ...volta];
  const u = fracoesDoCaminho(caminho, true);
  const iC0 = sobe.length, iC1 = iC0 + cond.length - 1, iV0 = iC1 + 3, iV1 = iC1 + 4, iE0 = iC1 + desce.length + 1, iE1 = iE0 + evap.length - 1, iIn = caminho.length - 2;
  const uV = (u[iV0] + u[iV1]) / 2;                         // garganta da válvula: a cor vira ali, seca (sem passar por roxo)
  const corGas = gradiente([[0, '#FF6A1E'], [u[iC0], '#FF6A1E'], [u[iC1], '#FFB43A'], [uV - 0.002, '#FFD08A'], [uV + 0.002, '#4F8BFF'], [u[iE0], '#4F8BFF'],
    [u[iE1], '#7FB2FF'], [u[iIn], '#9CC4FF'], [u[iIn] + 0.004, '#FF6A1E'], [1, '#FF6A1E']]);
  const gas = fluxo(caminho, 100, { raio: 0.13, vel: 0.034, tubo: { cor: '#9FC4DA', raio: 0.22, opacidade: 0.26 } });
  gas.cano.material.side = THREE.BackSide;                    // só a metade de trás do cano: as bolinhas não ficam tingidas
  scene.add(gas.group);
  // ----- condensador: aletas vermelhas atrás da serpentina -----
  const aletaQ = toon('#B8432E', { emissive: '#FF6A2A', emissiveIntensity: 0 });
  const condG = new THREE.Group(); scene.add(condG);
  for (let x = -2.0; x <= 2.21; x += 0.3) condG.add(at(box(0.07, 1.7, 0.55, aletaQ), x, 3.9, -0.45));
  condG.add(at(box(4.7, 0.1, 0.6, toon('#7A2E22')), 0.1, 4.8, -0.4), at(box(4.7, 0.1, 0.6, toon('#7A2E22')), 0.1, 3.0, -0.4));
  // ----- evaporador: aletas azuis atrás da serpentina (no alto da caixa) -----
  const aletaF = toon('#2F5E9E', { emissive: '#4F8BFF', emissiveIntensity: 0 });
  const evapG = new THREE.Group(); scene.add(evapG);
  for (let x = -1.8; x <= 1.81; x += 0.3) evapG.add(at(box(0.07, 1.55, 0.55, aletaF), x, -0.5, -0.45));
  // ----- válvula de expansão: estreitamento (dois cones) com anéis e um parafuso de ajuste -----
  const valM = toon('#9AA2AA'), valE = toon('#5A626B');
  const valvula = new THREE.Group(); at(valvula, xe, yValv, 0); scene.add(valvula);
  valvula.add(at(cyl(0.36, 0.08, 0.5, valM, 14), 0, 0.3, 0), at(cyl(0.08, 0.36, 0.5, valM, 14), 0, -0.3, 0));
  valvula.add(at(cyl(0.38, 0.38, 0.1, valE, 14), 0, 0.58, 0), at(cyl(0.38, 0.38, 0.1, valE, 14), 0, -0.58, 0), at(box(0.26, 0.16, 0.26, toon('#FFB43A')), 0.36, 0, 0));
  // ----- compressor: cuba escura com domo, base e motor; pulsa (aperta) -----
  const compM = toon('#3A4048'), compE = toon('#272B30');
  const compressor = new THREE.Group(); at(compressor, xd, yComp, 0); scene.add(compressor);
  const corpoC = new THREE.Group(); compressor.add(corpoC);
  corpoC.add(at(cyl(0.62, 0.62, 1.0, compM, 18), 0, 0, 0));
  const domo = at(sph(0.62, compM, 18), 0, 0.5, 0); domo.scale.y = 0.55; corpoC.add(domo);
  const faixa = at(cyl(0.64, 0.64, 0.14, toon('#FF8A3A', { emissive: '#FF5A2E', emissiveIntensity: 0.2 }), 18), 0, 0.15, 0); corpoC.add(faixa);
  compressor.add(at(box(1.5, 0.12, 1.1, compE), 0, -0.56, 0), at(box(0.32, 0.36, 0.3, compE), 0.62, -0.15, 0.25));
  // ----- setas de calor -----
  const calorM = glow('#FF8A3A');
  const sai = [], entra = [];
  for (let i = 0; i < 7; i++) { const s = seta3d(calorM); scene.add(s); sai.push(s); }
  const origens = [[-1.35, cy0 + 1.35], [-0.1, cy0 + 1.15], [1.3, cy0 + 0.7], [-0.75, cy0 + 0.6], [0.6, cy0 + 0.6]];
  for (let i = 0; i < origens.length; i++) { const s = seta3d(calorM); scene.add(s); entra.push(s); }
  const pontos = {
    compressor: V(xd, yComp + 0.15, 0.64), condensador: V(0.1, 3.9, 0), valvula: V(xe, yValv, 0.36), evaporador: V(-0.1, -0.5, 0),
    caixa: V(-0.05, cy0 + 0.6, 0.4), calorSai: V(0.1, 5.4, 0.3), calorEntra: V(0, -1.9, 0.4), centro: V(0.4, -0.2, 0),
  };
  return {
    scene, pontos, gas, corGas, compressor, valvula, caixa,
    atualizar(t, { k = 1, quente = 1, frio = 1 } = {}) {
      gas.atualizar(t, { k, cores: corGas });                  // k encolhe as bolinhas; o cano fica sempre
      gas.group.visible = true; gas.cano.material.opacity = gas.cano.userData.opacidade;
      if (k <= 0.01) gas.bolinhas.forEach((b) => { b.visible = false; });
      const pulso = k * Math.max(0, Math.sin(t * Math.PI * 2 * 1.6));
      corpoC.scale.set(1 + 0.05 * pulso, 1 - 0.09 * pulso, 1 + 0.05 * pulso);
      faixa.material.emissiveIntensity = 0.2 + 0.8 * pulso;
      aletaQ.emissiveIntensity = 0.45 * quente; aletaF.emissiveIntensity = 0.35 * frio;
      fundoM.color.copy(fundoBase).lerp(fundoFrio, frio);
      // calor saindo do condensador: sobe e some
      sai.forEach((s, i) => {
        const ph = (t * 0.55 + i * 0.37) % 1, e = Math.sin(Math.PI * ph) * quente;
        s.visible = e > 0.03;
        s.position.set(-1.8 + i * 0.63 + Math.sin(t * 2 + i) * 0.12, 4.95 + ph * 1.0, 0.3);
        s.scale.setScalar(Math.max(e, 1e-3));
      });
      // calor saindo da comida e entrando no evaporador (encolhe ao chegar)
      entra.forEach((s, i) => {
        const [x0, y0] = origens[i], ph = (t * 0.5 + i * 0.29) % 1, e = Math.sin(Math.PI * Math.min(1, ph * 1.15)) * frio;
        s.visible = e > 0.03;
        s.position.set(x0 + Math.sin(t * 2.3 + i) * 0.1, lerpN(y0, -1.95, ph), 0.4);
        s.scale.setScalar(Math.max(e, 1e-3) * 0.75);
      });
    },
  };
}

export function microMundo() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2B1712');
  scene.add(new THREE.HemisphereLight('#FFE2C4', '#3A1A12', 1.5));
  const sol = new THREE.DirectionalLight('#FFF0DC', 2.0); sol.position.set(3, 5, 6); scene.add(sol);
  const fundoM = [toon('#5A2A1E'), toon('#6E3622'), toon('#4A2218')];
  const bolhas = [];
  for (let i = 0; i < 16; i++) { const b = at(sph(1.2 + (i % 4) * 0.6, fundoM[i % 3], 12), Math.sin(i * 2.1) * 9, Math.cos(i * 1.7) * 12, -8 - (i % 5) * 2); scene.add(b); bolhas.push(b); }
  const mols = [];
  for (let i = 0; i < 34; i++) {
    const m = molecula(0.9); scene.add(m.group);
    const r = (k) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
    m.base = V((r(1) - 0.5) * 9, (r(2) - 0.5) * 15, (r(3) - 0.5) * 6 - 1.5);
    m.rot = [r(4) * 6.28, r(5) * 6.28, r(6) * 6.28]; m.fase = r(7) * 6.28; m.lag = 0.05 + r(8) * 0.12;
    if (Math.abs(m.base.x) < 3 && Math.abs(m.base.y) < 3.4 && m.base.z > -3) m.base.z -= 4.5;   // deixa o centro para a molécula herói
    mols.push(m);
  }
  const heroi = molecula(0.95); scene.add(heroi.group);
  const imaG = ima(); scene.add(imaG);
  // partículas de calor
  const calorM = glow('#FFB43A', 0.9), calorG = new THREE.BoxGeometry(0.14, 0.14, 0.14), faiscas = [];
  for (let i = 0; i < 40; i++) { const f = new THREE.Mesh(calorG, calorM); f.visible = false; scene.add(f); faiscas.push(f); }
  return {
    scene, mols, heroi, ima: imaG, faiscas, bolhas,
    /** alinhar 0..1 = quanto as moléculas seguem o campo; campo = ângulo do campo; agito = tremor; calor 0..1 */
    atualizar(t, { alinhar = 0, campo = 0, agito = 0, calor = 0 } = {}) {
      scene.background.set('#2B1712').lerp(new THREE.Color('#5A2410'), calor * 0.8);
      for (const m of mols) {
        const s = t * 0.35 + m.fase;
        m.group.position.set(m.base.x + Math.sin(s) * 0.25 + Math.sin(t * 31 + m.fase * 9) * 0.12 * agito, m.base.y + Math.cos(s * 0.8) * 0.3 + Math.cos(t * 27 + m.fase * 5) * 0.12 * agito, m.base.z);
        const livre = [m.rot[0] + t * 0.4, m.rot[1] + t * 0.3, m.rot[2] + t * 0.25];
        const alvo = campo + Math.sin(t * 23 + m.fase) * 0.35 * agito;
        m.group.rotation.set(livre[0] * (1 - alinhar), livre[1] * (1 - alinhar), livre[2] * (1 - alinhar) + alvo * alinhar);
        m.calor(calor);
      }
      heroi.calor(calor);
      faiscas.forEach((f, i) => {
        const v = calor > 0.05; f.visible = v; if (!v) return;
        const ph = (t * 0.6 + i * 0.137) % 1;
        f.position.set(Math.sin(i * 3.7) * 6, -7 + ph * 15, Math.cos(i * 2.3) * 2 - 1);
        f.scale.setScalar((1 - ph) * 1.4 * calor);
      });
    },
  };
}

// ---------------- porta (tela de metal) ----------------
/** close de chapa perfurada (porta do micro-ondas) com lasanha iluminada atrás, frentes de onda que batem e voltam e raios de luz que passam */
export function telaPerfurada() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#1A1410');
  scene.add(new THREE.HemisphereLight('#FFE6C8', '#20160F', 1.4));
  const sol = new THREE.DirectionalLight('#FFF2DD', 1.8); sol.position.set(-3, 4, 6); scene.add(sol);
  // chapa perfurada: textura com furos (alphaTest)
  const furos = texturaCanvas(256, 256, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#000'; for (let y = 1; y < h; y += 4) for (let x = (y - 1) / 4 % 2 ? 1 : 3; x < w; x += 4) c.fillRect(x, y, 2, 2); });
  furos.tex.colorSpace = THREE.NoColorSpace;
  const chapaM = new THREE.MeshToonMaterial({ color: '#4A525A', alphaMap: furos.tex, alphaTest: 0.5, side: THREE.DoubleSide });
  const chapa = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), chapaM); scene.add(chapa);
  // moldura
  const mm = toon('#2C3136');
  scene.add(at(box(9, 0.6, 0.4, mm), 0, 4.2, 0), at(box(9, 0.6, 0.4, mm), 0, -4.2, 0), at(box(0.6, 9, 0.4, mm), -4.2, 0, 0), at(box(0.6, 9, 0.4, mm), 4.2, 0, 0));
  // interior: lasanha iluminada atrás da tela
  const dentro = new THREE.Group(); at(dentro, 0, -2.5, -5); scene.add(dentro);
  dentro.add(at(box(14, 0.3, 8, toon('#E9D9AE')), 0, -0.15, 0));
  const las = lasanha(); at(las.group, 0, 0.2, 0); dentro.add(las.group);
  dentro.add(at(cyl(2.6, 2.2, 0.2, toon('#F4F1EA'), 24), 0, 0.1, 0));
  const luzDentro = new THREE.PointLight('#FFC66B', 30, 14, 1.4); at(luzDentro, 0, 4, -4); scene.add(luzDentro);
  // frentes de onda (faixas laranja) entre a lasanha e a tela
  const ondaM = glow('#FF9A2E', 0.75), ondas = [];
  for (let i = 0; i < 4; i++) { const o = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.12, 6, 48, Math.PI * 0.9), ondaM); o.rotation.z = Math.PI * 0.05; scene.add(o); ondas.push(o); }
  // raios de luz que atravessam os furos
  const raioM = glow('#FFE7A0', 0.85), raios = [];
  for (let i = 0; i < 26; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.8), raioM); r.visible = false; scene.add(r); raios.push(r); }
  return {
    scene, chapa, ondas, raios,
    /** ondas: fase das ondas (batem na tela e voltam); luz 0..1 */
    atualizar(t, { ondasK = 1, luz = 0 } = {}) {
      ondas.forEach((o, i) => {
        const ph = (t * 0.55 + i / ondas.length) % 1;
        // vai de z=-4 até a tela (z=-0.3) e volta: nunca passa
        const z = ph < 0.5 ? lerpN(-4.5, -0.35, ph * 2) : lerpN(-0.35, -4.5, (ph - 0.5) * 2);
        o.position.set(0, -0.3, z); o.scale.setScalar(0.8 + ph * 0.5);
        o.material.opacity = 0.75 * ondasK; o.visible = ondasK > 0.02;
      });
      raios.forEach((r, i) => {
        const v = luz > 0.02; r.visible = v; if (!v) return;
        const ph = (t * 0.9 + i * 0.173) % 1, x = ((i * 37) % 13) / 13 * 6 - 3, y = ((i * 53) % 11) / 11 * 6 - 3;
        r.position.set(x, y, -1 + ph * 9); r.scale.z = luz;
      });
    },
  };
}

/** estúdio escuro com prato: fundo liso e luz de cima, para mostrar um objeto de perto (ex.: corteLasanha) */
export function estudio({ fundo = '#22150F', prato = true } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(fundo);
  scene.add(new THREE.HemisphereLight('#FFE6C8', fundo, 1.5));
  const sol = new THREE.DirectionalLight('#FFF0DC', 2.2); sol.position.set(3, 6, 5); scene.add(sol);
  if (prato) { const p = cyl(3.4, 2.9, 0.25, toon('#F4F1EA'), 28); p.position.y = -0.13; scene.add(p); }
  return { scene };
}

// ================= casa: sala, banheiro e quarto =================
// Escala em metros (1 unidade = 1 m; pé-direito de 2,6 a 2,7). Cada cômodo é uma caixa aberta na frente (+z):
// piso em y = 0, parede do fundo em z = -prof/2, laterais em x = ±larg/2 e forro em cima. A câmera fica dentro,
// perto da boca aberta, olhando para o fundo: as bordas da caixa ficam fora do quadro (ver STYLE.md §5.7).

/** textura pequena que repete (rx x ry vezes na face) */
function texRep(w, h, pintar, rx, ry) {
  const t = texturaCanvas(w, h, pintar); t.tex.wrapS = t.tex.wrapT = THREE.RepeatWrapping; t.tex.repeat.set(rx, ry); return t.tex;
}
/** semente determinística 0..1 */
const sem = (i, k = 0) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
/** plano que recebe sombra */
const plano = (w, h, m) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.receiveShadow = true; return p; };
/** piso de tábuas (taco / laminado): 8 fileiras com emendas desencontradas */
const pisoTabuas = (rx, ry, base = '#B07A4F') => texRep(32, 32, (c, w, h) => {
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) {
    for (let k = 0; k < 2; k++) {
      const x0 = ((r * 11) % 16) + k * 16, v = sem(r, k);
      c.fillStyle = v < 0.33 ? '#A06D45' : v < 0.66 ? '#BD8859' : base; c.fillRect(x0 % w, r * 4, 16, 3);
      if (x0 + 16 > w) c.fillRect(0, r * 4, x0 + 16 - w, 3);
      c.fillStyle = '#7E5235'; c.fillRect(x0 % w, r * 4, 1, 4);
    }
    c.fillStyle = '#80553A'; c.fillRect(0, r * 4 + 3, w, 1);
  }
}, rx, ry);
/** caixa do cômodo: piso, 3 paredes, forro e rodapé. Paredes e forro não projetam sombra (o sol entra pela boca aberta). */
function comodo(scene, { larg, prof, alt = 2.7, piso, parede, forro = '#F3EADB', rodape = '#F3EADB', esp = 0.15 }) {
  const mx = larg / 2, mz = prof / 2;
  const chao = at(box(larg + 2 * esp, 0.12, prof, piso), 0, -0.06, 0); chao.castShadow = false; scene.add(chao);
  const pm = typeof parede === 'string' ? toon(parede) : parede;
  const fundo = at(box(larg + 2 * esp, alt, esp, pm), 0, alt / 2, -mz - esp / 2);
  const esq = at(box(esp, alt, prof, pm), -mx - esp / 2, alt / 2, 0);
  const dir = at(box(esp, alt, prof, pm), mx + esp / 2, alt / 2, 0);
  const teto = at(box(larg + 2 * esp, esp, prof, toon(forro, { emissive: '#7A6450', emissiveIntensity: 0.8 })), 0, alt + esp / 2, 0);   // forro só pega luz do chão: um pouco de emissão o mantém claro
  for (const o of [fundo, esq, dir, teto]) { o.castShadow = false; scene.add(o); }
  const rm = toon(rodape);
  scene.add(at(box(larg, 0.09, 0.025, rm), 0, 0.045, -mz + 0.012), at(box(0.025, 0.09, prof, rm), -mx + 0.012, 0.045, 0), at(box(0.025, 0.09, prof, rm), mx - 0.012, 0.045, 0));
  return { chao, fundo, esq, dir, forro: teto, mx, mz, alt };
}
/** luz de casa: sol quente entrando pela boca aberta (sombra dura) + céu e chão quentes */
function luzCasa(scene, { alvo = [0, 1, -0.5], pos = [-2.5, 6.5, 6], caixa = 4.5, solI = 2.0, hemiI = 1.5 } = {}) {
  const L = luzes(scene, { pos, solI, hemiI, caixa, alvo, ceu: '#FFF1DC', chao: '#B88A63' });
  L.sol.shadow.normalBias = 0.02;                                         // sem listras de sombra nas paredes rasantes
  return L;
}
/** janela com luz de dia (glow), caixilho branco com cruz e cortinas nos lados. Plano no xy, frente em +z. */
function janela(w, h, { cortina = '#C9774F', luz = '#FFE9B8' } = {}) {
  const g = new THREE.Group(), cx = toon('#F4EFE6'), vidro = glow(luz);
  g.add(plano(w, h, vidro)); g.userData.vidro = vidro;                                // a sala escurece a luz de fora (anoitecer)
  g.add(at(box(w + 0.12, 0.07, 0.08, cx), 0, h / 2, 0.02), at(box(w + 0.12, 0.07, 0.08, cx), 0, -h / 2, 0.02),
    at(box(0.07, h, 0.08, cx), -w / 2, 0, 0.02), at(box(0.07, h, 0.08, cx), w / 2, 0, 0.02),
    at(box(0.04, h, 0.05, cx), 0, 0, 0.02), at(box(w, 0.04, 0.05, cx), 0, h * 0.1, 0.02));
  g.add(at(box(w + 0.3, 0.05, 0.16, cx), 0, -h / 2 - 0.04, 0.06));                     // peitoril
  const cm = toon(cortina);
  for (const s of [-1, 1]) {
    const c = new THREE.Group(); at(c, s * (w / 2 + 0.1), 0.06, 0.12); g.add(c);
    for (let i = 0; i < 4; i++) c.add(at(box(0.11, h + 0.45, 0.06, cm), (i - 1.5) * 0.085, 0, (i % 2) * 0.04));
  }
  const varao = at(cyl(0.015, 0.015, w + 0.7, toon('#3A2A20'), 6), 0, h / 2 + 0.25, 0.12); varao.rotation.z = Math.PI / 2; g.add(varao);
  return g;
}
/** vaso com planta (folhas em caixas inclinadas) */
function plantaVaso(alt = 1.0, { vaso = '#C8734A', folha = '#4E8A45' } = {}) {
  const g = new THREE.Group();
  g.add(at(cyl(0.2, 0.15, 0.36, toon(vaso), 12), 0, 0.18, 0));
  const fm = [toon(folha), toon('#5E9C4E'), toon('#3F7639')];
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, r = 0.08 + (i % 3) * 0.05, f = at(box(0.2, 0.05, alt * (0.4 + (i % 3) * 0.12), fm[i % 3]), Math.cos(a) * r, 0.36 + alt * 0.28 + (i % 3) * 0.08, Math.sin(a) * r);
    f.rotation.order = 'YXZ'; f.rotation.set(-0.5 - (i % 2) * 0.3, a, 0); g.add(f);
  }
  return g;
}
/** quadro na parede (moldura + gravura de blocos) */
function quadro(w, h, cores = ['#E2843A', '#E9C46A', '#7E8E66', '#C9774F']) {
  const g = new THREE.Group();
  g.add(box(w + 0.06, h + 0.06, 0.03, toon('#2B2018')));
  const tx = texturaCanvas(16, 20, (c, W, H) => { c.fillStyle = '#F3E6CF'; c.fillRect(0, 0, W, H); c.fillStyle = cores[0]; c.fillRect(3, 9, 10, 8); c.fillStyle = cores[1]; c.beginPath(); c.arc(10, 6, 3, 0, 7); c.fill(); c.fillStyle = cores[2]; c.fillRect(2, 13, 6, 4); c.fillStyle = cores[3]; c.fillRect(9, 14, 5, 3); });
  g.add(at(plano(w, h, toon('#FFFFFF', { map: tx.tex })), 0, 0, 0.017));
  return g;
}

// ---------------- sala ----------------
/**
 * sala de estar brasileira: painel ripado com TV, rack, estante baixa com livros (o roteador vai em cima),
 * sofá de costas para a câmera com almofadas, mesinha de centro no tapete, janela com cortina na parede da
 * esquerda, planta, quadro e luminária pendente no forro (bocal exposto: a lâmpada é rosqueada nele).
 * Opções (sem elas nada muda):
 *   roteador: true  -> roteador() no tampo da estante (x local 0,1): S.rot
 *   lampada: true   -> lampada() rosqueada no bocal da luminária (S.teto): S.lamp
 *   vizinho: true   -> um 2º cômodo ATRÁS da parede do fundo (escritório 5,2 x 2,2, sem forro, só para a vista de cima
 *                      do Wi-Fi): piso, paredes, escrivaninha encostada no fundo com o celular() deitado (S.cel, tela
 *                      para cima), cadeira, tapete e planta. A parede do fundo da sala é a parede entre os dois.
 *                      S.vizinho (grupo), S.mesaVizinho (tampo da escrivaninha), S.parede ({ ponto, normal }: a face da
 *                      parede do lado da sala e a normal apontando para o escritório; é o `parede` do ondasEsfericas).
 * S.anoitecer(k): 0 = dia (padrão), 1 = noite (sol e céu quase apagados, janela escura, forro sem brilho próprio);
 *   use com S.lamp.acesa(k) para a lâmpada iluminar o cômodo. Chame todo quadro (anoitecer(0) no reset da cena).
 * -> { scene, L, estante, mesa, sofa, tv, telaTV, teto, forro, comodo, rot, lamp, cel, vizinho, mesaVizinho, parede, anoitecer }
 *   (pontos no STYLE.md §5.7)
 */
export function sala({ roteador: comRoteador = false, lampada: comLampada = false, vizinho: comVizinho = false } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2A1A12');
  const L = luzCasa(scene, { alvo: [0, 1, -0.8] });
  const C = comodo(scene, { larg: 5.2, prof: 5.6, piso: toon('#FFFFFF', { map: pisoTabuas(4, 4) }), parede: '#EBD9C0' });
  const zf = -C.mz;                                                       // face da parede do fundo
  const madeira = toon('#8A5A3C'), madeiraC = toon('#9E6A47'), escuro = toon('#1D2125');
  // painel ripado atrás da TV
  const painel = new THREE.Group(); at(painel, 0.55, 0, zf); scene.add(painel);
  painel.add(at(box(2.1, 2.45, 0.03, toon('#6E452E')), 0, 1.225, 0.015));
  for (let i = 0; i < 21; i++) painel.add(at(box(0.055, 2.45, 0.04, i % 2 ? madeira : madeiraC), -1.0 + i * 0.1, 1.225, 0.05));
  // rack
  const rack = new THREE.Group(); at(rack, 0.55, 0, zf + 0.29); scene.add(rack);
  rack.add(at(box(1.9, 0.38, 0.44, toon('#D8C3A0')), 0, 0.33, 0));
  for (const x of [-0.475, 0.475]) rack.add(at(box(0.9, 0.3, 0.02, toon('#C9B08A')), x, 0.33, 0.225), at(box(0.18, 0.025, 0.03, escuro), x, 0.4, 0.245));
  for (const [x, z] of [[-0.85, -0.15], [0.85, -0.15], [-0.85, 0.15], [0.85, 0.15]]) rack.add(at(box(0.04, 0.14, 0.04, toon('#3A2A20')), x, 0.07, z));
  rack.add(at(box(0.36, 0.06, 0.24, escuro), -0.55, 0.55, 0));
  const vasinho = at(plantaVaso(0.35, { vaso: '#E9E3D6' }), 0.72, 0.52, 0.02); vasinho.scale.setScalar(0.6); rack.add(vasinho);
  // TV na parede (no painel)
  const tv = new THREE.Group(); at(tv, 0.55, 1.3, zf + 0.12); scene.add(tv);
  tv.add(box(1.32, 0.78, 0.06, escuro));
  const telaTV = glow('#26343C'); tv.add(at(plano(1.24, 0.7, telaTV), 0, 0, 0.032));
  const brilhoTV = at(plano(0.16, 0.8, glow('#3A4C55')), -0.3, 0, 0.034); brilhoTV.rotation.z = -0.6; brilhoTV.scale.y = 0.85; tv.add(brilhoTV);   // reflexo na tela desligada
  // estante baixa (a do roteador)
  const est = new THREE.Group(); at(est, -1.45, 0, zf + 0.18); scene.add(est);
  const em = toon('#B98559'), emE = toon('#9A6646');
  est.add(at(box(0.04, 1.3, 0.36, em), -0.43, 0.65, 0), at(box(0.04, 1.3, 0.36, em), 0.43, 0.65, 0), at(box(0.9, 1.3, 0.02, emE), 0, 0.65, -0.17));
  for (const y of [0.04, 0.45, 0.87, 1.28]) est.add(at(box(0.9, 0.04, 0.36, em), 0, y, 0));
  const livroC = ['#C9774F', '#E9C46A', '#7E8E66', '#8E4A3A', '#E2843A', '#D8C3A0', '#5E6E8A'];
  [[0.06, 9, -0.38], [0.47, 6, -0.38], [0.89, 4, 0.02]].forEach(([y, nL, x0], r) => {
    let x = x0;
    for (let i = 0; i < nL; i++) { const w = 0.05 + sem(i, r) * 0.03, h = 0.26 + sem(i, r + 5) * 0.1; est.add(at(box(w, h, 0.24, toon(livroC[(i + r * 3) % 7])), x + w / 2, y + 0.02 + h / 2, 0.02)); x += w + 0.008; }
  });
  est.add(at(box(0.3, 0.2, 0.26, toon('#C9A77A')), 0.22, 0.6, 0.02), at(box(0.16, 0.14, 0.16, toon('#E9E3D6')), -0.25, 0.98, 0.02));   // cesto e caixinha
  const estante = new THREE.Group(); at(estante, 0.05, 1.3, 0); est.add(estante);
  const plantinha = at(plantaVaso(0.6, { vaso: '#E9E3D6' }), -0.3, 1.3, 0); plantinha.scale.setScalar(0.55); est.add(plantinha);
  // quadro acima da estante
  scene.add(at(quadro(0.5, 0.62), -1.45, 1.95, zf + 0.02));
  // janela na parede da esquerda
  const jan = janela(1.3, 1.25); at(jan, -C.mx + 0.02, 1.55, -0.6); jan.rotation.y = Math.PI / 2; scene.add(jan);
  // planta grande no canto direito do fundo
  scene.add(at(plantaVaso(1.3, { vaso: '#C8734A' }), 2.15, 0, zf + 0.45));
  // tapete
  const tapTex = texturaCanvas(24, 16, (c, w, h) => { c.fillStyle = '#E3C79E'; c.fillRect(0, 0, w, h); c.fillStyle = '#C9774F'; c.fillRect(1, 1, w - 2, 1); c.fillRect(1, h - 2, w - 2, 1); c.fillRect(1, 1, 1, h - 2); c.fillRect(w - 2, 1, 1, h - 2); c.fillStyle = '#D6B386'; for (let x = 4; x < w - 4; x += 4) c.fillRect(x, 4, 2, h - 8); });
  const tapete = at(box(2.6, 0.02, 1.9, toon('#FFFFFF', { map: tapTex.tex })), 0.25, 0.01, 0.15); tapete.castShadow = false; scene.add(tapete);
  // mesinha de centro
  const mesinha = new THREE.Group(); at(mesinha, 0.25, 0, 0.3); scene.add(mesinha);
  mesinha.add(at(box(1.0, 0.05, 0.55, toon('#9A6646')), 0, 0.375, 0), at(box(0.92, 0.03, 0.47, toon('#8A5A3C')), 0, 0.14, 0));
  for (const [x, z] of [[-0.44, -0.22], [0.44, -0.22], [-0.44, 0.22], [0.44, 0.22]]) mesinha.add(at(box(0.04, 0.37, 0.04, toon('#5E3B27')), x, 0.185, z));
  const mesa = new THREE.Group(); at(mesa, 0, 0.4, 0); mesinha.add(mesa);
  mesinha.add(at(cyl(0.04, 0.035, 0.09, toon('#E2843A'), 10), 0.28, 0.445, 0.05), at(box(0.22, 0.04, 0.16, toon('#5E6E8A')), -0.2, 0.42, -0.05), at(box(0.05, 0.02, 0.16, escuro), 0.05, 0.41, 0.1));
  // sofá (de costas para a câmera, de frente para a TV): de trás aparecem as almofadas do encosto e a manta
  const sofa = new THREE.Group(); at(sofa, 0.25, 0, 1.85); scene.add(sofa);
  const tecido = toon('#7E8E66'), tecidoE = toon('#68774F'), tecidoC = toon('#8E9E74');
  sofa.add(at(box(2.2, 0.3, 0.92, tecidoE), 0, 0.27, 0), at(box(2.2, 0.5, 0.2, tecidoE), 0, 0.62, 0.36));
  for (const x of [-1.0, 1.0]) sofa.add(at(box(0.2, 0.62, 0.92, tecido), x, 0.31, 0));
  for (const x of [-0.45, 0.45]) {
    sofa.add(at(box(0.88, 0.14, 0.7, tecidoC), x, 0.49, -0.08));
    const enc = at(box(0.88, 0.46, 0.18, tecidoC), x, 0.8, 0.2); enc.rotation.x = 0.18; sofa.add(enc);   // almofada do encosto
  }
  for (const [x, z] of [[-1.0, -0.38], [1.0, -0.38], [-1.0, 0.38], [1.0, 0.38]]) sofa.add(at(box(0.05, 0.12, 0.05, toon('#3A2A20')), x, 0.06, z));
  const alm1 = at(box(0.42, 0.4, 0.13, toon('#E9C46A')), -0.62, 0.82, 0.04), alm2 = at(box(0.4, 0.38, 0.13, toon('#C9774F')), 0.64, 0.8, 0.04);
  alm1.rotation.set(0.25, 0, 0.14); alm2.rotation.set(0.25, 0, -0.12); sofa.add(alm1, alm2);
  // manta listrada jogada no encosto
  const mantaTex = texturaCanvas(8, 16, (c, w, h) => { c.fillStyle = '#E3C79E'; c.fillRect(0, 0, w, h); c.fillStyle = '#C9774F'; for (let y = 1; y < h; y += 4) c.fillRect(0, y, w, 2); });
  const mantaM = toon('#FFFFFF', { map: mantaTex.tex });
  sofa.add(at(box(0.5, 0.03, 0.36, mantaM), 0.35, 0.885, 0.36), at(box(0.5, 0.42, 0.03, mantaM), 0.35, 0.68, 0.475));
  // luminária pendente (canopla no forro, fio, cúpula pequena e bocal exposto)
  const lum = new THREE.Group(); at(lum, 0.25, 0, 0.2); scene.add(lum);
  const preto = toon('#2B2622'), latao = toon('#D9A441');
  lum.add(at(cyl(0.09, 0.09, 0.04, preto, 14), 0, C.alt - 0.02, 0), at(cyl(0.008, 0.008, C.alt - 2.34, preto, 6), 0, (C.alt + 2.34) / 2, 0));
  lum.add(at(cyl(0.05, 0.2, 0.14, toon('#D9A441', { side: THREE.DoubleSide }), 16), 0, 2.32, 0));
  lum.add(at(cyl(0.035, 0.035, 0.09, latao, 12), 0, 2.225, 0));
  const teto = new THREE.Group(); at(teto, 0, 2.18, 0); lum.add(teto);
  // ----- opções: roteador na estante, lâmpada no bocal, escritório atrás da parede do fundo -----
  let rot = null, lamp = null, cel = null, vizinho = null, mesaVizinho = null;
  if (comRoteador) { rot = roteador(); at(rot.group, 0.1, 0, 0); estante.add(rot.group); }
  if (comLampada) { lamp = lampada(); teto.add(lamp.group); }
  const zAtras = zf - 0.15;                                               // face de trás da parede do fundo
  if (comVizinho) {
    vizinho = new THREE.Group(); scene.add(vizinho);
    const PV = 2.2, zv = zAtras - PV / 2, pm = toon('#E6D3B8');
    // carpete cinza-quente e escrivaninha escura: a onda laranja (mais fraca deste lado) precisa de contraste
    const chao = at(box(5.5, 0.12, PV, toon('#6E6259')), 0, -0.06, zv); chao.castShadow = false; vizinho.add(chao);
    for (const o of [at(box(5.5, 2.7, 0.15, pm), 0, 1.35, zAtras - PV - 0.075), at(box(0.15, 2.7, PV, pm), -2.675, 1.35, zv), at(box(0.15, 2.7, PV, pm), 2.675, 1.35, zv)]) { o.castShadow = false; vizinho.add(o); }
    const rm = toon('#F3EADB');
    vizinho.add(at(box(5.2, 0.09, 0.025, rm), 0, 0.045, zAtras - PV + 0.012), at(box(5.2, 0.09, 0.025, rm), 0, 0.045, zAtras - 0.012));
    // escrivaninha encostada no fundo, atrás do roteador (x -1,3), com o celular deitado
    const esc = new THREE.Group(); at(esc, -1.3, 0, zAtras - PV + 0.3); vizinho.add(esc);
    esc.add(at(box(1.1, 0.04, 0.55, toon('#4A3428')), 0, 0.73, 0));
    for (const [x, z] of [[-0.51, -0.23], [0.51, -0.23], [-0.51, 0.23], [0.51, 0.23]]) esc.add(at(box(0.04, 0.71, 0.04, toon('#5E3B27')), x, 0.355, z));
    esc.add(at(box(0.32, 0.03, 0.22, toon('#2E3338')), 0.3, 0.765, -0.08), at(box(0.3, 0.012, 0.2, toon('#5E6E8A')), 0.3, 0.786, -0.08));   // notebook fechado
    esc.add(at(cyl(0.05, 0.04, 0.1, toon('#E2843A'), 10), -0.4, 0.8, -0.12), at(box(0.2, 0.05, 0.26, toon('#C9774F')), -0.36, 0.775, 0.08));   // caneca e livro
    mesaVizinho = new THREE.Group(); at(mesaVizinho, 0, 0.75, 0); esc.add(mesaVizinho);
    cel = celular(); at(cel.group, -0.05, 0, 0.05); cel.group.rotation.y = 0.25; mesaVizinho.add(cel.group);
    // cadeira de frente para a escrivaninha
    const cad = new THREE.Group(); at(cad, -1.3, 0, zAtras - PV + 0.85); vizinho.add(cad);
    cad.add(at(box(0.44, 0.06, 0.42, toon('#3A4148')), 0, 0.46, 0), at(box(0.44, 0.45, 0.05, toon('#3A4148')), 0, 0.72, 0.2), at(cyl(0.025, 0.025, 0.42, toon('#2B2622'), 8), 0, 0.22, 0));
    cad.add(at(cyl(0.22, 0.22, 0.03, toon('#2B2622'), 10), 0, 0.03, 0));
    const tap = at(box(1.6, 0.015, 1.1, toon('#E3C79E')), -1.1, 0.008, zv + 0.15); tap.castShadow = false; vizinho.add(tap);
    vizinho.add(at(plantaVaso(1.0, { vaso: '#C8734A' }), 2.1, 0, zAtras - PV + 0.35));
    vizinho.add(at(box(0.36, 1.6, 0.9, toon('#D8C3A0')), 2.4, 0.8, zv + 0.3));                   // armário baixo à direita
  }
  const parede = { ponto: V(0, 0, zf), normal: V(0, 0, -1) };
  // anoitecer: guarda a luz do dia para voltar
  const dia = { sol: L.sol.intensity, hemi: L.hemi.intensity, forro: C.forro.material.emissiveIntensity, janela: jan.userData.vidro.color.clone(),
    ceu: L.hemi.color.clone(), chao: L.hemi.groundColor.clone() };
  // à noite o céu do hemisfério fica âmbar: bege bem escuro com céu neutro vira verde no quantizador
  const janelaNoite = new THREE.Color('#2E2622'), ceuNoite = new THREE.Color('#FFB878'), chaoNoite = new THREE.Color('#8A5A3C');
  const anoitecer = (k) => {
    const kk = Math.max(0, Math.min(1, k));
    L.sol.intensity = dia.sol * (1 - 0.95 * kk); L.hemi.intensity = dia.hemi * (1 - 0.78 * kk);
    L.hemi.color.copy(dia.ceu).lerp(ceuNoite, kk); L.hemi.groundColor.copy(dia.chao).lerp(chaoNoite, kk);
    C.forro.material.emissiveIntensity = dia.forro * (1 - 0.9 * kk);
    jan.userData.vidro.color.copy(dia.janela).lerp(janelaNoite, kk);
  };
  return { scene, L, estante, mesa, sofa, tv, telaTV, teto, forro: C.forro, comodo: C, rot, lamp, cel, vizinho, mesaVizinho, parede, anoitecer };
}

// ---------------- banheiro ----------------
/** azulejo 15 x 15 com rejunte (2 x 2 peças por repetição) */
const azulejo = (rx, ry, base = '#F1E8D6', rej = '#D6CBB6') => texRep(16, 16, (c, w, h) => { c.fillStyle = base; c.fillRect(0, 0, w, h); c.fillStyle = rej; c.fillRect(0, 0, w, 1); c.fillRect(0, 8, w, 1); c.fillRect(0, 0, 1, h); c.fillRect(8, 0, 1, h); }, rx, ry);
/** faixa de pastilhas (quadradinhos de 3 tons) */
const pastilhas = (rx) => texRep(16, 4, (c, w, h) => { c.fillStyle = '#C9B08A'; c.fillRect(0, 0, w, h); const cs = ['#C9774F', '#E2843A', '#B5653F']; for (let x = 0; x < w; x += 2) for (let y = 0; y < h; y += 2) { c.fillStyle = cs[(x * 3 + y * 5) % 3]; c.fillRect(x, y, 1, 1); } }, rx, 1);
/**
 * banheiro com azulejo creme e faixa de pastilhas terracota, piso cerâmico, box de vidro à esquerda com o ponto do
 * chuveiro, registro e ralo, pia com gabinete e espelho à direita, vaso sanitário, toalha, basculante e plafon.
 * banheiro({ chuveiro: true }): + chuveiro() preso em `parede` (braço saindo em +z, crivo a ~2,06 do chão). -> { ..., ch }
 * -> { scene, L, parede, box, ralo, pia, espelho, forro, comodo, ch (ou null) }  (pontos no STYLE.md §5.7)
 */
export function banheiro({ chuveiro: comChuveiro = false } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2A1A12');
  const L = luzCasa(scene, { alvo: [0, 1.1, -0.6], pos: [-1.5, 6, 5.5], caixa: 3 });
  const LG = 2.6, PR = 3.0, ALT = 2.6;
  const pisoTex = texRep(16, 16, (c, w, h) => { c.fillStyle = '#D9C4A3'; c.fillRect(0, 0, w, h); c.fillStyle = '#E3D0B2'; c.fillRect(1, 1, 7, 7); c.fillRect(9, 9, 7, 7); c.fillStyle = '#B49C7A'; c.fillRect(0, 0, w, 1); c.fillRect(0, 8, w, 1); c.fillRect(0, 0, 1, h); c.fillRect(8, 0, 1, h); }, 4, 5);
  const C = comodo(scene, { larg: LG, prof: PR, alt: ALT, piso: toon('#FFFFFF', { map: pisoTex }), parede: '#F1E8D6', rodape: '#E6DAC4' });
  const zf = -C.mz;
  // azulejos (planos por dentro das paredes) e faixa de pastilhas a 1,25
  const az = (w, h) => toon('#FFFFFF', { map: azulejo(w / 0.3, h / 0.3) });
  const faixa = (w) => toon('#FFFFFF', { map: pastilhas(w / 0.4) });
  scene.add(at(plano(LG, ALT, az(LG, ALT)), 0, ALT / 2, zf + 0.004), at(plano(LG, 0.1, faixa(LG)), 0, 1.25, zf + 0.008));
  for (const s of [-1, 1]) {
    const p = at(plano(PR, ALT, az(PR, ALT)), s * (C.mx - 0.004), ALT / 2, 0); p.rotation.y = -s * Math.PI / 2;
    const f = at(plano(PR, 0.1, faixa(PR)), s * (C.mx - 0.008), 1.25, 0); f.rotation.y = -s * Math.PI / 2;
    scene.add(p, f);
  }
  // box: soleira, vidro na frente e vidro lateral, perfis de alumínio (x de -1,3 a 0; z de -1,5 a -0,25)
  const alu = toon('#B8BEC2'), vidroM = toon('#CFE0DC', { opacity: 0.25 });
  const boxG = new THREE.Group(); scene.add(boxG);
  const xb = 0.0, zb = -0.25;
  boxG.add(at(box(C.mx + xb, 0.04, 0.08, toon('#E6DAC4')), (-C.mx + xb) / 2, 0.02, zb));
  const vf = at(box(1.3, 1.95, 0.012, vidroM), -0.65, 1.02, zb), vl = at(box(0.012, 1.95, 1.25, vidroM), xb, 1.02, (zf + zb) / 2);
  vf.castShadow = vl.castShadow = false; boxG.add(vf, vl);
  const perfis = [at(box(1.3, 0.035, 0.035, alu), -0.65, 2.0, zb), at(box(0.035, 0.035, 1.25, alu), xb, 2.0, (zf + zb) / 2), at(box(0.035, 2.0, 0.035, alu), xb, 1.0, zb)];
  perfis.forEach((o) => { o.castShadow = false; boxG.add(o); });   // sombra fina riscaria o azulejo
  // ponto do chuveiro na parede do box (saída do cano)
  const parede = new THREE.Group(); at(parede, -0.62, 2.2, zf); scene.add(parede);
  const niple = at(cyl(0.035, 0.035, 0.02, alu, 12), 0, 0, 0.01); niple.rotation.x = Math.PI / 2; parede.add(niple);
  // registro a 1,1
  const reg = at(cyl(0.05, 0.05, 0.03, alu, 14), -0.62, 1.1, zf + 0.015); reg.rotation.x = Math.PI / 2;
  scene.add(reg, at(box(0.12, 0.025, 0.06, alu), -0.62, 1.1, zf + 0.05));
  // ralo
  const ralo = new THREE.Group(); at(ralo, -0.62, 0.0, -0.85); scene.add(ralo);
  ralo.add(at(box(0.14, 0.006, 0.14, alu), 0, 0.003, 0));
  for (let i = -2; i <= 2; i++) ralo.add(at(box(0.1, 0.004, 0.012, toon('#4A4F52')), 0, 0.007, i * 0.022));
  // tapetinho na frente do box
  const tap = at(box(0.6, 0.015, 0.4, toon('#E9C46A')), -0.6, 0.008, 0.25); tap.castShadow = false; scene.add(tap);
  // pia com gabinete
  const pia = new THREE.Group(); at(pia, 0.78, 0, zf + 0.25); scene.add(pia);
  pia.add(at(box(0.8, 0.62, 0.46, toon('#B98559')), 0, 0.42, 0), at(box(0.84, 0.04, 0.5, toon('#EDE6DA')), 0, 0.75, 0));
  for (const x of [-0.2, 0.2]) pia.add(at(box(0.38, 0.55, 0.02, toon('#C9976A')), x, 0.42, 0.235), at(box(0.02, 0.12, 0.03, alu), x + (x < 0 ? 0.15 : -0.15), 0.5, 0.255));
  pia.add(at(cyl(0.18, 0.13, 0.12, toon('#FBF8F2'), 18), 0, 0.82, 0.04));
  pia.add(at(cyl(0.015, 0.015, 0.18, alu, 8), 0, 0.86, -0.18), at(box(0.03, 0.03, 0.14, alu), 0, 0.95, -0.12));
  pia.add(at(box(0.07, 0.12, 0.07, toon('#7E8E66')), -0.28, 0.83, -0.1));   // sabonete líquido
  // espelho com moldura
  const espelho = new THREE.Group(); at(espelho, 0.78, 1.55, zf + 0.02); scene.add(espelho);
  espelho.add(box(0.66, 0.82, 0.03, toon('#B98559')), at(plano(0.58, 0.74, toon('#D7E0DC', { emissive: '#3A3A36', emissiveIntensity: 0.4 })), 0, 0, 0.017));
  const reflexo = at(box(0.1, 0.6, 0.004, toon('#EEF3F0')), -0.12, 0.02, 0.02); reflexo.rotation.z = 0.5; espelho.add(reflexo);
  // vaso sanitário encostado na parede da direita, perto da frente
  const vaso = new THREE.Group(); at(vaso, C.mx - 0.36, 0, 0.75); vaso.rotation.y = -Math.PI / 2; scene.add(vaso);
  const louca = toon('#FBF8F2');
  vaso.add(at(cyl(0.17, 0.14, 0.38, louca, 16), 0, 0.19, 0.05), at(cyl(0.2, 0.19, 0.05, louca, 16), 0, 0.41, 0.06), at(box(0.38, 0.36, 0.16, louca), 0, 0.6, -0.22), at(box(0.4, 0.04, 0.18, louca), 0, 0.8, -0.22));
  // toalha no porta-toalha da parede da direita
  scene.add(at(box(0.04, 0.02, 0.5, alu), C.mx - 0.03, 1.5, -0.6), at(box(0.05, 0.6, 0.44, toon('#E2843A')), C.mx - 0.05, 1.2, -0.6));
  // basculante no alto da parede do fundo, em cima da pia
  const bas = new THREE.Group(); at(bas, 0.78, 2.28, zf + 0.01); scene.add(bas);
  bas.add(plano(0.6, 0.3, glow('#FFE9B8')), at(box(0.66, 0.04, 0.05, alu), 0, 0.15, 0.02), at(box(0.66, 0.04, 0.05, alu), 0, -0.15, 0.02), at(box(0.66, 0.025, 0.04, alu), 0, 0, 0.03));
  // plafon no forro
  const plafon = at(cyl(0.18, 0.18, 0.05, glow('#FFF3D6'), 18), 0.2, ALT - 0.025, 0.2); plafon.castShadow = false; scene.add(plafon);
  // chuveiro elétrico no ponto da parede (o crivo fica a 2,2 - 0,144 do piso)
  const ch = comChuveiro ? chuveiro({ altura: 2.2 - 0.146 }) : null;
  if (ch) parede.add(ch.group);
  return { scene, L, parede, box: boxG, ralo, pia, espelho, forro: C.forro, comodo: C, ch };
}

// ---------------- quarto ----------------
/**
 * quarto de casal: cama com cabeceira estofada e edredom, criado-mudo à esquerda com abajur (o celular fica no
 * tampo, ao lado do carregador na tomada logo acima), tomada brasileira de 3 furos na parede, segundo criado-mudo,
 * janela com cortina, guarda-roupa, tapete e quadro.
 * quarto({ celular: true }): celular() deitado no criado-mudo (x local -0,12, z 0,04, filho de `criado`), com o
 * carregador na tomada e o cabo descendo pela fresta entre a parede e o móvel até o conector (contorna o celular
 * pela esquerda). -> { ..., cel }
 * -> { scene, L, criado, cama, tomada, abajur, forro, comodo, cel (ou null) }  (pontos no STYLE.md §5.7)
 */
export function quarto({ celular: comCelular = false } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#2A1A12');
  const L = luzCasa(scene, { alvo: [-0.3, 0.8, -1.2], pos: [2.5, 6.5, 6] });
  const C = comodo(scene, { larg: 4.2, prof: 4.4, piso: toon('#FFFFFF', { map: pisoTabuas(3, 3, '#A8754C') }), parede: '#E6D3B8' });
  const zf = -C.mz;
  // parede da cabeceira em tom terroso
  scene.add(at(box(2.6, 2.7, 0.02, toon('#A3AB86')), 0.1, 1.35, zf + 0.01));
  // cama de casal
  const cama = new THREE.Group(); at(cama, 0.1, 0, zf); scene.add(cama);
  cama.add(at(box(1.75, 1.1, 0.12, toon('#D8C3A0')), 0, 0.85, 0.08));                          // cabeceira
  for (let i = 0; i < 4; i++) cama.add(at(box(0.4, 0.9, 0.06, toon('#CDB590')), -0.63 + i * 0.42, 0.88, 0.16));
  cama.add(at(box(1.6, 0.28, 2.0, toon('#9A6646')), 0, 0.2, 1.15), at(box(1.56, 0.22, 1.96, toon('#F4EFE6')), 0, 0.45, 1.15));
  cama.add(at(box(1.64, 0.1, 1.45, toon('#C9774F')), 0, 0.6, 1.42), at(box(1.66, 0.3, 0.06, toon('#C9774F')), 0, 0.42, 2.15));   // edredom + caimento
  cama.add(at(box(1.64, 0.11, 0.3, toon('#E9C46A')), 0, 0.61, 1.9));                           // peseira
  for (const x of [-0.4, 0.4]) { const tr = at(box(0.62, 0.16, 0.36, toon('#FBF6EC')), x, 0.65, 0.42); tr.rotation.x = -0.25; cama.add(tr); }
  for (const [x, z] of [[-0.76, 0.2], [0.76, 0.2], [-0.76, 2.1], [0.76, 2.1]]) cama.add(at(box(0.06, 0.08, 0.06, toon('#3A2A20')), x, 0.04, z));
  // criados-mudos
  const criadoMudo = (x) => {
    const g = new THREE.Group(); at(g, x, 0, zf + 0.38); scene.add(g);
    g.add(at(box(0.48, 0.42, 0.4, toon('#B98559')), 0, 0.33, 0), at(box(0.52, 0.04, 0.44, toon('#9A6646')), 0, 0.54, 0));
    g.add(at(box(0.42, 0.16, 0.02, toon('#C9976A')), 0, 0.36, 0.205), at(box(0.1, 0.02, 0.03, toon('#3A2A20')), 0, 0.37, 0.22));
    for (const [px, pz] of [[-0.2, -0.16], [0.2, -0.16], [-0.2, 0.16], [0.2, 0.16]]) g.add(at(box(0.035, 0.12, 0.035, toon('#3A2A20')), px, 0.06, pz));
    return g;
  };
  const cmE = criadoMudo(-1.13), cmD = criadoMudo(1.33);
  const criado = new THREE.Group(); at(criado, 0, 0.56, 0); cmE.add(criado);
  // abajur no canto de trás à direita do criado da esquerda
  const abajur = new THREE.Group(); at(abajur, 0.14, 0.56, -0.06); cmE.add(abajur);
  abajur.add(at(cyl(0.06, 0.08, 0.04, toon('#3A2A20'), 12), 0, 0.02, 0), at(cyl(0.012, 0.012, 0.24, toon('#3A2A20'), 6), 0, 0.16, 0));
  abajur.add(at(cyl(0.09, 0.14, 0.17, toon('#F3E3C3', { emissive: '#FFB347', emissiveIntensity: 0.35 }), 16), 0, 0.33, 0));
  // vasinho e livro no criado da direita
  const vas = at(plantaVaso(0.4, { vaso: '#E9E3D6' }), 0.08, 0.56, 0); vas.scale.setScalar(0.5); cmD.add(vas);
  cmD.add(at(box(0.18, 0.04, 0.24, toon('#5E6E8A')), -0.1, 0.58, 0.02));
  // tomada brasileira (placa branca, rebaixo sextavado e 3 furos) acima do criado da esquerda
  const tomada = new THREE.Group(); at(tomada, -1.29, 0.78, zf); scene.add(tomada);
  tomada.add(at(box(0.08, 0.12, 0.012, toon('#F7F4EE')), 0, 0, 0.006));
  const rebaixo = at(cyl(0.024, 0.024, 0.006, toon('#E2DED6'), 6), 0, 0, 0.012); rebaixo.rotation.x = Math.PI / 2; tomada.add(rebaixo);
  for (const [x, y] of [[-0.01, -0.006], [0.01, -0.006], [0, 0.011]]) tomada.add(at(box(0.006, 0.006, 0.004, toon('#2B2622')), x, y, 0.016));
  // janela à direita, guarda-roupa à esquerda
  const jan = janela(1.1, 1.2, { cortina: '#E9C46A' }); at(jan, C.mx - 0.02, 1.5, -0.4); jan.rotation.y = -Math.PI / 2; scene.add(jan);
  const gr = new THREE.Group(); at(gr, -C.mx + 0.32, 0, -0.95); scene.add(gr);
  gr.add(at(box(0.6, 2.3, 1.6, toon('#D8C3A0')), 0, 1.17, 0));
  for (const z of [-0.4, 0.4]) gr.add(at(box(0.02, 2.2, 0.78, toon('#CDB590')), 0.31, 1.17, z), at(box(0.03, 0.4, 0.03, toon('#3A2A20')), 0.33, 1.2, z + (z < 0 ? 0.33 : -0.33)));
  // tapete ao lado da cama e quadro acima da cabeceira
  const tp = at(box(0.62, 0.015, 1.6, toon('#E3C79E')), -1.1, 0.008, -0.45); tp.castShadow = false; scene.add(tp);
  scene.add(at(quadro(0.9, 0.5, ['#7E8E66', '#E9C46A', '#C9774F', '#E2843A']), 0.1, 1.85, zf + 0.03));
  // celular no criado (coordenadas do celular = do criado - posição dele; a tomada fica 0,16 atrás do tampo)
  let cel = null;
  if (comCelular) {
    const pc = [-0.12, 0, 0.04];
    const tomadaCel = [-1.29 - (-1.13) - pc[0], 0.78 - 0.56 - pc[1], zf + 0.012 - (zf + 0.38) - pc[2]];   // face da tomada
    const via = [[-0.044, 0.15, -0.33], [-0.052, 0.06, -0.285], [-0.06, 0.012, -0.262], [-0.066, 0.0021, -0.236],
      [-0.072, 0.0021, -0.17], [-0.07, 0.0021, -0.05], [-0.064, 0.0021, 0.07], [-0.046, 0.0021, 0.11], [-0.018, 0.0021, 0.112]];
    cel = celular({ tomada: tomadaCel, via });
    at(cel.group, ...pc); criado.add(cel.group);
  }
  return { scene, L, criado, cama, tomada, abajur, forro: C.forro, comodo: C, cel };
}

// ---------------- bateria por dentro ----------------
/**
 * bateriaPorDentro(): diagrama vivo de uma célula de íons de lítio, de frente para a câmera (plano xy, z = 0).
 * De baixo para cima: coletor de alumínio, cátodo (4 fileiras de blocos de óxido metálico, cor quente, com 3 fileiras
 * de vagas entre elas), separador (placa translúcida com poros), ânodo (4 camadas de grafite cinza, 3 fileiras de vagas
 * entre elas) e coletor de cobre. À direita, o fio externo sai do alumínio, sobe passando por um aparelho (caixa com
 * ⚡: o carregador ou o celular) e entra no cobre.
 * 18 íons de lítio (esferas glow ciano-claro, 6 colunas x 3 níveis): com carga 0 todos no cátodo, com carga 1 todos
 * no ânodo (lógica pura em ions.mjs). Elétrons (fluxo amarelo) correm no fio: sentido +1 (carregando) do alumínio para
 * o cobre (o carregador tira elétrons do cátodo e empurra para o ânodo); -1 (descarregando) do cobre para o alumínio.
 * -> { scene, pontos, ions, eletrons, aparelho, de, para, atualizar(t, { carga = 0, sentido = 1, eletrons = 1 }) }
 *   carga 0..1 (posição dos íons; a média acompanha a carga); sentido +1/-1 (rastro dos íons e sentido dos elétrons;
 *   0 = parado, sem elétrons); eletrons 0..1 (tamanho das bolinhas do fio).
 * pontos.ion acompanha o íon herói (o 10º a sair: atravessa o separador por volta de carga 0,5). Câmera: (0.45, -0.4, 16.6)
 * olhando para (0.45, -0.4, 0) (STYLE.md §5.7).
 */
export function bateriaPorDentro() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#1A100C');
  scene.add(new THREE.HemisphereLight('#FFE6C8', '#2A1A12', 1.5));
  const sol = new THREE.DirectionalLight('#FFF0DC', 2.0); sol.position.set(4, 6, 9); scene.add(sol);
  const COL = 6, NIV = 3, n = COL * NIV, passo = 0.62, x0 = -((COL - 1) / 2) * passo;     // colunas das vagas: x0 + j·passo
  const xs = Array.from({ length: COL }, (_, j) => x0 + j * passo);
  const xa = x0 - passo / 2 - 0.05, xb = -x0 + passo / 2 + 0.05;                           // largura da célula
  const zI = 0.1;                                                                          // íons um pouco à frente do meio
  // ----- fundo da célula -----
  const yBase = -2.3, yTopo = 2.82;
  scene.add(at(box(xb - xa + 0.3, yTopo - yBase + 0.3, 0.1, toon('#2E1C14')), 0, (yBase + yTopo) / 2, -0.5));
  // ----- coletores (alumínio embaixo, cobre em cima), com a aba à direita para o fio -----
  const alM = toon('#B9BEC4'), cuM = toon('#C98447');
  const yAl = -2.19, yCu = 2.69;
  scene.add(at(box(xb - xa + 0.2, 0.22, 0.44, alM), 0, yAl, 0), at(box(0.7, 0.16, 0.2, alM), xb + 0.3, yAl, 0));
  scene.add(at(box(xb - xa + 0.2, 0.22, 0.44, cuM), 0, yCu, 0), at(box(0.7, 0.16, 0.2, cuM), xb + 0.3, yCu, 0));
  // ----- cátodo: 4 fileiras de blocos de óxido (7 por fileira, entre as colunas); vagas nas 3 frestas -----
  const catM = [toon('#D9763F'), toon('#B8562E'), toon('#E2843A')];
  const yCat = [-0.1, -0.68, -1.26, -1.84], hCat = 0.34, wCat = 0.36;
  yCat.forEach((y, r) => { for (let k = 0; k <= COL; k++) scene.add(at(box(wCat, hCat, 0.3, catM[(r + k) % 3]), x0 - passo / 2 + k * passo, y, 0)); });
  const vagaCat = (nivel) => (yCat[nivel] + yCat[nivel + 1]) / 2;          // nível 0 = fresta de cima (perto do separador)
  // ----- separador: placa translúcida com poros -----
  const ySep = 0.5;
  const poros = texturaCanvas(64, 4, (c, w) => { c.fillStyle = '#F3E3C3'; c.fillRect(0, 0, w, 4); c.fillStyle = '#8A6A4A'; for (let x = 1; x < w; x += 3) c.fillRect(x, x % 2 ? 1 : 2, 1, 1); });
  const sepM = new THREE.MeshToonMaterial({ color: '#FFFFFF', map: poros.tex, transparent: true, opacity: 0.55, depthWrite: false });
  scene.add(at(box(xb - xa + 0.1, 0.18, 0.42, sepM), 0, ySep, 0));
  // ----- ânodo: 4 camadas de grafite (segmentos com frestas nas colunas); vagas entre as camadas -----
  const grM = [toon('#5A626B'), toon('#6E767E')], pontoC = toon('#3E454C');
  const yAn = [1.05, 1.51, 1.97, 2.43], hAn = 0.12;
  yAn.forEach((y, r) => {
    for (let k = 0; k <= COL; k++) {
      const x = x0 - passo / 2 + k * passo;
      scene.add(at(box(passo - 0.16, hAn, 0.3, grM[(r + k) % 2]), x, y, 0));
      for (const dx of [-0.12, 0, 0.12]) scene.add(at(box(0.04, 0.04, 0.02, pontoC), x + dx, y, 0.155));   // anéis de carbono
    }
  });
  const vagaAn = (nivel) => (yAn[nivel] + yAn[nivel + 1]) / 2;             // nível 0 = de baixo (perto do separador)
  // ----- íons de lítio (com 2 rastros transparentes quando andam) -----
  const ionM = glow('#9BEFFF'), rastroM = [glow('#9BEFFF', 0.5), glow('#9BEFFF', 0.25)];
  const geoIon = new THREE.SphereGeometry(0.12, 12, 9);
  const ions = [], rastros = [], de = [], para = [];
  for (let i = 0; i < n; i++) {
    const v = vagaDoIon(i, COL, NIV);
    de.push([xs[v.coluna], vagaCat(v.nivelCatodo), zI]); para.push([xs[v.coluna], vagaAn(v.nivelAnodo), zI]);
    const s = new THREE.Mesh(geoIon, ionM); scene.add(s); ions.push(s);
    rastros.push(rastroM.map((m, k) => { const o = new THREE.Mesh(geoIon, m); o.scale.setScalar(0.8 - k * 0.2); scene.add(o); return o; }));
  }
  const heroi = Math.floor(n / 2);
  // ----- fio externo com o aparelho no meio; elétrons do alumínio (cátodo) para o cobre (ânodo) -----
  const xf = xb + 0.75;
  const fio = [[xb + 0.5, yAl, 0], [xf - 0.15, yAl, 0], [xf, yAl + 0.15, 0], [xf, -0.6, 0], [xf, 1.4, 0], [xf, yCu - 0.15, 0], [xf - 0.15, yCu, 0], [xb + 0.5, yCu, 0]];
  const eletrons = fluxo(fio, 16, { cor: '#FFD23F', raio: 0.08, vel: 0.16, fechado: false, tubo: { cor: '#8A5A3C', raio: 0.11, opacidade: 0.35 } });
  scene.add(eletrons.group);
  const aparelho = new THREE.Group(); at(aparelho, xf, 0.4, 0); scene.add(aparelho);
  aparelho.add(at(box(0.62, 0.9, 0.42, toon('#2C3136')), 0, 0, 0));
  const raioTx = texturaCanvas(8, 10, (c) => { c.fillStyle = '#2C3136'; c.fillRect(0, 0, 8, 10); escrever(c, '⚡', 4, 1, 1, '#FFB43A'); });
  const raioM = new THREE.MeshBasicMaterial({ map: raioTx.tex });
  aparelho.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.6), raioM), 0, 0, 0.215));
  const pontos = {
    anodo: V(0, 1.74, 0.2), catodo: V(0, -0.97, 0.2), separador: V(0, ySep, 0.2), ion: V(), fio: V(xf, 1.9, 0),
    aparelho: V(xf, 0.4, 0.22), cobre: V(-1.2, yCu, 0.22), aluminio: V(-1.2, yAl, 0.22), centro: V(0.45, -0.4, 0),
  };
  return {
    scene, pontos, ions, eletrons, aparelho, de, para,
    atualizar(t, { carga = 0, sentido = 1, eletrons: ke = 1 } = {}) {
      for (let i = 0; i < n; i++) {
        const p = progressoDoIon(i, n, carga), q = pontoDoIon(de[i], para[i], p);
        const parado = p <= 0 || p >= 1, tremor = parado ? 0.018 : 0;
        ions[i].position.set(q[0] + Math.sin(t * 5.3 + i * 1.7) * tremor, q[1] + Math.cos(t * 4.1 + i * 2.3) * tremor, q[2]);
        rastros[i].forEach((o, k) => {
          o.visible = !parado && sentido !== 0;
          if (!o.visible) return;
          const r = pontoDoIon(de[i], para[i], Math.max(0, Math.min(1, p - sentido * 0.07 * (k + 1))));
          o.position.set(r[0], r[1], r[2] - 0.01 * (k + 1));
        });
        if (i === heroi) pontos.ion.copy(ions[i].position);
      }
      const ativo = sentido !== 0 && ke > 0.01;
      eletrons.atualizar(t * (sentido < 0 ? -1 : 1), { k: ativo ? ke : 0 });
      eletrons.group.visible = true; eletrons.cano.material.opacity = eletrons.cano.userData.opacidade;   // o fio fica sempre
      if (!ativo) eletrons.bolinhas.forEach((b) => { b.visible = false; });
      raioM.color.setScalar(ativo ? 0.8 + 0.2 * Math.sin(t * 6) : 0.55);
    },
  };
}

// ---------------- resistência por dentro ----------------
/**
 * resistenciaPorDentro(): close de um pedaço do fio da resistência (níquel-cromo), em pé no meio do quadro (eixo y).
 * O fio é um cilindro grosso cortado ao meio (só a metade de trás, vista por dentro: a parede esquenta de cinza a
 * laranja e vermelho). Dentro, a rede de átomos (esferas cinza em grade, 2 camadas) treme mais com o calor. Os elétrons
 * (fluxo ciano-claro, a exceção do §2 para partículas elétricas) descem em 2 trilhas em zigue-zague entre os átomos e
 * esbarram neles: cada átomo encostado por um elétron acende em laranja (o choque que vira calor: efeito Joule). Dos
 * lados, por fora do fio, a água desce (bolinhas azuis) e vai ficando quente (creme, laranja) enquanto passa encostada
 * no trecho usado.
 * `trecho` 0..1 = pedaço usado, de cima (u = 0, y = 5,2) para baixo (u = 1, y = -5,2): abaixo do corte o fio fica frio
 * e escuro, sem elétrons, os átomos quase parados, e um anel âmbar marca o corte (o borne do meio, no inverno).
 * -> { scene, pontos, atomos, eletrons, aguas, atualizar(t, { corrente = 1, calor = 0, trecho = 1 }) }
 *   corrente 0..1: quantos elétrons aparecem (0 = nenhum); calor 0..1: cor do fio, tremor dos átomos e quanto a água
 *   esquenta (no total do trecho: com o mesmo calor, trecho menor esquenta a mesma água mais rápido); trecho 0..1.
 * Câmera: (0, 0.3, 16) olhando para (0, 0.3, 0), fov 35 (STYLE.md §5.7).
 */
export function resistenciaPorDentro() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#1A100C');
  scene.add(new THREE.HemisphereLight('#FFE6C8', '#2A1A12', 1.5));
  const sol = new THREE.DirectionalLight('#FFF0DC', 2.0); sol.position.set(4, 6, 9); scene.add(sol);
  const R = 1.35, YA = 7.4, Y0 = 5.2, Y1 = -5.2;                 // raio do fio; ponta (fora do quadro); u = 0 e u = 1
  const uDeY = (y) => (Y0 - y) / (Y0 - Y1);
  // ----- fio: metade de trás de um cilindro, vista por dentro; trecho usado (quente) em cima, o resto (frio) embaixo -----
  const meiaCasca = new THREE.CylinderGeometry(R, R, 1, 36, 1, true, Math.PI / 2, Math.PI);
  const fioQ = new THREE.Mesh(meiaCasca, toon('#8C949C', { side: THREE.DoubleSide, emissive: '#000000' }));
  const fioF = new THREE.Mesh(meiaCasca, toon('#4A5058', { side: THREE.DoubleSide }));
  scene.add(fioQ, fioF);
  // bordas da casca (as duas linhas onde o corte passa), para o cilindro ler como fio cortado
  const bordaM = toon('#B9BEC4');
  for (const s of [-1, 1]) scene.add(at(box(0.07, 2 * YA, 0.07, bordaM), s * R, 0, 0));
  const corte = at(new THREE.Mesh(new THREE.TorusGeometry(R + 0.03, 0.07, 6, 40, Math.PI), glow('#FFB43A')), 0, 0, 0);
  corte.rotation.x = Math.PI / 2; corte.rotation.z = Math.PI; scene.add(corte);       // meio anel na parede de trás
  // ----- rede de átomos: frente com 3 colunas, fundo com 2 (desencontradas), passo 0,85 -----
  const passo = 0.85, atomos = [];
  for (let r = -9; r <= 9; r++) {
    for (const x of [-passo, 0, passo]) atomos.push({ base: [x, r * passo, 0.3], frente: true });
    for (const x of [-passo / 2, passo / 2]) atomos.push({ base: [x, r * passo + passo / 2, -0.6], frente: false });
  }
  const geoF = new THREE.SphereGeometry(0.235, 14, 10), geoT = new THREE.SphereGeometry(0.19, 12, 9);
  const cinzaF = new THREE.Color('#B9BEC4'), cinzaT = new THREE.Color('#7E858C'), quenteA = new THREE.Color('#E9A070');
  atomos.forEach((a) => {
    a.cor = a.frente ? cinzaF : cinzaT;                        // camada de trás menor e mais escura: a grade lê em 2 planos
    a.m = toon(a.cor, { emissive: '#FFB43A', emissiveIntensity: 0 }); a.mesh = new THREE.Mesh(a.frente ? geoF : geoT, a.m); scene.add(a.mesh);
  });
  // ----- elétrons: 2 trilhas em zigue-zague entre as colunas da frente, de cima para baixo -----
  const trilha = (xc, fase) => {
    const pts = [];
    for (let r = 9; r >= -9; r--) pts.push([xc + (r % 2 === 0 ? 1 : -1) * fase * 0.13, r * passo, 0.32]);
    return [[xc, YA, 0.32], ...pts, [xc, -YA, 0.32]];
  };
  const NE = 15, VE = 0.08;
  const eletrons = [trilha(-passo / 2, 1), trilha(passo / 2, -1)].map((pts) => {
    const f = fluxo(pts, NE, { cor: '#9BEFFF', raio: 0.12, vel: VE, fechado: false }); scene.add(f.group); return f;
  });
  const vivoPela = (i, kc) => ((i * 7) % NE) / NE < kc;         // quais elétrons aparecem com a corrente kc
  /** elétron herói da trilha 0: o visível mais perto de y = 2,6 no começo de cada janela de 3 s (puro; não pula no meio) */
  const heroiEm = (t, kc) => {
    const t0 = Math.floor(t / 3) * 3, alvo = new THREE.Vector3();
    let melhor = -1, dm = Infinity;
    for (let i = 0; i < NE; i++) {
      if (!vivoPela(i, kc)) continue;
      const u = posicaoNoFluxo(i, NE, t0, VE, true);
      const d = Math.abs(eletrons[0].curva.getPointAt(u, alvo).y - 2.6);
      if (d < dm) { dm = d; melhor = i; }
    }
    return melhor;
  };
  // ----- água por fora: 2 trilhas de cada lado, descendo; esquenta ao longo do trecho usado -----
  const azul = new THREE.Color('#4F8BFF'), creme = new THREE.Color('#FFE9C4'), laranja = new THREE.Color('#FF7A2E'), cA = new THREE.Color();
  const aguas = [[-1.85, 0.25], [1.85, 0.25], [-2.35, -0.35], [2.35, -0.35]].map(([x, z], j) => {
    const pts = [];
    for (let y = YA; y >= -YA - 0.01; y -= 1.85) pts.push([x + Math.sin(y * 0.9 + j) * 0.08, y, z]);
    const f = fluxo(pts, 12, { cor: '#4F8BFF', raio: 0.17, vel: 0.05 + 0.006 * j, fechado: false }); scene.add(f.group); return f;
  });
  const pontos = {
    fio: V(-R, 3.2, 0), atomo: V(), eletron: V(), trilha: V(-passo / 2 + 0.13, 2 * passo, 0.32), agua: V(1.85, 3.0, 0.25),
    aguaQuente: V(1.85, -3.6, 0.25), trecho: V(R, 0, 0), centro: V(0, 0.3, 0),
  };
  const iHeroi = atomos.findIndex((a) => a.base[0] === passo && a.base[1] === 3 * passo && a.base[2] === 0.3);
  const tmp = new THREE.Vector3();
  return {
    scene, pontos, atomos, eletrons, aguas, corte,
    atualizar(t, { corrente = 1, calor = 0, trecho = 1 } = {}) {
      const kc = Math.max(0, Math.min(1, corrente)), kq = Math.max(0, Math.min(1, calor)), tr = Math.max(0, Math.min(1, trecho));
      // corte: y onde termina o trecho usado (trecho 1 = o fio inteiro, até fora do quadro)
      const yCorte = tr >= 0.999 ? -YA : tr <= 0.001 ? YA : Y0 - tr * (Y0 - Y1);
      const hQ = YA - yCorte, hF = yCorte + YA;
      fioQ.visible = hQ > 0.001; fioQ.scale.y = Math.max(hQ, 1e-3); fioQ.position.y = (YA + yCorte) / 2;
      fioF.visible = hF > 0.001; fioF.scale.y = Math.max(hF, 1e-3); fioF.position.y = (yCorte - YA) / 2;
      const quente = corResistencia(kq);
      fioQ.material.color.copy(quente); fioQ.material.emissive.copy(quente); fioQ.material.emissiveIntensity = 0.4 * kq;
      corte.visible = tr > 0.001 && tr < 0.999; corte.position.y = yCorte; pontos.trecho.set(R, yCorte, 0);
      // elétrons: só no trecho usado (somem no corte), quantidade pela corrente
      const vivos = [];
      eletrons.forEach((f, j) => {
        f.atualizar(t + j * 0.37, { k: kc > 0.01 ? 1 : 0 });
        f.bolinhas.forEach((b, i) => {
          if (!b.visible) return;
          const d = dentroDoTrecho(uDeY(b.position.y), tr, 0.04);   // acima de Y0 (u < 0) conta como dentro
          const mostra = d > 0.01 && vivoPela(i, kc);
          b.visible = mostra;
          if (mostra) { b.scale.multiplyScalar(d); vivos.push(b.position); }
        });
      });
      const h = heroiEm(t, kc), bh = h >= 0 ? eletrons[0].bolinhas[h] : null;
      if (bh && bh.visible) pontos.eletron.copy(bh.position); else pontos.eletron.copy(pontos.trilha);
      // átomos: tremor pelo calor local; acendem quando um elétron encosta
      atomos.forEach((a, i) => {
        const y = a.base[1], dentro = dentroDoTrecho(uDeY(y), tr, 0.04);
        const local = kq * dentro;
        const v = vibracaoDoAtomo(i, t, local), e = 0.7 * passo;      // amplitude em espaçamentos da rede (máx. ~0,18 aqui)
        a.mesh.position.set(a.base[0] + v[0] * e, y + v[1] * e, a.base[2] + v[2] * e);
        let choque = 0;
        for (const p of vivos) {
          const dd = tmp.copy(p).sub(a.mesh.position).length();
          if (dd < 0.5) choque = Math.max(choque, 1 - Math.max(0, dd - 0.34) / 0.16);
        }
        a.m.color.copy(a.cor).lerp(quenteA, 0.45 * local);
        a.m.emissiveIntensity = 0.9 * choque;
        if (i === iHeroi) pontos.atomo.copy(a.mesh.position);
      });
      // água: esquenta enquanto passa encostada no trecho usado e fica quente dali para baixo
      const yFim = Math.max(yCorte, Y1), yIni = Y0;
      const cores = (u) => {
        const y = YA - u * 2 * YA;
        const h = tr <= 0.001 ? 0 : kq * Math.max(0, Math.min(1, (yIni - Math.max(y, yFim)) / (yIni - yFim)));
        return h < 0.5 ? cA.copy(azul).lerp(creme, h * 2) : cA.copy(creme).lerp(laranja, (h - 0.5) * 2);
      };
      aguas.forEach((f, j) => f.atualizar(t + j * 0.53, { cores }));
    },
  };
}

// ---------------- chip LED por dentro ----------------
/**
 * chipLED(): close da junção P-N de um LED, de frente para a câmera (plano xy), fundo marrom-escuro. De baixo para cima:
 * contato de metal, camada N (cinza-grafite, letra N) com elétrons (esferas glow ciano-claro, a exceção do §2), a
 * junção (linha creme), camada P (terracota, letra P) com lacunas (anéis laranja vazios), um vão transparente e a
 * camada de fósforo amarelo. Elétrons sobem da N e lacunas descem da P até a junção; cada encontro some com os dois,
 * solta um clarão e um fóton (faísca glow) que sobe AZUL e sai do fósforo BRANCO (o fósforo amarelo + o azul que passa
 * = luz branca). Lógica pura em led.mjs (8 pares defasados, período 2,4 s: um encontro a cada 0,3 s).
 * -> { scene, pontos, atualizar(t, { k = 1 }) }
 *   k 0..1 = corrente: quantos pares conduzem (0 = nenhum: elétrons e lacunas parados nas camadas, sem luz); o fósforo
 *   brilha um pouco com k.
 * pontos (mundo): chip (meio), juncao, fosforo, nCamada, pCamada, centro (alvo da câmera); móveis (atualizar): eletron e
 * lacuna (o par herói chegando na junção; troca a cada 0,9 s) e foton (o fóton herói subindo; troca a cada 0,9 s).
 * Câmera: (0, -0.35, 16) olhando para (0, -0.35, 0), fov 35: o chip fica acima da faixa da legenda.
 */
export function chipLED() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#1A100C');
  scene.add(new THREE.HemisphereLight('#FFE6C8', '#2A1A12', 1.5));
  const sol = new THREE.DirectionalLight('#FFF0DC', 2.0); sol.position.set(4, 6, 9); scene.add(sol);
  const LW = 4.6, zP = 0.3;                                             // largura das camadas; plano das partículas
  const yN0 = -2.2, yN1 = -0.12, yP0 = 0.12, yP1 = 1.6, yF0 = 2.25, yF1 = 3.2, yTopo = 4.6;
  scene.add(at(box(LW + 0.5, 6.4, 0.1, toon('#2E1C14')), 0, 0.4, -0.5));                         // fundo
  scene.add(at(box(LW + 0.2, 0.3, 0.44, toon('#B9BEC4')), 0, yN0 - 0.15, 0));                     // contato de baixo
  scene.add(at(box(LW, yN1 - yN0, 0.3, toon('#5A626B')), 0, (yN0 + yN1) / 2, 0));                // camada N
  scene.add(at(box(LW, yP1 - yP0, 0.3, toon('#B8562E')), 0, (yP0 + yP1) / 2, 0));                // camada P
  scene.add(at(box(LW + 0.04, yP0 - yN1, 0.32, toon('#3A2A22')), 0, 0, 0));                       // zona da junção
  scene.add(at(box(LW + 0.06, 0.05, 0.34, glow('#FFE9C4')), 0, 0, 0));                            // linha da junção
  scene.add(at(box(0.7, 0.14, 0.32, toon('#E9C46A')), 1.5, yP1 + 0.07, 0));                      // contato de cima (pad)
  // vão transparente (encapsulamento) e fósforo amarelo
  scene.add(at(box(LW, yF0 - yP1, 0.3, toon('#E9DCC0', { opacity: 0.12 })), 0, (yP1 + yF0) / 2, 0));
  const fosM = toon('#F2C94C', { emissive: '#FFE08A', emissiveIntensity: 0 });
  scene.add(at(box(LW, yF1 - yF0, 0.3, fosM), 0, (yF0 + yF1) / 2, 0));
  // letras N e P (fonte pixel numa textura) no canto esquerdo das camadas
  const letra = (txt, cor, y) => {
    const tx = texturaCanvas(8, 10, (c) => { c.fillStyle = cor; c.fillRect(0, 0, 8, 10); escrever(c, txt, 4, 1, 1, '#FFF1C1'); });
    scene.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.4), new THREE.MeshBasicMaterial({ map: tx.tex })), -LW / 2 + 0.22, y, 0.152));
  };
  letra('N', '#5A626B', (yN0 + yN1) / 2); letra('P', '#B8562E', (yP0 + yP1) / 2);
  // população parada: elétrons na N e lacunas na P (tremem de leve), entre as colunas dos pares
  const n = 8, PER = 2.4, xCol = (fx) => -1.9 + fx * 3.8;
  const eM = glow('#9BEFFF'), lM = glow('#FFB43A');
  const geoE = new THREE.SphereGeometry(0.13, 12, 9), geoL = new THREE.TorusGeometry(0.115, 0.04, 6, 16);
  const parados = [];
  for (const [y, m, geo] of [[-1.9, eM, geoE], [-1.45, eM, geoE], [1.05, lM, geoL], [1.42, lM, geoL]]) {
    for (let c = 0; c < 7; c++) {
      const o = new THREE.Mesh(geo, m); const b = [xCol((c + 1) / 8) + (y > 0 ? 0.06 : -0.06), y, zP];
      scene.add(o); parados.push({ o, b, i: parados.length });
    }
  }
  // pares que andam: elétron, lacuna, clarão e fóton (com 2 rastros)
  const yN = -1.0, yP = 0.72;
  const azul = new THREE.Color('#4F8BFF'), branco = new THREE.Color('#FFF6DD');
  const geoF = new THREE.SphereGeometry(0.11, 10, 8), geoBarra = new THREE.BoxGeometry(0.07, 0.42, 0.05);
  const pares = Array.from({ length: n }, () => {
    const el = new THREE.Mesh(geoE, eM), la = new THREE.Mesh(geoL, lM);
    const clarao = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 9), glow('#FFF1C1', 0.7));
    const fm = glow('#4F8BFF'), foton = new THREE.Group();
    foton.add(new THREE.Mesh(geoF, fm), new THREE.Mesh(geoBarra, fm));
    const cruz = new THREE.Mesh(geoBarra, fm); cruz.rotation.z = Math.PI / 2; cruz.scale.y = 0.7; foton.add(cruz);
    const rastros = [glow('#4F8BFF', 0.55), glow('#4F8BFF', 0.3)].map((m, k) => { const r = new THREE.Mesh(geoF, m); r.scale.setScalar(0.75 - k * 0.2); scene.add(r); return r; });
    scene.add(el, la, clarao, foton);
    return { el, la, clarao, foton, fm, rastros };
  });
  const pontos = {
    chip: V(0, 0.2, 0.2), juncao: V(LW / 2 - 0.1, 0, 0.2), fosforo: V(1.2, (yF0 + yF1) / 2, 0.2), nCamada: V(0, -1.2, 0.2), pCamada: V(0, 1.2, 0.2),
    centro: V(0, -0.35, 0), eletron: V(), lacuna: V(), foton: V(),
  };
  const cTmp = new THREE.Color();
  return {
    scene, pontos,
    atualizar(t, { k = 1 } = {}) {
      const kk = Math.max(0, Math.min(1, k));
      parados.forEach(({ o, b, i }) => o.position.set(b[0] + Math.sin(t * 4.3 + i * 1.9) * 0.03, b[1] + Math.cos(t * 3.7 + i * 2.6) * 0.03, b[2]));
      const hE = heroiDaFase(t, n, PER, 0.9, 0, FASE_ENCONTRO, kk), hF = heroiDaFase(t, n, PER, 0.9, FASE_ENCONTRO, 1, kk);
      pares.forEach((P, i) => {
        const p = parDoEncontro(i, n, t, { periodo: PER, yN, yP, yTopo, k: kk }), x = xCol(p.x);
        P.el.visible = p.eletron.vis; P.el.position.set(x, p.eletron.y, zP); P.el.scale.setScalar(Math.max(p.eletron.escala, 1e-3));
        P.la.visible = p.lacuna.vis; P.la.position.set(x, p.lacuna.y, zP); P.la.scale.setScalar(Math.max(p.lacuna.escala, 1e-3));
        P.clarao.visible = p.flash > 0.01; P.clarao.position.set(x, 0, zP + 0.05); P.clarao.scale.setScalar(0.4 + 0.8 * (1 - p.flash)); P.clarao.material.opacity = 0.75 * p.flash;
        P.foton.visible = p.foton.vis; P.foton.position.set(x, p.foton.y, zP + 0.08);
        const cor = (y) => cTmp.copy(azul).lerp(branco, corDoFoton(y, yF0, yF1));
        P.fm.color.copy(cor(p.foton.y));
        P.rastros.forEach((r, j) => {
          const yr = p.foton.y - 0.28 * (j + 1);
          r.visible = p.foton.vis && yr > 0.05; r.position.set(x, yr, zP + 0.06); r.material.color.copy(cor(yr));
        });
        if (i === hE) { pontos.eletron.copy(P.el.position); pontos.lacuna.copy(P.la.position); }
        if (i === hF) pontos.foton.copy(P.foton.position);
      });
      if (hE < 0) { pontos.eletron.copy(parados[10].o.position); pontos.lacuna.copy(parados[17].o.position); }
      if (hF < 0) pontos.foton.set(0, (yF0 + yF1) / 2, zP);
      fosM.emissiveIntensity = 0.35 * kk;
    },
  };
}
