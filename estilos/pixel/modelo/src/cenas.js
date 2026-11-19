// Cenas do vídeo-modelo pixel ("Como o micro-ondas esquenta a comida?", ~15 s, 5 linhas).
// montarCenas(E, { tempo, tema, script }) -> { cenas, cues }. Cada cena: { id, at, note, draw(lt, d, t, blit) }.
// Regras: tempos SEMPRE por tempo.linha(i) / tempo.palavra('x', i); cada draw começa com reset (quadro = função pura de t);
// HUD depois do blit(); um corte por linha (às vezes dois), um pouco antes da fala.
import { camera } from '../kit/motor/pixel.js';
import { lerp, seg, eo, eio } from '../kit/motor/lib.js';
import { valorTopo, etiqueta, cartaoFinal } from '../kit/hud.mjs';
import { V, L3, olhar, projetar, noMundo } from '../kit/mundo/pecas.js';
import { cozinha, microMundo } from '../kit/mundo/cenarios.js';
import { arcos, vapor } from '../kit/mundo/efeitos.js';

export function montarCenas(E, { tempo, script }) {
  const cenas = [], cues = [];
  const cue = (t, type, o = {}) => cues.push({ t, type, ...o });
  const inicio = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
  const P = (w, i, oc) => tempo.palavra(w, i, oc);
  const cenaEm = (at, id, note, draw, gain = 0.45) => { cenas.push({ id, at, note, draw }); if (at > 0) cue(at, 'whoosh', { gain }); };
  const cam = camera(35);
  const ver = (pos, alvo, fov = 35) => olhar(cam, pos, alvo, fov);
  const tela = (obj, local) => projetar(noMundo(obj, local), cam);

  // ---------- mundos ----------
  const K = cozinha(), mw = K.mw;
  const arcA = arcos(7), arcB = arcos(7); K.scene.add(arcA.group, arcB.group);
  const fumaca = vapor(); fumaca.group.position.set(0, mw.lasanha.altura * 0.32 + 0.6, 0); mw.mesa.add(fumaca.group);
  const MM = microMundo();
  const resetCozinha = () => { mw.reset(); arcA.group.visible = arcB.group.visible = false; fumaca.group.visible = false; };
  const visorContagem = (t) => mw.visor(`0:${String(Math.max(0, 30 - Math.floor(t))).padStart(2, '0')}`);

  // ===== L0: cozinha, micro-ondas ligado =====
  const tMas = P('mas', 0);
  cenaEm(0, 'A0', 'cozinha: micro-ondas ligado, câmera chegando', (lt, d, t, blit) => {
    resetCozinha(); mw.ligado(1); mw.mesa.rotation.y = t * 0.7; visorContagem(t);
    ver(L3([-5.5, 5, 16], [-3.2, 3.4, 11.5], eio(lt / d)), [-0.3, 1.5, 0]);
    E.render(K.scene, cam); blit();
  });
  cue(0.05, 'rumble', { dur: tempo.linha(2) - 0.2, gain: 0.25 });
  cenaEm(tMas - 0.06, 'A1', 'pela janela: lasanha girando', (lt, d, t, blit) => {
    resetCozinha(); mw.ligado(1); mw.mesa.rotation.y = t * 0.7; visorContagem(t);
    ver(L3([-1.6, 2.6, 8.6], [-1.0, 2.1, 6.8], eio(lt / d)), [-0.65, 0.9, 0]);
    E.render(K.scene, cam); blit();
  });

  // ===== L1: raio-x, magnetron, ondas =====
  const i1 = inicio(1), tDentro = P('dentro', 1), tMag = P('magnetron', 1), tJoga = P('joga', 1);
  cenaEm(i1, 'B0', 'raio-x: a carcaça some e aparece o magnetron', (lt, d, t, blit) => {
    resetCozinha(); mw.ligado(1); mw.mesa.rotation.y = t * 0.7; visorContagem(t);
    mw.casca(lerp(1, 0.16, eo(seg(t, tDentro - 0.1, tDentro + 0.5))));
    ver(L3([3.5, 4.6, 13.5], [9.6, 5.4, 10.6], eio(lt / d)), [0.4, 1.5, 0]);
    E.render(K.scene, cam); blit();
    const [x, y] = tela(mw.mag, V(0, 0.2, 0));
    etiqueta('MAGNETRON', 540, 520, x, y, seg(t, tMag - 0.05, tMag + 0.5));
  });
  cue(tDentro, 'sparkle', { dur: 0.6, gain: 0.35 }); cue(tMag, 'pop', { gain: 0.6 });
  cenaEm(tJoga - 0.1, 'B1', 'ondas laranja enchendo a cavidade', (lt, d, t, blit) => {
    resetCozinha(); mw.ligado(0.45); mw.mesa.rotation.y = t * 0.7; visorContagem(t); mw.casca(0.16);
    const k = eo(seg(t, tJoga - 0.05, tJoga + 0.4));
    arcA.atualizar(t, { origem: noMundo(mw.cav, V(1.5, 0.95, -0.35)), rotY: Math.PI, alcance: 3.2, k });
    arcB.atualizar(t + 0.35, { origem: noMundo(mw.cav, V(-1.5, 0.3, 0.2)), rotY: 0, alcance: 3.2, k: k * 0.7 });
    mw.lasanha.calor(0.3 * seg(t, tJoga, tempo.linha(2)));
    ver(L3([-0.4, 5.2, 7.6], [-0.5, 4.2, 6.0], eio(lt / d)), [-0.65, 1.1, 0]);
    E.render(K.scene, cam); blit();
  });
  cue(tJoga, 'zip', { gain: 0.5 });

  // ===== L2: moléculas de água girando com o campo =====
  const i2 = inicio(2), tAgua = P('água', 2), tGirar = P('girar', 2), tBilhoes = P('bilhões', 2);
  cenaEm(i2, 'C0', 'moléculas de água passam a girar juntas', (lt, d, t, blit) => {
    const kAl = eo(seg(t, tGirar - 0.15, tGirar + 0.3));
    const campo = Math.tanh(4 * Math.sin((t - tGirar) * Math.PI * 2 * lerp(1.2, 2.4, seg(t, tBilhoes, tBilhoes + 0.5)))) * (Math.PI / 2);
    MM.atualizar(t, { alinhar: kAl, campo });
    MM.heroi.group.position.set(0, 0.4, 1.2); MM.heroi.group.rotation.set(0.3 * (1 - kAl), t * 0.5 * (1 - kAl), campo * kAl); MM.ima.visible = false;
    ver(L3([0, 0.3, 12.5], [0.3, 0.6, 10.8], eio(lt / d)), [0, 0.3, 0]);
    E.render(MM.scene, cam); blit();
    const [x, y] = tela(MM.heroi.o);
    etiqueta('ÁGUA (H2O)', 540, 560, x, y, seg(t, tAgua - 0.05, tAgua + 0.45) * (1 - seg(t, tBilhoes - 0.3, tBilhoes)));
    valorTopo('2,45 GHZ', '2,45 BILHÕES DE CICLOS POR SEGUNDO', seg(t, tBilhoes - 0.1, tBilhoes + 0.7), seg(t, tempo.linha(3) - 0.3, tempo.linha(3) - 0.1));
  });
  cue(tAgua, 'bubbles', { dur: 0.9, gain: 0.3 }); cue(tGirar, 'slide', { gain: 0.4 }); cue(tBilhoes, 'zip', { gain: 0.6 });

  // ===== L3: atrito vira calor =====
  const i3 = inicio(3), tAtrito = P('atrito', 3), tCalor = P('calor', 3);
  cenaEm(i3, 'D0', 'moléculas se batendo e esquentando', (lt, d, t, blit) => {
    const campo = Math.tanh(4 * Math.sin((t - tGirar) * Math.PI * 2 * 2.4)) * (Math.PI / 2);
    MM.atualizar(t, { alinhar: 1, campo, agito: eo(seg(t, tAtrito - 0.2, tAtrito + 0.2)), calor: eo(seg(t, tAtrito, tCalor + 0.4)) });
    MM.heroi.group.position.set(0, 0.4, 1.2); MM.heroi.group.rotation.set(0, 0, campo); MM.ima.visible = false;
    ver(L3([0.3, 0.6, 10.8], [1.6, 1.4, 13.5], eio(lt / d)), [0, 0.3, 0]);
    E.render(MM.scene, cam); blit();
    valorTopo('ATRITO = CALOR', null, seg(t, tAtrito - 0.05, tAtrito + 0.6), 0, { s: 9 });
  });
  cue(tAtrito, 'thud', { gain: 0.45 }); cue(tCalor, 'sizzle', { dur: 1.0, gain: 0.45 });

  // ===== L4: pronto + cartão final =====
  const i4 = inicio(4), tCur = P('curiosidades', 4), tClique = tCur + 0.15;
  cenaEm(i4, 'H0', 'pronto: porta abre, vapor, cartão final', (lt, d, t, blit) => {
    resetCozinha(); mw.ligado(0.6); mw.lasanha.calor(0.6); mw.visor(Math.floor(lt * 3) % 2 ? '0:00' : '    ');
    mw.abrir(eo(seg(lt, 0.1, 0.9))); fumaca.atualizar(t, eo(seg(lt, 0.3, 1.0)));
    ver(L3([-4.2, 4.2, 13], [-5.2, 4.8, 15.5], eio(lt / d)), [-0.3, 1.6, 0]);
    E.render(K.scene, cam); blit();
    const ult = script.lines[tempo.ultima];
    cartaoFinal({ marca: script.marca_nome || 'Conhecimento', arroba: script.marca_arroba, textoDaUltimaLinha: ult.text, k: seg(t, i4 + 0.1, i4 + 0.5), clique: seg(t, tClique - 0.3, tClique + 0.3) });
  });
  cue(i4 + 0.05, 'tock', { gain: 0.5 }); cue(i4 + 0.25, 'tock', { gain: 0.5 }); cue(tClique, 'pop', { gain: 0.7 });

  return { cenas, cues };
}
