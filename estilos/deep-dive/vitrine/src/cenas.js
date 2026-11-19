// Vitrine do kit deep-dive: uma cena de 2,5 s por linha do roteiro, todas na cozinha/sala da `casa`, mostrando o
// personagem: mastigar com a barra embalada desembrulhando, falar pelo envelope, engolir, sobrancelhas e piscar, os gestos
// (garganta, barriga com as duas mãos, coçar a cabeça, apontar, acenar), segurar o celular e posar sentado/dormindo.
// Depois, o corpo (kit/corpo): herói → raio-x na mesma pose e câmera (crossfadeRaioX), a bolinha descendo o esôfago com a
// onda, coração batendo e pulmões respirando em close (orgaos.update) e a bolinha pelo intestino (noCaminho).
// Por fim, os mundos internos em macro: o estômago por dentro (bolinha caindo no ácido, enzimas mordendo), o intestino
// por dentro (câmera seguindo a bolinha, anel de contração) e o vaso sanguíneo (câmera indo junto do fluxo de hemácias).
// Fecho: a passagem de 2 dias na sala (rotina anda/senta/dorme + pílula DIA n), o balão de pensamento com X vermelho e estouro
// (a imagem vem de outra cena renderizada no MESMO quadro) e o cartão final com o herói acenando.
// Receitas de câmera e luz copiadas de engolir-chiclete-v2/src/shots.js. Todo quadro = função pura de t (reset por quadro).
import * as THREE from 'three';
import { ctx, lerp, seg, eo, eio, eob, bigText } from '../kit/motor/lib.js';
import { camera } from '../kit/motor/engine.js';
import { Human } from '../kit/personagem/humano.js';
import { POSES_CORPO, misturarPosesCorpo } from '../kit/personagem/poses.mjs';
import { casa, SPOT } from '../kit/casa.js';
import { barraEmbalada, bolinha } from '../kit/objetos.js';
import { xrayStage, orgaos, humanoRaioX, crossfadeRaioX } from '../kit/corpo/raiox.js';
import { esofago, intestino } from '../kit/corpo/tubos.js';
import { noCaminho } from '../kit/corpo/caminho.js';
import { estomagoPorDentro } from '../kit/corpo/estomago.js';
import { intestinoPorDentro } from '../kit/corpo/intestino.js';
import { vasoSanguineo } from '../kit/corpo/vaso.js';
import { rotuloGuia, pilula, cartaoFinal } from '../kit/hud.mjs';
import { passagemDeDias } from '../kit/dias.mjs';
import { balaoPensamento, xVermelho } from '../kit/balao.mjs';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, k) => a.clone().lerp(b, k);
const wob = (t, a = 1, f = 1) => V3(Math.sin(t * 0.9 * f) * 0.006 * a, Math.sin(t * 1.3 * f + 1) * 0.005 * a, Math.sin(t * 0.7 * f + 2) * 0.004 * a);   // câmera na mão
/** pálpebra de uma piscada que começa em `at` (dura 0,16 s), por cima da pálpebra base `lid` */
const piscada = (lt, at, lid = 0) => { const ph = (lt - at) / 0.16; return ph > 0 && ph < 1 ? lid + (1 - lid) * Math.sin(ph * Math.PI) : lid; };

export function montarCenas(E, { tempo, fala, script }) {
  const cenas = [], cues = [];
  const cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const inicio = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
  const cena = (i, id, note, draw) => { const at = inicio(i); cenas.push({ id, at, note, draw }); cue(at, 'whoosh', { gain: 0.4 }); return at; };
  const cam = camera(30), camW = camera(40);
  const KLOOK = { aperture: 0.0035, maxblur: 0.01, bloom: 0.18, bloomThreshold: 0.85 };

  // ── mundo ──────────────────────────────────────────────────────────────
  const K = casa(E), heroi = new Human({}); K.scene.add(heroi.group);
  const barra = barraEmbalada(); K.scene.add(barra.group);
  const phone = K.props.phone, PHONE0 = { p: phone.position.clone(), q: phone.quaternion.clone() };
  const FACE = V3(0, 1.66, 0.05);
  // raio-x: o mesmo corpo em vidro, numa cena separada, com ossos/órgãos, esôfago, intestino e a bolinha presos ao spine
  const XLOOK = { aperture: 0.0012, bloom: 0.45, bloomThreshold: 0.55, vignette: 0.45 };
  const X = xrayStage(E), xh = humanoRaioX(); X.scene.add(xh.group);
  // o intestino é mais largo que a bolinha (11,8 mm × 9,5 mm): translúcido para a bolinha aparecer dentro
  const OR = orgaos(xh), ES = esofago(), IN = intestino({ opacidade: 0.6 }); xh.spine.add(ES.mesh); xh.spine.add(IN.mesh);
  const bola = bolinha(), RB = 0.0095, ROSA = '#FF7AAE'; xh.spine.add(bola.mesh);
  // mundos internos (macro), cada um na sua cena; looks do v2 (SLOOK, GLOOK)
  const SLOOK = { aperture: 0.0025, maxblur: 0.008, bloom: 0.28, bloomThreshold: 0.8, vignette: 0.5 };
  const GLOOK = { aperture: 0.002, maxblur: 0.008, bloom: 0.3, bloomThreshold: 0.8, vignette: 0.55 };
  const SI = estomagoPorDentro(E), GI = intestinoPorDentro(E), VS = vasoSanguineo(E);

  // ── reset por quadro: tudo que alguma cena mexe volta ao estado de partida ──
  const reset = (t) => {
    heroi.group.position.set(0, 0, 0); heroi.group.rotation.set(0, 0, 0);
    K.setDay(7.6, t); K.setPhone(false, t);
    if (phone.parent !== K.scene) K.scene.add(phone);
    phone.position.copy(PHONE0.p); phone.quaternion.copy(PHONE0.q);
    barra.group.visible = false; barra.unwrap(0);
    heroi.engolir(0); heroi.hand('L', 'relax'); heroi.hand('R', 'relax');
    heroi.face(t, { look: [0, 0] });   // o olhar só gira quando o face() recebe look: sem isto vaza do quadro anterior
    xh.group.position.set(0, 0, 0); xh.hand('L', 'relax'); xh.hand('R', 'relax'); xh.cabecaVidro(true);
    OR.focar(false); OR.update(t); OR.stomach.scale.setScalar(1); ES.update(-1, 1, t);
    bola.mesh.visible = false; bola.setCor(ROSA); bola.mesh.material.emissiveIntensity = 1.3; bola.mesh.scale.setScalar(RB); bola.mesh.rotation.set(0, 0, 0);
    SI.enzimas.forEach((m) => { m.visible = false; m.scale.setScalar(0.7); m.userData.up.rotation.x = 0; });
  };
  /** ponto no referencial do spine do corpo de raio-x → mundo (chame depois de posar) */
  const noSpine = (p) => { xh.group.updateMatrixWorld(true); return xh.spine.localToWorld(p.clone()); };
  /** ponto do mundo → pixel do quadro */
  const naTela = (p, c) => { const v = p.clone().project(c); return [(v.x + 1) / 2 * 1080, (1 - v.y) / 2 * 1920]; };
  const xrayRender = (alvo, extra = {}) => { cam.lookAt(alvo); E.render(X.scene, cam, { ...XLOOK, focus: cam.position.distanceTo(alvo), ...extra }); };
  const kitchenRender = (focus, extra = {}) => E.render(K.scene, cam, { ...KLOOK, focus, ...extra });
  const repouso = (lados = ['L', 'R']) => lados.forEach((lado) => heroi.gesto('repouso', 1, 0, { lado }));
  /** a barra: origem o, eixo longo ax (mundo), face larga para fn (shots.js stickAt) */
  const barraEm = (o, ax, fn) => { const x = ax.clone().normalize(), y = fn.clone().sub(x.clone().multiplyScalar(fn.dot(x))).normalize(), z = new THREE.Vector3().crossVectors(x, y); barra.group.position.copy(o); barra.group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); };

  // 1 · mastigando enquanto desembrulha a barra (shots.js S01: a esquerda segura, a direita puxa a embalagem)
  const GL1 = V3(-0.05, 1.45, 0.31);
  cena(0, 'mastigar', 'medium: mastiga (boca, bochechas) enquanto desembrulha a barraEmbalada na altura do peito', (lt, d, t, blit) => {
    reset(t); const k = eio(seg(lt, 0.25, 1.6));
    heroi.posar('emPe', 1, { head: [12, -4, 0], spine: [3, 0, 0] }).breathe(t);
    heroi.face(t, { chew: 1, smile: 0.3, brow: 0.3 + 0.2 * k, look: [0, -12] });
    heroi.place('L', GL1, [0.7, 0.25, 0.6], [0.2, -0.4, -0.9], { pole: [-1, -1, -0.3] }); heroi.hand('L', 'pinch');
    barra.group.visible = true; barraEm(GL1.clone().add(V3(0.006, 0, 0.004)), V3(1, 0, 0), V3(0, 0.3, 1)); barra.unwrap(k * 0.9); barra.group.updateMatrixWorld(true);
    heroi.place('R', barra.group.localToWorld(V3(0.068 + k * 0.081, 0, 0)), [-0.7, 0.25, 0.6], [-0.2, -0.4, -0.9], { pole: [1, -1, -0.3] }); heroi.hand('R', 'pinch');
    cam.position.copy(lerpV(V3(0.14, 1.6, 1.6), V3(0.1, 1.59, 1.4), eio(lt / d))).add(wob(t)); cam.lookAt(0, 1.52, 0.12); kitchenRender(cam.position.distanceTo(V3(0, 1.55, 0.15))); blit();
  });
  for (let k = 0; k < 4; k++) cue(inicio(0) + 0.3 + k * 0.645, 'chew', { gain: 0.6 });
  cue(inicio(0) + 0.3, 'crinkle', { dur: 1.2, gain: 0.5 });

  // 2 · falando: a boca segue o envelope de fala (data/env.json; sem ele, boca parada)
  cena(1, 'falar', 'close: fala olhando para a lente, boca pelo envelope (talk)', (lt, d, t, blit) => {
    reset(t);
    heroi.posar('emPe', 1, { head: [-2, -2 + Math.sin(lt * 3) * 2, 3], spine: [2, 0, 0] }).breathe(t);
    heroi.face(t, { talk: fala(t) * 0.9, smile: 0.25, brow: 0.35, browR: 0.3, look: [0, 0] });
    repouso();
    cam.position.copy(lerpV(V3(0.04, 1.62, 1.35), V3(0.02, 1.62, 1.2), eio(lt / d))).add(wob(t)); cam.lookAt(0, 1.56, 0.05); kitchenRender(cam.position.distanceTo(FACE)); blit();
  });

  // 3 · engolindo: o gole desce pelo pescoço (perfil 3/4, como o S05)
  const at3 = cena(2, 'engolir', 'close 3/4 de perfil: para de mastigar, o volume desce do queixo à clavícula (engolir), olhos arregalam', (lt, d, t, blit) => {
    reset(t); const g = seg(lt, 0.45, 1.55), pop = eob(seg(lt, 1.6, 1.8));
    heroi.posar('emPe', 1, { head: [lerp(6, -2, pop) - 7 * Math.sin(g * Math.PI), -4, 0], spine: [3, 0, 0] }).breathe(t);
    heroi.face(t, { chew: 1 - seg(lt, 0.15, 0.45), open: 0.45 * pop, round: pop, brow: lerp(0.15, 1, pop), lid: lerp(0.12, -0.35, pop), look: [0, lerp(-6, 0, pop)], blink: false });
    heroi.engolir(g); repouso();
    cam.position.copy(lerpV(V3(0.62, 1.6, 0.8), V3(0.55, 1.59, 0.68), eio(lt / d))); cam.lookAt(0, 1.55, 0.06); kitchenRender(cam.position.distanceTo(V3(0, 1.55, 0.06)), { aperture: 0.004 }); blit();
    if (lt > 0.85 && lt < 1.6) bigText('GLUP!', 800, 760, 140, '#FFFFFF', -0.12, eob(seg(lt, 0.85, 1.05)));
  });
  cue(at3 + 0.9, 'gulp', { gain: 1 }); cue(at3 + 1.6, 'boing', { gain: 0.5 });

  // 4 · sobrancelhas e piscar: surpresa → bravo/dúvida (furrow) → cética (uma só), com piscadas nas trocas
  cena(3, 'sobrancelhas', 'close do rosto: sobrancelhas sobem, franzem, uma sobe só; piscadas', (lt, d, t, blit) => {
    reset(t); const a = eio(seg(lt, 0.7, 0.95)), b = eio(seg(lt, 1.5, 1.75));
    heroi.posar('emPe', 1, { head: [0, lerp(0, 6, b), lerp(0, 4, b)] }).breathe(t);
    const lid = lerp(lerp(-0.3, 0.15, a), 0.05, b);
    heroi.face(t, { brow: lerp(lerp(0.9, -0.4, a), 0, b), furrow: lerp(a, 0, b), browL: 1.1 * b, browR: -0.5 * b, smile: lerp(0, -0.25, a) + 0.35 * b, open: 0.2 * (1 - a), round: 0.6 * (1 - a), lid: piscada(lt, 1.52, piscada(lt, 0.72, lid)), blink: false, look: [lerp(0, 8, b), 0] });
    repouso();
    cam.position.copy(lerpV(V3(0.02, 1.665, 0.95), V3(0.0, 1.665, 0.85), eio(lt / d))).add(wob(t, 0.6)); cam.lookAt(0, 1.62, 0.05); kitchenRender(cam.position.distanceTo(FACE)); blit();
  });

  // 5-9 · gestos (repouso → gesto em ~0,45 s, segura, volta no fim)
  const forca = (lt, d) => eio(seg(lt, 0.15, 0.6)) * (1 - eio(seg(lt, d - 0.35, d - 0.02)));
  cena(4, 'garganta', 'medium frontal: susto, mão esquerda no pescoço (gesto garganta)', (lt, d, t, blit) => {
    reset(t); const k = forca(lt, d);
    heroi.posar('reagir').breathe(t, 1.6); heroi.face(t, { open: 0.55 * k, round: k, brow: k, lid: -0.35 * k, look: [0, 0] });
    heroi.gesto('garganta', k, t); repouso(['R']);
    cam.position.copy(lerpV(V3(0.06, 1.6, 1.75), V3(0.03, 1.59, 1.45), eio(lt / d))).add(wob(t, 1.5, 2)); cam.lookAt(0, 1.52, 0.05); kitchenRender(cam.position.distanceTo(FACE)); blit();
  });
  cena(5, 'barriga', 'medium: as duas mãos na barriga (gesto barriga no lado nativo L e espelhado no R)', (lt, d, t, blit) => {
    reset(t); const k = forca(lt, d);
    heroi.posar('barriga').breathe(t); heroi.face(t, { brow: 0.4 * k, furrow: 0.4 * k, smile: -0.2 * k, open: 0.08, look: [0, -10 * k] });
    heroi.gesto('barriga', k, t); heroi.gesto('barriga', k, t, { lado: 'R' });
    cam.position.copy(lerpV(V3(0.25, 1.4, 2.3), V3(0.2, 1.38, 2.05), eio(lt / d))).add(wob(t)); cam.lookAt(0, 1.3, 0.1); kitchenRender(cam.position.distanceTo(V3(0, 1.15, 0.12))); blit();
  });
  cena(6, 'cocarCabeca', 'medium: dúvida, a mão direita coça o topo da cabeça (gesto cocarCabeca)', (lt, d, t, blit) => {
    reset(t); const k = forca(lt, d);
    heroi.posar('emPe', 1, { head: [-2 * k, -6 * k, -8 * k] }).breathe(t); heroi.face(t, { furrow: 0.5 * k, browR: 0.6 * k, smile: -0.15 * k, look: [12 * k, 8 * k] });
    heroi.gesto('cocarCabeca', k, t); repouso(['L']);
    cam.position.copy(lerpV(V3(-0.1, 1.7, 1.95), V3(-0.08, 1.7, 1.75), eio(lt / d))).add(wob(t)); cam.lookAt(0, 1.66, 0.05); kitchenRender(cam.position.distanceTo(FACE)); blit();
  });
  cena(7, 'apontar', '3/4: aponta para a frente com a mão direita (gesto apontar)', (lt, d, t, blit) => {
    reset(t); const k = forca(lt, d);
    heroi.posar('emPe', 1, { head: [0, 6 * k, 0] }).breathe(t); heroi.face(t, { smile: 0.45 * k, brow: 0.5 * k, open: 0.15 * k, look: [6 * k, 0] });
    heroi.gesto('apontar', k, t); repouso(['L']);
    cam.position.copy(lerpV(V3(-0.6, 1.55, 1.95), V3(-0.52, 1.55, 1.75), eio(lt / d))).add(wob(t)); cam.lookAt(0.12, 1.42, 0.25); kitchenRender(cam.position.distanceTo(V3(0.1, 1.5, 0.2))); blit();
  });
  cena(8, 'acenar', 'medium frontal: acena com a mão direita, sorrindo (gesto acenar)', (lt, d, t, blit) => {
    reset(t); const k = forca(lt, d);
    heroi.posar('emPe', 1, { head: [0, 0, 4 * k] }).breathe(t); heroi.face(t, { smile: 0.7 * k, brow: 0.45 * k, lid: 0.1, look: [0, 0] });
    heroi.gesto('acenar', k, t); repouso(['L']);
    cam.position.copy(lerpV(V3(0.05, 1.55, 2.05), V3(0.04, 1.55, 1.8), eio(lt / d))).add(wob(t)); cam.lookAt(0.06, 1.5, 0.1); kitchenRender(cam.position.distanceTo(FACE)); blit();
  });

  // 10 · segurando o celular: segurar() prende o celular na pegada da mão direita; a mão o leva da cintura aos olhos
  const GRIP_C = V3(-0.03, -0.003, 0.012), F_C = V3(0, -0.4, -1).normalize(), N_C = V3(1, 0, 0);    // pegada no celular (shots.js 113)
  // orientação do celular dentro da mão R: a mão (dedos -y, palma -x no referencial dela, como o place) agarra GRIP_C
  const Q_NA_MAO = (() => {
    const hy = F_C.clone().negate(), hx = N_C.clone().negate(); hx.sub(hy.clone().multiplyScalar(hx.dot(hy))).normalize();
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(hx, hy, new THREE.Vector3().crossVectors(hx, hy))).invert();
  })();
  const P_NA_MAO = GRIP_C.clone().applyQuaternion(Q_NA_MAO).negate();
  const EYES = V3(0, 1.67, 0.09), HOLD_P = V3(0.08, 1.4, 0.3), LOW_P = V3(0.14, 1.06, 0.3);
  const QH = (() => { const n = EYES.clone().sub(HOLD_P).normalize(), u = V3(0, 1, 0).sub(n.clone().multiplyScalar(n.y)).normalize(), z = u.clone().negate(), x = new THREE.Vector3().crossVectors(n, z); return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, n, z)); })();
  const QL = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, -0.3, 0));
  cena(9, 'segurar', '3/4: segura o celular (segurar) e o leva da cintura até os olhos, tela acesa', (lt, d, t, blit) => {
    reset(t); K.setPhone(true, t); const k = eio(seg(lt, 0.1, 0.9));
    heroi.posar('emPe', 1, { head: [lerp(10, 16, k), -4, 0], spine: [3, 0, 0] }).breathe(t); heroi.face(t, { smile: 0.2 + 0.2 * k, brow: 0.15, look: [0, -18] });
    heroi.segurar('R', phone); phone.position.copy(P_NA_MAO); phone.quaternion.copy(Q_NA_MAO);
    const q = QL.clone().slerp(QH, k), p = lerpV(LOW_P, HOLD_P, k);
    heroi.place('R', p.clone().add(GRIP_C.clone().applyQuaternion(q)), F_C.clone().applyQuaternion(q).toArray(), N_C.clone().applyQuaternion(q).toArray(), { pole: [1, -1, -0.3] }); heroi.hand('R', 'hold');
    repouso(['L']);
    cam.position.copy(lerpV(V3(-0.42, 1.55, 1.55), V3(-0.36, 1.55, 1.4), eio(lt / d))).add(wob(t)); cam.lookAt(0.02, 1.48, 0.12); kitchenRender(cam.position.distanceTo(V3(0.03, 1.52, 0.15)), { aperture: 0.003 }); blit();
  });

  // 11 · sentado no sofá → dormindo (posar; o olho fechado vai no face, que reescreve a pálpebra)
  cena(10, 'sentadoDormindo', 'sala à noite: sentado no sofá (posar sentado) e cochilando (dormindo), abajur aceso', (lt, d, t, blit) => {
    reset(t); K.setDay(20.5, t); const k = eio(seg(lt, 0.9, 1.8));
    heroi.group.position.set(SPOT.sofa.x - 0.25, 0, SPOT.sofa.z + 0.2);
    heroi.posar(misturarPosesCorpo(POSES_CORPO.sentado, POSES_CORPO.dormindo, k)).breathe(t, 1 + k * 0.5);
    heroi.face(t, { smile: 0.15 * (1 - k), look: [0, -4 * (1 - k)], lid: lerp(0.1, 1, k), blink: k < 0.05, open: 0.15 * k });
    camW.position.copy(lerpV(V3(3.2, 1.25, 1.55), V3(3.22, 1.22, 1.35), eio(lt / d))); camW.lookAt(3.35, 0.85, -0.85);
    E.render(K.scene, camW, { ...KLOOK, aperture: 0.0015, focus: camW.position.distanceTo(V3(3.35, 0.9, -0.85)), bloom: 0.25 }); blit();
  });

  // ── corpo ──────────────────────────────────────────────────────────────
  // a pose de susto com a mão na garganta: a MESMA função para o herói e para o corpo de raio-x (P_REACT do v2)
  const poseSusto = (h, t) => { h.posar('reagir').breathe(t, 1.6); h.face(t, { open: 0.55, round: 1, brow: 1, lid: -0.35, blink: false }); h.gesto('garganta', 1, t); h.gesto('repouso', 1, 0, { lado: 'R' }); };

  // 12 · herói → raio-x na mesma pose e câmera (crossfade com flash ciano; shots.js S07)
  const at12 = cena(11, 'raioX', 'medium frontal: o herói (susto, mão na garganta) dissolve no próprio raio-x, mesma pose e câmera (crossfadeRaioX)', (lt, d, t, blit) => {
    reset(t); const mix = seg(lt, 0.75, 1.35), alvo = V3(0, 1.36, 0.05);
    cam.position.copy(lerpV(V3(0.08, 1.46, 2.25), V3(0.05, 1.42, 1.75), eio(lt / d))).add(wob(t, 0.6));
    crossfadeRaioX(ctx, () => { poseSusto(heroi, t); cam.lookAt(alvo); kitchenRender(cam.position.distanceTo(FACE)); blit(); },
      () => { poseSusto(xh, t); xrayRender(alvo); blit(); }, mix);
  });
  cue(at12 + 0.75, 'scan', { gain: 0.8 });

  // 13 · a bolinha descendo o esôfago, empurrada pela onda (shots.js S08)
  const at13 = cena(12, 'esofago', 'raio-x close: a onda muscular (anel) empurra a bolinha esôfago abaixo, câmera acompanha (esofago.update + noCaminho)', (lt, d, t, blit) => {
    reset(t); poseSusto(xh, t); OR.focar(true);
    const u = lerp(0.29, 0.86, eio(lt / d));
    bola.mesh.visible = true; noCaminho(bola.mesh, ES.curve, u); bola.mesh.rotation.set(t * 2, t, 0); bola.mesh.scale.set(RB * 1.08, RB * 0.92, RB); ES.update(u, 1, t);
    const gp = noSpine(ES.curve.getPointAt(u));
    cam.position.copy(gp.clone().add(lerpV(V3(0.36, 0.07, 0.16), V3(0.29, 0.04, 0.12), eio(lt / d)))); xrayRender(gp.clone().add(V3(0, -0.01, 0)), { bloom: 0.35, bloomThreshold: 0.6 }); blit();
    const [rx, ry] = naTela(noSpine(ES.curve.getPointAt(Math.max(0, u - 0.07))), cam); rotuloGuia('ONDA MUSCULAR', 330, 680, rx, ry, eob(seg(lt, 0.4, 0.75)));
  });
  for (let k = 0; k < 4; k++) cue(at13 + 0.1 + k * 0.55, 'squish', { gain: 0.8 });

  // 14 · coração batendo e pulmões respirando, em close no peito de vidro (orgaos.update)
  const BPM = 72, RESPIRA = 14, PEITO = V3(0, 0.39, 0.02);
  const at14 = cena(13, 'coracao', 'raio-x close do peito sem as costelas: coração bate (72 bpm) e pulmões respiram (orgaos.update)', (lt, d, t, blit) => {
    reset(t); xh.posar('emPe').breathe(t); xh.face(t, {}); xh.gesto('repouso', 1, 0, { lado: 'L' }); xh.gesto('repouso', 1, 0, { lado: 'R' });
    OR.update(t, { bpm: BPM, respira: RESPIRA }); OR.ribs.forEach((r) => (r.visible = false));          // o reset volta com focar(false)
    const alvo = noSpine(PEITO);
    cam.position.copy(alvo.clone().add(lerpV(V3(0.06, 0.03, 1.05), V3(0.05, 0.02, 0.9), eio(lt / d)))).add(wob(t, 0.4)); xrayRender(alvo, { bloom: 0.4 }); blit();
    const [hx, hy] = naTela(noSpine(V3(0.025, 0.4, 0.03)), cam); rotuloGuia('CORAÇÃO', 800, 620, hx, hy, eob(seg(lt, 0.3, 0.65)));
    const [px, py] = naTela(noSpine(V3(-0.085, 0.44, 0.03)), cam); rotuloGuia('PULMÕES', 280, 520, px, py, eob(seg(lt, 0.55, 0.9)));
  });
  // uma batida (pico do pulso, fase 0,08 do ciclo no tempo do filme) = um 'heartbeat'
  for (let n = Math.ceil(at14 * BPM / 60 - 0.08); (n + 0.08) * 60 / BPM < at14 + 2.45; n++) cue((n + 0.08) * 60 / BPM, 'heartbeat', { gain: 0.8 });

  // 15 · a bolinha indo pelo intestino (translúcido, ver acima), mão de vidro na barriga (shots.js S16)
  const at15 = cena(14, 'intestino', 'raio-x da barriga: a bolinha brilhante percorre o intestino enrolado (noCaminho)', (lt, d, t, blit) => {
    reset(t); xh.posar('barriga').breathe(t); xh.face(t, { brow: 0.6, browL: 0.3, furrow: 0.2 }); xh.gesto('barriga', 1, t); xh.gesto('repouso', 1, 0, { lado: 'R' });
    const u = 0.9 * eio(seg(lt, 0.15, d - 0.1));                         // o fim do intestino some atrás da pelve
    bola.mesh.visible = true; bola.mesh.material.emissiveIntensity = 1.6; noCaminho(bola.mesh, IN.curve, u); bola.mesh.rotation.set(t * 2, t, 0);
    OR.stomach.scale.setScalar(1 + 0.025 * Math.sin(t * 6));
    const alvo = noSpine(V3(0.01, 0.03, 0.05));
    cam.position.copy(alvo.clone().add(lerpV(V3(0.12, 0.05, 0.98), V3(0.08, 0.03, 0.82), eio(lt / d)))); xrayRender(alvo); blit();
    const [bx, by] = naTela(noSpine(bola.mesh.position), cam); rotuloGuia('INTESTINO', 330, 1220, bx, by, eob(seg(lt, 0.3, 0.65)));
  });
  cue(at15 + 0.15, 'slide', { dur: 2.1, gain: 0.5 });

  // ── mundos internos ────────────────────────────────────────────────────
  // 16 · estômago por dentro: a bolinha cai no ácido em câmera lenta (respingo em anel, bolhas) e as enzimas tentam
  // mordê-la e quicam (shots.js S10 + S13)
  const MORDE = 0.75, ENZ0 = 0.95;
  const at16 = cena(15, 'estomago', 'macro dentro do estômago: a bolinha cai no ácido (queda, respingo, bolhas) e 4 enzimas a mordem e quicam (estomagoPorDentro)', (lt, d, t, blit) => {
    reset(t); const queda = eo(seg(lt, 0, 0.55)), respingo = lt > 0.55 ? (lt - 0.55) * 0.5 : -1, GP = SI.pouso, le = lt - ENZ0;
    SI.enzimas.forEach((m, i) => {                                        // ciclo de mordida de cada enzima (S13)
      const a = [0.18, 0.42, 0.62, 0.84][i] * Math.PI, c = (Math.max(0, le) + i * 0.19 + 0.3) % MORDE, hit = 0.38; m.visible = le > 0.05 + i * 0.12;
      const r = c < hit ? lerp(1.0, 0.36, eio(c / hit)) : lerp(0.36, 0.75, eo((c - hit) / (MORDE - hit)));
      m.position.set(GP.x + Math.cos(a) * r * 0.62, GP.y + 0.04 + Math.sin(a) * r * 0.9, GP.z + (i % 2 ? 0.14 : -0.06)); m.lookAt(GP);
      const bite = c < hit ? seg(c, hit - 0.2, hit) : 1 - seg(c, hit, hit + 0.15); m.userData.up.rotation.x = -0.75 * (1 - bite);
      const sq = c > hit && c < hit + 0.12 ? 1 - (c - hit) / 0.12 : 0; m.scale.set(0.7 * (1 + 0.25 * sq), 0.7 * (1 - 0.2 * sq), 0.7 * (1 + 0.25 * sq));
    });
    cam.position.copy(lerpV(V3(-0.5, -0.35, 2.3), V3(0.05, -0.45, 1.75), eio(lt / d))); cam.lookAt(GP.clone().add(V3(0, 0.15 * (1 - queda), 0)));
    const amassar = le > 0 ? 0.06 * Math.sin(le * 26) * Math.exp(-((le % MORDE) * 3)) : 0;
    SI.update(t * 0.4, { bolhas: 0.6, queda, respingo, amassar, boiar: 0.3, cam: cam.position }); E.render(SI.scene, cam, { ...SLOOK, focus: cam.position.distanceTo(GP) }); blit();
    rotuloGuia('ÁCIDO', 300, 1240, ...naTela(GP.clone().add(V3(-0.7, -0.08, 0.3)), cam), eob(seg(lt, 0.6, 0.9)));
    if (le > 0.2) rotuloGuia('ENZIMAS', 780, 640, ...naTela(SI.enzimas[1].position, cam), eob(seg(le, 0.2, 0.5)));
  });
  cue(at16 + 0.5, 'splash', { gain: 0.9 }); cue(at16 + 0.2, 'bubbles', { dur: 2.2, gain: 0.6 });
  for (let k = 0; ENZ0 + 0.35 + k * MORDE / 2 < 2.45; k++) cue(at16 + ENZ0 + 0.35 + k * MORDE / 2, k % 2 ? 'chomp' : 'boing', { gain: 0.5 });

  // 17 · intestino por dentro: o anel de contração empurra a bolinha e a câmera vai atrás (shots.js S17)
  const at17 = cena(16, 'intestinoDentro', 'dentro do intestino: túnel com vilosidades, o anel de contração empurra a bolinha, câmera segue (intestinoPorDentro)', (lt, d, t, blit) => {
    reset(t); const s = 4 + lt * 2.2, anel = s - 1.2 + 0.25 * Math.sin(lt * 3);
    cam.position.copy(GI.ponto(s - 3.2, 0.2).add(V3(Math.sin(t) * 0.05, 0, 0))); cam.lookAt(GI.ponto(s + 0.4, -0.2));
    GI.update(t, { s, anel, cam: cam.position }); E.render(GI.scene, cam, { ...GLOOK, focus: cam.position.distanceTo(GI.objeto.position) }); blit();
    rotuloGuia('VILOSIDADES', 300, 1230, ...naTela(GI.ponto(s - 0.6, -1.0), cam), eob(seg(lt, 0.4, 0.7)));
  });
  cue(at17, 'squish', { gain: 0.6 }); cue(at17 + 0.2, 'slide', { dur: 2.2, gain: 0.5 });

  // 18 · vaso sanguíneo: a câmera anda junto do fluxo (mais devagar que as hemácias do meio, que a ultrapassam) e alcança
  // o leucócito rolando no fundo. O tempo do vaso é o da cena (lt): o leucócito começa em 0,3·LEN
  const at18 = cena(17, 'vaso', 'dentro do vaso: hemácias fluindo e ultrapassando a câmera, parede pulsando a 72 bpm, leucócito branco rolando no fundo (vasoSanguineo)', (lt, d, t, blit) => {
    reset(t); const sc = VS.LEN * 0.3 - 6 + 1.6 * lt;                    // começa 6 m atrás do leucócito e se aproxima
    cam.position.copy(VS.ponto(sc, -0.55)); cam.lookAt(VS.ponto(sc + 3, -0.75));        // na camada de plasma, atrás do leucócito
    VS.update(lt, { fluxo: 1, bpm: BPM, cam: cam.position }); E.render(VS.scene, cam, { ...GLOOK, focus: 2.5 }); blit();
    rotuloGuia('LEUCÓCITO', 760, 1260, ...naTela(VS.leucocito.position, cam), eob(seg(lt, 0.9, 1.2)));
    // a hemácia (a 1,5–5 m da lente, à frente) que aparece mais perto do pixel (560, 720) — o mesmo cálculo em todo quadro
    const frente = cam.getWorldDirection(V3(0, 0, 0)), m = new THREE.Matrix4(), p = V3(0, 0, 0); let melhor = null, bd = Infinity;
    for (let i = 0; i < VS.hemacias.count; i++) {
      VS.hemacias.getMatrixAt(i, m); p.setFromMatrixPosition(m); const rel = p.clone().sub(cam.position), dist = rel.length();
      if (dist < 1.5 || dist > 5 || rel.dot(frente) < 0) continue;
      const [x, y] = naTela(p, cam), dd = (x - 560) ** 2 + (y - 720) ** 2; if (dd < bd) { bd = dd; melhor = [x, y]; }
    }
    if (melhor) rotuloGuia('HEMÁCIAS', 330, 470, ...melhor, eob(seg(lt, 0.3, 0.6)));
  });
  // uma batida (pico do pulso, fase 0,1 do ciclo no tempo da cena) = um 'heartbeat'
  for (let n = 0; (n + 0.1) * 60 / BPM < 2.45; n++) cue(at18 + (n + 0.1) * 60 / BPM, 'heartbeat', { gain: 0.7 });

  // ── fecho ──────────────────────────────────────────────────────────────
  // 19 · dois dias na sala (S18 do v2): a hora corre 48 h, a luz da janela/abajur/TV cicla, ele anda, senta e dorme pela
  // rotina de kit/dias.mjs, e a pílula mostra DIA n (com um amassadinho quando vira o dia)
  const at19 = cena(18, 'dias', 'time-lapse de 2 dias na sala: passagemDeDias + casa.setDay, anda → senta → dorme pela rotina, pílula DIA n', (lt, d, t, blit) => {
    reset(t); const { hora, dia, rotina } = passagemDeDias(Math.min(0.999, lt / d)), h = hora % 24, sofa = SPOT.sofa;
    K.setDay(hora, t);
    if (rotina === 'anda') {
      const ph = (h - 6.5) / 10.5; heroi.group.position.set(lerp(3.0, 4.1, ph), 0, 0.35); heroi.group.rotation.y = Math.PI / 2; heroi.walk(ph * 18, 1);
      heroi.face(t, { chew: 0, smile: 0.2 });
    } else {
      heroi.group.position.set(sofa.x - 0.25, 0, sofa.z + 0.2);
      if (rotina === 'senta') { heroi.posar('sentado'); heroi.face(t, { smile: 0.15, look: [0, -4], lid: 0.1 }); }
      else { heroi.posar('dormindo'); heroi.face(t, { lid: 1, blink: false, open: 0.15 }); }   // a pálpebra fechada passa pelo face()
    }
    heroi.breathe(t);
    camW.position.copy(lerpV(V3(3.55, 1.42, 3.5), V3(3.55, 1.36, 3.25), eio(lt / d))); camW.lookAt(3.6, 1.05, -0.8);
    E.render(K.scene, camW, { ...KLOOK, aperture: 0.0015, focus: 3.9, bloom: 0.25 }); blit();
    const noite = h < 6.5 || h >= 19, virou = dia > 1 ? seg(hora - 24 * (dia - 1), 0, 1.5) : 0;
    pilula(noite ? 'moon' : 'sun', 'DIA', String(dia), eob(seg(lt, 0.05, 0.3)), virou);
  });
  for (let k = 0; k < 8; k++) cue(at19 + k * 2.4 / 8, 'tick', { gain: 0.5 });

  // 20 · balão de pensamento: ele pensa no estômago (renderizado AGORA, no mesmo quadro, num canvas à parte), o balão
  // cresce, ganha um X vermelho e estoura em 14 pedaços
  const off = document.createElement('canvas'); off.width = 1080; off.height = 1920; const octx = off.getContext('2d');
  const at20 = cena(19, 'balao', 'medium: ele pensa no estômago (balão com a imagem de outra cena), o X vermelho cai por cima e o balão estoura em pedaços', (lt, d, t, blit) => {
    reset(t);
    // 1) a imagem do balão: o estômago por dentro, no canvas `off`, usado só neste quadro
    const GP = SI.pouso; cam.position.set(0.05, -0.45, 1.75); cam.lookAt(GP); cam.updateMatrixWorld(true);
    SI.update(t * 0.4, { bolhas: 0.6, queda: 1, respingo: lt * 0.5, amassar: 0, boiar: 0.3, cam: cam.position });
    E.render(SI.scene, cam, { ...SLOOK, focus: cam.position.distanceTo(GP) }); octx.clearRect(0, 0, 1080, 1920); octx.drawImage(E.renderer.domElement, 0, 0, 1080, 1920);
    // 2) a cena do herói pensando
    const k = eio(seg(lt, 0.1, 0.7));
    heroi.posar('emPe', 1, { head: [-6 * k, -14 * k, 4 * k] }).breathe(t); heroi.face(t, { brow: 0.3 + 0.4 * k, browR: 0.5 * k, smile: -0.1 * k, look: [-10 * k, -14 * k] });
    repouso();
    cam.position.copy(lerpV(V3(0.55, 1.5, 2.6), V3(0.5, 1.5, 2.35), eio(lt / d))); cam.lookAt(0.2, 1.5, 0.05); cam.updateMatrixWorld(true);
    kitchenRender(cam.position.distanceTo(FACE)); blit();
    // 3) o balão (cresce → X → estouro)
    const cabeca = naTela(heroi.head.getWorldPosition(V3(0, 0, 0)).add(V3(0.04, 0.12, 0)), cam);
    const estouro = seg(lt, 1.75, 2.25), kb = seg(lt, 0.35, 0.95);
    balaoPensamento(off, 700, 560, 330, 270, kb, cabeca, t, estouro);
    if (estouro < 0.3) xVermelho(700, 560, lerp(0.9, 1, eob(seg(lt, 1.15, 1.4))), seg(lt, 1.15, 1.35) * (1 - estouro / 0.3));
  });
  cue(at20 + 0.4, 'pop', { gain: 0.5 }); cue(at20 + 1.2, 'slam', { gain: 0.6 }); cue(at20 + 1.75, 'shatter', { gain: 0.7 });

  // 21 · cartão final: o herói de frente e grande acima do cartão, acenando; o "clique" cai numa palavra do fim da chamada
  const ULT = tempo.ultima, TXT = script.lines[ULT].text, MARCA = 'Conhecimento';
  const PALAVRA = TXT.trim().split(/\s+/).pop(), tClique = tempo.palavra(PALAVRA, ULT);
  const at21 = cena(20, 'cartaoFinal', 'herói de frente acenando acima do cartão de seguir; o botão vira "Seguindo ✓" na última palavra da chamada', (lt, d, t, blit) => {
    reset(t); const k = eio(seg(lt, 0.1, 0.5));
    heroi.posar('emPe', 1, { head: [0, 0, 3 * k] }).breathe(t); heroi.face(t, { smile: 0.8, brow: 0.5, lid: 0.1, look: [0, 0] });
    heroi.gesto('acenar', k, t); repouso(['L']);
    cam.position.set(0.02, 1.5, 2.9); cam.lookAt(0.02, 1.0, 0.1); cam.updateMatrixWorld(true);
    kitchenRender(cam.position.distanceTo(FACE), { aperture: 0.0025 }); blit();
    cartaoFinal({ marca: MARCA, textoDaUltimaLinha: TXT, k: eob(seg(lt, 0.4, 0.9)), clique: seg(t, tClique, tClique + 0.35) });
  });
  cue(at21 + 0.4, 'whoosh', { gain: 0.5 }); cue(tClique + 0.12, 'ding', { gain: 0.7 });

  return { cenas, cues };
}
