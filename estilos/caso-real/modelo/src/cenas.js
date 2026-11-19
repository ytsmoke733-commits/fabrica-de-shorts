// Vídeo-modelo do caso-real: "O vírus que trancou 200 mil computadores" (WannaCry, 12 MAI 2017; ~25 s, 5 linhas).
// Planos presos às linhas (2 no máximo por linha, 3-5 s cada; nada abaixo de 1 s):
//   linha 0 · gancho: a sala de servidores escura com a data 12 MAI 2017 datilografada; em "vírus" o alarme (LEDs
//             vermelhos); corte em "duzentos" para o mapa-múndi com as conexões saindo de Londres para 8 cidades até o fim da
//             linha; pílulas COMPUTADORES 200 mil (em "computadores") e PAÍSES 150 (em "países"), uma embaixo da outra
//   linha 1 · o escritório à noite com 2 testemunhas; as telas viram "bloqueado" uma a uma a partir de "hospitais"; em
//             "cancelar" o fundo desfoca e o recorte de jornal cai; círculo vermelho em CONSULTAS em "consultas"
//   linha 2 · a tela de código genérico em tela cheia; círculo vermelho numa linha em "falha"; corte em "correção" para a
//             linha do tempo (14 MAR 2017 correção → 12 MAI 2017 ataque) com a ficha do caso atrás
//   linha 3 · o quarto: o pesquisador (a pessoa alvo, vermelha) digitando, a câmera aproximando por cima do ombro; em
//             "registrando" a tela dá o alerta verde 'ok' e o mapa volta em inserto com as conexões apagando
//   linha 4 · chamada: a parede do caso com o barbante se revelando; a ficha cai e leva o carimbo ATUALIZE em "sistema";
//             depois o cartão final, com o clique em "reais"
// Receitas de lugar, câmera, luz e intensidades da vitrine (vitrine/src/cenas.js, aprovada). Uma luz por cena; vermelho só
// no ataque (conexões, alarme, telas bloqueadas, carimbo, círculo) e no pesquisador. Tempos só por tempo.linha(i) /
// tempo.palavra(…, i). Todo quadro = função pura de t (pose, visibilidade, material e luz refeitos a cada quadro).
import * as THREE from 'three';
import { ctx, setCtx, W, H, lerp, seg, eo, eio, eob } from '../kit/motor/lib.js';
import { camera } from '../kit/motor/engine.js';
import { NOITE } from '../kit/luz.js';
import { pessoa, POSES_CASO, digitar } from '../kit/pessoas.js';
import { misturarPosesCorpo } from '../kit/personagem/poses.mjs';
import { quarto } from '../kit/lugares/quarto.js';
import { escritorio } from '../kit/lugares/escritorio.js';
import { servidores } from '../kit/lugares/servidores.js';
import { paredeDoCaso } from '../kit/lugares/parede.js';
import { pilula, cartaoFinal } from '../kit/hud.mjs';
import { rgba } from '../kit/tema.mjs';
import { ficha, polaroid, circuloVermelho, dataDatilografada, recorteDeJornal, filme, corDoTema, fonteDoTema } from '../kit/evidencias.mjs';
import { mapaMundi, linhaDoTempo } from '../kit/paineis.mjs';
import { desenharTela } from '../kit/tela.mjs';
import { linhasDeCodigo } from '../kit/codigo.mjs';

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

export function montarCenas(E, { tempo, script }) {
  const cenas = [], cues = [];
  const cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const corte = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
  // toda cena termina com o filme (vinheta + grão) por cima, antes das legendas
  const cena = (at, id, note, draw) => {
    cenas.push({ id, at, note, draw: (lt, d, t, blit) => { draw(lt, d, t, blit); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; filme(t); } });
    return at;
  };

  const cam = camera(34);
  /** o render do NF: DOF focado em `foco`, look NOITE, fov 34 (ou 58 em lugar escuro via extra.fov) */
  const render = (scene, foco, t, extra = {}) => {
    const fov = extra.fov || 34; if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    E.render(scene, cam, { ...NOITE, focus: cam.position.distanceTo(foco), aperture: 0.0012, t, ...extra });
  };
  const olhar = (pos, alvo) => { cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(alvo); cam.updateMatrixWorld(true); };

  // ═══════════════ linha 0 · gancho: servidores → mapa ═══════════════
  const S = servidores({ racks: 6 }), FIM_S = S.pontos.corredor[1];
  const tVirus = tempo.palavra('vírus', 0);
  cena(corte(0), 'servidores', 'sala de servidores escura, travelling lento pelo corredor; data 12 MAI 2017 / SEXTA-FEIRA · 1º DIA datilografada; em "vírus" o alarme: LEDs vermelhos piscando', (lt, d, t, blit) => {
    S.atualizar(t, { alarme: eo(seg(t, tVirus, tVirus + 0.3)) });
    const k = eio(lt / d);
    olhar(lerpV(V3(0.22, 1.5, 3.0), V3(0.14, 1.46, 2.1), k), lerpV(V3(-0.12, 1.15, FIM_S.z), V3(-0.06, 1.12, FIM_S.z), k));
    render(S.scene, S.pontos.lampada.clone().add(V3(0, 1.2, 0)), t, { fov: 58 }); blit();
    dataDatilografada('12 MAI 2017', 'SEXTA-FEIRA · 1º DIA', seg(lt, 0.15, 1.6), 80, 300);
  });
  for (let i = 0; i < 6; i++) cue(0.15 + i * 0.24, 'tock', { gain: 0.3 });
  for (let i = 0; i < 3; i++) cue(tVirus + i * 0.33, 'bip', { gain: 0.45 });

  // o mapa: 8 conexões partindo de Londres até o fim da linha; as duas pílulas, uma embaixo da outra
  const DESTINOS = ['Madri', 'Moscou', 'Nova York', 'Mumbai', 'São Paulo', 'Pequim', 'Joanesburgo', 'Sydney'];
  const at0b = tempo.palavra('duzentos', 0) - 0.08, fim0 = tempo.fimLinha(0);
  const tComp = tempo.palavra('computadores', 0), tPaises = tempo.palavra('países', 0);
  cena(at0b, 'mapa', 'mapa-múndi em pontos; 8 conexões vermelhas saindo de Londres até o fim da linha; pílulas COMPUTADORES 200 mil e PAÍSES 150', (lt, d, t) => {
    fundo(540, 860, 800, 0.08); ctx.save(); empurrar(lt, d, 540, 860, 0.03);
    mapaMundi({ y: 640, conexoes: DESTINOS.map((c) => ['Londres', c]), p: seg(t, at0b + 0.2, fim0), foco: 'Londres', k: t });
    ctx.restore();
    pilula('tela', 'COMPUTADORES', '200 mil', eob(seg(t, tComp, tComp + 0.4)));
    ctx.save(); ctx.translate(0, 112); pilula('globe', 'PAÍSES', '150', eob(seg(t, tPaises, tPaises + 0.4))); ctx.restore();
  });
  cue(at0b, 'whoosh', { gain: 0.4 }); cue(at0b + 0.2, 'slide', { dur: fim0 - at0b - 0.2, gain: 0.35 });
  cue(tComp, 'tock', { gain: 0.5 }); cue(tPaises, 'tock', { gain: 0.5 });

  // ═══════════════ linha 1 · o escritório bloqueando e o recorte de jornal ═══════════════
  const O = escritorio({ fileiras: 3, mesasPorFileira: 4 });
  const sentadas = [pessoa('testemunha'), pessoa('testemunha')], MESAS = [1, 5];
  sentadas.forEach((h) => O.scene.add(h.group));
  const at1 = corte(1), tHosp = tempo.palavra('hospitais', 1), tCanc = tempo.palavra('cancelar', 1), tCons = tempo.palavra('consultas', 1);
  const bloqueio = (i, t) => seg(t, tHosp + i * 0.18, tHosp + 0.25 + i * 0.18);
  const JORNAL = { x: 540, y: 860, s: 1.3, rot: -0.04 };
  cena(at1, 'escritorio', 'escritório aberto à noite; 2 testemunhas sentadas; telas viram BLOQUEADO uma a uma desde "hospitais"; em "cancelar" o fundo desfoca e o recorte HOSPITAIS CANCELAM CONSULTAS cai; círculo em CONSULTAS', (lt, d, t, blit) => {
    sentadas.forEach((h, j) => {
      const i = MESAS[j], kb = bloqueio(i, t); h.group.position.copy(O.pontos.cadeiras[i]); h.group.rotation.set(0, Math.PI, 0);
      h.posar(misturarPosesCorpo(POSES_CASO.sentadoDigitando, POSES_CASO.sentadoOlhando, eo(seg(t, tHosp + 0.15 + i * 0.18, tHosp + 0.8 + i * 0.18)))); digitar(h, t + j, 1 - kb);
    });
    O.atualizar(t, { telas: (i) => ({ linhas: 10, k: 1, cursor: false, alerta: 'bloqueado', kAlerta: bloqueio(i, t) }), luz: 1, piscar: 0 });
    const k = eio(lt / d);
    olhar(lerpV(V3(0.35, 1.62, 3.7), V3(0.3, 1.55, 2.6), k), lerpV(V3(-1.25, 1.0, -1.2), V3(-1.2, 1.0, -1.9), k));
    render(O.scene, O.pontos.cadeiras[MESAS[1]].clone().add(V3(0, 1.0, 0)), t, { fov: 58 });
    // o recorte entra sobre o fundo desfocado e escurecido
    const kj = seg(t, tCanc, tCanc + 0.8);
    ctx.filter = kj > 0 ? `blur(${(12 * eo(kj)).toFixed(1)}px)` : 'none'; blit(); ctx.filter = 'none';
    if (kj > 0) { ctx.fillStyle = `rgba(0,0,0,${(0.4 * eo(kj)).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
    recorteDeJornal(JORNAL.x, JORNAL.y, JORNAL.s, JORNAL.rot, { titulo: 'HOSPITAIS CANCELAM CONSULTAS', subtitulo: 'Sistemas fora do ar em vários hospitais do país', jornal: 'NOTÍCIAS', data: '13 MAI 2017' }, kj);
    // o círculo em volta de CONSULTAS (3ª linha da manchete), no mesmo referencial do recorte
    ctx.save(); ctx.translate(JORNAL.x, JORNAL.y); ctx.rotate(JORNAL.rot); ctx.scale(JORNAL.s, JORNAL.s);
    circuloVermelho(0, 4, 250, 58, eo(seg(t, tCons, tCons + 0.6)));
    ctx.restore();
  });
  cue(at1, 'whoosh', { gain: 0.4 }); cue(at1 + 0.05, 'teclado', { dur: Math.max(0.3, tHosp + 0.6 - at1), gain: 0.4 });
  cue(tCanc + 0.7, 'slam', { gain: 0.55 });

  // ═══════════════ linha 2 · a falha no código e a linha do tempo ═══════════════
  const at2 = corte(2), tFalha = tempo.palavra('falha', 2), tCorr = tempo.palavra('correção', 2);
  const SEED_TELA = 7, LINHAS_TELA = 24, MARCADA = 17;            // a linha 17 do seed 7: "if (tentativas > limite) {"
  // onde a linha MARCADA cai na tela cheia (mesmas contas do desenharTela: margem 7%, fonte pela largura de 44 colunas)
  const m = Math.min(W, H) * 0.07, px = Math.min((H - 2 * m) / (LINHAS_TELA + 1) / 1.35, (W - 2 * m) / (44 * 0.6)), lh = px * 1.35;
  const yMarcada = m + (MARCADA + 1) * lh - px * 0.35, xCod = m + 4 * 0.6 * px, txtMarcada = linhasDeCodigo(SEED_TELA, LINHAS_TELA)[MARCADA];
  cena(at2, 'tela', 'tela cheia de código genérico verde digitando; em "falha" um círculo vermelho na linha 17; empurrão lento na linha marcada', (lt, d, t) => {
    ctx.save(); empurrar(lt, d, 540, yMarcada, 0.06);
    desenharTela(ctx, W, H, { seed: SEED_TELA, linhas: LINHAS_TELA, k: lerp(0.55, 1, seg(lt, 0, Math.max(0.5, tFalha - at2))), t });
    ctx.font = fonteDoTema('mono', 700, px); const larg = ctx.measureText(txtMarcada).width;
    circuloVermelho(xCod + larg / 2, yMarcada, larg / 2 + 50, lh * 0.95, eo(seg(t, tFalha, tFalha + 0.6)));
    ctx.restore();
  });
  cue(at2 + 0.05, 'teclado', { dur: Math.max(0.3, tFalha - at2), gain: 0.4 });

  const at2b = tCorr - 0.08, fimTL = tempo.fimLinha(2);
  const EVENTOS = [{ data: '14 MAR 2017', rotulo: 'correção' }, { data: '12 MAI 2017', rotulo: 'ataque' }];
  cena(at2b, 'linhaDoTempo', 'linha do tempo: 14 MAR 2017 correção → 12 MAI 2017 ataque (o atual, vermelho pulsando); a ficha CASO Nº 2017-05 atrás', (lt, d, t) => {
    fundo(540, 820, 800, 0.1); ctx.save(); empurrar(lt, d, 540, 900);
    ficha(560, 1170, 1.05, 'CASO Nº 2017-05', '', 0, 0.05);
    linhaDoTempo({ eventos: EVENTOS, p: seg(t, at2b + 0.1, Math.min(fimTL, at2b + 1.3)), atual: 1, y: 720, t });
    ctx.restore();
  });
  cue(at2b, 'whoosh', { gain: 0.3 }); cue(at2b + 0.15, 'tock', { gain: 0.5 }); cue(at2b + 0.15 + Math.min(fimTL - at2b - 0.1, 1.2) * 0.9, 'tock', { gain: 0.5 });

  // ═══════════════ linha 3 · o pesquisador no quarto ═══════════════
  const Q = quarto(), pesquisador = pessoa('alvo');
  Q.scene.add(pesquisador.group);
  const TELA_Q = Q.monitor.tela.malha.getWorldPosition(new THREE.Vector3());
  const at3 = corte(3), tReg = tempo.palavra('registrando', 3), fim3 = tempo.linha(4) - 0.08;
  cena(at3, 'quarto', 'quarto escuro; o pesquisador (pessoa alvo, vermelha) digitando; câmera atrás do ombro aproximando da tela; em "registrando" alerta verde SISTEMA ATUALIZADO e o mapa volta em inserto com as conexões apagando', (lt, d, t, blit) => {
    pesquisador.group.position.copy(Q.pontos.mesa); pesquisador.group.rotation.set(0, Math.PI, 0);
    pesquisador.parts[0].material.emissiveIntensity = 0.85;          // em close: menos emissive, senão o vermelho lava
    pesquisador.posar(POSES_CASO.sentadoDigitando); digitar(pesquisador, t, 1 - seg(t, tReg, tReg + 0.4));
    Q.atualizar(t, { tela: { linhas: 10, k: seg(lt, 0, Math.max(0.5, tReg - at3)), cursor: true, alerta: 'ok', kAlerta: seg(t, tReg, tReg + 0.4) }, abajur: 0 });
    const k = eio(lt / d);
    olhar(lerpV(V3(0.95, 1.85, 1.0), V3(0.7, 1.72, 0.45), k), lerpV(V3(-0.1, 0.98, -1.45), V3(-0.06, 1.02, -1.5), k));
    render(Q.scene, TELA_Q, t, { fov: 40, aperture: 0.0016, bloomThreshold: 0.8 }); blit();
    // o inserto: o mapa do gancho volta, com as conexões recolhendo para Londres
    const ki = eob(seg(t, tReg + 0.25, tReg + 0.6));
    if (ki > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, ki * 1.5); ctx.translate(540, 360); ctx.scale(lerp(0.9, 1, ki), lerp(0.9, 1, ki)); ctx.translate(-540, -360);
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30;
      ctx.fillStyle = rgba(corDoTema('painel'), 0.9); ctx.beginPath(); ctx.roundRect(50, 140, 980, 440, 26); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = corDoTema('hud'); ctx.lineWidth = 4; ctx.stroke();
      mapaMundi({ x: 80, y: 170, w: 920, h: 383, conexoes: DESTINOS.map((c) => ['Londres', c]), p: 1 - seg(t, tReg + 0.5, fim3 - 0.1), foco: 'Londres', k: t });
      ctx.restore();
    }
  });
  cue(at3, 'whoosh', { gain: 0.35 }); cue(at3 + 0.05, 'teclado', { dur: Math.max(0.3, tReg - at3), gain: 0.45 });
  cue(tReg, 'bip', { gain: 0.6 }); cue(tReg + 0.25, 'whoosh', { gain: 0.3 });

  // ═══════════════ linha 4 · a parede do caso, o carimbo ATUALIZE e o cartão final ═══════════════
  // as fotos da parede: polaroides desenhadas UMA vez, aqui, num canvas próprio
  const fotoDaParede = (tipo) => {
    const c = document.createElement('canvas'); c.width = 360; c.height = 420;
    const g = c.getContext('2d'), antes = ctx; setCtx(g);
    try { g.fillStyle = corDoTema('papel'); g.fillRect(0, 0, 360, 420); g.save(); g.translate(180, 210); g.scale(1.5, 1.5); polaroid(0, 0, 1, 0, tipo); g.restore(); }
    finally { setCtx(antes); }                          // o ctx global volta para o canvas do vídeo mesmo se o desenho lançar
    return c;
  };
  const PW = paredeDoCaso(['tela', 'casa', 'tela', 'vazio', 'tela'].map(fotoDaParede));
  const at4 = corte(4), ULT = tempo.ultima, TXT = script.lines.at(-1).text, MARCA = script.marca_nome || 'Hacker';
  const tSis = tempo.palavra('sistema', ULT), tCartao = tempo.palavra('mais', ULT) - 0.3, tClique = tempo.palavra('reais', ULT) + 0.15;
  cena(at4, 'parede', 'parede do caso com o barbante se revelando; a ficha cai e o carimbo ATUALIZE bate em "sistema"; o cartão final entra e o clique cai em "reais"', (lt, d, t, blit) => {
    PW.atualizar(t, { barbante: seg(lt, 0.1, 1.8) });
    const k = eio(lt / d);
    olhar(lerpV(V3(0.4, 0.3, 9.5), V3(0.2, 0.2, 7.6), k), V3(0, 0.2, 0));
    render(PW.scene, V3(0, 0.2, 0), t, { bloom: 0.4 });
    const kc = eob(seg(t, tCartao, tCartao + 0.45));
    ctx.filter = kc > 0 ? `blur(${(8 * Math.min(1, kc)).toFixed(1)}px)` : 'none'; blit(); ctx.filter = 'none';
    // a ficha cai (de cima, girando um pouco) e, quando o cartão entra, desce e some
    const kf = eob(seg(lt, 0.05, 0.55)), sai = eo(seg(t, tCartao, tCartao + 0.35));
    ctx.save(); ctx.globalAlpha = 1 - sai;
    if (sai < 1) ficha(540, lerp(-300, 1000, kf) + 300 * sai, 1.15, 'CASO Nº 2017-05', 'ATUALIZE', eo(seg(t, tSis, tSis + 0.25)), lerp(-0.3, -0.05, kf));
    ctx.restore();
    cartaoFinal({ marca: MARCA, textoDaUltimaLinha: TXT, k: kc, clique: seg(t, tClique, tClique + 0.35) });
  });
  cue(at4, 'whoosh', { gain: 0.4 }); cue(at4 + 0.5, 'thud', { gain: 0.45 }); cue(tSis + 0.2, 'slam', { gain: 0.6 });
  cue(tCartao, 'whoosh', { gain: 0.35 }); cue(tClique, 'pop', { gain: 0.8 });

  return { cenas, cues };
}
