// Vídeo-modelo voxel: "E se a Terra parasse de girar?" (Marca A, ~15 s). Uma ou duas cenas por linha do roteiro, tempos só por
// tempo.linha(i) / tempo.palavra('…', i). Mundos: orla (beachTown) e espaço (space). Protagonista com sorvete na mão direita.
// Receitas de render/reset copiadas de teste-lowpoly-v2/src/shots.js (S01a/S01b, S04, S08, S11, S16) e da vitrine do kit.
// Todo quadro = função pura de t: o reset devolve tudo ao estado base antes de cada quadro.
import * as THREE from 'three';
import { lerp, seg, eo, eio, eob } from '../kit/motor/lib.js';
import { pilula, manchete, cartaoFinal, comCameraLenta, fmt } from '../kit/hud.mjs';
import { camera } from '../kit/motor/engine.js';
import { travelling, closeBaixo, drone, orbita, CAMERA_LENTA } from '../kit/cameras.mjs';
import { POSES, misturarPoses, acenarNoTempo } from '../kit/mundo/poses.mjs';
import { beachTown } from '../kit/mundo/orla.js';
import { space } from '../kit/mundo/espaco.js';
import { protagonista, figurante, sorvete } from '../kit/mundo/elenco.js';
import { windPalms, calmPalms, windStreaks, giantWave, voadores, particulas } from '../kit/mundo/efeitos.js';
import { aplicarCamera } from '../kit/mundo/camera3d.js';

const DEG = Math.PI / 180;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function montarCenas(E, { tempo, script }) {
  const cenas = [], cues = [];
  const cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const inicio = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
  const cenaEm = (at, id, note, draw, gain = 0.5) => { cenas.push({ id, at, note, draw }); cue(at, 'whoosh', { gain }); };
  const W = (txt, i) => tempo.palavra(txt, i);
  const cam = camera(30); cam.far = 2500; cam.updateProjectionMatrix();
  const TLOOK = { aperture: 0.008, maxblur: 0.016, bloom: 0.26, bloomThreshold: 0.86, vignette: 0.32, grain: 0.014, warm: 0.03, exposure: 0.95 };
  const SLOOK = { aperture: 0, bloom: 0.55, bloomThreshold: 0.72, vignette: 0.45, grain: 0.014, warm: 0.0, exposure: 1.0 };

  // ── mundos e elenco ────────────────────────────────────────────────────
  const TW = beachTown(E), SP = space(E), P = SP.P, scene = TW.scene;
  let planetK = 0; const planetSeas = (k) => { if (Math.abs(k - planetK) > 1e-4) { P.update(k); planetK = k; } };   // cache do v2
  const heroi = protagonista(); scene.add(heroi.group);
  const cone = sorvete(); heroi.handR.add(cone);
  const coneSolto = sorvete(); scene.add(coneSolto);                       // o sorvete que o vento arranca da mão (linha 2)
  const corredores = [51, 53, 56, 58].map((s) => { const p = figurante(s); scene.add(p.group); return p; });
  const todos = [heroi, ...corredores];
  const voa = voadores({ n: 16, seed: 3 }); scene.add(voa.group);
  const streaks = windStreaks(320, '#F6E7C6'); scene.add(streaks);
  const wave = giantWave(); scene.add(wave);
  const espuma = particulas({ n: 360, cor: '#F4FAFF', tamanho: 0.07, seed: 5 }); scene.add(espuma.mesh);
  // spray soprado da crista da onda: partículas grandes numa caixa achatada que acompanha a crista (escala da malha)
  const spray = particulas({ n: 700, cor: '#FFFFFF', tamanho: 1.1, seed: 8 }); scene.add(spray.mesh);

  // ── reset por quadro (como no v2) ──────────────────────────────────────
  const reset = () => {
    TW.night(0); TW.setSun(38, -18); TW.sea.visible = true; wave.visible = false; streaks.visible = false; calmPalms(TW.palms);
    todos.forEach((p) => { p.reset(); p.group.visible = false; p.group.rotation.set(0, 0, 0); p.group.position.set(0, 0, 0); });
    heroi.group.visible = true; heroi.group.position.set(0, 0.18, 3.2); heroi.group.rotation.y = Math.PI / 2;
    heroi.handR.add(cone); cone.visible = true; cone.position.set(0, 0, 0); cone.rotation.set(0, 0, 0); coneSolto.visible = false;
    heroi.acc.glasses.position.set(0, 0.32, -0.05); heroi.acc.glasses.rotation.set(-0.3, 0, 0);
    voa.group.visible = false; espuma.mesh.visible = false; spray.mesh.visible = false;
    TW.crowd.forEach((p) => p.reset());
    TW.umbrellas.forEach((u) => u.canopy.rotation.set(0, 0, 0));
    planetSeas(0); P.spin.rotation.set(0, 0, 0); P.clouds.rotation.set(0, 0, 0); P.tilt.rotation.set(0, 0, 0.41); P.group.position.set(0, 0, 0);
    P.ring.material.opacity = 0; P.pin.visible = true; P.pin.scale.setScalar(1); SP.setSun(-7, 3.5, 6); cam.up.set(0, 1, 0); cam.fov = 30;
  };
  const _seg = new THREE.Vector3(), _d = new THREE.Vector3();
  /** esconde figurantes / objetos de praia na frente da lente; cada objeto volta a ficar visível antes do teste (o quadro não depende do anterior) */
  const clearLens = (focusP, near = 2.2) => {
    const c = cam.position, f = focusP, len = c.distanceTo(f); _seg.copy(f).sub(c).normalize();
    const test = (o, pos, r = 0.9) => { _d.copy(pos).sub(c); const s = _d.dot(_seg); if (_d.length() < near || (s > 0 && s < len - 0.6 && _d.clone().addScaledVector(_seg, -s).length() < r)) o.visible = false; };
    TW.crowd.forEach((p) => { if (p.group.visible) test(p.group, p.group.position.clone().add(V3(0, 1, 0))); });
    TW.sunbathers.forEach((p) => { p.group.visible = true; test(p.group, p.group.position, 1.2); });
    TW.umbrellas.forEach((u) => { u.group.visible = true; test(u.group, u.group.position.clone().add(V3(0, 1.8, 0)), 1.8); });
    [...TW.chairs, ...TW.beachStuff].forEach((o) => { o.visible = true; test(o, o.position, 1.0); });
  };
  const townRender = (focusP, look = {}, near = 2.2) => { clearLens(focusP, near); E.render(scene, cam, { ...TLOOK, focus: cam.position.distanceTo(focusP), ...look }); };
  const spaceRender = (look = {}) => E.render(SP.scene, cam, { ...SLOOK, ...look });
  const headW = (p) => p.head.getWorldPosition(V3(0, 0, 0)).add(V3(0, 0.23, 0));
  const arr = (v) => [v.x, v.y, v.z];
  /** figurantes da multidão se segurando contra o vento (k 0..1) */
  const braceCrowd = (k, t) => TW.crowd.forEach((p, i) => { const s = p.userData.v > 0 ? 1 : -1;
    p.pose({ lean: [0, 0, s * 14 * k], armL: [k * (100 + 10 * Math.sin(t * 3 + i)), 20], armR: [k * (100 + 10 * Math.sin(t * 3.3 + i)), 20], legL: [8 * k, 6], legR: [-8 * k, 6], head: [10 * k, 0] }).face(k > 0.3 ? 'scared' : 'neutral'); });
  /** some com quem da multidão passa a menos de r metros do protagonista (o TW.life reexibe a cada quadro): ninguém cruza na frente dele */
  const semMultidaoPerto = (r = 2.8) => { const h = heroi.group.position; TW.crowd.forEach((p) => { if (Math.hypot(p.group.position.x - h.x, p.group.position.z - h.z) < r) p.group.visible = false; }); };
  /** sorvete na mão direita, no ângulo do braço */
  const segurarCone = (fwd) => { cone.rotation.x = fwd * DEG; };

  // ══ Linha 0 · gancho ═══════════════════════════════════════════════════
  const tGirar = W('girar', 0) - 0.04, tRepente = W('repente', 0);
  const L0 = tempo.linha(0), mancheteGancho = (t) => manchete(['E SE A *TERRA*', 'PARASSE DE', '*GIRAR*?'], seg(t, L0 - 0.15, L0 + 0.75), seg(t, tempo.linha(1) - 0.3, tempo.linha(1) - 0.1));
  // 0A · espaço: o planeta girando rápido, órbita curta, a manchete entra
  cenaEm(inicio(0), 'L0a', 'espaço: planeta girando rápido, órbita curta; manchete E SE A TERRA PARASSE DE GIRAR? entrando', (lt, d, t, blit) => {
    reset(); P.spin.rotation.y = 1.9 * t - 1.2; P.clouds.rotation.y = 0.2 * t;
    aplicarCamera(cam, orbita({ alvo: [0, 0, 0], raio: lerp(10.2, 8.8, eio(lt / d)), de: -0.32, ate: -0.1, altura: 0.9 }, eio(lt / d)));
    spaceRender(); blit(); mancheteGancho(t);
  }, 0.6);
  // 0B · em "girar": close baixo no protagonista na orla, sorvete na mão; em "repente" olha para cima, surpreso
  cenaEm(tGirar, 'L0b', 'orla: closeBaixo no protagonista com sorvete; smile (piscando) → surprised olhando para cima em "repente"', (lt, d, t, blit) => {
    reset(); TW.life(t); semMultidaoPerto();
    const up = eo(seg(t, tRepente - 0.2, tRepente + 0.2));
    heroi.posar('segurar', 1, { head: [-16 * up, 0, 0] }).rosto(t >= tRepente - 0.05 ? 'surprised' : 'smile', t, { semente: 2 });
    segurarCone(POSES.segurar.armR[0]);
    const h = headW(heroi); TW.shadowAt(0, 3, 9);
    aplicarCamera(cam, closeBaixo({ alvo: arr(h) }, eio(lt / d)));
    townRender(h); blit(); mancheteGancho(t);
  }, 0.7);
  cue(tRepente, 'pop', { gain: 0.6 });

  // ══ Linha 1 · 1.670 km/h no equador ════════════════════════════════════
  const tMil = W('mil', 1), tHora = W('hora', 1), tChao = W('chão', 1) - 0.04;
  /** pílula EQUADOR: entra em "mil" e conta de 0 a 1.670 até "hora" */
  const pilulaEquador = (t) => pilula('spin', 'EQUADOR', `${fmt(1670 * eo(seg(t, tMil, tHora)))} KM/H`, eob(seg(t, tMil, tMil + 0.35)), seg(t, tHora, tHora + 0.28));
  // 1A · drone sobre a orla
  cenaEm(inicio(1), 'L1a', 'drone alto sobre a orla ensolarada', (lt, d, t, blit) => {
    reset(); TW.life(t); TW.shadowAt(-10, 6, 45);
    aplicarCamera(cam, drone({ centro: [-2, 0, 14] }, eio(lt / d)));
    townRender(V3(0, 0, 10), { aperture: 0.0002 }); blit(); pilulaEquador(t);
  });
  // 1B · em "chão": plano médio, o protagonista aponta o chão (dedo); o sorvete passa para a mão esquerda
  cenaEm(tChao, 'L1b', 'plano médio: protagonista apontando o chão (apontarChao, dedo), sorvete na mão esquerda; pílula EQUADOR 0 → 1.670 KM/H', (lt, d, t, blit) => {
    reset(); TW.life(t); semMultidaoPerto();
    heroi.handL.add(cone); segurarCone(40);
    heroi.posar('apontarChao', eo(seg(lt, 0.05, 0.45)), { armL: [40, 4] }).rosto('smile', t, { semente: 5 });
    TW.shadowAt(0, 3, 9);
    aplicarCamera(cam, travelling({ de: [4.9, 1.55, 7.2], para: [4.4, 1.5, 6.8], olharDe: [0, 1.05, 3.2] }, eio(lt / d)));
    townRender(V3(0, 0.9, 3.2), { aperture: 0.004 }); blit(); pilulaEquador(t);
  }, 0.4);
  cue(tMil, 'zip', { gain: 0.7 });

  // ══ Linha 2 · câmera lenta: o ar continua correndo ═════════════════════
  const tFreasse = W('freasse', 2), tSolta = tFreasse + 0.2, i2 = inicio(2), _p0 = new THREE.Vector3(), _q0 = new THREE.Quaternion(), _qs = new THREE.Quaternion(), _es = new THREE.Euler();
  /** braço direito saindo de `segurar` (com o sorvete) para `maoNaCabeca`, desde "freasse" */
  const kMao = (t) => eo(seg(t, tFreasse, tFreasse + 0.5)), poseVento = (t) => misturarPoses(POSES.segurar, POSES.maoNaCabeca, kMao(t));
  // comCameraLenta entrega tl e d escalados (tl/d = progresso real); t segue real e a etiqueta CÂMERA LENTA é automática
  cenaEm(i2, 'L2', 'CÂMERA LENTA, plano aberto da orla: vento (palmeiras, riscos, voadores) desde "freasse"; protagonista mão na cabeça, assustado; o sorvete voa', comCameraLenta((tl, d, t, blit) => {
    reset(); const tt = i2 + tl;                                            // relógio lento do mundo
    const kw = eo(seg(t, tFreasse - 0.1, tFreasse + 0.45)), kv = seg(t, tFreasse, inicio(3) + 0.1);
    TW.life(tt); semMultidaoPerto(); braceCrowd(kw, tt); windPalms(TW.palms, kw, t, CAMERA_LENTA);
    // o sorvete: na mão até soltar; depois voa com o vento a partir de onde (e como) ele estava na mão no instante da soltura
    const pS = poseVento(tSolta); heroi.posar(pS); segurarCone(pS.armR[0]); heroi.group.updateMatrixWorld(true); cone.getWorldPosition(_p0); cone.getWorldQuaternion(_q0);
    const pose = poseVento(t); heroi.posar(pose).rosto(t >= tFreasse ? 'scared' : 'smile', t, { semente: 6 }); segurarCone(pose.armR[0]);
    if (t >= tSolta) {
      cone.visible = false; coneSolto.visible = true;
      const tau = (t - tSolta) * CAMERA_LENTA * 2.2;                        // segundos "físicos" desde que soltou
      coneSolto.position.copy(_p0).add(V3(0.2 * Math.sin(tau * 5), 1.6 * tau + 3.2 * tau * tau, -(1.4 * tau + 13 * tau * tau)));
      coneSolto.quaternion.copy(_q0).multiply(_qs.setFromEuler(_es.set(tau * 7, tau * 2, tau * 5)));
    }
    voa.group.visible = true; voa.update(tt, kv, { centro: [-3.5, 1, 3.8], vento: [0, 0.4, -1], alcance: 12 });
    streaks.update(tt, kw, V3(-6, 0.25, 2.5), V3(30, 4.5, 16), 30);
    TW.shadowAt(-2, 3, 12);
    aplicarCamera(cam, travelling({ de: [8.2, 1.4, 4.3], para: [7.4, 1.45, 4.15], olharDe: [-6, 1.5, 2.8] }, eio(tl / d)));
    townRender(V3(0, 1.2, 3.2), { aperture: 0.0016 }); blit();
  }));
  cue(i2 + 0.05, 'slowmo', { gain: 0.8 });
  cue(tFreasse, 'wind', { dur: inicio(3) - tFreasse + 0.3, gain: 0.9 });

  // ══ Linha 3 · a onda gigante ═══════════════════════════════════════════
  // câmera baixa na areia olhando para cima (referência: plano S11 do v2; aqui H 22→38): a onda cresce até "gigante" e segura no máximo
  const i3 = inicio(3), tGigante = W('gigante', 3);
  // ao contrário do S11 (de frente, a onda vira uma faixa), a câmera olha a crista em diagonal (~23° do mar aberto): a linha da crista
  // some em perspectiva e o lábio com espuma aparece; grande-angular e sol de lado para a face curva ter luz e sombra
  const DIR3 = new THREE.Vector3(-27, 0, 63).normalize(), CAM3 = V3(4.6, 1.0, 7.4), RUMO3 = Math.atan2(-DIR3.x, -DIR3.z);
  cenaEm(i3, 'L3', 'câmera baixa na areia, em diagonal: onda gigante (crista curvada, espuma, spray) cresce até "gigante"; figurantes correndo para a câmera', (lt, d, t, blit) => {
    reset(); TW.life(i2 + 0.3); braceCrowd(1, t); windPalms(TW.palms, 1, t);
    const k = eio(seg(t, i3, tGigante)), zc = lerp(130, 86, k), H = lerp(22, 38, k);
    TW.setSun(32, 95);                                                      // sol de lado: a face curva da onda ganha luz e sombra
    TW.sea.visible = false; wave.visible = true; wave.update(zc, H, t);
    spray.mesh.visible = true; spray.mesh.position.set(0, H * 0.95, zc - H * 0.38 - 1); spray.mesh.scale.set(1, 0.09, 0.25);
    spray.update(t, { centro: [0, 0, 0], raio: 70, subida: 3, vento: [0, 0, -16] });
    corredores.forEach((p, i) => { const sd = [13, 16.5, 20, 24][i] - lt * 3.4, lado = [0.6, -1.2, 1.5, -0.4][i], ph = t * 9 + i * 1.7;
      p.group.visible = true; p.group.position.copy(CAM3).addScaledVector(DIR3, sd).add(V3(DIR3.z * lado, -1.0, -DIR3.x * lado));
      p.group.rotation.y = RUMO3 + [0.15, -0.2, 0.3, -0.1][i];
      p.walk(ph, 1.6, { lean: [14, 0, 0], head: [-8, 0, 0], armL: [60 + 40 * Math.sin(ph), 30], armR: [60 - 40 * Math.sin(ph), 30] }); p.face('scared'); });
    heroi.group.visible = false;
    TW.umbrellas.forEach((u, i) => { u.canopy.rotation.set(-0.5 - 0.15 * Math.sin(t * 8 + i), 0, 0.1 * Math.sin(t * 7 + i)); });
    streaks.update(t, 1, V3(-4, 0.3, 18), V3(30, 5, 22), 30);
    espuma.mesh.visible = true; espuma.update(t, { centro: [-3, 1.2, 20], raio: 8, subida: 0.6, vento: [0.4, 0.8, -6] });
    TW.shadowAt(-4, 20, 24);
    cam.fov = 52;                                                           // grande-angular baixa: cabe a onda inteira, com céu acima da crista
    const alvo = CAM3.clone().addScaledVector(DIR3, 60);
    aplicarCamera(cam, travelling({ de: arr(CAM3), para: arr(CAM3.clone().addScaledVector(DIR3, -0.9)), olharDe: [alvo.x, 9, alvo.z], olharPara: [alvo.x, 10, alvo.z] }, eio(lt / d)));
    townRender(CAM3.clone().addScaledVector(DIR3, 16), { aperture: 0.0001, bloom: 0.3, exposure: 0.88 }, 14); blit();
  });
  cue(i3, 'rumble', { dur: inicio(4) - i3 + 0.2, gain: 0.95 });
  cue(tGigante, 'slam', { gain: 0.7 });

  // ══ Linha 4 · chamada ══════════════════════════════════════════════════
  // de volta ao sol: órbita lenta, protagonista de frente para a câmera, grande, acenando acima do cartão final
  // o cartão entra no começo da linha 4 e o clique cai em "curiosidades" (o "Seguir"/"Inscrever-se" fica legível ~0,9 s antes)
  const i4 = inicio(4), tClique = W('curiosidades', 4) + 0.15, ultima = script.lines[script.lines.length - 1].text;
  cenaEm(i4, 'L4', 'sol de novo: órbita lenta em volta do protagonista acenando (happy), de frente; cartão final e clique em "curiosidades"', (lt, d, t, blit) => {
    reset(); TW.life(t); semMultidaoPerto(3.5);
    cone.visible = false;
    heroi.posar(acenarNoTempo(t, eo(seg(lt, 0.05, 0.4)))).rosto('happy', t, { semente: 7 });
    TW.shadowAt(0, 3, 9);
    aplicarCamera(cam, orbita({ alvo: [0, 0.75, 3.2], raio: 6.6, de: 1.38, ate: 1.72, altura: 0.75 }, eio(lt / d)));
    townRender(V3(0, 1.4, 3.2), { aperture: 0.003 }); blit();
    cartaoFinal({ marca: script.marca_nome || 'Conhecimento', textoDaUltimaLinha: ultima, k: eo(seg(lt, 0, 0.22)), clique: seg(t, tClique - 0.3, tClique + 0.3) });   // troca para "Seguindo" em tClique
  });
  cue(tClique, 'pop', { gain: 0.7 });

  return { cenas, cues };
}
