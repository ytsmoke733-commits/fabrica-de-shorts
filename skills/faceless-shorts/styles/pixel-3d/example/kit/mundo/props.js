// Props do mundo pixel: micro-ondas (com raio-x e magnetron), lasanha (inteira e em corte com mapa de calor),
// molécula de água, ímã, geladeira (com raio-x, tubos do gás e compressor), celular (tela, raio-x, cabo e carregador),
// chuveiro elétrico (chave, raio-x com a resistência em espiral, água), roteador Wi-Fi (antenas, LEDs piscando) e
// lâmpada LED (bulbo, rosca, raio-x com os chips, acesa). Todos com material toon; controles por métodos puros (chame reset() todo quadro).
import * as THREE from 'three';
import { toon, glow, luzes } from '../motor/pixel.js';
import { V, box, cyl, sph, at, lerpN, texturaCanvas, escrever } from './pecas.js';
import { fluxo, gradiente, agua } from './efeitos.js';
import { fracoesDoCaminho, pontosSerpentina } from './caminhos.mjs';
import { TRECHO_INVERNO, trechoDaChave, dentroDoTrecho, pontosEspiral } from './chuveiro.mjs';
import { ledDoRoteador } from './wifi.mjs';

// ---------------- micro-ondas ----------------
/** micro-ondas de 5 x 3 x 3,8 com a frente em z = +1,9. Devolve partes e controles. */
export function microondas() {
  const g = new THREE.Group();
  const corpoM = toon('#D9DCDF'), portaM = toon('#2C3136'), painelM = toon('#AEB3B8'), escuroM = toon('#1D2125');
  const botaoM = toon('#7E858C'), puxM = toon('#9EA4AA'), iniM = toon('#E2843A');
  const casca = [corpoM, portaM, painelM, escuroM, botaoM, puxM, iniM];
  casca.forEach((m) => { m.transparent = true; m.opacity = 1; });
  // corpo: 5 paredes (sem a frente), para a cavidade aparecer no corte
  const corpo = new THREE.Group(); g.add(corpo);
  corpo.add(at(box(5, 0.2, 3.8, corpoM), 0, 2.9, 0), at(box(5, 0.2, 3.8, corpoM), 0, 0.1, 0), at(box(0.2, 3, 3.8, corpoM), -2.4, 1.5, 0),
    at(box(0.2, 3, 3.8, corpoM), 2.4, 1.5, 0), at(box(5, 3, 0.2, corpoM), 0, 1.5, -1.8));
  // pés
  for (const [x, z] of [[-2.1, 1.5], [2.1, 1.5], [-2.1, -1.5], [2.1, -1.5]]) corpo.add(at(box(0.35, 0.12, 0.35, escuroM), x, -0.05, z));
  // cavidade (paredes internas claras; BackSide: vistas de fora somem)
  const cavM = toon('#F2E3B8', { side: THREE.BackSide, emissive: '#FFB347', emissiveIntensity: 0 });
  const cav = at(new THREE.Mesh(new THREE.BoxGeometry(3.3, 2.5, 3.3), cavM), -0.65, 1.5, 0.05); cav.receiveShadow = true; g.add(cav);
  // porta: moldura escura + janela de vidro
  const porta = new THREE.Group(); at(porta, -2.35, 0, 1.9); g.add(porta);   // dobradiça à esquerda
  const mold = [[3.75, 0.35, 1.825, 2.8], [3.75, 0.35, 1.825, 0.2], [0.35, 2.95, 0.175, 1.5], [0.35, 2.95, 3.525, 1.5]];
  for (const [w, h, x, y] of mold) porta.add(at(box(w, h, 0.14, portaM), x, y, 0.07));
  const vidroM = toon('#20343A', { opacity: 0.38 }); casca.push(vidroM);
  const vidro = at(new THREE.Mesh(new THREE.BoxGeometry(3.05, 2.45, 0.06), vidroM), 1.825, 1.5, 0.07); porta.add(vidro);
  const tela = texturaCanvas(64, 52, (c, w, h) => { c.fillStyle = '#000'; for (let y = 1; y < h; y += 3) for (let x = 1; x < w; x += 3) c.fillRect(x, y, 1, 1); });
  const telaM = new THREE.MeshBasicMaterial({ map: tela.tex, transparent: true, opacity: 0.32, depthWrite: false }); casca.push(telaM);
  porta.add(at(new THREE.Mesh(new THREE.PlaneGeometry(3.05, 2.45), telaM), 1.825, 1.5, 0.105));
  porta.add(at(box(0.16, 2.1, 0.22, puxM), 3.5, 1.5, 0.25));
  // painel de controle
  const painel = at(box(1.15, 2.95, 0.12, painelM), 1.85, 1.5, 1.9); g.add(painel);
  const visor = texturaCanvas(40, 16);
  const visorM = new THREE.MeshBasicMaterial({ map: visor.tex, transparent: true }); casca.push(visorM);
  g.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.36), visorM), 1.85, 2.55, 1.97));
  const botoes = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const b = at(box(0.22, 0.16, 0.06, botaoM), 1.55 + c * 0.3, 2.05 - r * 0.28, 1.98); g.add(b); botoes.push(b); }
  const iniciar = at(box(0.82, 0.26, 0.07, iniM), 1.85, 0.7, 1.98); g.add(iniciar);
  // prato giratório + lasanha
  const mesa = new THREE.Group(); at(mesa, -0.65, 0.32, 0.05); g.add(mesa);
  mesa.add(at(cyl(1.25, 1.25, 0.06, toon('#CFE8EE', { opacity: 0.6 }), 28), 0, 0, 0));
  const prato = at(cyl(0.95, 0.75, 0.12, toon('#F4F1EA'), 24), 0, 0.09, 0); mesa.add(prato);
  const las = lasanha(); las.group.scale.setScalar(0.32); at(las.group, 0, 0.16, 0); mesa.add(las.group);
  // magnetron (no compartimento da direita, atrás do painel) + guia de onda até a cavidade
  const mag = new THREE.Group(); at(mag, 1.8, 1.55, -0.3); g.add(mag);
  const cobre = toon('#C98447'), aco = toon('#8C949C');
  mag.add(at(cyl(0.42, 0.42, 0.85, cobre), 0, 0, 0));
  for (let i = 0; i < 6; i++) mag.add(at(box(0.95, 0.05, 0.95, aco), 0, -0.36 + i * 0.145, 0));
  mag.add(at(cyl(0.1, 0.1, 0.45, aco), 0, 0.62, 0), at(sph(0.13, aco), 0, 0.86, 0));
  const ima1 = at(cyl(0.48, 0.48, 0.12, toon('#4A5560')), 0, 0.5, 0), ima2 = at(cyl(0.48, 0.48, 0.12, toon('#4A5560')), 0, -0.5, 0); mag.add(ima1, ima2);
  const guia = at(box(1.0, 0.45, 0.7, aco), 1.15, 2.45, -0.3); g.add(guia);
  mag.visible = false; guia.visible = false;
  // luz da cavidade (acende quando ligado)
  const luz = new THREE.PointLight('#FFC66B', 0, 8, 1.6); at(luz, -0.65, 2.4, 0.3); g.add(luz);
  let ultVisor = null;
  return {
    group: g, porta, mesa, lasanha: las, mag, guia, cav, vidro, botoes, iniciar,
    boca: V(0.85, 2.45, -0.3),   // saída da guia de onda dentro da cavidade (coordenadas do grupo)
    centro: V(-0.65, 1.5, 0.05),
    /** opacidade da carcaça (1 = normal; baixo = raio-x) */
    casca(op) {
      for (const m of casca) { const base = m.userData.base ?? (m.userData.base = m.opacity); m.opacity = base * op; m.depthWrite = op > 0.99 && base >= 1; }
      painel.visible = op > 0.05;
      mag.visible = guia.visible = op < 0.999;
    },
    ligado(k) { cavM.emissiveIntensity = 0.55 * k; luz.intensity = 6 * k; },
    visor(txt, cor = '#FFB43A') {
      if (txt === ultVisor) return; ultVisor = txt;
      visor.pintar((c, w, h) => { c.fillStyle = '#10161A'; c.fillRect(0, 0, w, h); escrever(c, txt, w / 2, 4, 1, cor); });
    },
    abrir(k) { porta.rotation.y = -k * 1.6; },
    reset() { this.casca(1); this.ligado(0); this.abrir(0); mesa.rotation.y = 0; las.calor(0); g.visible = true; },
  };
}

// ---------------- lasanha ----------------
/** lasanha em camadas (caixa 4 x 1,6 x 2,4, base em y = 0). calor(k) deixa a casca alaranjada */
export function lasanha() {
  const g = new THREE.Group();
  const massa = toon('#E8C36A'), molho = toon('#B8432E'), queijo = toon('#F1DC9A'), topo = toon('#D9893B');
  const cam = [[massa, 0.18], [molho, 0.22], [massa, 0.16], [molho, 0.22], [queijo, 0.14], [massa, 0.16], [molho, 0.2], [topo, 0.32]];
  let y = 0;
  for (const [m, h] of cam) { g.add(at(box(4, h, 2.4, m), 0, y + h / 2, 0)); y += h; }
  // bolhas de queijo gratinado no topo
  for (let i = 0; i < 14; i++) { const r = 0.12 + ((i * 37) % 10) / 70; g.add(at(sph(r, toon(i % 3 ? '#B8652A' : '#F0C35A'), 8), -1.7 + ((i * 53) % 34) / 10, y, -1 + ((i * 29) % 20) / 10)); }
  const mats = [massa, molho, queijo, topo], base = mats.map((m) => m.color.clone()), quente = new THREE.Color('#FF7B2E');
  return { group: g, altura: y, calor(k) { mats.forEach((m, i) => m.color.copy(base[i]).lerp(quente, k * 0.45)); } };
}

/** corte da lasanha: placa com textura de camadas + mapa de calor (casca quente, miolo frio). */
export function corteLasanha() {
  const g = new THREE.Group();
  const las = lasanha(); g.add(las.group);
  const tx = texturaCanvas(64, 26);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.6), new THREE.MeshBasicMaterial({ map: tx.tex }));
  at(face, 0, 0.8, 1.205); g.add(face);
  const camadas = ['#E8C36A', '#E8C36A', '#B8432E', '#B8432E', '#E8C36A', '#B8432E', '#B8432E', '#B8432E', '#F1DC9A', '#E8C36A', '#E8C36A', '#B8432E', '#B8432E', '#D9893B', '#D9893B'];
  const c = (h) => new THREE.Color(h);
  const frio = c('#3F7FD6'), morno = c('#E9C24A'), quente = c('#FF6A2A');
  let ult = '';
  return {
    group: g, las,
    /** banda = espessura da casca quente (0..0,5 da altura); miolo = 0..1 aquecimento do centro; mapa = 0..1 mostra o calor */
    calor(banda, miolo, mapa) {
      const key = [banda, miolo, mapa].map((v) => v.toFixed(3)).join();
      if (key === ult) return; ult = key;
      tx.pintar((gg, w, h) => {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const camada = c(camadas[Math.floor(((h - 1 - y) / h) * camadas.length)]);
          // distância normalizada até a borda mais próxima (topo, base e laterais recebem onda)
          const dx = Math.min(x, w - 1 - x) / (h * 0.5), dy = Math.min(y, h - 1 - y) / (h * 0.5);
          const d = Math.min(dx, dy) * 0.5;   // 0 na borda, 0,5 no centro da altura
          let temp = d < banda ? 1 : Math.max(0, 1 - (d - banda) * 6) * 0.25;
          temp = Math.max(temp, miolo * (0.55 + 0.45 * (1 - d * 2)));
          const cor = temp > 0.66 ? quente : temp > 0.33 ? morno.clone().lerp(quente, (temp - 0.33) * 3) : frio.clone().lerp(morno, temp * 3);
          const f = camada.clone().lerp(cor, mapa * 0.8);
          gg.fillStyle = '#' + f.getHexString(); gg.fillRect(x, y, 1, 1);
        }
      });
    },
  };
}

// ---------------- moléculas de água ----------------
export function molecula(escala = 1) {
  const g = new THREE.Group();
  const oM = toon('#E0503A'), hM = toon('#F4F1EA');
  g.add(sph(0.5 * escala, oM, 18));
  const a = (104.5 / 2) * (Math.PI / 180), d = 0.62 * escala;
  const h1 = at(sph(0.32 * escala, hM, 14), Math.sin(a) * d, -Math.cos(a) * d, 0), h2 = at(sph(0.32 * escala, hM, 14), -Math.sin(a) * d, -Math.cos(a) * d, 0);
  g.add(h1, h2);
  const base = [oM.color.clone(), hM.color.clone()], quente = new THREE.Color('#FF8A3A');
  return { group: g, o: g.children[0], h1, h2, calor(k) { oM.color.copy(base[0]).lerp(quente, k * 0.5); hM.color.copy(base[1]).lerp(quente, k * 0.55); } };
}

/** ímã de barra (N vermelho em cima, S azul embaixo), 0,7 x 2,2 */
export function ima() {
  const g = new THREE.Group();
  g.add(at(box(0.7, 1.1, 0.5, toon('#D9443A')), 0, 0.55, 0), at(box(0.7, 1.1, 0.5, toon('#3C6FD1')), 0, -0.55, 0));
  return g;
}

// ---------------- geladeira ----------------
/** tubo (TubeGeometry) por uma lista de pontos [x, y, z] (CatmullRom centrípeta), material toon */
function cano(pontos, raio, mat, fechado = false) {
  const curva = new THREE.CatmullRomCurve3(pontos.map((p) => V(...p)), fechado, 'centripetal');
  const m = new THREE.Mesh(new THREE.TubeGeometry(curva, Math.max(32, pontos.length * 12), raio, 6, fechado), mat);
  m.castShadow = true; return m;
}
/**
 * geladeira duplex (freezer em cima) em METROS: corpo 0,70 x 1,80 x 0,60 + portas de 0,06 (frente em z = +0,36),
 * base no chão (y = 0), centro em x = 0. `escala` multiplica tudo (a cozinha({ geladeira: true }) usa 10).
 * Atrás: serpentina preta (condensador) e compressor num nicho embaixo. Por dentro: prateleiras, garrafas, frutas,
 * gaveta de legumes, freezer com gelo; portas com prateleirinhas. Nas paredes, os tubos do gás (só no raio-x).
 * -> { group, porta, freezer, casca(op), aberta(k, kFreezer), luz(k), gas(t, { k }), compressor, serpentina,
 *      tubos (todos; tubosDentro = os das paredes, só no raio-x), fluxoGas, corGas, pontos, reset() }
 * pontos = coordenadas do grupo (sem escala): use noMundo(gel.group, gel.pontos.compressor).
 */
export function geladeira({ escala = 1 } = {}) {
  const g = new THREE.Group(); g.scale.setScalar(escala);
  const W = 0.70, H = 1.80, D = 0.60, e = 0.04, zf = D / 2, zt = -D / 2;
  const corpoM = toon('#EDEBE4'), ladoM = toon('#DCD8CE'), puxM = toon('#3A4148'), borrM = toon('#7E868D'), grelhaM = toon('#2B3035');
  const internoM = toon('#E4EBEE', { side: THREE.BackSide, emissive: '#FFF0C8', emissiveIntensity: 0 });
  const portaInM = toon('#E9EEF0'), prateM = toon('#CFE2E8'), cestoM = toon('#DDE8EC'), vidroM = toon('#BFD8E0', { opacity: 0.45 });
  const casca = [corpoM, ladoM, puxM, borrM, grelhaM, internoM, portaInM, prateM, cestoM, vidroM];
  // ----- corpo: laterais inteiras, topo, fundo (acima do nicho), base (na frente do nicho), divisória -----
  const corpo = new THREE.Group(); g.add(corpo);
  const yNicho = 0.24, zNicho = -0.12;                       // nicho do compressor: atrás, embaixo (y 0..0,24, z -0,30..-0,12)
  corpo.add(at(box(e, H, D, ladoM), -W / 2 + e / 2, H / 2, 0), at(box(e, H, D, ladoM), W / 2 - e / 2, H / 2, 0));
  corpo.add(at(box(W - 2 * e, e, D, corpoM), 0, H - e / 2, 0));
  corpo.add(at(box(W - 2 * e, H - yNicho, e, corpoM), 0, yNicho + (H - yNicho) / 2, zt + e / 2));
  corpo.add(at(box(W - 2 * e, yNicho, zf - zNicho, corpoM), 0, yNicho / 2, (zf + zNicho) / 2));
  corpo.add(at(box(W - 2 * e, 0.03, zNicho - zt, corpoM), 0, yNicho - 0.015, (zNicho + zt) / 2));   // teto do nicho
  const yDiv0 = 1.17, yDiv1 = 1.25;
  corpo.add(at(box(W - 2 * e, yDiv1 - yDiv0, D - e, corpoM), 0, (yDiv0 + yDiv1) / 2, e / 2));
  corpo.add(at(box(W - 0.08, 0.055, 0.012, grelhaM), 0, 0.045, zf + 0.006));                       // grade do rodapé
  // ----- interior: dois forros BackSide (vistos de fora, só aparecem as faces de dentro) -----
  const xi = W / 2 - e - 0.003, zi0 = zt + e + 0.003, zi1 = zf - 0.005;   // 3 mm para dentro das paredes (sem z-fighting)
  const forro = (y0, y1) => at(new THREE.Mesh(new THREE.BoxGeometry(2 * xi, y1 - y0, zi1 - zi0), internoM), 0, (y0 + y1) / 2, (zi0 + zi1) / 2);
  const dentro = new THREE.Group(); g.add(dentro);
  dentro.add(forro(yNicho + 0.003, yDiv0 - 0.003), forro(yDiv1 + 0.003, H - e - 0.003));
  // prateleiras de vidro (fosco) + frente da gaveta de legumes
  const zp0 = zi0, zp1 = 0.2, zpc = (zp0 + zp1) / 2, dp = zp1 - zp0;
  for (const y of [0.47, 0.72, 0.96]) dentro.add(at(box(2 * xi - 0.01, 0.014, dp, prateM), 0, y, zpc));
  dentro.add(at(box(2 * xi - 0.04, 0.17, 0.008, vidroM), 0, yNicho + 0.1, zp1 - 0.01));
  const comida = new THREE.Group(); dentro.add(comida);
  const C = (cor) => toon(cor);
  // gaveta: frutas e verduras
  [['#E5533D', -0.2, -0.05], ['#F2B233', -0.08, 0.06], ['#7DB343', 0.05, -0.08], ['#E5533D', 0.17, 0.05], ['#4E9A4A', 0.22, -0.12], ['#F2B233', -0.22, 0.1]]
    .forEach(([c, x, z], i) => comida.add(at(sph(0.045 + (i % 2) * 0.008, C(c), 10), x, yNicho + 0.06, z)));
  // 1ª prateleira: garrafa verde, caixa de suco, pote de geleia, garrafa de água
  const y1 = 0.477;
  comida.add(at(cyl(0.034, 0.034, 0.19, C('#3F7A3A'), 10), -0.22, y1 + 0.095, -0.12), at(cyl(0.012, 0.03, 0.07, C('#3F7A3A'), 8), -0.22, y1 + 0.225, -0.12));
  comida.add(at(box(0.07, 0.18, 0.07, C('#E2843A')), -0.1, y1 + 0.09, -0.02), at(box(0.07, 0.03, 0.07, C('#F4F1EA')), -0.1, y1 + 0.195, -0.02));
  comida.add(at(cyl(0.045, 0.045, 0.09, C('#B8432E'), 12), 0.05, y1 + 0.045, 0.06), at(cyl(0.047, 0.047, 0.02, C('#E9C46A'), 12), 0.05, y1 + 0.1, 0.06));
  comida.add(at(cyl(0.038, 0.038, 0.21, C('#8EC3E6'), 10), 0.2, y1 + 0.105, -0.1), at(cyl(0.016, 0.016, 0.03, C('#3C6FD1'), 8), 0.2, y1 + 0.225, -0.1));
  // 2ª: queijo, bolo no prato, ovos
  const y2 = 0.727;
  comida.add(at(box(0.13, 0.06, 0.09, C('#F2C94C')), -0.18, y2 + 0.03, 0.02));
  comida.add(at(cyl(0.11, 0.11, 0.012, C('#F4F1EA'), 16), 0.04, y2 + 0.006, -0.05), at(cyl(0.085, 0.085, 0.07, C('#F1DC9A'), 14), 0.04, y2 + 0.047, -0.05), at(cyl(0.087, 0.087, 0.015, C('#B8432E'), 14), 0.04, y2 + 0.088, -0.05));
  comida.add(at(box(0.15, 0.04, 0.08, C('#C9B08A')), 0.2, y2 + 0.02, 0.08));
  for (let i = 0; i < 3; i++) comida.add(at(sph(0.022, C('#F7EBD3'), 8), 0.15 + i * 0.05, y2 + 0.05, 0.08));
  // 3ª: panela com tampa e pote verde
  const y3 = 0.967;
  comida.add(at(cyl(0.09, 0.08, 0.1, C('#E2843A'), 14), -0.12, y3 + 0.05, -0.06), at(cyl(0.092, 0.092, 0.015, C('#C9682E'), 14), -0.12, y3 + 0.108, -0.06), at(sph(0.018, C('#3A2A20'), 8), -0.12, y3 + 0.125, -0.06));
  comida.add(at(box(0.15, 0.07, 0.11, C('#7E8E66')), 0.16, y3 + 0.035, 0.02), at(box(0.155, 0.015, 0.115, C('#5E6E4A')), 0.16, y3 + 0.078, 0.02));
  // freezer: forma de gelo, pacotes congelados, pote de sorvete
  const yf = yDiv1;
  comida.add(at(box(0.24, 0.03, 0.11, C('#DCEBF0')), -0.12, yf + 0.015, 0.1));
  for (let i = 0; i < 4; i++) comida.add(at(box(0.04, 0.035, 0.04, C('#F2FAFC')), -0.21 + i * 0.06, yf + 0.04, 0.1));
  comida.add(at(box(0.16, 0.1, 0.2, C('#3C6FD1')), -0.13, yf + 0.05, -0.12), at(box(0.15, 0.08, 0.18, C('#F4F1EA')), 0.15, yf + 0.04, -0.1), at(box(0.152, 0.02, 0.182, C('#D9443A')), 0.15, yf + 0.06, -0.1));
  comida.add(at(cyl(0.07, 0.06, 0.1, C('#F3C6C0'), 14), 0.17, yf + 0.13, -0.08));
  // luz interna (lâmpada no teto do compartimento de baixo)
  const lampada = at(box(0.1, 0.02, 0.05, glow('#FFF6DD')), 0, yDiv0 - 0.011, -0.05); dentro.add(lampada);
  const luzP = new THREE.PointLight('#FFF1CF', 0, 1.6 * escala, 1.5); at(luzP, 0, yDiv0 - 0.08, 0.12); g.add(luzP);
  const luzI = 0.5 * Math.pow(escala, 1.5);
  // ----- portas (dobradiça à esquerda, abrem para +z como a do micro-ondas) -----
  const umaPorta = (y0, h, puxY, puxH, prats) => {
    const p = new THREE.Group(); at(p, -W / 2, y0, zf); g.add(p);
    p.add(at(box(W, h, 0.06, corpoM), W / 2, h / 2, 0.03));
    p.add(at(box(W - 0.06, h - 0.06, 0.012, portaInM), W / 2, h / 2, -0.004));                      // forro de dentro da porta
    // puxador: barra vertical escura com dois apoios, no lado da abertura
    p.add(at(box(0.03, puxH, 0.03, puxM), W - 0.06, puxY, 0.115), at(box(0.025, 0.025, 0.05, borrM), W - 0.06, puxY - puxH / 2 + 0.03, 0.08), at(box(0.025, 0.025, 0.05, borrM), W - 0.06, puxY + puxH / 2 - 0.03, 0.08));
    // prateleirinhas da porta com coisas
    const itens = new THREE.Group(); p.add(itens);
    for (const [y, coisas] of prats) {
      p.add(at(box(W - 0.14, 0.012, 0.065, cestoM), W / 2, y, -0.04), at(box(W - 0.14, 0.05, 0.008, cestoM), W / 2, y + 0.025, -0.072));
      for (const [tipo, x, cor] of coisas) {
        if (tipo === 'caixa') itens.add(at(box(0.06, 0.17, 0.05, C(cor)), x, y + 0.09, -0.04), at(box(0.06, 0.025, 0.05, C('#3C6FD1')), x, y + 0.19, -0.04));
        else itens.add(at(cyl(0.024, 0.024, 0.13, C(cor), 8), x, y + 0.071, -0.04), at(cyl(0.01, 0.018, 0.035, C(cor), 6), x, y + 0.153, -0.04));
      }
    }
    return { p, itens };
  };
  const pg = umaPorta(0.09, 1.10, 0.86, 0.42, [
    [0.2, [['caixa', 0.14, '#F4F1EA'], ['garrafa', 0.26, '#D9443A'], ['garrafa', 0.33, '#F2C94C'], ['caixa', 0.5, '#F4F1EA']]],
    [0.55, [['garrafa', 0.15, '#7DB343'], ['garrafa', 0.24, '#E2843A'], ['garrafa', 0.47, '#B8432E'], ['garrafa', 0.56, '#3F7A3A']]],
    [0.85, [['garrafa', 0.2, '#F2C94C'], ['garrafa', 0.42, '#D9443A']]]]);
  const pf = umaPorta(1.215, 0.575, 0.12, 0.2, [[0.18, [['garrafa', 0.2, '#8EC3E6'], ['caixa', 0.42, '#F4F1EA']]]]);
  const porta = pg.p, freezer = pf.p;
  for (const it of [pg.itens, pf.itens]) it.traverse((o) => { if (o.material && !casca.includes(o.material)) casca.push(o.material); });
  casca.forEach((m) => { m.userData.base = m.opacity; });
  const comidaM = []; comida.traverse((o) => { if (o.material && !comidaM.includes(o.material)) { o.material.userData.base = 1; comidaM.push(o.material); } });
  /** opacidade de uma lista de materiais; transparente só quando precisa (opaco não tem fantasma de contorno) */
  const opac = (lista, op) => {
    for (const m of lista) {
      const tr = op < 0.999 || m.userData.base < 1;
      if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
      m.opacity = m.userData.base * op; m.depthWrite = !tr;
    }
  };
  // ----- atrás: compressor no nicho, serpentina preta (condensador) -----
  const pretoM = toon('#22262A'), compM = toon('#2E3338'), cobreM = toon('#C98447');
  const compressor = new THREE.Group(); at(compressor, 0.1, 0, -0.21); g.add(compressor);
  compressor.add(at(box(0.22, 0.015, 0.16, pretoM), 0, 0.0075, 0));
  const domo = at(sph(0.075, compM, 14), 0, 0.145, 0); domo.scale.y = 0.6;
  compressor.add(at(cyl(0.075, 0.075, 0.12, compM, 14), 0, 0.085, 0), domo, at(box(0.05, 0.05, 0.04, toon('#14171A')), -0.09, 0.07, 0.02));
  const zc = zt - 0.03;                                       // plano da serpentina, 3 cm atrás do corpo
  const serpentina = new THREE.Group(); g.add(serpentina);
  const ptsCond = pontosSerpentina(-0.25, 0.25, 1.2, 0.34, 7, zc);       // entra em cima à esquerda, sai embaixo à direita
  serpentina.add(cano(ptsCond, 0.009, pretoM));
  for (let i = 0; i < 7; i++) serpentina.add(at(box(0.006, 0.92, 0.006, pretoM), -0.24 + i * 0.08, 0.77, zc - 0.012));   // arames
  for (const x of [-0.3, 0.3]) serpentina.add(at(box(0.02, 0.94, 0.012, pretoM), x, 0.77, zc + 0.012));                // suportes
  // ----- circuito do gás (coordenadas do grupo) -----
  // compressor -> descarga (sobe pela esquerda, atrás) -> condensador (serpentina de trás, de cima para baixo) ->
  // capilar (sobe pela direita e entra na parede do fundo do freezer: é a "válvula") -> evaporador (na parede do fundo
  // do freezer) -> sucção (desce por dentro da parede da direita) -> compressor
  const zp = zt + e / 2;                                      // dentro da parede do fundo
  const descarga = [[0.1, 0.17, -0.21], [0.05, 0.2, -0.27], [-0.05, 0.21, zc], [-0.3, 0.24, zc], [-0.335, 0.32, zc], [-0.335, 1.13, zc], [-0.29, 1.2, zc]];
  const capilar = [[0.3, 0.36, zc], [0.335, 0.45, zc], [0.335, 1.62, zc], [0.3, 1.69, zp]];
  const evap = pontosSerpentina(0.24, -0.24, 1.69, 1.33, 4, zp);           // atrás do freezer; termina à direita
  const succao = [[0.29, 1.3, -0.24], [0.33, 1.22, -0.2], [0.33, 0.32, -0.2], [0.29, 0.17, -0.21], [0.17, 0.12, -0.21]];
  const tubos = new THREE.Group(); g.add(tubos);
  const tubosDentro = new THREE.Group(); tubos.add(tubosDentro);
  const frioM = toon('#8FB6D9');
  tubos.add(cano([...descarga, ptsCond[0]], 0.007, cobreM), cano([ptsCond[ptsCond.length - 1], ...capilar.slice(0, 3)], 0.005, cobreM));
  tubosDentro.add(cano(capilar.slice(2), 0.005, cobreM), cano([capilar[capilar.length - 1], ...evap, succao[0]], 0.008, frioM), cano([evap[evap.length - 1], ...succao], 0.009, frioM));
  const caminho = [...descarga, ...ptsCond, ...capilar, ...evap, ...succao];
  const u = fracoesDoCaminho(caminho, true);
  const iCond0 = descarga.length, iCond1 = iCond0 + ptsCond.length - 1, iValv = iCond1 + capilar.length, iEvap1 = iValv + evap.length, iIn = caminho.length - 1;
  const corGas = gradiente([[0, '#FF6A1E'], [u[iCond0], '#FF6A1E'], [u[iCond1], '#FFB43A'], [u[iValv] - 0.006, '#FFD08A'], [u[iValv], '#4F8BFF'],
    [u[iEvap1], '#7FB2FF'], [u[iIn], '#9CC4FF'], [u[iIn] + 0.004, '#FF6A1E'], [1, '#FF6A1E']]);
  const fluxoGas = fluxo(caminho, 90, { raio: 0.014, vel: 0.06 }); g.add(fluxoGas.group);
  const pontos = {
    compressor: V(0.1, 0.13, -0.21), condensador: V(0, 0.77, zc), valvula: V(0.3, 1.69, zp), evaporador: V(0, 1.51, zp),
    luz: V(0, yDiv0 - 0.02, -0.05), dentro: V(0, 0.75, 0), freezer: V(0, 1.5, 0), puxador: V(W / 2 - 0.06, 0.95, zf + 0.115),
  };
  return {
    group: g, porta, freezer, compressor, serpentina, tubos, tubosDentro, fluxoGas, corGas, pontos, escala,
    /** opacidade da carcaça (1 = normal; ~0,15 raio-x: corpo, portas, forro e prateleiras somem, a comida fica fraca, os tubos das paredes aparecem) */
    casca(op) {
      opac(casca, op); opac(comidaM, Math.min(1, op * 2));
      tubosDentro.visible = op < 0.999;
    },
    /** porta da geladeira (0 fechada, 1 aberta ~100°) e do freezer; a luz acende junto com a de baixo (chame luz(k) depois para outro valor) */
    aberta(k, kFreezer = 0) { porta.rotation.y = -k * 1.75; freezer.rotation.y = -kFreezer * 1.75; this.luz(Math.min(1, k * 4)); },
    /** luz interna 0..1 (lâmpada, forro claro e luz pontual) */
    luz(k) { internoM.emissiveIntensity = 0.5 * k; luzP.intensity = luzI * k; lampada.visible = k > 0.02; },
    /** bolinhas do gás pelo circuito (vermelho/laranja quente até a válvula, azul frio depois); k = 0 esconde */
    gas(t, { k = 1 } = {}) { fluxoGas.atualizar(t, { k, cores: corGas }); },
    reset() { this.casca(1); this.aberta(0, 0); fluxoGas.group.visible = false; g.visible = true; },
  };
}

// ---------------- celular ----------------
/** laje de cantos arredondados (planta w x d, altura h, centro na origem): 2 caixas em cruz + 4 cilindros nos cantos */
function lajeRedonda(w, h, d, r, mat, seg = 12) {
  const g = new THREE.Group();
  g.add(box(w - 2 * r, h, d, mat), box(w, h, d - 2 * r, mat));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(at(cyl(r, r, h, mat, seg), sx * (w / 2 - r), 0, sz * (d / 2 - r)));
  return g;
}
/**
 * celular em METROS, DEITADO de tela para cima: corpo 0,075 x 0,008 x 0,155 (largura x espessura x comprimento),
 * base em y = 0 (o calombo da câmera traseira encosta no tampo), topo para -z, conector embaixo (+z: a "frente",
 * virada para quem olha a mesa). Para ver em pé, de frente: group.rotation.x = Math.PI / 2 (tela para +z, topo +y).
 * Aro champanhe, traseira coral, vidro preto, 3 botões, alto-falante e conector, câmera traseira (3 lentes e flash).
 * Opções (coordenadas do grupo): tomada = [x, y, z] da face da tomada (o carregador encosta nela, de frente para
 * +z); via = pontos [x, y, z] por onde o cabo passa entre o carregador e o conector. Sem tomada não há cabo.
 * -> { group, tela(txt, pct, luz), casca(op), carga(k), bateria, placa, cabo, carregador, pontosCabo, pontos, reset() }
 */
export function celular({ tomada = null, via = [] } = {}) {
  const g = new THREE.Group();
  const W = 0.075, H = 0.008, L = 0.155, r = 0.011, y0 = 0.0015, yT = y0 + H;   // y0 = altura do calombo da câmera
  const aroM = toon('#D8BE93'), trasM = toon('#D9764A'), vidroM = toon('#15100D'), botaoM = toon('#C4A77C');
  const lenteM = toon('#1D2125'), anelM = toon('#9EA4AA'), calomboM = toon('#C9683F'), furoM = toon('#2B2622');
  const flashM = glow('#FFF1C1');
  // ----- corpo: aro (a lateral), traseira por baixo, vidro por cima -----
  const corpo = new THREE.Group(); g.add(corpo);
  corpo.add(at(lajeRedonda(W, H, L, r, aroM, 14), 0, y0 + H / 2, 0));
  corpo.add(at(lajeRedonda(W - 0.0016, 0.0007, L - 0.0016, r - 0.0008, trasM, 14), 0, y0 + 0.0002, 0));
  corpo.add(at(lajeRedonda(W - 0.0014, 0.0006, L - 0.0014, r - 0.0007, vidroM, 14), 0, yT + 0.0001, 0));
  // botões: liga/desliga à direita, volume (2) à esquerda
  corpo.add(at(box(0.0012, 0.0034, 0.018, botaoM), W / 2 + 0.0004, y0 + H / 2, -0.03));
  for (const z of [-0.045, -0.028]) corpo.add(at(box(0.0012, 0.0034, 0.012, botaoM), -W / 2 - 0.0004, y0 + H / 2, z));
  // embaixo (+z): conector no meio e furos do alto-falante dos lados
  corpo.add(at(box(0.009, 0.0032, 0.001, furoM), 0, y0 + H / 2, L / 2 + 0.0001));
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) corpo.add(at(box(0.0016, 0.0016, 0.001, furoM), s * (0.012 + i * 0.0035), y0 + H / 2, L / 2 + 0.0001));
  // câmera traseira (calombo embaixo do corpo, no canto de cima; vista de trás fica à esquerda)
  const cam = new THREE.Group(); at(cam, 0.0175, 0, -0.0535); corpo.add(cam);
  cam.add(at(lajeRedonda(0.034, y0 + 0.0004, 0.034, 0.008, calomboM, 12), 0, (y0 + 0.0004) / 2, 0));
  for (const [x, z] of [[0.0075, -0.0075], [0.0075, 0.0075], [-0.0075, 0]]) {
    cam.add(at(cyl(0.0066, 0.0066, 0.0012, anelM, 16), x, -0.0002, z), at(cyl(0.0052, 0.0052, 0.0014, lenteM, 16), x, -0.0004, z));
  }
  cam.add(at(cyl(0.0022, 0.0022, 0.0012, flashM, 10), -0.0085, -0.0002, -0.01), at(cyl(0.0014, 0.0014, 0.0012, lenteM, 8), -0.0085, -0.0002, 0.01));
  // ----- tela: textura de canvas com a fonte pixel (só repinta quando muda) -----
  const TW = 48, TH = 104;
  const tx = texturaCanvas(TW, TH);
  const telaM = new THREE.MeshBasicMaterial({ map: tx.tex });
  const telaMesh = at(new THREE.Mesh(new THREE.PlaneGeometry(W - 0.0055, L - 0.0065), telaM), 0, yT + 0.00045, 0);
  telaMesh.rotation.x = -Math.PI / 2; g.add(telaMesh);
  const cantos = (c) => {                                   // cantos arredondados da tela (na cor do vidro)
    c.fillStyle = '#15100D';
    for (const [x, y, sx, sy] of [[0, 0, 1, 1], [TW - 1, 0, -1, 1], [0, TH - 1, 1, -1], [TW - 1, TH - 1, -1, -1]]) {
      c.fillRect(Math.min(x, x + sx * 3), y, 3, 1); c.fillRect(x, Math.min(y, y + sy * 3), 1, 3); c.fillRect(x + sx, y + sy, 1, 1);
    }
  };
  let ultTela = null;
  /** leque do Wi-Fi (ponto + 3 arcos, abertura de ±45°): os `sinal` primeiros níveis acesos em laranja, o resto apagado */
  const leque = (c, sinal) => {
    const cx = 24, cy = 66, bandas = [[0, 3.3], [7, 10.6], [13.2, 16.8], [19.4, 23]];
    for (let y = 36; y < 70; y++) for (let x = 0; x < 48; x++) {
      const dx = x + 0.5 - cx, dy = cy - (y + 0.5), r = Math.hypot(dx, dy);
      const b = bandas.findIndex(([r0, r1]) => r >= r0 && r < r1);
      if (b < 0 || (b > 0 && (dy <= 0 || Math.abs(Math.atan2(dx, dy)) > 0.79))) continue;
      c.fillStyle = b < sinal ? '#FFB43A' : '#4A3A30'; c.fillRect(x, y, 1, 1);
    }
  };
  const pintarTela = (txt, pct0, sinal0 = null) => {
    const pct = Number.isFinite(pct0) ? pct0 : 0; // NaN/undefined não podem virar chave nem fillRect
    const sinal = Number.isFinite(sinal0) ? Math.max(0, Math.min(4, Math.round(sinal0))) : null;
    const key = txt == null ? 'off' : `${txt}|${Math.round(pct)}|${sinal}`;
    if (key === ultTela) return; ultTela = key;
    tx.pintar((c, w, h) => {
      if (txt == null) { c.fillStyle = '#0D0A08'; c.fillRect(0, 0, w, h); cantos(c); return; }
      c.fillStyle = '#1A120E'; c.fillRect(0, 0, w, h);               // fundo liso (faixas de tom escuro viram verde no quantizador)
      c.fillStyle = '#000'; c.fillRect(18, 3, 12, 3);                 // ilha da câmera da frente
      escrever(c, '22:47', w / 2, 11, 1, '#FFF1C1');
      if (sinal !== null) { leque(c, sinal); escrever(c, txt, w / 2, 82, 1, '#FFF1C1'); cantos(c); return; }
      // bateria grande em pé: contorno, polo e o nível subindo de baixo para cima
      const bx = 15, by = 30, bw = 18, bh = 42, f = Math.max(0, Math.min(100, pct)) / 100;
      c.fillStyle = '#FFF1C1'; c.fillRect(bx, by, bw, bh); c.fillRect(bx + 6, by - 3, bw - 12, 3);
      c.fillStyle = '#1A120E'; c.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
      const nh = Math.round((bh - 4) * f);
      c.fillStyle = '#FFB43A'; c.fillRect(bx + 2, by + bh - 2 - nh, bw - 4, nh);
      c.fillStyle = '#FFE08A'; if (nh > 0) c.fillRect(bx + 2, by + bh - 2 - nh, bw - 4, 1);   // brilho no topo do nível
      escrever(c, txt, w / 2, 82, 1, '#FFF1C1');
      cantos(c);
    });
  };
  // ----- por dentro (raio-x): bateria em camadas e placa -----
  const yi = y0 + 0.0008;                                   // fundo da cavidade
  const bateria = new THREE.Group(); at(bateria, 0, yi, 0.019); g.add(bateria);
  const BW = 0.064, BL = 0.098, camadas = ['#6E767E', '#C9682E', '#E9DCC0', '#5A626B', '#D9763F', '#E9DCC0', '#6E767E'];
  camadas.forEach((cor, i) => bateria.add(at(box(BW - (i % 2) * 0.0012, 0.0007, BL - (i % 2) * 0.0012, toon(cor)), 0, 0.00035 + i * 0.0007, 0)));
  const yb = camadas.length * 0.0007;
  bateria.add(at(box(BW, 0.0004, BL, toon('#2E3338')), 0, yb + 0.0002, 0));                 // capa (etiqueta escura)
  // medidor no meio da capa: moldura creme e o nível laranja subindo de baixo (+z) para cima (-z)
  const GW = 0.02, GL = BL - 0.024, nivelM = glow('#FFB43A'), nivel = new THREE.Group(); at(nivel, 0, yb + 0.00045, GL / 2); bateria.add(nivel);
  const nivelBarra = at(new THREE.Mesh(new THREE.PlaneGeometry(GW, 1), nivelM), 0, 0, -0.5); nivelBarra.rotation.x = -Math.PI / 2; nivel.add(nivelBarra);
  const molduraNivel = toon('#FFF1C1'), ym = yb + 0.0005, e = 0.0014;
  for (const s of [-1, 1]) bateria.add(at(box(e, 0.0003, GL + 2 * e, molduraNivel), s * (GW / 2 + e / 2), ym, 0), at(box(GW + 2 * e, 0.0003, e, molduraNivel), 0, ym, s * (GL / 2 + e / 2)));
  bateria.add(at(box(0.008, 0.0003, 0.003, molduraNivel), 0, ym, -GL / 2 - e - 0.0015));                       // polo
  bateria.add(at(box(0.012, 0.0014, 0.006, toon('#B9BEC4')), -0.02, 0.0014, -BL / 2 - 0.003));   // conector da bateria
  const placa = new THREE.Group(); at(placa, 0, yi, 0); g.add(placa);
  const pcbM = toon('#2E5A43'), chipM = toon('#1D2125'), ouroM = toon('#E9C46A'), blindM = toon('#AEB3B8'), flexM = toon('#E2843A');
  placa.add(at(box(0.066, 0.0008, 0.042, pcbM), 0, 0.0004, -0.053));                        // placa principal (em cima)
  placa.add(at(box(0.05, 0.0008, 0.008, pcbM), 0, 0.0004, 0.072));                           // plaquinha do conector (embaixo)
  placa.add(at(box(0.024, 0.0018, 0.016, blindM), -0.012, 0.0017, -0.044));                   // blindagem do processador
  placa.add(at(box(0.011, 0.0016, 0.011, chipM), 0.004, 0.0016, -0.062), at(box(0.008, 0.0014, 0.006, chipM), -0.024, 0.0015, -0.065));
  for (let i = 0; i < 6; i++) placa.add(at(box(0.0022, 0.0009, 0.0022, ouroM), -0.026 + i * 0.0045, 0.001, -0.036));
  placa.add(at(box(0.016, 0.004, 0.03, chipM), 0.0175, 0.0028, -0.0535));                     // módulo das câmeras
  placa.add(at(box(0.006, 0.0005, 0.106, flexM), -0.0295, 0.0011, 0.016));                    // cabo flexível até o conector
  placa.add(at(box(0.009, 0.003, 0.006, blindM), 0, 0.0024, 0.073));                          // conector USB-C
  // aro sozinho (anel extrudado, opaco), só no raio-x: o contorno do celular fica firme e o miolo limpo
  const forma = (w, l, rr) => {
    const f = new THREE.Shape(), x = w / 2, z = l / 2;
    f.moveTo(-x + rr, -z); f.lineTo(x - rr, -z); f.quadraticCurveTo(x, -z, x, -z + rr); f.lineTo(x, z - rr); f.quadraticCurveTo(x, z, x - rr, z);
    f.lineTo(-x + rr, z); f.quadraticCurveTo(-x, z, -x, z - rr); f.lineTo(-x, -z + rr); f.quadraticCurveTo(-x, -z, -x + rr, -z);
    return f;
  };
  const anel = forma(W - 0.0002, L - 0.0002, r); anel.holes.push(forma(W - 0.0034, L - 0.0034, r - 0.0016));
  const aroRX = new THREE.Mesh(new THREE.ExtrudeGeometry(anel, { depth: H, bevelEnabled: false, curveSegments: 4 }), toon('#D8BE93'));
  aroRX.rotation.x = -Math.PI / 2; at(aroRX, 0, y0, 0); g.add(aroRX);
  const dentro = [bateria, placa, aroRX];
  // ----- carregador na tomada e cabo até o conector -----
  const cabo = new THREE.Group(), carregador = new THREE.Group(); g.add(cabo, carregador);
  let pontosCabo = null;
  const brancoM = toon('#F4F1EA'), cinzaM = toon('#D6D1C7'), pretoM = toon('#2E3338');
  if (tomada) {
    const [tx0, ty0, tz0] = tomada, cw = 0.042, ch = 0.046, cd = 0.03;
    at(carregador, tx0, ty0, tz0);
    const caixa = at(lajeRedonda(cw, cd, ch, 0.006, pretoM, 10), 0, 0, cd / 2); caixa.rotation.x = Math.PI / 2; carregador.add(caixa);   // em pé, frente +z
    carregador.add(at(box(0.012, 0.005, 0.002, toon('#14100E')), 0, -0.01, cd + 0.0005));     // porta USB na frente, embaixo
    carregador.add(at(box(0.004, 0.004, 0.002, glow('#FFB43A')), 0, 0.012, cd + 0.0005));      // luzinha acesa
    carregador.add(at(box(0.009, 0.004, 0.012, brancoM), 0, -0.01, cd + 0.006));              // plugue do cabo
    const saida = [tx0, ty0 - 0.01, tz0 + cd + 0.012];
    const boca = [0, y0 + H / 2, L / 2 + 0.014];                                                 // fim do plugue do lado do celular
    pontosCabo = [saida, [saida[0], saida[1] - 0.004, saida[2] + 0.012], ...via, [boca[0], boca[1] - 0.001, boca[2] + 0.01], boca];
    const curva = new THREE.CatmullRomCurve3(pontosCabo.map((p) => V(...p)), false, 'centripetal');
    const fio = new THREE.Mesh(new THREE.TubeGeometry(curva, 120, 0.003, 6, false), brancoM); fio.castShadow = true; fio.userData.noEdge = true; cabo.add(fio);   // sem linha interna: fio fino não vira tracejado
    cabo.add(at(box(0.0085, 0.0036, 0.014, brancoM), 0, y0 + H / 2, L / 2 + 0.007));          // plugue USB-C no celular
    cabo.add(at(box(0.0066, 0.0022, 0.002, cinzaM), 0, y0 + H / 2, L / 2 + 0.0005));
  }
  // ----- raio-x (padrão da geladeira: transparente só quando op < 1) -----
  const casca = [aroM, trasM, vidroM, botaoM, lenteM, anelM, calomboM, furoM, flashM, telaM];
  casca.forEach((m) => { m.userData.base = m.opacity; });
  const pontos = {
    tela: V(0, yT + 0.0005, 0), bateria: V(0, yi + 0.005, 0.019), placa: V(-0.012, yi + 0.003, -0.044), camera: V(0.0175, 0, -0.0535),
    conector: V(0, y0 + H / 2, L / 2), carregador: tomada ? V(tomada[0], tomada[1], tomada[2] + 0.03) : null,
  };
  return {
    group: g, corpo, bateria, placa, cabo, carregador, pontosCabo, pontos, medidas: { W, H, L, y0 },
    /**
     * texto e nível da tela (txt = null apaga; pct em 0..100 enche a bateria desenhada; luz 0..1 = brilho).
     * { sinal }: 0..4 troca a bateria pelo leque do Wi-Fi (ponto + 3 arcos; os `sinal` primeiros acesos), ex.:
     * tela('WI-FI', 0, 1, { sinal: barrasDeSinal(dbm) }).
     */
    tela(txt, pct = 0, luz = 1, { sinal = null } = {}) { pintarTela(txt, pct, sinal); telaM.color.setScalar(txt == null ? 1 : Math.max(0, Math.min(1, luz))); },
    /** opacidade da carcaça (1 = normal; ~0,15 raio-x: aro, traseira, vidro e tela somem (opacidade op²), aparecem bateria, placa e o anel do aro) */
    casca(op) {
      for (const m of casca) {
        const tr = op < 0.999 || m.userData.base < 1;
        if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
        m.opacity = m.userData.base * op * op; m.depthWrite = !tr;   // op²: a carcaça some rápido e não suja o raio-x
      }
      for (const o of dentro) o.visible = op < 0.999;
      corpo.visible = telaMesh.visible = op > 0.25;          // abaixo disso a carcaça (op² < 6%) só deixaria manchas quantizadas
    },
    /** nível de carga desenhado em cima da bateria (0..1; só aparece no raio-x) */
    carga(k) { const f = Math.max(0, Math.min(1, k)); nivel.scale.z = Math.max(f * GL, 1e-5); nivelBarra.visible = f > 0.001; },
    reset() { this.casca(1); this.tela(null); this.carga(0); g.visible = true; cabo.visible = carregador.visible = true; },
  };
}

// ---------------- chuveiro elétrico ----------------
/** pedaço [a, b] (em fração do comprimento) de uma curva, como curva própria (para colorir trechos de um tubo) */
class PedacoDaCurva extends THREE.Curve {
  constructor(curva, a, b) { super(); this.curva = curva; this.a = a; this.b = b; }
  getPoint(t, alvo = new THREE.Vector3()) { return this.curva.getPointAt(this.a + (this.b - this.a) * t, alvo); }
}
/** cor da resistência: cinza (frio) -> laranja -> vermelho (k = 1) */
export const corResistencia = gradiente([[0, '#8C949C'], [0.5, '#E2843A'], [1, '#E0482E']]);
/**
 * chuveiro elétrico brasileiro em METROS, preso na parede: o grupo começa no ponto da parede (use B.parede.add(ch.group)
 * no banheiro()) e o braço sai em +z. Canopla e braço branco de 30 cm; corpo branco em sino (domo em cima) com o eixo
 * em z = 0,30; crivo redondo (raio 0,088, furos) embaixo, a 0,144 do braço; chave de 3 posições na frente-direita do
 * sino (azimute 0,9 rad; desligado / verão / inverno, marcas cinza, âmbar e vermelha); 3 fios (preto, vermelho e terra verde) saindo de trás
 * do domo para a parede. Por dentro (raio-x): câmara de água, resistência em espiral (5 voltas) com 3 bornes na tampa
 * (entrada, meio = inverno, ponta = verão) e a água descendo encostada no fio.
 * Opção: altura = queda do crivo até o chão (2,05 no banheiro(), com o ponto a 2,2). Não projeta sombra (escada no azulejo).
 * -> { group, corpo, crivo, chaveG, alavanca, dentro, aguaFx, fluxoAgua, pontos, altura, casca(op), resistencia(k), agua(k, t), chave(pos), reset() }
 * pontos = coordenadas do grupo: use noMundo(ch.group, ch.pontos.crivo).
 */
export function chuveiro({ altura = 2.05 } = {}) {
  const g = new THREE.Group();
  const ZC = 0.3;                                             // eixo do corpo: 30 cm à frente da parede
  const brancoM = toon('#F4F1EA'), canoM = toon('#EDE8DE'), cinzaM = toon('#E2DED6'), aroM = toon('#F4F1EA');
  // ----- canopla, braço e cotovelo (ficam no raio-x) -----
  const canopla = at(cyl(0.034, 0.034, 0.012, canoM, 18), 0, 0, 0.006); canopla.rotation.x = Math.PI / 2; g.add(canopla);
  const braco = at(cyl(0.0125, 0.0125, ZC - 0.012, canoM, 12), 0, 0, (ZC + 0.012) / 2); braco.rotation.x = Math.PI / 2; g.add(braco);
  g.add(at(sph(0.0145, canoM, 12), 0, 0, ZC), at(cyl(0.0125, 0.0125, 0.044, canoM, 12), 0, -0.022, ZC));   // descida até a tampa da câmara (aparece no raio-x)
  // ----- fios saindo de trás do domo para a parede, por cima do braço -----
  [['#2B2622', -0.007], ['#D9443A', 0], ['#4E9A4A', 0.007]].forEach(([cor, x]) => {
    const pts = [[x, -0.03, ZC - 0.045], [x, -0.006, ZC - 0.07], [x, 0.03, ZC - 0.14], [x, 0.045, 0.06], [x, 0.045, 0.0]];
    const curva = new THREE.CatmullRomCurve3(pts.map((p) => V(...p)), false, 'centripetal');
    const fio = new THREE.Mesh(new THREE.TubeGeometry(curva, 40, 0.0022, 6, false), toon(cor)); fio.userData.noEdge = true; g.add(fio);
  });
  // ----- corpo (subgrupo no eixo): carcaça em sino + domo; crivo embaixo -----
  const corpo = new THREE.Group(); at(corpo, 0, 0, ZC); g.add(corpo);
  const carcaca = new THREE.Group(); corpo.add(carcaca);
  const domo = at(sph(0.05, brancoM, 22), 0, -0.04, 0); domo.scale.y = 0.5; carcaca.add(domo);
  carcaca.add(at(cyl(0.05, 0.082, 0.085, brancoM, 30), 0, -0.0825, 0));
  const crivo = new THREE.Group(); corpo.add(crivo);
  crivo.add(at(cyl(0.088, 0.086, 0.018, cinzaM, 30), 0, -0.134, 0));
  const furos = texturaCanvas(32, 32, (c, w) => {
    c.fillStyle = '#D6D1C7'; c.fillRect(0, 0, w, w);
    c.fillStyle = '#5A626B';
    for (let i = 0; i < 44; i++) { const r = 13.5 * Math.sqrt((i + 0.5) / 44), a = i * 2.39996323; c.fillRect(Math.round(16 + r * Math.cos(a) - 0.5), Math.round(16 + r * Math.sin(a) - 0.5), 1, 1); }
  });
  const face = at(new THREE.Mesh(new THREE.CircleGeometry(0.084, 30), toon('#FFFFFF', { map: furos.tex, side: THREE.DoubleSide })), 0, -0.1432, 0);
  face.rotation.x = Math.PI / 2; crivo.add(face);
  // ----- chave de 3 posições na frente-direita do sino (azimute 0,9 rad; inclinada com a parede do sino) -----
  const yc = -0.085, rc = 0.05 + 0.032 * ((-0.04 - yc) / 0.085), AZ = 0.9;
  const giroChave = new THREE.Group(); giroChave.rotation.y = AZ; corpo.add(giroChave);
  // caixinha redonda saindo do sino (o disco plano afastado 5 mm não entra na curva do sino)
  const chaveG = new THREE.Group(); at(chaveG, 0, yc, rc + 0.005); chaveG.rotation.x = -Math.atan(0.032 / 0.085); giroChave.add(chaveG);   // o sino abre para baixo: a parede olha para cima
  const caixaChave = at(cyl(0.0235, 0.0235, 0.008, cinzaM, 20), 0, 0, -0.004); caixaChave.rotation.x = Math.PI / 2; chaveG.add(caixaChave);
  chaveG.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.0235, 20), toon('#D6D1C7')), 0, 0, 0.0001));
  const ANG = 0.9;                                            // desligado +0,9 rad (esquerda), verão 0 (em cima), inverno -0,9 (direita)
  [['#6E767E', ANG], ['#FFB43A', 0], ['#E0482E', -ANG]].forEach(([cor, a]) => {
    const mk = at(box(0.0055, 0.0055, 0.002, glow(cor)), -Math.sin(a) * 0.0182, Math.cos(a) * 0.0182, 0.001); mk.rotation.z = a; chaveG.add(mk);
  });
  const alavanca = new THREE.Group(); at(alavanca, 0, 0, 0.002); chaveG.add(alavanca);
  const chaveM = toon('#3A4148');
  const botao = at(cyl(0.0058, 0.0058, 0.006, chaveM, 14), 0, 0, 0.003); botao.rotation.x = Math.PI / 2; alavanca.add(botao);
  alavanca.add(at(box(0.0055, 0.0135, 0.0045, chaveM), 0, 0.0072, 0.003));
  // ----- por dentro (raio-x): aros do sino, câmara, tampa com bornes, resistência em espiral, água -----
  const dentro = new THREE.Group(); corpo.add(dentro);
  const aro = (r, y, tubo, m) => { const o = at(new THREE.Mesh(new THREE.TorusGeometry(r, tubo, 6, 36), m), 0, y, 0); o.rotation.x = Math.PI / 2; return o; };
  dentro.add(aro(0.05, -0.04, 0.0022, aroM), aro(0.0815, -0.125, 0.0026, aroM));          // silhueta do sino no raio-x
  const camM = toon('#C9CED3');
  dentro.add(aro(0.045, -0.049, 0.0018, camM), aro(0.045, -0.12, 0.0018, camM));           // bocas da câmara de água
  dentro.add(at(cyl(0.047, 0.047, 0.004, toon('#AEB3B8'), 24), 0, -0.046, 0));             // tampa da câmara
  const aguaDentroM = glow('#4F8BFF', 0.24); aguaDentroM.side = THREE.BackSide;
  const aguaDentro = at(cyl(0.044, 0.044, 0.07, aguaDentroM, 24), 0, -0.0845, 0); aguaDentro.castShadow = false; dentro.add(aguaDentro);
  // resistência: hélice cortada em pedaços (cada um com material próprio, para pintar o trecho usado)
  const P = pontosEspiral(5, 0.03, -0.056, -0.112, 12), NP = P.length - 1;
  const curvaR = new THREE.CatmullRomCurve3(P.map((p) => V(...p)), false, 'centripetal');
  const S = 30, pedacos = [];
  for (let s = 0; s < S; s++) {
    const m = toon('#8C949C', { emissive: '#000000' });
    const o = new THREE.Mesh(new THREE.TubeGeometry(new PedacoDaCurva(curvaR, s / S, (s + 1) / S), 6, 0.0032, 6, false), m);
    dentro.add(o); pedacos.push({ m, u: (s + 0.5) / S });
  }
  // terminais: entrada (topo da hélice), meio (borne do inverno) e ponta (verão), subindo até os bornes da tampa
  const yT = -0.048, kMeio = Math.round(TRECHO_INVERNO * NP);
  const p0 = P[0], pm = P[kMeio], pf = P[NP];
  const terminais = [[p0, [p0[0], yT, p0[2]]], [pm, [pm[0] * 0.55, pm[1], pm[2] * 0.55], [pm[0] * 0.55, yT, pm[2] * 0.55]], [pf, [0, pf[1], 0], [0, yT, 0]]];
  const terminalM = toon('#B9BEC4'), bornes = [];
  for (const pts of terminais) {
    const c = new THREE.CatmullRomCurve3(pts.map((p) => V(...p)), false, 'catmullrom', 0.1);
    dentro.add(new THREE.Mesh(new THREE.TubeGeometry(c, 12, 0.0016, 5, false), terminalM));
    const topo = pts[pts.length - 1], bm = toon('#C98447', { emissive: '#FFB43A', emissiveIntensity: 0 });
    dentro.add(at(cyl(0.0042, 0.0042, 0.006, bm, 10), topo[0], -0.041, topo[2])); bornes.push(bm);
  }
  // água descendo encostada na resistência (do cano até o crivo), azul que esquenta no caminho
  const pa = [[0, -0.03, 0], [0.012, -0.046, 0.01], ...pontosEspiral(3, 0.039, -0.054, -0.116, 10), [0.02, -0.126, 0], [0, -0.14, 0]];
  const fluxoAgua = fluxo(pa, 34, { cor: '#8FD0FF', raio: 0.0034, vel: 0.3, fechado: false }); dentro.add(fluxoAgua.group);
  // água caindo do crivo
  const aguaFx = agua(64); g.add(aguaFx.group);
  // sem sombra própria: o mapa de sombra do cômodo (1,2 cm por texel) vira escada no azulejo nos closes
  g.traverse((o) => { o.castShadow = false; });
  // ----- estado -----
  const casca = [brancoM]; casca.forEach((m) => { m.userData.base = m.opacity; });
  const frioInativo = new THREE.Color('#4A5058'), azul = new THREE.Color('#8FD0FF'), morno = new THREE.Color('#FFE9C4'), quenteA = new THREE.Color('#FF8A3A');
  const cAgua = new THREE.Color(), cTmp = new THREE.Color();
  let kRes = 0, trecho = 0;
  const corAgua = (u) => {                                    // azul na entrada, esquentando até o crivo (pelo calor da resistência)
    const h = kRes * Math.min(1, u * 1.15);
    return h < 0.5 ? cAgua.copy(azul).lerp(morno, h * 2) : cAgua.copy(morno).lerp(quenteA, (h - 0.5) * 2);
  };
  const pintar = () => {
    const quente = corResistencia(kRes);
    for (const { m, u } of pedacos) {
      const d = dentroDoTrecho(u, trecho, 0.04);
      m.color.copy(frioInativo).lerp(cTmp.copy(quente), d);
      m.emissive.copy(quente); m.emissiveIntensity = 0.75 * kRes * d;
    }
    const meio = trecho > 0 && trecho < 0.999, ponta = trecho >= 0.999;
    [trecho > 0, meio, ponta].forEach((on, i) => { bornes[i].emissiveIntensity = on ? 0.9 : 0; });
    aguaDentroM.color.copy(azul).lerp(quenteA, 0.35 * kRes);
  };
  const pontos = {
    crivo: V(0, -0.144, ZC), chave: V(Math.sin(AZ) * (rc + 0.008), yc, ZC + Math.cos(AZ) * (rc + 0.008)), resistencia: V(0, -0.084, ZC + 0.033), camara: V(0, -0.084, ZC),
    agua: V(0, -0.36, ZC), aguaDentro: V(-0.039, -0.1, ZC), braco: V(0, 0, 0.15), fios: V(0, 0.045, 0.08),
    bornes: V(0, -0.041, ZC),
  };
  return {
    group: g, corpo, crivo, chaveG, alavanca, dentro, aguaFx, fluxoAgua, pontos, altura,
    /** opacidade da carcaça (1 = normal; ~0,15 raio-x: o sino e o domo somem (op²; abaixo de 0,25 escondidos), ficam os aros, a câmara, a resistência, o crivo e a chave) */
    casca(op) {
      for (const m of casca) {
        const tr = op < 0.999;
        if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
        m.opacity = m.userData.base * op * op; m.depthWrite = !tr;
      }
      carcaca.visible = op > 0.25; dentro.visible = op < 0.999;
    },
    /** calor da resistência 0..1: o trecho usado vai de cinza a laranja e vermelho (brilho próprio); a água de dentro esquenta */
    resistencia(k) { kRes = Math.max(0, Math.min(1, k)); pintar(); },
    /** posição da chave: 0 desligado, 1 verão (fio inteiro), 2 inverno (só o trecho até o borne do meio); no meio = animando */
    chave(pos) {
      const p = Math.max(0, Math.min(2, pos));
      alavanca.rotation.z = ANG * (1 - p); trecho = trechoDaChave(p); pintar();
    },
    /** vazão 0..1 (0 = fechado): água caindo do crivo e, no raio-x, descendo pela câmara. Passe t (função pura de t). */
    agua(k, t = 0) {
      const kk = Math.max(0, Math.min(1, k));
      aguaFx.atualizar(t, { origem: [0, -0.146, ZC], k: kk, largura: 0.068, altura });
      fluxoAgua.atualizar(t, { k: kk, cores: corAgua });
      aguaDentro.visible = kk > 0.01;
    },
    reset() { this.casca(1); this.chave(0); this.resistencia(0); this.agua(0); g.visible = true; },
  };
}

// ---------------- roteador Wi-Fi ----------------
/**
 * roteador Wi-Fi em METROS: caixa preta 0,24 x 0,045 x 0,16 (largura x altura x profundidade) sobre 4 pés, base em
 * y = 0, frente em +z (4 LEDs verdes numa faixa), frisos de ventilação em cima, 3 antenas pretas atrás (0,17 de
 * altura; as dos lados abertas para fora) e 2 cabos (força e rede) saindo de trás e descendo. Na sala:
 * sala({ roteador: true }) põe em S.estante (x local 0,1) e devolve S.rot.
 * -> { group, corpo, antenas, pontos, leds(t, k), reset() }
 *   leds(t, k): LED 0 energia (fixo), 1 internet (pisca raro), 2 e 3 Wi-Fi 2,4 e 5 GHz (piscam com o tráfego);
 *   k 0..1 = brilho geral (0 = tudo apagado). Puro em t (wifi.mjs: ledDoRoteador).
 * pontos (coordenadas do grupo; no mundo: noMundo(rot.group, rot.pontos.antena)): antena (ponta da do meio),
 * antenas (as 3 pontas), led (LED do Wi-Fi 2,4), centro, emissor (de onde saem as ondas: entre as antenas).
 */
export function roteador() {
  const g = new THREE.Group();
  const W = 0.24, H = 0.045, D = 0.16, yP = 0.008, yT = yP + H;
  const pretoM = toon('#22262A'), topoM = toon('#2E3338'), frisoM = toon('#14171A'), antM = toon('#1D2125'), faixaM = toon('#14171A');
  const corpo = new THREE.Group(); g.add(corpo);
  corpo.add(at(box(W, H, D, pretoM), 0, yP + H / 2, 0));
  corpo.add(at(box(W - 0.012, 0.004, D - 0.012, topoM), 0, yT + 0.002, 0));                       // tampa (um degrau)
  for (let i = 0; i < 7; i++) corpo.add(at(box(0.13, 0.002, 0.006, frisoM), 0.02, yT + 0.0045, -0.05 + i * 0.016));   // frisos de ventilação
  for (const [x, z] of [[-0.1, -0.06], [0.1, -0.06], [-0.1, 0.06], [0.1, 0.06]]) corpo.add(at(box(0.02, yP, 0.02, frisoM), x, yP / 2, z));
  corpo.add(at(box(W - 0.03, 0.014, 0.002, faixaM), 0, yP + H * 0.45, D / 2 + 0.001));             // faixa dos LEDs
  // LEDs: verde aceso / verde-escuro apagado (glow: não dependem de luz)
  const ledOn = new THREE.Color('#8BE36A'), ledOff = new THREE.Color('#1F3324');
  const ledMs = [], xsLed = [-0.075, -0.035, 0.005, 0.045];
  for (const x of xsLed) { const m = glow('#1F3324'); ledMs.push(m); corpo.add(at(box(0.012, 0.006, 0.003, m), x, yP + H * 0.45, D / 2 + 0.0025)); }
  // antenas (dobradiça + haste que afina + ponta redonda); as dos lados abertas
  const antenas = [], pontas = [], zA = -D / 2 + 0.012, LA = 0.17;
  [[-0.095, 0.2], [0, 0], [0.095, -0.2]].forEach(([x, giro]) => {
    corpo.add(at(box(0.02, 0.016, 0.018, antM), x, yT + 0.006, zA));
    const piv = new THREE.Group(); at(piv, x, yT + 0.012, zA); piv.rotation.z = giro; g.add(piv);
    piv.add(at(cyl(0.0055, 0.0075, LA, antM, 10), 0, LA / 2, 0), at(sph(0.0058, antM, 10), 0, LA, 0));
    antenas.push(piv); pontas.push(V(x - Math.sin(giro) * LA, yT + 0.012 + Math.cos(giro) * LA, zA));
  });
  // cabos de força (preto) e de rede (creme) saindo de trás e descendo atrás do móvel
  const fioM = toon('#1D2125'), redeM = toon('#E9DCC0');
  [[0.05, fioM], [0.075, redeM]].forEach(([x, m], i) => {
    const pts = [[x, yP + 0.015, -D / 2], [x, yP + 0.012, -D / 2 - 0.03], [x + 0.01 * i, 0.002, -D / 2 - 0.06], [x + 0.01 * i, -0.02, -D / 2 - 0.085], [x + 0.01 * i, -0.3, -D / 2 - 0.09]];
    const curva = new THREE.CatmullRomCurve3(pts.map((p) => V(...p)), false, 'centripetal');
    const fio = new THREE.Mesh(new THREE.TubeGeometry(curva, 30, 0.003, 6, false), m); fio.userData.noEdge = true; g.add(fio);
  });
  const pontos = {
    antena: pontas[1], antenas: pontas, led: V(xsLed[2], yP + H * 0.45, D / 2 + 0.004), centro: V(0, yP + H / 2, 0),
    emissor: V(0, yT + 0.09, zA),
  };
  return {
    group: g, corpo, antenas, pontos,
    /** LEDs no tempo t (puro); k = brilho geral 0..1 */
    leds(t, k = 1) {
      const kk = Math.max(0, Math.min(1, k));
      ledMs.forEach((m, i) => { m.color.copy(ledOff).lerp(ledOn, ledDoRoteador(i, t) * kk); });
    },
    reset() { this.leds(0, 0); g.visible = true; },
  };
}

// ---------------- lâmpada LED ----------------
/**
 * lâmpada LED (bulbo A60) em METROS, pendurada para -y: o grupo começa no fundo do bocal (S.teto) e a rosca E27
 * (metálica, 4 anéis) sobe 1,2 cm para dentro dele; abaixo, o pescoço branco de plástico e o bulbo leitoso (raio 3 cm,
 * fundo a ~9 cm do bocal). Por dentro: a placa redonda de alumínio virada para baixo, no alto do bulbo, com 8 chips
 * LED amarelos em anel e 1 no meio (o amarelo é o fósforo que cobre cada chip). Na sala: sala({ lampada: true }) a
 * rosqueia em S.teto e devolve S.lamp.
 * -> { group, bulbo, placa, chip, chips, luz, pontos, casca(op), acesa(k), reset() }
 *   casca(op): 1 normal (bulbo leitoso opaco); ~0,35 raio-x: o bulbo vira um véu (op²; transparente só quando
 *     op < 1, sem fantasma de contorno), o halo some e aparecem a placa e os chips.
 *   acesa(k): 0..1 = bulbo emissivo, chips acesos, um halo leve e uma PointLight quente que ilumina o cômodo de verdade.
 *     Escureça o cômodo junto (S.anoitecer(k)) para a luz aparecer.
 * pontos (coordenadas do grupo): bulbo (centro do bulbo), chip (chip do meio), placa, rosca, fundo (ponta de baixo).
 */
export function lampada() {
  const g = new THREE.Group();
  const roscaM = toon('#C9CED3'), anelM = toon('#AEB3B8'), colarM = toon('#F4F1EA');
  // rosca E27 (de y = +0,012, dentro do bocal, até -0,014) com anéis
  g.add(at(cyl(0.0135, 0.0135, 0.026, roscaM, 16), 0, -0.001, 0));
  for (const y of [0.008, 0.002, -0.004, -0.01]) { const a = at(new THREE.Mesh(new THREE.TorusGeometry(0.0137, 0.0013, 5, 20), anelM), 0, y, 0); a.rotation.x = Math.PI / 2; g.add(a); }
  // pescoço de plástico (abre para o bulbo)
  g.add(at(cyl(0.0145, 0.022, 0.02, colarM, 18), 0, -0.024, 0));
  // bulbo leitoso
  const yB = -0.059, RB = 0.03;
  const bulboM = toon('#F4EFE6', { emissive: '#FFF1C1', emissiveIntensity: 0.08 });
  const bulbo = at(sph(RB, bulboM, 24), 0, yB, 0); bulbo.scale.y = 1.06; g.add(bulbo);
  // por dentro: placa de alumínio virada para baixo e os chips (fósforo amarelo)
  const placa = new THREE.Group(); at(placa, 0, -0.037, 0); g.add(placa);
  placa.add(at(cyl(0.019, 0.019, 0.002, toon('#B9BEC4'), 20), 0, 0, 0));
  placa.add(at(cyl(0.006, 0.006, 0.0022, toon('#E9DCC0'), 10), 0, 0.0003, 0));                   // furo do meio (fios do driver)
  // o fósforo é amarelo mesmo na sombra (a placa olha para baixo): um pouco de brilho próprio amarelo; aceso vai a creme
  const chipM = toon('#F2C94C', { emissive: '#F2C94C', emissiveIntensity: 0.35 });
  const chipApagado = new THREE.Color('#F2C94C'), chipAceso = new THREE.Color('#FFF6DD');
  const chips = [];
  const umChip = (x, z) => { const c = at(box(0.0045, 0.0016, 0.0045, chipM), x, -0.0016, z); placa.add(c); chips.push(c); return c; };
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; umChip(Math.cos(a) * 0.0128, Math.sin(a) * 0.0128); }
  const chip = umChip(0, 0);
  // halo leve (duas cascas glow transparentes, sem contorno) e a luz
  const haloM = [glow('#FFE9C4', 0.16), glow('#FFE9C4', 0.07)];
  const halos = haloM.map((m, i) => { const h = at(new THREE.Mesh(new THREE.SphereGeometry(RB * (1.5 + i * 0.8), 18, 12), m), 0, yB, 0); h.userData.base = m.opacity; g.add(h); return h; });
  const luz = new THREE.PointLight('#FFE6BE', 0, 0, 1.5); at(luz, 0, yB - 0.01, 0); g.add(luz);
  g.traverse((o) => { o.castShadow = false; });
  const pontos = { bulbo: V(0, yB, 0), chip: V(0, -0.0386, 0), placa: V(0, -0.037, 0), rosca: V(0, -0.006, 0), fundo: V(0, yB - RB * 1.06, 0) };
  let kAcesa = 0, raioX = false;
  const halo = () => halos.forEach((h) => { h.material.opacity = h.userData.base * kAcesa; h.visible = kAcesa > 0.01 && !raioX; });
  return {
    group: g, bulbo, placa, chip, chips, luz, pontos,
    /** opacidade do bulbo (1 = leitoso; ~0,35 raio-x: um véu, a placa com os chips aparece; o halo some no raio-x) */
    casca(op) {
      const tr = op < 0.999;
      if (bulboM.transparent !== tr) { bulboM.transparent = tr; bulboM.needsUpdate = true; }
      bulboM.opacity = op * op; bulboM.depthWrite = !tr;
      raioX = tr; this.acesa(kAcesa);
    },
    /**
     * acesa 0..1: bulbo e chips brilham, halo e luz pontual (intensidade 3,5 com decaimento 1,5: ilumina a sala).
     * No raio-x (casca < 1) a luz pontual cai para 3%: colada no pescoço e na casca transparente ela estoura o close
     * (o alvo de render guarda brilho acima de 1). A ordem de casca() e acesa() não importa.
     */
    acesa(k) {
      kAcesa = Math.max(0, Math.min(1, k));
      bulboM.emissiveIntensity = 0.08 + 1.1 * kAcesa * (raioX ? 0.3 : 1);
      chipM.emissive.copy(chipApagado).lerp(chipAceso, kAcesa); chipM.emissiveIntensity = 0.35 + 0.9 * kAcesa;
      luz.intensity = 3.5 * kAcesa * (raioX ? 0.03 : 1); halo();
    },
    reset() { this.casca(1); this.acesa(0); g.visible = true; },
  };
}
