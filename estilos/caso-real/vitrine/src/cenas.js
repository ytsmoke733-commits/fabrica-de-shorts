// Vitrine do kit caso-real: uma cena de 3 s por linha do roteiro, mostrando cada peça 2D isolada sobre o fundo `vazio`
// com uma luz só (a poça de luz da cena) e o filme por cima: a ficha com o carimbo e a data datilografada, as 5 polaroides
// com o círculo vermelho, o relatório com tarjas + marcadores + relógio, o recorte de jornal, o mapa com as conexões
// saindo de Londres, a linha do tempo e a tela de código com o alerta. Câmera lenta: empurrão de 4% por cena.
// Depois, as cenas 3D (uma luz por cena, lente aberta no escuro): o quarto por cima do ombro, o quarto de frente e de
// baixo com o alerta de invasão, o escritório bloqueando tela a tela, a lâmpada piscando e os 3 materiais lado a lado.
// Por fim os lugares da Task 6: a sala de servidores (travelling e close nos LEDs com o alarme), a rua na chuva com a
// testemunha andando e o carro passando, o corredor com a luz piscando e o alvo no fundo, e a parede do caso.
// Todo quadro = função pura de t (nenhum estado entre quadros): pose, visibilidade, material e luz são refeitos a cada quadro.
import * as THREE from 'three';
import { ctx, setCtx, W, H, lerp, seg, eo, eio, eob } from '../kit/motor/lib.js';
import { camera } from '../kit/motor/engine.js';
import { NOITE, luminaria } from '../kit/luz.js';
import { pessoa, POSES_CASO, digitar } from '../kit/pessoas.js';
import { misturarPosesCorpo } from '../kit/personagem/poses.mjs';
import { quarto } from '../kit/lugares/quarto.js';
import { escritorio } from '../kit/lugares/escritorio.js';
import { servidores } from '../kit/lugares/servidores.js';
import { rua } from '../kit/lugares/rua.js';
import { corredor } from '../kit/lugares/corredor.js';
import { paredeDoCaso } from '../kit/lugares/parede.js';
import { pilula } from '../kit/hud.mjs';
import { rgba } from '../kit/tema.mjs';
import { ficha, polaroid, papel, circuloVermelho, dataDatilografada, tarjas, marcador, relogio, recorteDeJornal, filme, corDoTema } from '../kit/evidencias.mjs';
import { mapaMundi, linhaDoTempo } from '../kit/paineis.mjs';
import { desenharTela } from '../kit/tela.mjs';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z), lerpV = (a, b, k) => a.clone().lerp(b, k);

/** fundo `vazio` com a única luz da cena: uma poça quente em (x, y) */
function fundo(x = 540, y = 900, raio = 900, forca = 0.12) {
  ctx.fillStyle = corDoTema('vazio'); ctx.fillRect(-300, -300, W + 600, H + 600);
  const g = ctx.createRadialGradient(x, y, 0, x, y, raio); g.addColorStop(0, rgba(corDoTema('luz'), forca)); g.addColorStop(1, rgba(corDoTema('luz'), 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
/** empurrão lento da câmera em volta de (cx, cy): escala 1 → 1 + a ao longo da cena */
function empurrar(lt, d, cx = 540, cy = 900, a = 0.04) {
  const s = 1 + a * eio(lt / d); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
}

export function montarCenas(E, { tempo }) {
  const cenas = [], cues = [];
  const cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const inicio = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
  const cena = (i, id, note, draw) => {
    const at = inicio(i);
    cenas.push({ id, at, note, draw: (lt, d, t, blit) => { draw(lt, d, t, blit); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; filme(t); } });
    cue(at, 'whoosh', { gain: 0.3 }); return at;
  };

  // 1 · a ficha: o carimbo NÃO RESOLVIDO cai e a data é datilografada no alto
  const at1 = cena(0, 'ficha', 'pasta do caso com etiqueta; carimbo NÃO RESOLVIDO caindo (1,8× → 1×); data 12 MAI 2017 · LONDRES 14:20 datilografada', (lt, d) => {
    fundo(540, 980); ctx.save(); empurrar(lt, d, 540, 980);
    ficha(540, 1000, 1.25, 'CASO Nº 0512', 'NÃO RESOLVIDO', eo(seg(lt, 1.3, 1.55)), -0.05);
    ctx.restore();
    dataDatilografada('12 MAI 2017', 'LONDRES · 14:20', seg(lt, 0.15, 1.2), 80, 300);
  });
  cue(at1 + 0.15, 'teclado', { dur: 1.0, gain: 0.5 }); cue(at1 + 1.4, 'slam', { gain: 0.6 });

  // 2 · as 5 polaroides caindo uma a uma; o círculo vermelho marca a pessoa do caso
  const FOTOS = [[290, 470, -0.08, 'escuro'], [790, 500, 0.06, 'alvo'], [280, 860, 0.05, 'casa'], [800, 890, -0.05, 'tela'], [540, 1190, 0.03, 'vazio']];
  const at2 = cena(1, 'polaroides', 'polaroides escuro, alvo, casa, tela e vazio caindo uma a uma; círculo vermelho em volta da pessoa do caso', (lt, d) => {
    fundo(540, 880); ctx.save(); empurrar(lt, d);
    FOTOS.forEach(([x, y, rot, tipo], i) => { const k = seg(lt, 0.1 + i * 0.22, 0.4 + i * 0.22); if (k > 0) polaroid(x, y, 1.3 * eob(k), rot, tipo); });
    circuloVermelho(790, 485, 200, 230, eo(seg(lt, 1.6, 2.3)));
    ctx.restore();
  });
  FOTOS.forEach((_, i) => cue(at2 + 0.12 + i * 0.22, 'tock', { gain: 0.4 })); cue(at2 + 1.6, 'zip', { gain: 0.4 });

  // 3 · o relatório: papel com tarjas passando, marcadores 1 e 2 na frente e o relógio na parede
  const at3 = cena(2, 'relatorio', 'papel do relatório com tarjas pretas; marcadores de evidência 1 e 2; relógio marcando 14:20', (lt, d) => {
    fundo(540, 860); ctx.save(); empurrar(lt, d, 540, 860);
    relogio(830, 330, 0.75, 14, 20);
    const k = eo(seg(lt, 0.05, 0.5)), cinza = '#6A6458', X = 520, Y = 900, R = -0.03, Wp = 820, Hp = 600;
    papel(X, lerp(1080, Y, k), Wp, Hp, R, [
      ['RELATÓRIO INTERNO · Nº 0042', 32, cinza, 70], ['SERVIDOR 03 · SALA 2', 42, null, 140], ['RESPONSÁVEL:', 32, cinza, 230],
      ['TÉCNICO DE PLANTÃO', 36, null, 290], ['OCORRÊNCIA:', 32, cinza, 380], ['PASTAS INACESSÍVEIS', 36, null, 440], ['SISTEMA PARADO', 36, null, 500],
    ], k);
    if (k >= 1) { ctx.save(); ctx.translate(X, Y); ctx.rotate(R); tarjas(-Wp / 2 + 34, -Hp / 2 + 257, [420], seg(lt, 0.7, 1.1)); tarjas(-Wp / 2 + 34, -Hp / 2 + 407, [500, 340], seg(lt, 1.0, 1.6)); ctx.restore(); }
    const m1 = eob(seg(lt, 1.7, 2.0)), m2 = eob(seg(lt, 1.95, 2.25));
    if (m1 > 0) marcador(330, 1320, 1.1 * m1, 1);
    if (m2 > 0) marcador(720, 1340, 1.1 * m2, 2);
    ctx.restore();
  });
  cue(at3 + 0.05, 'crinkle', { dur: 0.5, gain: 0.5 }); cue(at3 + 0.7, 'zip', { gain: 0.3 }); cue(at3 + 1.7, 'tock', { gain: 0.5 }); cue(at3 + 1.95, 'tock', { gain: 0.5 });

  // 4 · o recorte de jornal entra girando e caindo
  const at4 = cena(3, 'jornal', 'recorte de jornal amarelado de borda rasgada (nome genérico) com a manchete HOSPITAIS CANCELAM CONSULTAS', (lt, d) => {
    fundo(540, 860); ctx.save(); empurrar(lt, d, 540, 860);
    recorteDeJornal(540, 860, 1.3, -0.04, { titulo: 'HOSPITAIS CANCELAM CONSULTAS', subtitulo: 'Sistemas fora do ar em vários hospitais do país', jornal: 'NOTÍCIAS', data: '13 MAI 2017' }, seg(lt, 0.1, 0.9));
    ctx.restore();
  });
  cue(at4 + 0.1, 'crinkle', { dur: 0.6, gain: 0.5 }); cue(at4 + 0.85, 'thud', { gain: 0.4 });

  // 5 · o mapa: 6 conexões partindo de Londres, foco em Londres, pílula PAÍSES 150
  const DESTINOS = ['Moscou', 'Mumbai', 'Pequim', 'Sydney', 'São Paulo', 'Nova York'];
  const at5 = cena(4, 'mapa', 'mapa-múndi em pontos; 6 conexões vermelhas partindo de Londres, uma de cada vez; pílula PAÍSES 150', (lt, d, t) => {
    fundo(540, 860, 800, 0.08); ctx.save(); empurrar(lt, d, 540, 860, 0.03);
    mapaMundi({ y: 600, conexoes: DESTINOS.map((c) => ['Londres', c]), p: seg(lt, 0.3, 2.5), foco: 'Londres', k: t });
    ctx.restore();
    pilula('globe', 'PAÍSES', '150', eob(seg(lt, 0.2, 0.6)));
  });
  DESTINOS.forEach((_, i) => cue(at5 + 0.3 + (i + 1) * 2.2 / 6, 'bip', { gain: 0.35 }));

  // 6 · a linha do tempo: 3 marcos, o ataque (12 MAI 2017) é o atual
  const EVENTOS = [{ data: '14 MAR 2017', rotulo: 'correção' }, { data: '12 MAI 2017', rotulo: 'ataque' }, { data: '13 MAI 2017', rotulo: 'parado' }];
  const at6 = cena(5, 'linhaDoTempo', 'linha do tempo com 3 marcos (14 MAR, 12 MAI, 13 MAI 2017); o marco do ataque em vermelho pulsando', (lt, d, t) => {
    fundo(540, 960, 800, 0.1); ctx.save(); empurrar(lt, d, 540, 960);
    linhaDoTempo({ eventos: EVENTOS, p: seg(lt, 0.1, 2.4), atual: 1, t });
    ctx.restore();
  });
  cue(at6 + 0.15, 'teclado', { dur: 2.2, gain: 0.35 });

  // 7 · a tela de código em tela cheia, digitando; no fim o alerta de arquivos bloqueados
  const at7 = cena(6, 'tela', 'tela cheia de código genérico digitado em verde; alerta SEUS ARQUIVOS FORAM BLOQUEADOS no fim', (lt, d, t) => {
    ctx.save(); empurrar(lt, d, 540, 900, 0.03);
    desenharTela(ctx, W, H, { seed: 7, linhas: 24, k: seg(lt, 0.05, 1.9), alerta: 'bloqueado', kAlerta: seg(lt, 2.0, 2.35), t });
    ctx.restore();
  });
  cue(at7 + 0.05, 'teclado', { dur: 1.85, gain: 0.5 }); cue(at7 + 2.0, 'bip', { gain: 0.6 }); cue(at7 + 2.0, 'thud', { gain: 0.5 });

  // ═════════════════════════ cenas 3D ═════════════════════════
  const cam = camera(34);
  /** o render do NF: DOF focado em `foco`, look NOITE, fov 34 (ou 58 em lugar escuro via extra.fov) */
  const render = (scene, foco, t, extra = {}) => {
    const fov = extra.fov || 34; if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    E.render(scene, cam, { ...NOITE, focus: cam.position.distanceTo(foco), aperture: 0.0012, t, ...extra });
  };
  const olhar = (pos, alvo) => { cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(alvo); cam.updateMatrixWorld(true); };

  // duas da mesma pessoa no quarto, uma por cena: a acesa (cena 8) e a apagada (cena 9: corpo quase preto que a tela
  // modela em verde, com um piso de vermelho do alvo nas bordas desde o início, subindo junto com o alerta)
  const Q = quarto(), alvo = pessoa('alvo'), sombra = pessoa('alvo');
  sombra.parts[0].material.color.set('#0A0B0D'); sombra.parts[0].material.roughness = 0.7;
  Q.scene.add(alvo.group, sombra.group);
  const sentar = (h) => { alvo.group.visible = h === alvo; sombra.group.visible = h === sombra; h.group.position.copy(Q.pontos.mesa); h.group.rotation.set(0, Math.PI, 0); };
  const TELA_Q = Q.monitor.tela.malha.getWorldPosition(new THREE.Vector3());

  // 8 · o quarto por cima do ombro: a pessoa do caso digitando, a câmera aproximando da tela
  const at8 = cena(7, 'quartoOmbro', 'quarto escuro; pessoa alvo (vermelha) sentada digitando; câmera atrás do ombro direito aproximando da tela verde', (lt, d, t, blit) => {
    sentar(alvo); alvo.parts[0].material.emissiveIntensity = 0.85;
    alvo.posar(POSES_CASO.sentadoDigitando); digitar(alvo, t);
    Q.atualizar(t, { tela: { linhas: 10, k: seg(lt, 0, d * 0.95), cursor: true }, abajur: 0 });
    const k = eio(lt / d);
    olhar(lerpV(V3(0.95, 1.85, 1.0), V3(0.7, 1.72, 0.45), k), lerpV(V3(-0.1, 0.98, -1.45), V3(-0.06, 1.02, -1.5), k));
    render(Q.scene, TELA_Q, t, { fov: 40, aperture: 0.0016, bloomThreshold: 0.8 }); blit();
  });
  cue(at8, 'teclado', { dur: 2.8, gain: 0.45 });

  // 9 · o mesmo quarto em dois planos. A (até CORTE_9): de frente e de baixo, do canto da mesa — o rosto escuro modelado
  // pela tela verde, as bordas em vermelho fraco, a janela de persiana atrás. B: contraplano por cima do ombro esquerdo,
  // aproximando da tela — o alerta de invasão entra, a luz vira vermelha, ela acende em vermelho e recua na cadeira.
  const CORTE_9 = 1.1;
  const at9 = cena(8, 'quartoFrente', 'A: de frente e de baixo, rosto escuro modelado pela tela verde com bordas vermelhas, janela atrás; B (corte em 1,1 s): por cima do ombro esquerdo, o alerta INVASÃO entra na tela, a luz vira vermelha e ela acende e recua', (lt, d, t, blit) => {
    sentar(sombra);
    const ka = seg(lt, CORTE_9 + 0.2, CORTE_9 + 0.6), recua = eo(seg(lt, CORTE_9 + 0.5, CORTE_9 + 1.3));
    // antes do alerta: centro escuro (só a tela verde modela) e borda vermelha fraca; o alerta acende o corpo todo
    const ms = sombra.parts[0].material; ms.emissiveIntensity = lerp(0.3, 1.1, ka); ms.userData.volume.uCentro.value = lerp(0.12, 0.6, ka);
    sombra.posar(misturarPosesCorpo(POSES_CASO.sentadoDigitando, POSES_CASO.sentadoOlhando, recua)); digitar(sombra, t, 1 - recua);
    Q.atualizar(t, { tela: { linhas: 10, k: 0.6 + 0.4 * seg(lt, 0, CORTE_9 + 0.2), cursor: true, alerta: 'invasao', kAlerta: ka }, abajur: 0.6 });
    if (lt < CORTE_9) {
      const k = eio(lt / CORTE_9), cabeca = sombra.head.getWorldPosition(new THREE.Vector3()).add(V3(0, 0.12, 0));
      olhar(lerpV(V3(-0.62, 0.8, -1.46), V3(-0.59, 0.81, -1.42), k), V3(0.05, 1.22, -0.7));
      render(Q.scene, cabeca, t, { fov: 58 });
    } else {
      const k = eio((lt - CORTE_9) / (d - CORTE_9));
      olhar(lerpV(V3(-0.68, 1.56, 0.4), V3(-0.57, 1.5, 0.18), k), lerpV(V3(0.05, 1.12, -1.3), V3(0.14, 1.14, -1.25), k));
      render(Q.scene, TELA_Q, t, { fov: 58, aperture: 0.0014, bloomThreshold: 0.8 });
    }
    blit();
  });
  cue(at9 + CORTE_9, 'whoosh', { gain: 0.25 });
  cue(at9 + CORTE_9 + 0.2, 'bip', { gain: 0.6 }); cue(at9 + CORTE_9 + 0.2, 'thud', { gain: 0.5 });

  const O = escritorio({ fileiras: 3, mesasPorFileira: 4 });
  const sentadas = [pessoa('testemunha'), pessoa('testemunha')], MESAS = [1, 5], emPe = pessoa('testemunha');
  [...sentadas, emPe].forEach((h) => O.scene.add(h.group));
  const ZL = O.pontos.lampada.z;

  // 10 · o escritório: duas testemunhas sentadas; as telas viram "bloqueado" uma a uma, a câmera desce o corredor
  const at10 = cena(9, 'escritorioBloqueado', 'escritório aberto à noite; 2 testemunhas sentadas; telas viram BLOQUEADO uma a uma (índice × 0,3 s); travelling pelo corredor', (lt, d, t, blit) => {
    emPe.group.visible = false;
    const bloqueio = (i) => seg(lt, 0.1 + i * 0.3, 0.35 + i * 0.3);
    sentadas.forEach((h, j) => {
      const i = MESAS[j], kb = bloqueio(i); h.group.visible = true; h.group.position.copy(O.pontos.cadeiras[i]); h.group.rotation.set(0, Math.PI, 0);
      h.posar(misturarPosesCorpo(POSES_CASO.sentadoDigitando, POSES_CASO.sentadoOlhando, eo(seg(lt, 0.25 + i * 0.3, 0.9 + i * 0.3)))); digitar(h, t + j, 1 - kb);
    });
    O.atualizar(t, { telas: (i) => ({ linhas: 10, k: 1, cursor: false, alerta: 'bloqueado', kAlerta: bloqueio(i) }), luz: 1, piscar: 0 });
    const k = eio(lt / d);
    olhar(lerpV(V3(0.35, 1.62, 3.7), V3(0.3, 1.55, 2.5), k), lerpV(V3(-1.25, 1.0, -1.2), V3(-1.2, 1.0, -2.0), k));
    render(O.scene, O.pontos.cadeiras[MESAS[1]].clone().add(V3(0, 1.0, 0)), t, { fov: 58 }); blit();
  });
  for (let i = 0; i < 10; i++) cue(at10 + 0.1 + i * 0.3, 'bip', { gain: 0.25 });

  // 11 · a lâmpada piscando sobre o corredor e uma testemunha em pé, de costas, olhando para ela
  const at11 = cena(10, 'escritorioPisca', 'escritório com todas as telas bloqueadas; a luminária do meio pisca; testemunha em pé de costas, olhando a luz', (lt, d, t, blit) => {
    sentadas.forEach((h) => (h.group.visible = false));
    emPe.group.visible = true; emPe.group.position.set(0.05, 0, ZL + 1.5); emPe.group.rotation.set(0, Math.PI, 0); emPe.posar(POSES_CASO.emPeOlhando);
    O.atualizar(t, { telas: () => ({ linhas: 10, k: 1, cursor: false, alerta: 'bloqueado', kAlerta: 1 }), luz: 1, piscar: 1 });
    const k = eio(lt / d);
    olhar(lerpV(V3(0.35, 1.3, 2.4), V3(0.25, 1.28, 1.6), k), V3(0, 1.35, ZL));
    render(O.scene, emPe.group.position.clone().add(V3(0, 1.2, 0)), t, { fov: 58 }); blit();
  });
  cue(at11, 'buzz', { dur: 2.9, gain: 0.3 });

  // 12 · os 3 materiais lado a lado sob a mesma luz (como a seção 2 da folha do Night File)
  const P = new THREE.Scene(); P.background = new THREE.Color('#050608'); P.fog = new THREE.Fog('#050608', 6, 12);
  {
    const chao = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: '#151A24', roughness: 0.6 })); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; P.add(chao);
    const fundo = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), new THREE.MeshStandardMaterial({ color: '#2B3343', roughness: 0.9 })); fundo.position.set(0, 4, -2.5); fundo.receiveShadow = true; P.add(fundo);
    luminaria(P, 0, 3.4, 0, 22); P.add(new THREE.HemisphereLight('#2A3A60', '#05070C', 0.3));
  }
  const TRIO = [['testemunha', 'TESTEMUNHA', -0.78], ['alvo', 'ALVO', 0], ['memoria', 'MEMÓRIA', 0.78]].map(([tipo, rotulo, x]) => {
    const h = pessoa(tipo); h.group.position.set(x, 0, 0); P.add(h.group); return { h, rotulo, x };
  });
  const at12 = cena(11, 'materiais', 'palco escuro com uma luminária; testemunha, alvo e memória lado a lado em pé, com os rótulos embaixo', (lt, d, t, blit) => {
    TRIO.forEach(({ h }, i) => { h.posar(i === 1 ? POSES_CASO.emPeOlhando : POSES_CASO.deCostas); h.breathe(t + i, 1); });
    TRIO[1].h.parts[0].material.emissiveIntensity = 1.4;   // sob a luminária: menos emissive, senão o ACES lava o vermelho para salmão
    const k = eio(lt / d);
    olhar(lerpV(V3(0, 1.1, 5.6), V3(0, 1.05, 5.0), k), V3(0, 0.62, 0));
    render(P, V3(0, 1, 0), t, { fov: 40, bloomThreshold: 0.7 }); blit();
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = '700 34px FreeMono'; ctx.fillStyle = corDoTema('texto');
    TRIO.forEach(({ rotulo, x }, i) => {
      const p = V3(x, -0.06, 0.3).project(cam); ctx.globalAlpha = eo(seg(lt, 0.3 + i * 0.25, 0.8 + i * 0.25));
      ctx.fillText(rotulo, (p.x + 1) / 2 * W, (1 - p.y) / 2 * H);
    });
    ctx.globalAlpha = 1;
  });
  TRIO.forEach((_, i) => cue(at12 + 0.3 + i * 0.25, 'tock', { gain: 0.35 }));

  // ═════════════════════════ lugares 2: servidores, rua, corredor, parede ═════════════════════════
  const S = servidores({ racks: 6 }), FIM_S = S.pontos.corredor[1];

  // 13 · a sala de servidores: travelling lento pelo corredor; na metade o alarme entra e os LEDs vermelhos piscam
  const at13 = cena(12, 'servidores', 'sala de servidores escura; travelling lento entre as fileiras de racks; LEDs verdes; na metade o alarme: parte dos LEDs vira vermelha e pisca', (lt, d, t, blit) => {
    S.atualizar(t, { alarme: eo(seg(lt, d / 2, d / 2 + 0.3)) });
    const k = eio(lt / d);
    olhar(lerpV(V3(0.22, 1.5, 3.0), V3(0.12, 1.45, 1.9), k), lerpV(V3(-0.12, 1.15, FIM_S.z), V3(-0.05, 1.12, FIM_S.z), k));
    render(S.scene, S.pontos.lampada.clone().add(V3(0, 1.2, 0)), t, { fov: 58 }); blit();
  });
  cue(at13, 'buzz', { dur: 2.9, gain: 0.2 });
  for (let i = 0; i < 3; i++) cue(at13 + 1.5 + i * 0.33, 'bip', { gain: 0.45 });

  // 14 · close nos LEDs: a câmera rente à porta do rack, foco curto (DOF), o alarme tomando conta
  const FOCO_LED = V3(-0.65, 1.2, -1.05);
  const at14 = cena(13, 'leds', 'close rente à porta de grade de um rack; DOF curto: LEDs em foco na frente, o resto do corredor desfocado; o alarme crescendo, LEDs vermelhos piscando', (lt, d, t, blit) => {
    S.atualizar(t, { alarme: lerp(0.45, 1, eo(seg(lt, 0.1, 1.4))) });
    const k = eio(lt / d);
    olhar(lerpV(V3(0.12, 1.34, -0.3), V3(0.06, 1.3, -0.55), k), lerpV(V3(-0.66, 1.18, -1.3), V3(-0.66, 1.16, -1.55), k));
    render(S.scene, FOCO_LED, t, { fov: 40, aperture: 0.0025, maxblur: 0.01, exposure: 1.5 }); blit();
  });
  for (let i = 0; i < 9; i++) cue(at14 + 0.05 + i * 0.33, 'bip', { gain: 0.35 });

  // 15 · a rua na chuva: a testemunha anda pela calçada debaixo do poste; o carro passa ao fundo com os faróis acesos
  const R = rua(), passante = pessoa('testemunha'); R.scene.add(passante.group);
  const CALC = R.pontos.calcada[0], PASSO = 1.4, VEL = 1.05;          // 1 ciclo do walk = 2 passos de 0,7 m
  const at15 = cena(14, 'rua', 'rua à noite na chuva, chão molhado refletindo o poste; testemunha andando pela calçada debaixo do poste; o carro passa ao fundo, faróis acesos', (lt, d, t, blit) => {
    R.atualizar(t, { chuva: 1, carro: seg(lt, 0.2, 2.8) });
    const anda = VEL * lt;
    passante.group.position.set(-1.9 + anda, CALC.y, CALC.z); passante.group.rotation.set(0, Math.PI / 2, 0);
    passante.walk(anda / PASSO * Math.PI * 2, 1);
    const k = eio(lt / d);
    olhar(lerpV(V3(6.4, 1.55, 2.5), V3(5.8, 1.52, 2.4), k), V3(-4, 1.9, -0.7));
    render(R.scene, passante.group.position.clone().add(V3(0, 1.0, 0)), t, { fov: 58 }); blit();
  });
  cue(at15, 'buzz', { dur: 2.9, gain: 0.12 }); cue(at15 + 1.2, 'whoosh', { gain: 0.35 });

  // 16 · o corredor: a luminária do fundo piscando e a pessoa do caso parada lá no fundo, de frente
  const C = corredor(), alvoC = pessoa('alvo'); C.scene.add(alvoC.group);
  const Z_ALVO = C.pontos.lampadas[1].z + 1.9;                         // fora do cone de trás, entre as duas luzes
  const at16 = cena(15, 'corredor', 'corredor comprido de prédio; a luminária do fundo pisca; a pessoa alvo (vermelha) parada no fundo, de frente; câmera aproximando devagar', (lt, d, t, blit) => {
    C.atualizar(t, { piscar: 1 });
    alvoC.group.position.set(0, 0, Z_ALVO); alvoC.group.rotation.set(0, 0, 0);
    alvoC.posar(POSES_CASO.deCostas); alvoC.breathe(t, 1); alvoC.parts[0].material.emissiveIntensity = 1.3;
    const k = eio(lt / d);
    olhar(lerpV(V3(0.35, 1.45, 2.4), V3(0.25, 1.42, 1.5), k), V3(0, 1.3, Z_ALVO));
    render(C.scene, V3(0, 1.0, Z_ALVO), t, { fov: 46 }); blit();
  });
  cue(at16, 'buzz', { dur: 2.9, gain: 0.3 });

  // 17 · a parede do caso: as fotos (polaroides desenhadas UMA vez, aqui, num canvas próprio) e o barbante se revelando
  const fotoDaParede = (tipo) => {
    const c = document.createElement('canvas'); c.width = 360; c.height = 420;
    const g = c.getContext('2d'), antes = ctx; setCtx(g);
    try { g.fillStyle = corDoTema('papel'); g.fillRect(0, 0, 360, 420); g.save(); g.translate(180, 210); g.scale(1.5, 1.5); polaroid(0, 0, 1, 0, tipo); g.restore(); }
    finally { setCtx(antes); }                          // o ctx global volta para o canvas do vídeo mesmo se o desenho lançar
    return c;
  };
  const PW = paredeDoCaso(['escuro', 'casa', 'alvo', 'tela', 'vazio'].map(fotoDaParede));
  const at17 = cena(16, 'parede', 'parede do caso: quadro de cortiça com 5 polaroides (alvo no centro) e alfinetes vermelhos; o barbante vermelho se revela fio a fio; câmera aproximando', (lt, d, t, blit) => {
    PW.atualizar(t, { barbante: seg(lt, 0.25, 2.5) });
    const k = eio(lt / d);
    olhar(lerpV(V3(0.4, 0.3, 9.5), V3(0.2, 0.2, 7.2), k), V3(0, 0.2, 0));
    render(PW.scene, V3(0, 0.2, 0), t, { bloom: 0.4 }); blit();
  });
  for (let j = 0; j < 5; j++) cue(at17 + 0.25 + j * 0.45, 'zip', { gain: 0.3 });

  return { cenas, cues };
}
