// Cenas de "Por que os videogames antigos eram quadradinhos?" (~34 s, 9 linhas).
// montarCenas(E, { tempo, tema, script }) -> { cenas, cues }. Cada cena: { id, at, note, draw(lt, d, t, blit) }.
// Tempos SEMPRE por tempo.linha(i) / tempo.palavra('x', i); cada draw começa com reset; HUD depois do blit().
import * as THREE from 'three';
import { camera } from '../kit/motor/pixel.js';
import { clamp, lerp, seg, eo, eio } from '../kit/motor/lib.js';
import { valorTopo, etiqueta, cartaoFinal } from '../kit/hud.mjs';
import { V, L3, at, olhar, projetar, noMundo } from '../kit/mundo/pecas.js';
import { sala, placa, construtor, telaJogo } from './mundo.js';

export function montarCenas(E, { tempo, tema, script }) {
  const cenas = [], cues = [];
  const cue = (t, type, o = {}) => cues.push({ t, type, ...o });
  const inicio = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
  const P = (w, i, oc) => tempo.palavra(w, i, oc);
  const cenaEm = (at, id, note, draw, gain = 0.45) => { cenas.push({ id, at, note, draw }); if (at > 0) cue(at, 'whoosh', { gain }); };
  const cam = camera(35);
  const ver = (pos, alvo, fov = 35) => olhar(cam, pos, alvo, fov);
  const tela = (obj, local) => projetar(noMundo(obj, local), cam);
  const perigo = tema.cores.perigo;

  // ---------- mundos ----------
  const S = sala(), PL = placa(), K = construtor();
  // imagem da tela que tenta caber na memória (L4)
  const img = telaJogo();
  const imgM = new THREE.MeshBasicMaterial({ map: img.tex, color: '#FFFFFF' });
  const quadro = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.95), imgM); PL.scene.add(quadro);
  const moldura = new THREE.Mesh(new THREE.BoxGeometry(2.78, 2.13, 0.06), new THREE.MeshBasicMaterial({ color: '#1A0F0A' })); moldura.position.z = -0.04; quadro.add(moldura);
  const resetPlaca = () => { PL.reset(); quadro.visible = false; };
  // ordem de montagem do herói: de baixo para cima
  const ordem = K.h.cubos.map((c, i) => i).sort((a, b) => (K.h.cubos[b].p.r - K.h.cubos[a].p.r) || (K.h.cubos[a].p.c - K.h.cubos[b].p.c));
  const montar = (t, t0, t1) => {
    const n = ordem.length, passo = (t1 - t0 - 0.45) / n;
    ordem.forEach((idx, j) => {
      const c = K.h.cubos[idx], k = eo(seg(t, t0 + j * passo, t0 + j * passo + 0.45));
      c.o.position.lerpVectors(c.de, c.alvo, k);
      c.o.position.y += Math.sin(k * Math.PI) * 0.8;
      c.o.rotation.set((1 - k) * c.giro * 2, (1 - k) * c.giro * 3, 0);
    });
  };
  const centroTela = () => noMundo(S.vidro);

  // ===== L0: sala, TV ligada com o jogo =====
  const tQuad0 = P('quadradinhos', 0);
  cenaEm(0, 'A0', 'sala dos anos 70: TV de tubo com o jogo, console no chão', (lt, d, t, blit) => {
    S.reset(t);
    ver(L3([3.6, 4.4, 15.5], [1.6, 3.5, 11.2], eio(lt / d)), [0, 2.2, -1]);
    E.render(S.scene, cam); blit();
  });
  cenaEm(tQuad0 - 0.35, 'A1', 'close na tela: o herói é feito de quadradinhos', (lt, d, t, blit) => {
    S.reset(t);
    ver(L3([-0.4, 3.0, 7.6], [-0.4, 2.95, 5.6], eio(lt / d)), [-0.4, 2.9, -0.64]);
    E.render(S.scene, cam); blit();
  });
  cue(tQuad0, 'pop', { gain: 0.5 });

  // ===== L1: console de 1977, 128 bytes =====
  const i1 = inicio(1), tSet = P('setenta', 1), tSo = P('só', 1), tCento = P('cento', 1), tBytes = P('bytes', 1);
  cenaEm(i1, 'B0', 'console no chão, cartucho encaixado', (lt, d, t, blit) => {
    S.reset(t);
    ver(L3([4.6, 2.0, 5.8], [3.6, 1.6, 4.7], eio(lt / d)), [1.4, 0.5, 0.9]);
    E.render(S.scene, cam); blit();
    valorTopo('1977', 'CONSOLE DE CARTUCHO', seg(t, tSet - 0.1, tSet + 0.6), seg(t, tSo - 0.35, tSo - 0.15));
  });
  cue(tSet, 'zip', { gain: 0.55 });
  cenaEm(tSo - 0.1, 'B1', 'placa por dentro: chip de RAM e as 128 células acendendo', (lt, d, t, blit) => {
    resetPlaca();
    PL.memoria(Math.round(128 * eio(seg(t, tCento, tBytes + 0.2))));
    ver(L3([2.6, 3.0, 11.4], [2.2, 2.7, 10.0], eio(lt / d)), [2.0, 1.9, 0.6]);
    E.render(PL.scene, cam); blit();
    valorTopo('128 BYTES', 'A MEMÓRIA INTEIRA DO CONSOLE', seg(t, tCento - 0.1, tCento + 0.6), seg(t, tempo.linha(2) - 0.3, tempo.linha(2) - 0.1));
    const [x, y] = tela(PL.cels[0]);
    etiqueta('1 BYTE', 300, 1200, x, y, seg(t, tBytes - 0.05, tBytes + 0.45));
  });
  cue(tCento, 'zip', { gain: 0.55 }); cue(tCento, 'sparkle', { dur: 1.4, gain: 0.3 }); cue(tBytes, 'pop', { gain: 0.55 });

  // ===== L2: menos que um SMS =====
  const i2 = inicio(2), tMenos = P('menos', 2), tMsg = P('mensagem', 2);
  cenaEm(i2, 'C0', 'celular com um SMS entra ao lado da memória', (lt, d, t, blit) => {
    resetPlaca(); PL.memoria(128); PL.cel.visible = true;
    const k = eo(seg(t, i2 + 0.05, tMenos + 0.2));
    PL.cel.position.set(lerp(9, 4.4, k), 1.75, 1.8); PL.cel.rotation.set(0, lerp(-0.9, -0.3, k), 0);
    ver(L3([3.0, 3.6, 18.0], [2.9, 3.3, 16.8], eio(lt / d)), [2.9, 1.8, 0.8]);
    E.render(PL.scene, cam); blit();
    const [mx, my] = tela(PL.mem, V(0, 1.0, 0));
    etiqueta('RAM: 128 BYTES', 380, 520, mx, my, seg(t, tMenos - 0.05, tMenos + 0.45));
    const [cx, cy] = tela(PL.cel, V(0, -1.6, 0));
    etiqueta('SMS: 140 BYTES', 640, 1220, cx, cy, seg(t, tMsg - 0.05, tMsg + 0.45));
  });
  cue(i2 + 0.1, 'slide', { gain: 0.4 }); cue(tMenos, 'pop', { gain: 0.5 }); cue(tMsg, 'pop', { gain: 0.5 });

  // ===== L3: personagem de poucos quadradinhos =====
  const i3 = inicio(3), tPers = P('personagem', 3), tPoucos = P('poucos', 3), tQuad3 = P('quadradinhos', 3), tCor = P('cor', 3), tPix = P('pixels', 3);
  const fimMontagem = tPoucos + 0.3;
  cenaEm(i3, 'D0', 'o herói montado cubo a cubo, ainda cinza', (lt, d, t, blit) => {
    K.h.colorir(false); montar(t, tPers - 0.25, fimMontagem);
    ver(L3([0.4, 3.4, 16.5], [0, 3.0, 14.2], eio(lt / d)), [0, 2.6, 0]);
    E.render(K.scene, cam); blit();
  });
  cue(tPers - 0.2, 'sparkle', { dur: 1.6, gain: 0.3 });
  for (let j = 0; j < 6; j++) cue(tPers + j * ((fimMontagem - tPers) / 6), 'plop', { gain: 0.22 });
  cenaEm(tQuad3 - 0.06, 'D1', 'câmera gira, o herói ganha cor e aparece o pixel', (lt, d, t, blit) => {
    K.h.colorir(t >= tCor); montar(t, tPers - 0.25, fimMontagem);
    const a = lerp(0.42, 0.72, eio(lt / d)), r = lerp(15.8, 14.8, eio(lt / d));
    ver([Math.sin(a) * r, 3.6, Math.cos(a) * r], [0, 2.6, 0]);
    E.render(K.scene, cam); blit();
    const alvo = K.h.cubos.find((c) => c.p.r === 4 && c.p.c === 3);
    const [x, y] = tela(alvo.o);
    etiqueta('1 PIXEL', 300, 520, x, y, seg(t, tPix - 0.05, tPix + 0.45));
  });
  cue(tCor, 'pop', { gain: 0.5 }); cue(tPix, 'pop', { gain: 0.55 });

  // ===== L4: a imagem da tela não cabe na memória =====
  const i4 = inicio(4), tGuard = P('guardar', 4), tImg = P('imagem', 4), tInt = P('inteira', 4);
  cenaEm(i4, 'E0', 'a imagem da TV tenta entrar na memória e não cabe', (lt, d, t, blit) => {
    resetPlaca(); quadro.visible = true;
    const k = eo(seg(t, i4, tImg + 0.2)), alarme = seg(t, tInt - 0.05, tInt + 0.05);
    PL.memoria(Math.round(128 * seg(t, tGuard, tImg + 0.1)), alarme);
    img.pintar2(t);
    const treme = alarme > 0 ? Math.sin(t * 60) * 0.06 * (1 - seg(t, tInt + 0.3, tInt + 0.8)) : 0;
    quadro.position.set(lerp(0.2, 1.4, k) + treme, lerp(5.0, 3.85, k), lerp(1.4, 0.75, k));
    quadro.scale.setScalar(lerp(1.15, 0.95, k));
    imgM.color.set(alarme > 0.5 ? '#FF9A8A' : '#FFFFFF');
    ver(L3([1.4, 4.0, 14.2], [1.6, 3.7, 13.0], eio(lt / d)), [1.8, 3.0, 0.6]);
    E.render(PL.scene, cam); blit();
    const [x, y] = tela(quadro, V(0, 0.98, 0));
    etiqueta('NÃO CABE!', 540, 330, x, y, seg(t, tInt - 0.05, tInt + 0.4), { s: 7, cor: perigo });
  });
  cue(tGuard, 'slide', { gain: 0.4 }); cue(tGuard, 'bubbles', { dur: 0.8, gain: 0.25 }); cue(tInt, 'alarm', { gain: 0.3 }); cue(tInt, 'thud', { gain: 0.45 });

  // ===== L5: desenhada linha por linha, junto com o feixe da TV =====
  const i5 = inicio(5), tDes = P('desenhava', 5), tLinha = P('linha', 5);
  cenaEm(i5, 'F0', 'close no tubo: o feixe desenha a imagem linha por linha', (lt, d, t, blit) => {
    S.reset(t);
    const per = 1.15, rev = ((t - tDes + 0.2) / per % 1 + 1) % 1;
    S.tela.pintar2(t, { revelar: rev }); S.feixe.visible = true;
    S.feixe.position.y = 1.5 + 0.975 - rev * 1.95;
    S.ponto.position.x = ((t * 7) % 1) * 2.5 - 1.25;
    ver(L3([1.5, 3.15, 4.9], [0.7, 3.0, 4.1], eio(lt / d)), [-0.4, 2.9, -0.64]);
    E.render(S.scene, cam); blit();
    const [x, y] = tela(S.ponto);
    etiqueta('FEIXE DA TV', 560, 1220, x, y, seg(t, tLinha - 0.05, tLinha + 0.45));
  });
  cue(tDes, 'zip', { gain: 0.4 }); cue(i5 + 0.05, 'rumble', { dur: tempo.linha(6) - i5 - 0.2, gain: 0.18 });

  // ===== L6: hoje, mais de 60 milhões de vezes =====
  const i6 = inicio(6), tCel = P('celular', 6), tSes = P('sessenta', 6);
  cenaEm(i6, 'G0', 'um celular gigante sobe atrás da plaquinha', (lt, d, t, blit) => {
    resetPlaca(); PL.memoria(128); PL.pintarCel('home'); PL.cel.visible = true;
    const k = eo(seg(t, tCel - 0.25, tSes));
    PL.cel.scale.setScalar(5); PL.cel.position.set(1.4, lerp(-9, 8.2, k), -7.5);
    const kc = eio(lt / d);
    ver(L3([2.5, 3.0, 13], [1.8, 7.6, 31], kc), L3([2.0, 1.4, 0.6], [1.5, 7.0, -4], kc));
    E.render(PL.scene, cam); blit();
    valorTopo('+60 MILHÕES ×', '8 GB DE RAM / 128 BYTES', seg(t, tSes - 0.1, tSes + 0.7), seg(t, tempo.linha(7) - 0.3, tempo.linha(7) - 0.1), { s: 10 });
  });
  cue(tCel - 0.2, 'rumble', { dur: 0.9, gain: 0.3 }); cue(tSes - 0.05, 'thud', { gain: 0.5 }); cue(tSes, 'zip', { gain: 0.6 });

  // ===== L7: o quadradinho virou estilo (o herói sai da TV) =====
  const i7 = inicio(7), tQ7 = P('quadradinho', 7), tEst = P('estilo', 7), tEste = P('este', 7), tAssim = P('assim', 7);
  const chegada = V(-1.3, 0.05, 1.5);
  const posHeroi = (t) => {
    const c = centroTela(), k = seg(t, tQ7, tEst + 0.1), ke = eio(k);
    const p = new THREE.Vector3().lerpVectors(V(c.x, c.y - 0.8, c.z + 0.1), chegada, ke);
    p.y += Math.sin(k * Math.PI) * 1.6;
    if (k >= 1) p.y += Math.abs(Math.sin((t - tEst - 0.1) * 5)) * 0.35 * (t > tEste ? 1 : 0);
    return { p, k };
  };
  const heroiNaSala = (t) => {
    const { p, k } = posHeroi(t), h = S.h3.group;
    if (t < tQ7) return;
    S.tela.pintar2(t, { semHeroi: true });
    h.visible = true; h.position.copy(p); h.scale.setScalar(lerp(0.35, 0.75, eo(k)));
    h.rotation.set(0, (1 - k) * Math.PI * 2 + (t > tEste ? Math.sin((t - tEste) * 3) * 0.35 : 0), 0);
  };
  cenaEm(i7, 'H0', 'o herói pula de dentro da TV para a sala', (lt, d, t, blit) => {
    S.reset(t); heroiNaSala(t);
    ver(L3([1.2, 3.1, 11.2], [0.6, 2.7, 10.0], eio(lt / d)), [-0.6, 1.8, 0]);
    E.render(S.scene, cam); blit();
  });
  cue(tQ7, 'boing', { gain: 0.5 }); cue(tEst + 0.1, 'plop', { gain: 0.5 });
  cenaEm(tEste - 0.06, 'H1', 'câmera abre: a sala inteira é pixel', (lt, d, t, blit) => {
    S.reset(t); heroiNaSala(t);
    ver(L3([2.2, 3.2, 9.2], [3.4, 4.5, 14.2], eio(lt / d)), [-0.4, 1.7, 0]);
    E.render(S.scene, cam); blit();
  });
  cue(tAssim, 'sparkle', { dur: 0.6, gain: 0.3 });

  // ===== L8: cartão final =====
  const i8 = inicio(8), tCur = P('curiosidades', 8), tClique = tCur + 0.15;
  cenaEm(i8, 'I0', 'sala aberta, herói pulando, cartão final', (lt, d, t, blit) => {
    S.reset(t); heroiNaSala(t);
    ver(L3([-1.4, 4.2, 13.2], [-2.3, 4.8, 15.6], eio(lt / d)), [0, 1.8, 0]);
    E.render(S.scene, cam); blit();
    const ult = script.lines[tempo.ultima];
    cartaoFinal({ marca: script.marca_nome || 'Conhecimento', arroba: script.marca_arroba, textoDaUltimaLinha: ult.text, k: seg(t, i8 + 0.1, i8 + 0.5), clique: seg(t, tClique - 0.3, tClique + 0.3) });
  });
  cue(i8 + 0.05, 'tock', { gain: 0.45 }); cue(tClique, 'pop', { gain: 0.7 });

  return { cenas, cues };
}
