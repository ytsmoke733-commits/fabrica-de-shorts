// Vídeo-modelo do deep-dive: "O que acontece se você engolir um chiclete?" (~15 s, 5 linhas). Planos presos às linhas:
//   linha 0 · gancho: close na cozinha, o herói mastiga e desembrulha a barra com a manchete; em "chiclete" ele engole em
//             câmera lenta (o gole desce pelo pescoço, GLUP) e termina com cara de susto
//   linha 1 · o herói (susto, mão na garganta) dissolve no próprio raio-x, mesma pose e câmera; close da bolinha descendo
//             o esôfago empurrada pela onda até "músculo" (rótulo ESÔFAGO)
//   linha 2 · o estômago por dentro: a bolinha cai no ácido em "estômago" (pílula ÁCIDO pH 2) e as enzimas mordem e quicam
//             em "digerir"
//   linha 3 · time-lapse de 2 dias na sala (pílula DIA n); em "intestino", corte para o intestino por dentro com a câmera
//             seguindo a bolinha
//   linha 4 · chamada: o herói de frente fala (envelope) e acena, inteiro acima do cartão final; o clique cai em
//             "curiosidades"
// Receitas de câmera, luz e look de engolir-chiclete-v2/src/shots.js (S01, S05, S07, S08, S10, S13, S17, S18, S24) e da
// vitrine do kit. Tempos só por tempo.linha(i) / tempo.palavra(…, i). Todo quadro = função pura de t (reset por quadro).
import * as THREE from 'three';
import { ctx, lerp, seg, eo, eio, eob, bigText } from '../kit/motor/lib.js';
import { camera } from '../kit/motor/engine.js';
import { Human } from '../kit/personagem/humano.js';
import { casa, SPOT } from '../kit/casa.js';
import { barraEmbalada, bolinha } from '../kit/objetos.js';
import { xrayStage, orgaos, humanoRaioX, crossfadeRaioX } from '../kit/corpo/raiox.js';
import { esofago } from '../kit/corpo/tubos.js';
import { noCaminho } from '../kit/corpo/caminho.js';
import { estomagoPorDentro } from '../kit/corpo/estomago.js';
import { intestinoPorDentro } from '../kit/corpo/intestino.js';
import { manchete, rotuloGuia, pilula, cartaoFinal, comCameraLenta } from '../kit/hud.mjs';
import { CAMERA_LENTA } from '../kit/cameras.mjs';
import { passagemDeDias } from '../kit/dias.mjs';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, k) => a.clone().lerp(b, k);
const wob = (t, a = 1, f = 1) => V3(Math.sin(t * 0.9 * f) * 0.006 * a, Math.sin(t * 1.3 * f + 1) * 0.005 * a, Math.sin(t * 0.7 * f + 2) * 0.004 * a);   // câmera na mão
const ROSA = '#FF6FA8';                                     // o rosa do chiclete aprovado no v2 (GUM_PINK)

export function montarCenas(E, { tempo, fala, script }) {
  const cenas = [], cues = [];
  const cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const corte = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
  const cena = (at, id, note, draw) => { cenas.push({ id, at, note, draw }); return at; };
  const cam = camera(30), camW = camera(40);
  const KLOOK = { aperture: 0.0035, maxblur: 0.01, bloom: 0.18, bloomThreshold: 0.85 };
  const XLOOK = { aperture: 0.0012, bloom: 0.45, bloomThreshold: 0.55, vignette: 0.45 };
  const SLOOK = { aperture: 0.0025, maxblur: 0.008, bloom: 0.28, bloomThreshold: 0.8, vignette: 0.5 };
  const GLOOK = { aperture: 0.002, maxblur: 0.008, bloom: 0.3, bloomThreshold: 0.8, vignette: 0.55 };

  // ── mundo ──────────────────────────────────────────────────────────────
  const K = casa(E), heroi = new Human({}); K.scene.add(heroi.group);
  const barra = barraEmbalada({ corDentro: ROSA }); K.scene.add(barra.group);
  const FACE = V3(0, 1.66, 0.05);
  // raio-x: o mesmo corpo em vidro, ossos/órgãos, esôfago e a bolinha presos ao spine
  const X = xrayStage(E), xh = humanoRaioX(); X.scene.add(xh.group);
  const OR = orgaos(xh), ES = esofago(); xh.spine.add(ES.mesh);
  const bola = bolinha({ cor: ROSA }), RB = 0.0095; xh.spine.add(bola.mesh);
  // mundos internos (macro): a mesma bolinha rosa, fosca, em escala de macro
  const fosca = (raio) => { const m = bolinha({ cor: ROSA, raio }).mesh; m.material.emissiveIntensity = 0; return m; };
  const SI = estomagoPorDentro(E, { objeto: fosca(0.22), acucar: false }), GI = intestinoPorDentro(E, { objeto: fosca(0.3) });

  // ── reset por quadro: tudo que alguma cena mexe volta ao estado de partida ──
  const reset = (t) => {
    heroi.group.position.set(0, 0, 0); heroi.group.rotation.set(0, 0, 0);
    K.setDay(7.6, t); K.setPhone(false, t);
    barra.group.visible = false; barra.unwrap(0);
    heroi.engolir(0); heroi.hand('L', 'relax'); heroi.hand('R', 'relax');
    heroi.face(t, { look: [0, 0] });   // o olhar só gira quando o face() recebe look: sem isto vaza do quadro anterior
    xh.group.position.set(0, 0, 0); xh.hand('L', 'relax'); xh.hand('R', 'relax'); xh.cabecaVidro(true);
    OR.focar(false); OR.update(t); OR.stomach.scale.setScalar(1); ES.update(-1, 1, t);
    bola.mesh.visible = false; bola.mesh.material.emissiveIntensity = 1.3; bola.mesh.scale.setScalar(RB); bola.mesh.rotation.set(0, 0, 0);
    SI.enzimas.forEach((m) => { m.visible = false; m.scale.setScalar(0.7); m.userData.up.rotation.x = 0; });
  };
  /** ponto no referencial do spine do corpo de raio-x → mundo (chame depois de posar) */
  const noSpine = (p) => { xh.group.updateMatrixWorld(true); return xh.spine.localToWorld(p.clone()); };
  /** ponto do mundo → pixel do quadro */
  const naTela = (p, c) => { const v = p.clone().project(c); return [(v.x + 1) / 2 * 1080, (1 - v.y) / 2 * 1920]; };
  const xrayRender = (alvo, extra = {}) => { cam.lookAt(alvo); E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(alvo), ...extra }); };
  const kitchenRender = (focus, extra = {}) => E.render(K.scene, cam, { ...KLOOK, focus, ...extra });
  const repouso = (h, lados = ['L', 'R']) => lados.forEach((lado) => h.gesto('repouso', 1, 0, { lado }));
  /** a barra: origem o, eixo longo ax (mundo), face larga para fn (shots.js stickAt) */
  const barraEm = (o, ax, fn) => { const x = ax.clone().normalize(), y = fn.clone().sub(x.clone().multiplyScalar(fn.dot(x))).normalize(), z = new THREE.Vector3().crossVectors(x, y); barra.group.position.copy(o); barra.group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); };

  // ═══════════════ linha 0 · gancho ═══════════════
  const MANCHETE = ['O QUE ACONTECE', 'SE VOCÊ *ENGOLIR*', 'UM CHICLETE?'];
  const tCh = tempo.palavra('chiclete', 0), fim0 = corte(1);
  const mancheteK = (t) => eo(seg(t, 0.15, 0.75)), mancheteOut = (t) => seg(t, fim0 - 0.25, fim0);
  // 0a · mastiga enquanto desembrulha a barra (S01 + vitrine): a esquerda segura, a direita puxa a embalagem
  const GL1 = V3(-0.05, 1.45, 0.31), at0b = tCh - 0.12;
  cena(0, 'mastigar', 'close na cozinha: mastiga (chew) e desembrulha a barra na altura do peito; manchete do gancho', (lt, d, t, blit) => {
    reset(t); const k = eio(seg(lt, 0.2, 1.3));
    heroi.posar('emPe', 1, { head: [10, -4, 0], spine: [3, 0, 0] }).breathe(t);
    heroi.face(t, { chew: 1, smile: 0.3, brow: 0.3 + 0.2 * k, look: [0, -10] });
    heroi.place('L', GL1, [0.7, 0.25, 0.6], [0.2, -0.4, -0.9], { pole: [-1, -1, -0.3] }); heroi.hand('L', 'pinch');
    barra.group.visible = true; barraEm(GL1.clone().add(V3(0.006, 0, 0.004)), V3(1, 0, 0), V3(0, 0.3, 1)); barra.unwrap(k * 0.9); barra.group.updateMatrixWorld(true);
    heroi.place('R', barra.group.localToWorld(V3(0.068 + k * 0.081, 0, 0)), [-0.7, 0.25, 0.6], [-0.2, -0.4, -0.9], { pole: [1, -1, -0.3] }); heroi.hand('R', 'pinch');
    cam.position.copy(lerpV(V3(0.16, 1.6, 2.65), V3(0.12, 1.59, 2.4), eio(lt / d))).add(wob(t)); cam.lookAt(0, 1.53, 0.12); kitchenRender(cam.position.distanceTo(V3(0, 1.55, 0.15))); blit();   // rosto abaixo da manchete, barra acima da legenda
    manchete(MANCHETE, mancheteK(t), mancheteOut(t));
  });
  cue(0.25, 'crinkle', { dur: 1.0, gain: 0.5 });
  for (let k = 0; 0.3 + k * 0.645 < at0b; k++) cue(0.3 + k * 0.645, 'chew', { gain: 0.6 });

  // 0b · CÂMERA LENTA, perfil 3/4 (S05): em "chiclete" para de mastigar, o gole desce pelo pescoço (engolir), GLUP, susto.
  // comCameraLenta entrega lt e d lentos: o gole dura 0,17 s lentos (~0,5 s reais)
  const G0 = (tCh - at0b) * CAMERA_LENTA, G1 = G0 + 0.17, POP = G1 + 0.01;
  cena(at0b, 'engolir', 'CÂMERA LENTA close 3/4 de perfil: em "chiclete" ele engole (o volume desce pelo pescoço), GLUP e cara de susto', comCameraLenta((lt, d, t, blit) => {
    reset(t); const tl = at0b + lt, g = seg(lt, G0, G1), pop = eob(seg(lt, POP, POP + 0.05));    // tl: o relógio lento do rosto
    heroi.posar('emPe', 1, { head: [lerp(8, -3, pop) - 7 * Math.sin(g * Math.PI), -4, 0], spine: [lerp(3, -2, pop), 0, 0] }).breathe(tl);
    heroi.face(tl, { chew: 1 - seg(lt, G0 - 0.05, G0), open: 0.5 * pop, round: pop, brow: lerp(0.15, 1, pop), lid: lerp(0.12, -0.38, pop), look: [0, lerp(-6, 0, pop)], blink: false });
    heroi.engolir(g); repouso(heroi);
    cam.position.copy(lerpV(V3(1.02, 1.66, 1.3), V3(0.94, 1.66, 1.2), eio(lt / d))); cam.lookAt(0, 1.64, 0.06); kitchenRender(cam.position.distanceTo(V3(0, 1.58, 0.06)), { aperture: 0.004 }); blit();   // rosto em y 640-1280, pescoço logo acima da legenda
    if (lt > G0 + 0.02) bigText('GLUP!', 800, 1020, 140, '#FFFFFF', -0.12, eob(seg(lt, G0 + 0.02, G0 + 0.08)));
    manchete(MANCHETE, mancheteK(t), mancheteOut(t));
  }));
  cue(at0b, 'slowmo', { gain: 0.8 }); cue(tCh + 0.05, 'gulp', { gain: 1.1 }); cue(at0b + POP / CAMERA_LENTA, 'boing', { gain: 0.5 });

  // ═══════════════ linha 1 · raio-x e esôfago ═══════════════
  // a pose de susto com a mão na garganta: a MESMA função para o herói e para o corpo de raio-x (P_REACT do v2)
  const poseSusto = (h, t) => { h.posar('reagir').breathe(t, 1.6); h.face(t, { open: 0.55, round: 1, brow: 1, lid: -0.35, blink: false }); h.gesto('garganta', 1, t); repouso(h, ['R']); };
  const at1 = corte(1), at1b = tempo.palavra('empurrado', 1) - 0.08, tMus = tempo.palavra('músculo', 1);
  const U0 = 0.04, U1 = 0.29, U2 = 0.86, U3 = 0.97;                   // a bolinha: boca → meio do esôfago → "músculo" → estômago
  // 1a · herói → raio-x na mesma pose e câmera (S07): dissolve com flash ciano; a bolinha brilha no alto do esôfago
  cena(at1, 'raioX', 'medium frontal: o herói (susto, mão na garganta) dissolve no próprio raio-x, mesma pose e câmera; a bolinha entra no esôfago', (lt, d, t, blit) => {
    reset(t); const mix = seg(lt, 0.2, 0.7), alvo = V3(0, 1.42, 0.05);
    cam.position.copy(lerpV(V3(0.08, 1.5, 2.0), V3(0.05, 1.47, 1.55), eio(lt / d))).add(wob(t, 0.6));
    crossfadeRaioX(ctx, () => { poseSusto(heroi, t); cam.lookAt(alvo); kitchenRender(cam.position.distanceTo(FACE)); blit(); },
      () => {
        poseSusto(xh, t); const u = lerp(U0, U1, eio(seg(lt, 0.3, d)));
        bola.mesh.visible = true; noCaminho(bola.mesh, ES.curve, u); bola.mesh.rotation.set(t * 2, t, 0); ES.update(u, 1, t);
        xrayRender(alvo); blit();
      }, mix);
    if (mix >= 1) { const [bx, by] = naTela(noSpine(bola.mesh.position), cam); rotuloGuia('ESÔFAGO', 300, 720, bx, by, eob(seg(lt, 0.75, 1.05))); }
  });
  cue(at1 + 0.2, 'scan', { gain: 0.8 }); cue(at1 + 0.05, 'whoosh', { gain: 0.6 });
  // 1b · a onda muscular empurra a bolinha esôfago abaixo (S08), câmera acompanha; chega em "músculo" e entra no estômago
  cena(at1b, 'esofago', 'raio-x close: a onda muscular (anel) empurra a bolinha esôfago abaixo até "músculo", câmera acompanha; rótulo ESÔFAGO', (lt, d, t, blit) => {
    reset(t); poseSusto(xh, t); OR.focar(true);
    const ate = tMus - at1b, u = lt < ate ? lerp(U1, U2, eio(lt / ate)) : lerp(U2, U3, eo(seg(lt, ate, d))), onda = 1 - seg(lt, ate, d);
    bola.mesh.visible = true; noCaminho(bola.mesh, ES.curve, u); bola.mesh.rotation.set(t * 2, t, 0); bola.mesh.scale.set(RB * 1.08, RB * 0.92, RB); ES.update(Math.min(u, 0.94), onda, t);
    const gp = noSpine(ES.curve.getPointAt(Math.min(u, U2))), k = eio(lt / d);
    cam.position.copy(gp.clone().add(lerpV(V3(0.36, 0.07, 0.16), V3(0.29, 0.04, 0.12), k))); xrayRender(gp.clone().add(V3(0, -0.01, 0)), { bloom: 0.35, bloomThreshold: 0.6 }); blit();
    const [rx, ry] = naTela(noSpine(ES.curve.getPointAt(Math.max(0, Math.min(u, U2) - 0.05))), cam); rotuloGuia('ESÔFAGO', 330, 680, rx, ry, eob(seg(lt, 0.1, 0.4)));
  });
  cue(at1b, 'whoosh', { gain: 0.5 }); for (let k = 0; at1b + 0.1 + k * 0.48 < tMus + 0.2; k++) cue(at1b + 0.1 + k * 0.48, 'squish', { gain: 0.8 });

  // ═══════════════ linha 2 · estômago por dentro ═══════════════
  // a bolinha cai no ácido em "estômago" (S10: queda, respingo em anel, bolhas); em "ácido" a pílula pH 2 e as enzimas
  // chegando; em "digerir" elas mordem e quicam (S13)
  const at2 = corte(2), tEst = tempo.palavra('estômago', 2), tAc = tempo.palavra('ácido', 2), tDig = tempo.palavra('digerir', 2);
  const POUSO = tEst + 0.3, MORDE = 0.75;
  cena(at2, 'estomago', 'macro dentro do estômago: a bolinha cai no ácido em "estômago" (respingo, bolhas), pílula ÁCIDO pH 2, enzimas mordem e quicam em "digerir"', (lt, d, t, blit) => {
    reset(t); const queda = eo(seg(t, at2, POUSO)), respingo = t > POUSO ? (t - POUSO) * 0.5 : -1, GP = SI.pouso, le = t - tDig;
    SI.enzimas.forEach((m, i) => {
      const a = [0.18, 0.42, 0.62, 0.84][i] * Math.PI, hit = 0.38; m.visible = t > tAc + i * 0.1;
      let r, bite = 0, sq = 0;
      if (le < 0) r = lerp(2.2, 1.0, eo(seg(t, tAc + i * 0.1, tDig)));                 // nadam até a bolinha
      else {
        const c = (le + i * 0.19) % MORDE;
        r = c < hit ? lerp(1.0, 0.36, eio(c / hit)) : lerp(0.36, 0.75, eo((c - hit) / (MORDE - hit)));
        bite = c < hit ? seg(c, hit - 0.2, hit) : 1 - seg(c, hit, hit + 0.15); sq = c > hit && c < hit + 0.12 ? 1 - (c - hit) / 0.12 : 0;
      }
      m.position.set(GP.x + Math.cos(a) * r * 0.62, GP.y + 0.04 + Math.sin(a) * r * 0.9, GP.z + (i % 2 ? 0.14 : -0.06)); m.lookAt(GP);
      m.userData.up.rotation.x = -0.75 * (1 - bite); m.scale.set(0.7 * (1 + 0.25 * sq), 0.7 * (1 - 0.2 * sq), 0.7 * (1 + 0.25 * sq));
    });
    // lente 40° e mira um pouco acima do pouso: as 4 enzimas (que mordem por cima) cabem no quadro
    camW.position.copy(lerpV(V3(-0.45, -0.42, 2.55), V3(0.05, -0.5, 2.2), eio(lt / d))); camW.lookAt(GP.clone().add(V3(0, 0.18 + 0.15 * (1 - queda), 0)));
    const amassar = le > 0 ? 0.06 * Math.sin(le * 26) * Math.exp(-((le % MORDE) * 3)) : 0;
    SI.update(t * 0.4, { bolhas: 0.6, queda, respingo, amassar, boiar: 0.3, cam: camW.position }); E.render(SI.scene, camW, { ...SLOOK, focus: camW.position.distanceTo(GP) }); blit();
    pilula('drop', 'ÁCIDO', 'pH 2', eob(seg(t, tAc - 0.1, tAc + 0.25)));
    if (le > 0) rotuloGuia('ENZIMAS', 800, 560, ...naTela(SI.enzimas[1].position, camW), eob(seg(le, 0.1, 0.4)));
  });
  cue(at2, 'whoosh', { gain: 0.5 }); cue(POUSO, 'splash', { gain: 0.9 }); cue(POUSO - 0.1, 'bubbles', { dur: corte(3) - POUSO, gain: 0.6 });
  for (let k = 0; tDig + 0.38 + k * MORDE / 2 < corte(3); k++) cue(tDig + 0.38 + k * MORDE / 2, k % 2 ? 'boing' : 'chomp', { gain: 0.5 });

  // ═══════════════ linha 3 · dias passando e intestino ═══════════════
  // 3a · time-lapse na sala (S18): 1,5 dia em segundos (8 h do DIA 1 → 20 h do DIA 2); rotina anda → senta → dorme
  const at3 = corte(3), at3b = tempo.palavra('intestino', 3) - 0.08;
  cena(at3, 'dias', 'time-lapse na sala: a luz cicla, ele anda/senta/dorme pela rotina, pílula DIA 1 → DIA 2 (passagemDeDias)', (lt, d, t, blit) => {
    reset(t); const { hora, dia, rotina } = passagemDeDias(Math.min(1, lt / d), { dias: 1.5 }), h = hora % 24, sofa = SPOT.sofa;
    K.setDay(hora, t);
    if (rotina === 'anda') {
      const ph = (h - 6.5) / 10.5; heroi.group.position.set(lerp(3.0, 4.1, ph), 0, 0.35); heroi.group.rotation.y = Math.PI / 2; heroi.walk(ph * 18, 1);
      heroi.face(t, { smile: 0.2 });
    } else {
      heroi.group.position.set(sofa.x - 0.25, 0, sofa.z + 0.2);
      if (rotina === 'senta') { heroi.posar('sentado'); heroi.face(t, { smile: 0.15, look: [0, -4], lid: 0.1 }); }
      else { heroi.posar('dormindo'); heroi.face(t, { lid: 1, blink: false, open: 0.15 }); }   // a pálpebra fechada passa pelo face()
    }
    heroi.breathe(t);
    camW.position.copy(lerpV(V3(3.55, 1.42, 3.5), V3(3.55, 1.36, 3.25), eio(lt / d))); camW.lookAt(3.6, 1.05, -0.8);
    E.render(K.scene, camW, { ...KLOOK, aperture: 0.0015, focus: 3.9, bloom: 0.25 }); blit();
    const virou = dia > 1 ? seg(hora - 24 * (dia - 1), 0, 1.5) : 0;
    pilula('clock', 'DIA', String(dia), eob(seg(lt, 0.05, 0.3)), virou);
  });
  for (let k = 0; at3 + k * 0.22 < at3b; k++) cue(at3 + k * 0.22, 'tick', { gain: 0.5 });
  // 3b · em "intestino": dentro do intestino, o anel de contração empurra a bolinha e a câmera vai atrás (S17)
  cena(at3b, 'intestino', 'dentro do intestino: túnel com vilosidades, o anel de contração empurra a bolinha, câmera segue (intestinoPorDentro)', (lt, d, t, blit) => {
    reset(t); const s = 4 + lt * 2.2, anel = s - 1.2 + 0.25 * Math.sin(lt * 3);
    cam.position.copy(GI.ponto(s - 3.2, 0.2).add(V3(Math.sin(t) * 0.05, 0, 0))); cam.lookAt(GI.ponto(s + 0.4, -0.2));
    GI.update(t, { s, anel, cam: cam.position }); E.render(GI.scene, cam, { ...GLOOK, focus: cam.position.distanceTo(GI.objeto.position) }); blit();
    rotuloGuia('INTESTINO', 330, 1230, ...naTela(GI.objeto.position, cam), eob(seg(lt, 0.1, 0.4)));
  });
  cue(at3b, 'squish', { gain: 0.6 }); cue(at3b + 0.05, 'slide', { dur: corte(4) - at3b, gain: 0.5 });

  // ═══════════════ linha 4 · chamada e cartão final ═══════════════
  // o herói de frente, inteiro da cabeça à cintura ACIMA do cartão (cabeça e mão do aceno sem corte), fala pelo envelope e
  // acena; o cartão entra no começo da linha e o clique cai em "curiosidades" (o botão vira "Seguindo ✓" / "Inscrito ✓")
  const at4 = corte(4), ULT = tempo.ultima, TXT = script.lines[ULT].text, MARCA = script.marca_nome || 'Conhecimento';
  const tClique = tempo.palavra('curiosidades', ULT) + 0.15;
  cena(at4, 'cartaoFinal', 'o herói de frente fala (envelope) e acena, cabeça à cintura acima do cartão; clique em "curiosidades"', (lt, d, t, blit) => {
    reset(t); const k = eio(seg(lt, 0.05, 0.45));
    heroi.posar('emPe', 1, { head: [-2, Math.sin(lt * 2.4) * 2, 3 * k] }).breathe(t);
    heroi.face(t, { talk: fala(t) * 0.9, smile: 0.55, brow: 0.45, lid: 0.08, look: [0, 0] });
    heroi.gesto('acenar', k, t); repouso(heroi, ['L']);
    camW.position.copy(lerpV(V3(0.02, 1.05, 5.75), V3(0.02, 1.05, 5.6), eio(lt / d))); camW.lookAt(0.02, 0.3, 0.1);       // lente 40°, o herói no terço de cima
    E.render(K.scene, camW, { ...KLOOK, aperture: 0.0012, focus: camW.position.distanceTo(FACE) }); blit();
    cartaoFinal({ marca: MARCA, textoDaUltimaLinha: TXT, k: eob(seg(lt, 0.1, 0.55)), clique: seg(t, tClique, tClique + 0.35) });
  });
  cue(at4, 'whoosh', { gain: 0.5 }); cue(tClique, 'pop', { gain: 0.8 });

  return { cenas, cues };
}
