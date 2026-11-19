// Vitrine do kit pixel: uma cena de ~2,5 s por linha do script.json, cada uma mostrando uma peça do kit
// (cozinha, micro-ondas em raio-x, lasanha, corte da lasanha, planta técnica, micro mundo, tela perfurada,
// molécula e ímã no estúdio, arcos e vapor, HUD com valor e etiqueta, casa, fluxo, ondas, geladeira na cozinha
// (porta, raio-x com o gás) e ciclo do frio, celular (em pé, no quarto carregando, tela, raio-x), bateria por dentro
// (carregando e descarregando), chuveiro elétrico (no banheiro, chave, raio-x) e resistência por dentro (verão e
// inverno), roteador e Wi-Fi (close, vista de cima atravessando a parede, sinal no celular, planta com 2,4 e 5 GHz),
// lâmpada LED (acendendo na sala, raio-x) e chip LED por dentro (junção e fóton), cartão final). A legenda é o texto da linha.
// montarCenas(E, { tempo, tema, script }) -> { cenas, cues }. Cada cena: { id, at, note, draw(lt, d, t, blit) }.
// Receitas de câmera/reset do modelo (modelo/src/cenas.js) e do teste-pixel. Todo quadro = função pura de t:
// cada draw começa resetando tudo o que a cena controla.
//
// Para acrescentar uma peça: uma linha nova no script.json (antes de "cartão final") e um bloco cena(i, ...) aqui,
// com i = índice da linha. A cena do cartão final usa tempo.ultima, então fica sempre por último.
import { camera, glow } from '../kit/motor/pixel.js';
import { lerp, seg, eo, eio } from '../kit/motor/lib.js';
import { valorTopo, etiqueta, cartaoFinal } from '../kit/hud.mjs';
import { V, L3, at, sph, olhar, projetar, noMundo } from '../kit/mundo/pecas.js';
import { lasanha, corteLasanha, molecula, ima, celular } from '../kit/mundo/props.js';
import { calorDaChave, TRECHO_INVERNO } from '../kit/mundo/chuveiro.mjs';
import { perdaNaParede, fatorDaParede, forcaDoSinal, barrasDeSinal } from '../kit/mundo/wifi.mjs';
import { cozinha, planta, microMundo, telaPerfurada, estudio, sala, banheiro, quarto, cicloFrio, bateriaPorDentro, resistenciaPorDentro, chipLED } from '../kit/mundo/cenarios.js';
import { arcos, vapor, fluxo, ondasEsfericas, gradiente } from '../kit/mundo/efeitos.js';

export function montarCenas(E, { tempo, script }) {
  const cenas = [], cues = [];
  const cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const inicio = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
  /** uma cena por linha do roteiro: começa um pouco antes da fala da linha i */
  const cena = (i, id, note, draw) => { const at0 = inicio(i); cenas.push({ id, at: at0, note, draw }); if (at0 > 0) cue(at0, 'whoosh', { gain: 0.45 }); };
  const cam = camera(35);
  const ver = (pos, alvo, fov = 35) => olhar(cam, pos, alvo, fov);
  const tela = (obj, local) => projetar(noMundo(obj, local), cam);

  // ---------- mundos (montados uma vez; cada draw reseta o que usa) ----------
  const K = cozinha(), mw = K.mw;
  const fumaca = vapor(); at(fumaca.group, 0, mw.lasanha.altura * 0.32 + 0.6, 0); mw.mesa.add(fumaca.group);
  const resetCozinha = () => { mw.reset(); fumaca.group.visible = false; };
  const visorContagem = (t) => mw.visor(`0:${String(Math.max(0, 30 - Math.floor(t))).padStart(2, '0')}`);

  const LA = estudio(); const las = lasanha(); LA.scene.add(las.group);
  const CT = estudio(); const corte = corteLasanha(); CT.scene.add(corte.group);
  const PL = planta();
  const MM = microMundo();
  const TP = telaPerfurada();
  const ES = estudio({ prato: false }); const mol = molecula(1.5), imaG = ima(); ES.scene.add(mol.group, imaG);
  const AV = estudio({ prato: false }); const lasAV = lasanha(); AV.scene.add(lasAV.group);
  const arcA = arcos(7), arcB = arcos(7); AV.scene.add(arcA.group, arcB.group);
  const vap = vapor(); at(vap.group, 0, lasAV.altura, 0); vap.group.scale.setScalar(2.2); AV.scene.add(vap.group);

  // ===== L0: cozinha() =====
  cena(0, 'cozinha', 'cozinha(): bancada, azulejos, armários, chaleira, fruteira, vaso e micro-ondas; câmera passando de lado', (lt, d, t, blit) => {
    resetCozinha(); mw.ligado(1); mw.mesa.rotation.y = t * 0.7; visorContagem(t);
    const x = lerp(-4.5, 4.5, eio(lt / d));
    ver([x, 4.6, 17], [x * 0.85, 1.4, 0]);
    E.render(K.scene, cam); blit();
  });
  cue(0.05, 'rumble', { dur: 2.4, gain: 0.25 });

  // ===== L1: micro-ondas em raio-x =====
  cena(1, 'raio-x', 'microondas().casca(0.16): a carcaça some e aparecem magnetron e guia de onda', (lt, d, t, blit) => {
    resetCozinha(); mw.ligado(1); mw.mesa.rotation.y = t * 0.7; visorContagem(t);
    mw.casca(lerp(1, 0.16, eo(seg(lt, 0.15, 0.75))));
    ver(L3([3.5, 4.6, 13.5], [9.6, 5.4, 10.6], eio(lt / d)), [0.4, 1.5, 0]);
    E.render(K.scene, cam); blit();
    const [mx, my] = tela(mw.mag, V(0, 0.2, 0)), [gx, gy] = tela(mw.guia, V(0, 0.2, 0));
    etiqueta('MAGNETRON', 540, 1200, mx, my, seg(lt, 0.8, 1.3));
    etiqueta('GUIA DE ONDA', 540, 540, gx, gy, seg(lt, 1.1, 1.6));
  });
  cue(inicio(1) + 0.2, 'sparkle', { dur: 0.6, gain: 0.35 }); cue(inicio(1) + 0.8, 'pop', { gain: 0.6 }); cue(inicio(1) + 1.1, 'pop', { gain: 0.5 });

  // ===== L2: lasanha() =====
  cena(2, 'lasanha', 'lasanha(): camadas e gratinado girando no prato; calor(k) puxa a casca para laranja', (lt, d, t, blit) => {
    las.calor(eo(seg(lt, 0.6, 2.0))); las.group.rotation.y = 0.5 + t * 0.6;
    ver(L3([0, 6.5, 17], [2.5, 5.5, 16], eio(lt / d)), [0, 0.6, 0]);
    E.render(LA.scene, cam); blit();
  });

  // ===== L3: corteLasanha() =====
  cena(3, 'corte', 'corteLasanha().calor(banda, miolo, mapa): mapa de calor na face, casca quente e miolo frio', (lt, d, t, blit) => {
    corte.calor(0.13 * eo(seg(lt, 0.4, 1.2)), 0, eo(seg(lt, 0.0, 0.5)));
    ver(L3([3, 3.4, 17], [1, 2.6, 15.5], eio(lt / d)), [0, 0.8, 0]);
    E.render(CT.scene, cam); blit();
    const [cx, cy] = tela(corte.group, V(-1.85, 1.45, 1.21)), [mx, my] = tela(corte.group, V(0, 0.8, 1.21));
    etiqueta('CASCA QUENTE', 540, 560, cx, cy, seg(lt, 0.9, 1.4));
    etiqueta('MIOLO FRIO', 540, 1200, mx, my, seg(lt, 1.2, 1.7));
  });
  cue(inicio(3) + 0.4, 'sizzle', { dur: 0.9, gain: 0.35 });

  // ===== L4: planta() =====
  cena(4, 'planta', 'planta(): planta técnica em ciano, micro-ondas em arestas, seta do campo virando, senoide correndo', (lt, d, t, blit) => {
    PL.atualizar(1.2 * lt, 1, 0.9);
    ver(L3([9, 6, 14], [5.5, 4.5, 12.5], eio(lt / d)), [-0.4, 1.2, 0]);
    E.render(PL.scene, cam); blit();
    const [x, y] = tela(PL.seta, V(0, 0, 0));
    etiqueta('CAMPO ELÉTRICO', 540, 560, x, y, seg(lt, 0.5, 1.0));
  });

  // ===== L5: microMundo() =====
  cena(5, 'micro-mundo', 'microMundo().atualizar: moléculas soltas, alinham com o campo, agitam e esquentam', (lt, d, t, blit) => {
    const kAl = eo(seg(lt, 0.4, 0.9));
    const campo = Math.tanh(4 * Math.sin(lt * Math.PI * 2 * 1.4)) * (Math.PI / 2);
    MM.atualizar(t, { alinhar: kAl, campo, agito: eo(seg(lt, 1.3, 1.6)), calor: eo(seg(lt, 1.4, 2.3)) });
    MM.heroi.group.position.set(0, 0.4, 1.2); MM.heroi.group.rotation.set(0.3 * (1 - kAl), t * 0.5 * (1 - kAl), campo * kAl);
    MM.ima.visible = false;
    ver(L3([0, 0.3, 12.5], [0.8, 0.9, 11.6], eio(lt / d)), [0, 0.3, 0]);
    E.render(MM.scene, cam); blit();
    const [x, y] = tela(MM.heroi.o);
    etiqueta('ÁGUA (H2O)', 540, 560, x, y, seg(lt, 0.2, 0.7));
  });

  // ===== L6: telaPerfurada() =====
  cena(6, 'tela', 'telaPerfurada().atualizar: chapa furada, ondas batem e voltam, raios de luz atravessam', (lt, d, t, blit) => {
    TP.atualizar(t, { ondasK: 1, luz: eo(seg(lt, 1.0, 1.6)) });
    ver(L3([2.6, 1.6, 13], [1.2, 0.8, 10], eio(lt / d)), [0, -0.4, -1]);
    E.render(TP.scene, cam); blit();
  });
  cue(inicio(6) + 1.0, 'sparkle', { dur: 0.6, gain: 0.35 });

  // ===== L7: estudio() + molecula() + ima() =====
  cena(7, 'estudio', 'estudio({ prato: false }) com molecula(1,5) e ima() lado a lado', (lt, d, t, blit) => {
    mol.calor(0); at(mol.group, -1.2, 0.5, 0); mol.group.rotation.set(0.2, t * 0.9, 0.15 * Math.sin(t * 2));
    at(imaG, 1.4, 0.4, 0); imaG.rotation.set(0, -0.5 + t * 0.6, 0.12);
    ver(L3([0.8, 2.4, 15], [-0.4, 1.6, 14], eio(lt / d)), [0.1, 0.4, 0]);
    E.render(ES.scene, cam); blit();
    const [ox, oy] = tela(mol.o), [nx, ny] = tela(imaG, V(0, 0.55, 0)), [sx, sy] = tela(imaG, V(0, -0.55, 0));
    etiqueta('MOLÉCULA', 300, 560, ox, oy, seg(lt, 0.3, 0.8));
    etiqueta('N', 860, 560, nx, ny, seg(lt, 0.7, 1.1));
    etiqueta('S', 860, 1200, sx, sy, seg(lt, 0.9, 1.3));
  });

  // ===== L8: arcos() + vapor() =====
  cena(8, 'efeitos', 'arcos(7) de trás e da frente (um defasado) e vapor() subindo da lasanha quente', (lt, d, t, blit) => {
    lasAV.calor(0.6); lasAV.group.rotation.y = 0;
    const k = eo(seg(lt, 0.1, 0.5));
    arcA.atualizar(t, { origem: V(0, 0.9, -3.4), rotY: Math.PI / 2, alcance: 2.8, k });                 // de trás para a frente
    arcB.atualizar(t + 0.35, { origem: V(0, 0.9, 3.4), rotY: -Math.PI / 2, alcance: 2.8, k: k * 0.8 });  // da frente para trás
    vap.atualizar(t, eo(seg(lt, 0.6, 1.2)));
    ver(L3([-1.2, 16, 11], [1.2, 15, 10.5], eio(lt / d)), [0, -0.6, 0]);
    E.render(AV.scene, cam); blit();
  });

  // ===== L9: HUD (valorTopo + etiqueta) =====
  cena(9, 'hud', 'valorTopo (cantoneiras + tarja) e etiqueta com linha-guia em L, sobre a cozinha', (lt, d, t, blit) => {
    resetCozinha(); mw.ligado(1); mw.mesa.rotation.y = t * 0.7; visorContagem(t);
    ver(L3([-1, 3.8, 19], [0.6, 3.2, 17.5], eio(lt / d)), [0, 1.4, 0]);
    E.render(K.scene, cam); blit();
    valorTopo('2,45 GHZ', 'VALOR NO TOPO COM SUBTÍTULO', seg(lt, 0.1, 0.8), seg(lt, d - 0.3, d - 0.1));
    const [px, py] = tela(mw.porta, V(1.825, 1.5, 0.1)), [vx, vy] = tela(mw.group, V(1.85, 2.55, 1.97));
    etiqueta('PORTA', 300, 560, px, py, seg(lt, 0.6, 1.1));
    etiqueta('VISOR', 800, 560, vx, vy, seg(lt, 0.9, 1.4));
  });
  cue(inicio(9) + 0.1, 'zip', { gain: 0.5 }); cue(inicio(9) + 0.6, 'pop', { gain: 0.5 }); cue(inicio(9) + 0.9, 'pop', { gain: 0.5 });

  // ---------- casa (sala, banheiro, quarto) e efeitos genéricos ----------
  const SA = sala(), BA = banheiro(), QU = quarto();
  const FL = estudio({ prato: false });
  const gas = fluxo([[-1.5, -0.6, 0], [1.5, -0.6, 0], [1.75, 1.0, 0], [1.5, 2.6, 0], [-1.5, 2.6, 0], [-1.75, 1.0, 0]], 22,
    { raio: 0.11, vel: 0.12, tubo: { cor: '#E8D9C0', raio: 0.2, opacidade: 0.28 } });
  const corGas = gradiente([[0, '#FF5A2E'], [0.3, '#FFB43A'], [0.45, '#FFE9C4'], [0.55, '#7FB2FF'], [0.85, '#4F8BFF'], [0.92, '#FF5A2E'], [1, '#FF5A2E']]);
  const fio = fluxo([[-2.4, -2.1, 0], [-1.2, -1.8, 0.2], [0, -2.2, 0], [1.2, -1.8, -0.2], [2.4, -2.1, 0]], 14, { cor: '#FFE066', raio: 0.08, vel: 0.35, fechado: false });
  FL.scene.add(gas.group, fio.group);
  const ondas = ondasEsfericas(4), emissor = sph(0.035, glow('#FFB43A'), 8);
  SA.scene.add(ondas.group, emissor);

  // ===== L10: sala() =====
  cena(10, 'sala', 'sala(): painel com TV, estante (S.estante = lugar do roteador), sofá, mesinha, tapete, janela e luminária (S.teto = bocal)', (lt, d, t, blit) => {
    ondas.group.visible = false; emissor.visible = false;
    ver(L3([1.5, 2.3, 5.2], [0.1, 2.25, 5.0], eio(lt / d)), [-0.35, 0.85, -2.2], 40);
    E.render(SA.scene, cam); blit();
    const [ex, ey] = tela(SA.estante), [tx, ty] = tela(SA.teto);
    etiqueta('ESTANTE', 300, 1230, ex, ey, seg(lt, 0.5, 1.0));
    etiqueta('TETO', 780, 520, tx, ty, seg(lt, 0.8, 1.3));
  });

  // ===== L11: banheiro() =====
  cena(11, 'banheiro', 'banheiro(): azulejo, box de vidro, B.parede (ponto do chuveiro a 2,2), registro, ralo, pia, espelho e vaso', (lt, d, t, blit) => {
    ver(L3([0.45, 1.6, 4.6], [-0.2, 1.55, 4.4], eio(lt / d)), [-0.1, 1.1, -1.5], 42);
    E.render(BA.scene, cam); blit();
    const [px, py] = tela(BA.parede), [rx, ry] = tela(BA.ralo);
    etiqueta('PAREDE', 300, 330, px, py, seg(lt, 0.5, 1.0));
    etiqueta('RALO', 780, 1230, rx, ry, seg(lt, 0.8, 1.3));
  });

  // ===== L12: quarto() =====
  cena(12, 'quarto', 'quarto(): cama, Q.criado (tampo do criado-mudo, lugar do celular), Q.tomada na parede, abajur, janela e guarda-roupa', (lt, d, t, blit) => {
    ver(L3([0.5, 1.75, 4.3], [-0.2, 1.65, 4.1], eio(lt / d)), [-0.7, 0.8, -1.8], 40);
    E.render(QU.scene, cam); blit();
    const [cx, cy] = tela(QU.criado), [ox, oy] = tela(QU.tomada);
    etiqueta('CRIADO', 300, 1230, cx, cy, seg(lt, 0.5, 1.0));
    etiqueta('TOMADA', 300, 520, ox, oy, seg(lt, 0.8, 1.3));
  });

  // ===== L13: fluxo() =====
  cena(13, 'fluxo', 'fluxo(): caminho fechado com tubo e cores = gradiente (quente -> frio -> quente); embaixo, caminho aberto (repetir) em amarelo', (lt, d, t, blit) => {
    const k = eo(seg(lt, 0.0, 0.4));
    gas.atualizar(t, { k, cores: corGas });
    fio.atualizar(t, { k });
    ver(L3([1.2, 0.9, 12.5], [-0.8, 0.6, 12], eio(lt / d)), [0, 0.3, 0]);
    E.render(FL.scene, cam); blit();
  });

  // ===== L14: ondasEsfericas() =====
  cena(14, 'ondas', 'ondasEsfericas(4) saindo do tampo da estante da sala (onde vai o roteador) e atravessando as paredes', (lt, d, t, blit) => {
    const o = noMundo(SA.estante, V(0, 0.12, 0));
    emissor.visible = true; emissor.position.copy(o);
    ondas.atualizar(t, { origem: o, alcance: 5, vel: 0.45, k: eo(seg(lt, 0.0, 0.3)) });
    ver(L3([1.3, 2.25, 5.2], [0.4, 2.3, 5.0], eio(lt / d)), [-0.7, 0.95, -2.2], 40);
    E.render(SA.scene, cam); blit();
  });

  // ---------- geladeira na cozinha e ciclo do frio ----------
  const KG = cozinha({ geladeira: true }), gel = KG.gel;
  const CF = cicloFrio();
  const resetGel = () => { KG.mw.reset(); gel.reset(); };
  const naGel = (nome) => noMundo(gel.group, gel.pontos[nome]);
  const telaP = (v) => projetar(v, cam);

  // ===== L15: geladeira na cozinha() =====
  cena(15, 'geladeira', 'cozinha({ geladeira: true }): geladeira(escala 10) em pé no chão ao lado da bancada; duas portas, puxadores', (lt, d, t, blit) => {
    resetGel();
    ver(L3([-4.5, 2.5, 44], [-7.5, 1.5, 42], eio(lt / d)), [-9.0, 0.3, 0]);
    E.render(KG.scene, cam); blit();
  });

  // ===== L16: geladeira().aberta(k) =====
  cena(16, 'porta-geladeira', 'geladeira().aberta(k, kFreezer): porta abre ~100° e a luz de dentro acende; depois o freezer', (lt, d, t, blit) => {
    resetGel();
    gel.aberta(eo(seg(lt, 0.15, 1.2)), eo(seg(lt, 1.3, 2.1)) * 0.8);
    ver(L3([-1.5, 2, 37], [-3.5, 2.5, 35], eio(lt / d)), [-11.2, -0.4, 2.5]);
    E.render(KG.scene, cam); blit();
  });
  cue(inicio(16) + 0.3, 'sparkle', { dur: 0.5, gain: 0.3 });

  // ===== L17: geladeira().casca(0,15) + gas(t) =====
  cena(17, 'raio-x-geladeira', 'geladeira().casca(0.15) + gas(t): a carcaça some; serpentina, compressor e os tubos do gás nas paredes (laranja quente, azul frio)', (lt, d, t, blit) => {
    resetGel();
    gel.casca(lerp(1, 0.15, eo(seg(lt, 0.1, 0.7))));
    gel.gas(t, { k: eo(seg(lt, 0.4, 0.9)) });
    ver(L3([-21, 5, 31], [-24, 4, 29], eio(lt / d)), [-11.1, -0.3, -0.5]);
    E.render(KG.scene, cam); blit();
    const [cx, cy] = telaP(naGel('compressor')), [sx, sy] = telaP(naGel('condensador')), [ex, ey] = telaP(naGel('evaporador'));
    etiqueta('EVAPORADOR', 760, 200, ex, ey, seg(lt, 0.8, 1.3));
    etiqueta('CONDENSADOR', 760, 1230, sx, sy, seg(lt, 1.0, 1.5));
    etiqueta('COMPRESSOR', 300, 1300, cx, cy, seg(lt, 1.2, 1.7));
  });
  cue(inicio(17) + 0.15, 'sparkle', { dur: 0.6, gain: 0.35 });

  // ===== L18: cicloFrio() =====
  cena(18, 'ciclo-frio', 'cicloFrio().atualizar(t, { k, quente, frio }): compressor, condensador (calor sai), válvula, evaporador (calor da caixa entra); gás laranja -> azul', (lt, d, t, blit) => {
    CF.atualizar(t, { k: eo(seg(lt, 0, 0.4)), quente: eo(seg(lt, 0.3, 0.9)), frio: eo(seg(lt, 0.6, 1.2)) });
    ver(L3([1.7, 0.4, 24.2], [-0.9, -0.2, 23.6], eio(lt / d)), [0.4, -0.2, 0]);
    E.render(CF.scene, cam); blit();
    const P = CF.pontos, [cx, cy] = telaP(P.compressor), [nx, ny] = telaP(P.condensador), [vx, vy] = telaP(P.valvula), [ex, ey] = telaP(P.evaporador);
    etiqueta('CONDENSADOR', 700, 650, nx, ny, seg(lt, 0.5, 1.0));
    etiqueta('VÁLVULA', 380, 760, vx, vy, seg(lt, 0.8, 1.3));
    etiqueta('EVAPORADOR', 300, 1580, ex, ey, seg(lt, 1.1, 1.6));
    etiqueta('COMPRESSOR', 800, 1580, cx, cy, seg(lt, 1.4, 1.9));
  });

  // ---------- celular e bateria por dentro ----------
  const CE = estudio({ prato: false, fundo: '#2A1A12' });
  const celE = celular(); celE.group.rotation.order = 'YXZ'; celE.group.rotation.x = Math.PI / 2; CE.scene.add(celE.group);   // em pé, tela para +z
  const QC = quarto({ celular: true }), cel = QC.cel;
  const naCel = (nome) => noMundo(cel.group, cel.pontos[nome]);
  const BP = bateriaPorDentro();
  const pctTela = (k) => Math.round(lerp(41, 48, k));

  // ===== L19: celular() em pé, girando =====
  cena(19, 'celular', 'celular(): em pé no estúdio (group.rotation.x = PI/2) girando da traseira (câmera de 3 lentes) para a frente; tela "⚡ 45%"', (lt, d, t, blit) => {
    celE.reset(); celE.tela('⚡ 45%', 45);
    celE.group.rotation.y = lerp(Math.PI + 0.55, 0.35, eio(lt / d));
    ver([0.03, 0.03, 0.46], [0, -0.024, 0]);
    E.render(CE.scene, cam); blit();
  });

  // ===== L20: quarto({ celular: true }) =====
  cena(20, 'celular-quarto', 'quarto({ celular: true }): celular deitado no criado-mudo, cabo descendo da tomada, carregador; a tela acende', (lt, d, t, blit) => {
    cel.reset(); cel.tela('⚡ 45%', 45, eo(seg(lt, 0.3, 0.7)));
    ver(L3([-0.86, 1.2, -0.92], [-0.98, 1.1, -1.06], eio(lt / d)), [-1.25, 0.56, -1.98], 40);
    E.render(QC.scene, cam); blit();
    const [cx, cy] = telaP(noMundo(cel.carregador, V(0, 0.023, 0.015))), [ox, oy] = telaP(naCel('tela'));
    etiqueta('CARREGADOR', 300, 330, cx, cy, seg(lt, 0.6, 1.1));
    etiqueta('CELULAR', 780, 1230, ox, oy, seg(lt, 0.9, 1.4));
  });

  // ===== L21: celular().tela(txt, pct, luz) =====
  cena(21, 'tela-celular', 'celular().tela("⚡ 45%", pct, luz): close de cima; a tela acende e a bateria desenhada enche (41% -> 48%)', (lt, d, t, blit) => {
    const k = eio(lt / d), pct = pctTela(k);
    cel.reset(); cel.tela(`⚡ ${pct}%`, pct, eo(seg(lt, 0.1, 0.5)));
    const c = naCel('tela');
    ver(L3([c.x + 0.012, c.y + 0.44, c.z + 0.18], [c.x - 0.004, c.y + 0.38, c.z + 0.14], k), [c.x, c.y, c.z + 0.04]);
    E.render(QC.scene, cam); blit();
  });

  // ===== L22: celular().casca(0,15) + carga(k) =====
  cena(22, 'raio-x-celular', 'celular().casca(0.15) + carga(k): aro, vidro e traseira somem; bateria em camadas (com o nível subindo) e placa', (lt, d, t, blit) => {
    cel.reset(); cel.tela('⚡ 45%', 45);
    cel.casca(lerp(1, 0.15, eo(seg(lt, 0.1, 0.7)))); cel.carga(lerp(0.3, 0.7, eio(lt / d)));
    const c = naCel('tela');
    ver(L3([c.x + 0.05, c.y + 0.4, c.z + 0.17], [c.x + 0.025, c.y + 0.41, c.z + 0.15], eio(lt / d)), [c.x, c.y - 0.004, c.z + 0.035]);
    E.render(QC.scene, cam); blit();
    const [bx, by] = telaP(naCel('bateria')), [px, py] = telaP(naCel('placa'));
    etiqueta('BATERIA', 780, 1230, bx, by, seg(lt, 0.8, 1.3));
    etiqueta('PLACA', 300, 330, px, py, seg(lt, 1.0, 1.5));
  });
  cue(inicio(22) + 0.15, 'sparkle', { dur: 0.6, gain: 0.35 });

  // ===== L23: bateriaPorDentro() carregando =====
  const camBat = (lt, d) => ver(L3([0.75, -0.3, 16.9], [0.15, -0.45, 16.4], eio(lt / d)), [0.45, -0.4, 0]);
  const etiquetasBat = (lt, P) => {
    const [ax, ay] = telaP(P.anodo), [cx, cy] = telaP(P.catodo), [sx, sy] = telaP(P.separador), [ix, iy] = telaP(P.ion);
    etiqueta('ÂNODO', 300, 300, ax, ay, seg(lt, 0.3, 0.8));
    etiqueta('ÍON DE LÍTIO', 780, 300, ix, iy, seg(lt, 0.6, 1.1));
    etiqueta('SEPARADOR', 300, 1580, sx, sy, seg(lt, 0.9, 1.4));
    etiqueta('CÁTODO', 780, 1580, cx, cy, seg(lt, 1.2, 1.7));
  };
  cena(23, 'bateria', 'bateriaPorDentro().atualizar(t, { carga 0 -> 1, sentido +1 }): íons do cátodo para o ânodo; elétrons no fio do alumínio para o cobre', (lt, d, t, blit) => {
    BP.atualizar(t, { carga: eio(seg(lt, 0.15, 2.3)), sentido: 1 });
    camBat(lt, d);
    E.render(BP.scene, cam); blit();
    etiquetasBat(lt, BP.pontos);
  });

  // ===== L24: bateriaPorDentro() descarregando =====
  cena(24, 'descarga', 'bateriaPorDentro().atualizar(t, { carga 1 -> 0, sentido -1 }): íons voltam ao cátodo; elétrons do cobre para o alumínio, pelo aparelho', (lt, d, t, blit) => {
    BP.atualizar(t, { carga: 1 - eio(seg(lt, 0.15, 2.3)), sentido: -1 });
    camBat(lt, d);
    E.render(BP.scene, cam); blit();
    const [fx, fy] = telaP(BP.pontos.fio), [px, py] = telaP(BP.pontos.aparelho);
    etiqueta('ELÉTRONS', 780, 300, fx, fy, seg(lt, 0.4, 0.9));
    etiqueta('CELULAR', 780, 1580, px, py, seg(lt, 0.7, 1.2));
  });

  // ---------- chuveiro elétrico e resistência por dentro ----------
  const BC = banheiro({ chuveiro: true }), ch = BC.ch;
  const naCh = (nome) => noMundo(ch.group, ch.pontos[nome]);
  const vapCh = vapor(18); at(vapCh.group, -0.62, 1.15, -0.95); vapCh.group.scale.setScalar(0.28); BC.scene.add(vapCh.group);
  const RP = resistenciaPorDentro();
  const nomeChave = (pos) => (pos < 0.5 ? 'DESLIGADO' : pos < 1.5 ? 'VERÃO' : 'INVERNO');

  // ===== L25: banheiro({ chuveiro: true }) =====
  cena(25, 'chuveiro', 'banheiro({ chuveiro: true }): chuveiro() na parede do box; chave em verão, água caindo do crivo (agua(k, t)) e vapor()', (lt, d, t, blit) => {
    ch.reset(); ch.chave(1); ch.resistencia(0.6); ch.agua(eo(seg(lt, 0.15, 0.6)), t);
    vapCh.atualizar(t, 0.8 * eo(seg(lt, 0.6, 1.6)));
    ver(L3([0.1, 2.3, 1.0], [-0.2, 2.25, 0.6], eio(lt / d)), [-0.62, 1.7, -1.2], 40);
    E.render(BC.scene, cam); blit();
    const [cx, cy] = telaP(naCh('camara')), [ax, ay] = telaP(naCh('agua'));
    etiqueta('CHUVEIRO', 780, 330, cx, cy, seg(lt, 0.5, 1.0));
    etiqueta('ÁGUA', 300, 1230, ax, ay, seg(lt, 0.8, 1.3));
  });
  cue(inicio(25) + 0.2, 'bubbles', { dur: 2.0, gain: 0.25 });

  // ===== L26: chuveiro().chave(pos) =====
  const posChave = (lt) => eio(seg(lt, 0.35, 0.8)) + eio(seg(lt, 1.35, 1.8));
  cena(26, 'chave', 'chuveiro().chave(pos): close; a chave vai de desligado (0) a verão (1) e inverno (2); a água abre junto', (lt, d, t, blit) => {
    const pos = posChave(lt);
    ch.reset(); ch.chave(pos); ch.agua(eo(seg(lt, 0.4, 0.8)), t);
    vapCh.group.visible = false;
    const c = naCh('chave'), m = naCh('camara');
    ver(L3([m.x + 0.36, m.y + 0.01, m.z + 0.42], [m.x + 0.3, m.y + 0.02, m.z + 0.38], eio(lt / d)), [m.x + 0.02, m.y - 0.07, m.z]);
    E.render(BC.scene, cam); blit();
    valorTopo(nomeChave(pos), null, seg(lt, 0.1, 0.4), 0, { s: 10 });
    const [kx, ky] = telaP(c);
    etiqueta('CHAVE', 780, 1230, kx, ky, seg(lt, 0.2, 0.6));
  });
  cue(inicio(26) + 0.45, 'tock', { gain: 0.5 }); cue(inicio(26) + 1.45, 'tock', { gain: 0.5 });

  // ===== L27: chuveiro().casca(0,15) + resistencia(k) =====
  cena(27, 'raio-x-chuveiro', 'chuveiro().casca(0.15) + resistencia(k) + chave(1 -> 2): câmara de água, resistência em espiral esquentando (cinza -> laranja -> vermelho), no inverno só o trecho até o borne do meio', (lt, d, t, blit) => {
    const pos = 1 + eio(seg(lt, 1.3, 1.7));
    ch.reset(); ch.chave(pos); ch.casca(lerp(1, 0.15, eo(seg(lt, 0.1, 0.6))));
    ch.resistencia(calorDaChave(pos) * eo(seg(lt, 0.4, 1.1))); ch.agua(1, t);
    vapCh.group.visible = false;
    const c = naCh('camara');
    ver(L3([c.x - 0.08, c.y + 0.06, c.z + 0.54], [c.x - 0.03, c.y + 0.07, c.z + 0.5], eio(lt / d)), [c.x, c.y - 0.04, c.z]);
    E.render(BC.scene, cam); blit();
    const [rx, ry] = telaP(naCh('resistencia')), [ax, ay] = telaP(naCh('aguaDentro'));
    etiqueta('RESISTÊNCIA', 780, 330, rx, ry, seg(lt, 0.6, 1.1));
    etiqueta('ÁGUA', 300, 1230, ax, ay, seg(lt, 0.9, 1.4));
    valorTopo(nomeChave(pos), null, seg(lt, 1.3, 1.6), 0, { s: 10 });
  });
  cue(inicio(27) + 0.15, 'sparkle', { dur: 0.6, gain: 0.35 }); cue(inicio(27) + 0.6, 'sizzle', { dur: 1.6, gain: 0.3 });

  // ===== L28: resistenciaPorDentro() (verão) =====
  const camRes = (lt, d) => ver(L3([0.35, 0.45, 16.4], [-0.2, 0.2, 15.8], eio(lt / d)), [0, 0.3, 0]);
  cena(28, 'resistencia', 'resistenciaPorDentro().atualizar(t, { corrente, calor 0 -> 0,6, trecho 1 }): elétrons esbarram nos átomos, a rede treme, o fio e a água esquentam', (lt, d, t, blit) => {
    RP.atualizar(t, { corrente: eo(seg(lt, 0, 0.4)), calor: TRECHO_INVERNO * eo(seg(lt, 0.3, 2.0)), trecho: 1 });
    camRes(lt, d);
    E.render(RP.scene, cam); blit();
    const P = RP.pontos, [ex, ey] = telaP(P.eletron), [ox, oy] = telaP(P.atomo), [wx, wy] = telaP(P.aguaQuente);
    etiqueta('ELÉTRON', 300, 300, ex, ey, seg(lt, 0.3, 0.8));
    etiqueta('ÁTOMO', 780, 300, ox, oy, seg(lt, 0.6, 1.1));
    etiqueta('ÁGUA', 780, 1580, wx, wy, seg(lt, 0.9, 1.4));
  });
  cue(inicio(28) + 0.3, 'sizzle', { dur: 1.8, gain: 0.3 });

  // ===== L29: resistenciaPorDentro() (inverno: trecho menor) =====
  cena(29, 'inverno', 'resistenciaPorDentro().atualizar(t, { trecho 1 -> 0,58, calor 0,58 -> 1, corrente 0,6 -> 1 }): no inverno só o trecho de cima conduz; mais corrente, mais calor', (lt, d, t, blit) => {
    const k = eio(seg(lt, 0.2, 1.1)), tr = lerp(1, TRECHO_INVERNO, k);
    RP.atualizar(t, { corrente: lerp(0.6, 1, k), calor: TRECHO_INVERNO / tr, trecho: tr });
    camRes(lt, d);
    E.render(RP.scene, cam); blit();
    valorTopo('INVERNO', 'TRECHO MENOR, MAIS CORRENTE', seg(lt, 0.1, 0.6), 0);
    const [cx, cy] = telaP(RP.pontos.trecho), [wx, wy] = telaP(RP.pontos.aguaQuente);
    etiqueta('FIM DO TRECHO', 780, 1230, cx, cy, seg(lt, 1.0, 1.5));
    etiqueta('ÁGUA QUENTE', 300, 1580, wx, wy, seg(lt, 1.3, 1.8));
  });
  cue(inicio(29) + 0.1, 'zip', { gain: 0.5 });

  // ---------- roteador e Wi-Fi, lâmpada LED e chip por dentro ----------
  const SW = sala({ roteador: true, lampada: true, vizinho: true }), rot = SW.rot, lamp = SW.lamp, celW = SW.cel;
  const ondasW = ondasEsfericas(4, { opacidade: 0.08, aro: 1, espessura: 0.1 }); SW.scene.add(ondasW.group);   // vista de cima: aro grosso, miolo leve
  const ondasC = ondasEsfericas(8, { opacidade: 0, aro: 1, espessura: 0.025, corte: 0.009 }); SW.scene.add(ondasC.group);  // close: o corte da onda no tampo da mesa
  const naRot = (nome) => noMundo(rot.group, rot.pontos[nome]), naLamp = (nome) => noMundo(lamp.group, lamp.pontos[nome]);
  const PW = planta({ aparelho: 'roteador' });
  const CL = chipLED();
  const resetSW = () => { SW.anoitecer(0); SW.forro.visible = true; rot.reset(); lamp.reset(); celW.reset(); ondasW.group.visible = ondasC.group.visible = false; };
  // a onda sai do roteador e perde força ao atravessar a parede do fundo da sala (fator ~0,5 em 2,4 GHz)
  const paredeW = { ...SW.parede, fator: fatorDaParede(perdaNaParede(2.4)) };
  const ondasDoRoteador = (t, k, alcance = 3.4) => ondasW.atualizar(t, { origem: naRot('emissor'), alcance, vel: 0.45, k, parede: paredeW });
  const dCel = () => naRot('emissor').distanceTo(noMundo(celW.group, celW.pontos.tela));
  const barrasCel = () => barrasDeSinal(forcaDoSinal(dCel(), { ghz: 2.4, paredes: 1 }).dbm);

  // ===== L30: roteador() na estante da sala =====
  cena(30, 'roteador', 'sala({ roteador: true }): roteador() no tampo da estante; 3 antenas e leds(t, 1) piscando (energia, internet, Wi-Fi 2,4 e 5)', (lt, d, t, blit) => {
    resetSW(); rot.leds(t, eo(seg(lt, 0.1, 0.3)));
    const r = naRot('centro');
    ver(L3([r.x + 0.4, r.y + 0.36, r.z + 1.15], [r.x + 0.16, r.y + 0.3, r.z + 1.02], eio(lt / d)), [r.x, r.y + 0.07, r.z], 40);
    E.render(SW.scene, cam); blit();
    const [ax, ay] = tela(rot.group, rot.pontos.antena), [lx, ly] = tela(rot.group, rot.pontos.led);
    etiqueta('ANTENA', 300, 420, ax, ay, seg(lt, 0.4, 0.9));
    etiqueta('LED', 780, 1230, lx, ly, seg(lt, 0.7, 1.2));
  });

  // ===== L31: Wi-Fi atravessando a parede (vista de cima) =====
  cena(31, 'wi-fi', 'sala({ roteador, vizinho }) de cima (forro escondido): ondasEsfericas saindo do roteador, atravessando a parede do fundo com parede: { ponto, normal, fator } (mais fracas do outro lado) até o celular no escritório', (lt, d, t, blit) => {
    resetSW(); SW.forro.visible = false; rot.leds(t, 1);
    ondasDoRoteador(t, eo(seg(lt, 0.0, 0.3)));
    celW.tela('WI-FI', 0, 1, { sinal: Math.round(barrasCel() * eo(seg(lt, 0.6, 1.6))) });
    ver(L3([-0.95, 7.0, -0.55], [-1.2, 6.9, -0.7], eio(lt / d)), [-1.3, 0.6, -3.4], 40);
    E.render(SW.scene, cam); blit();
    const [rx, ry] = tela(rot.group, rot.pontos.centro), [cx, cy] = tela(celW.group, celW.pontos.tela), [px, py] = projetar(V(-0.7, 2.7, SW.parede.ponto.z - 0.075), cam);
    etiqueta('ROTEADOR', 300, 1580, rx, ry, seg(lt, 0.3, 0.8));
    etiqueta('PAREDE', 780, 1050, px, py, seg(lt, 0.6, 1.1));
    etiqueta('CELULAR', 780, 300, cx, cy, seg(lt, 0.9, 1.4));
  });

  // ===== L32: sinal chegando no celular (close) =====
  cena(32, 'sinal', 'celular().tela("WI-FI", 0, 1, { sinal }) no escritório: ondasEsfericas com corte no tampo (as frentes passam pela mesa, mais fracas depois da parede) e o leque do Wi-Fi acende até barrasDeSinal(forcaDoSinal(d, { paredes: 1 }))', (lt, d, t, blit) => {
    resetSW(); SW.forro.visible = false; rot.leds(t, 1);
    ondasC.atualizar(t, { origem: naRot('emissor'), alcance: 5, vel: 0.32, k: 1, parede: paredeW, corteY: noMundo(SW.mesaVizinho).y + 0.002 });
    const n = Math.round(barrasCel() * eo(seg(lt, 0.4, 1.6)));
    celW.tela('WI-FI', 0, 1, { sinal: n });
    const c = noMundo(celW.group, celW.pontos.tela);
    ver(L3([c.x + 0.04, c.y + 0.56, c.z + 0.27], [c.x + 0.015, c.y + 0.52, c.z + 0.23], eio(lt / d)), [c.x, c.y, c.z + 0.03], 35);
    E.render(SW.scene, cam); blit();
    valorTopo('WI-FI', `${n} DE 4 BARRAS`, seg(lt, 0.1, 0.5), 0, { s: 10 });
  });

  // ===== L33: planta({ aparelho: 'roteador' }) com 2,4 e 5 GHz =====
  cena(33, 'onda-ghz', 'planta({ aparelho: "roteador" }).atualizar(t, { ghz: 2.4, ghz2: 5 }): a onda de 5 GHz é mais curta (λ ~6 cm contra ~12,5 cm), mesma velocidade', (lt, d, t, blit) => {
    PW.atualizar(t, { ghz: 2.4, ghz2: 5, amp: 0.9, vel: 0.5 });
    ver(L3([2.4, 2.9, 15.5], [1.0, 2.8, 14.8], eio(lt / d)), [0, 2.0, 0], 35);
    E.render(PW.scene, cam); blit();
    const [ax, ay] = projetar(PW.pontos.onda, cam), [bx, by] = projetar(V(1.2, PW.pontos.onda2.y, 2.3), cam);
    etiqueta('2,4 GHZ', 300, 250, ax, ay, seg(lt, 0.3, 0.8));
    etiqueta('5 GHZ', 800, 556, bx, by, seg(lt, 0.6, 1.1));
  });

  // ===== L34: lâmpada acendendo na luminária =====
  cena(34, 'lampada', 'sala({ lampada: true }) à noite (anoitecer(1)): lampada() rosqueada no bocal acende (acesa(k)): bulbo emissivo, halo e a luz pontual iluminando a sala', (lt, d, t, blit) => {
    resetSW(); SW.anoitecer(1); lamp.acesa(eo(seg(lt, 0.7, 0.9)));
    ver(L3([0.6, 1.5, 2.5], [0.4, 1.45, 2.2], eio(lt / d)), [0.15, 1.55, -1.5], 42);
    E.render(SW.scene, cam); blit();
    const [bx, by] = tela(lamp.group, lamp.pontos.bulbo);
    etiqueta('BULBO', 780, 560, bx, by, seg(lt, 1.0, 1.5));
  });
  cue(inicio(34) + 0.75, 'sparkle', { dur: 0.6, gain: 0.35 });

  // ===== L35: lâmpada em raio-x =====
  cena(35, 'lampada-raio-x', 'lampada().casca(0.35) e depois acesa(1): o bulbo fica transparente, aparece a placa com os chips LED amarelos e eles acendem (no raio-x a luz pontual fica fraca)', (lt, d, t, blit) => {
    resetSW(); SW.anoitecer(0.5); lamp.casca(lerp(1, 0.35, eo(seg(lt, 0.1, 0.7)))); lamp.acesa(eo(seg(lt, 1.3, 1.6)));
    const b = naLamp('bulbo');
    ver(L3([b.x + 0.16, b.y - 0.13, b.z + 0.28], [b.x + 0.1, b.y - 0.12, b.z + 0.25], eio(lt / d)), [b.x, b.y + 0.005, b.z], 40);
    E.render(SW.scene, cam); blit();
    const [cx, cy] = tela(lamp.group, lamp.pontos.chip), [bx, by] = tela(lamp.group, V(0, lamp.pontos.bulbo.y - 0.015, 0));
    etiqueta('CHIP LED', 780, 420, cx, cy, seg(lt, 0.8, 1.3));
    etiqueta('BULBO', 300, 1230, bx, by, seg(lt, 1.0, 1.5));
  });
  cue(inicio(35) + 0.15, 'sparkle', { dur: 0.6, gain: 0.35 });

  // ===== L36: chipLED() — elétrons e lacunas se encontrando na junção =====
  const camChip = (lt, d) => ver(L3([0.35, -0.2, 16.3], [-0.2, -0.4, 15.8], eio(lt / d)), [0, -0.35, 0]);
  cena(36, 'chip', 'chipLED().atualizar(t, { k 0 -> 1 }): camada N com elétrons, P com lacunas (anéis); a corrente liga e cada encontro na junção solta um fóton azul', (lt, d, t, blit) => {
    CL.atualizar(t, { k: eo(seg(lt, 0.15, 0.7)) });
    camChip(lt, d);
    E.render(CL.scene, cam); blit();
    const P = CL.pontos, [lx, ly] = projetar(P.lacuna, cam), [jx, jy] = projetar(P.juncao, cam), [ex, ey] = projetar(P.eletron, cam);
    etiqueta('LACUNA', 300, 300, lx, ly, seg(lt, 0.3, 0.8));
    etiqueta('JUNÇÃO', 780, 300, jx, jy, seg(lt, 0.6, 1.1));
    etiqueta('ELÉTRON', 300, 1580, ex, ey, seg(lt, 0.9, 1.4));
  });

  // ===== L37: chipLED() — o fóton sai pelo fósforo =====
  cena(37, 'foton', 'chipLED().atualizar(t, { k: 1 }): o fóton sobe azul e sai do fósforo amarelo branco (pontos.foton e pontos.fosforo)', (lt, d, t, blit) => {
    CL.atualizar(t, { k: 1 });
    camChip(lt, d);
    E.render(CL.scene, cam); blit();
    valorTopo('AZUL + AMARELO = BRANCO', null, seg(lt, 0.1, 0.6), 0, { s: 8 });
    const P = CL.pontos, [fx, fy] = projetar(P.foton, cam), [sx, sy] = projetar(P.fosforo, cam);
    etiqueta('FÓTON', 300, 1580, fx, fy, seg(lt, 0.4, 0.9));
    etiqueta('FÓSFORO', 780, 1580, sx, sy, seg(lt, 0.7, 1.2));
  });

  // ===== última linha: cartão final =====
  const iF = inicio(tempo.ultima), tClique = tempo.fimLinha(tempo.ultima) - 0.2;
  cena(tempo.ultima, 'cartao', 'cartaoFinal: porta abre, vapor, cartão com Seguir -> Seguindo', (lt, d, t, blit) => {
    resetCozinha(); mw.ligado(0.6); mw.lasanha.calor(0.6); mw.visor(Math.floor(lt * 3) % 2 ? '0:00' : '    ');
    mw.abrir(eo(seg(lt, 0.1, 0.9))); fumaca.atualizar(t, eo(seg(lt, 0.3, 1.0)));
    ver(L3([-4.2, 4.2, 13], [-5.2, 4.8, 15.5], eio(lt / d)), [-0.3, 1.6, 0]);
    E.render(K.scene, cam); blit();
    const ult = script.lines[tempo.ultima];
    cartaoFinal({ marca: script.marca_nome || 'Conhecimento', textoDaUltimaLinha: ult.text, k: seg(t, iF + 0.1, iF + 0.5), clique: seg(t, tClique - 0.3, tClique + 0.3) });
  });
  cue(iF + 0.05, 'tock', { gain: 0.5 }); cue(iF + 0.25, 'tock', { gain: 0.5 }); cue(tClique, 'pop', { gain: 0.7 });

  return { cenas, cues };
}
