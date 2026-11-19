// Vitrine do kit voxel: uma cena de ~2,5 s por linha do roteiro, cada uma mostrando uma peça do kit
// (orla dia/noite, espaço, rostos com piscada, poses de mão, vento com voadores, onda, partículas, câmeras, câmera lenta,
// sala de aula, rua da cidade, cartão final de seguir/inscrever), com HUD (kit/hud.mjs) no espaço, nas poses e na câmera lenta.
// Receitas de render/reset copiadas de teste-lowpoly-v2/src/shots.js. Todo quadro = função pura de t.
import * as THREE from 'three';
import { clamp, lerp, seg, eo, eio, eob } from '../kit/motor/lib.js';
import { pilula, manchete, rotuloGuia, cartaoFinal, comCameraLenta, fmt } from '../kit/hud.mjs';
import { camera } from '../kit/motor/engine.js';
import { travelling, closeBaixo, drone, orbita, CAMERA_LENTA } from '../kit/cameras.mjs';
import { POSES, misturarPoses, acenarNoTempo } from '../kit/mundo/poses.mjs';
import { beachTown } from '../kit/mundo/orla.js';
import { space } from '../kit/mundo/espaco.js';
import { salaDeAula } from '../kit/mundo/sala.js';
import { ruaDaCidade } from '../kit/mundo/rua.js';
import { protagonista, figurante, sorvete } from '../kit/mundo/elenco.js';
import { windPalms, calmPalms, windStreaks, giantWave, voadores, particulas } from '../kit/mundo/efeitos.js';
import { aplicarCamera } from '../kit/mundo/camera3d.js';

const DEG = Math.PI / 180;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function montarCenas(E, { tempo }) {
  const cenas = [], cues = [];
  const cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const inicio = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
  const cena = (i, id, note, draw) => { const at = inicio(i); cenas.push({ id, at, note, draw }); cue(at, 'whoosh', { gain: 0.5 }); };
  const cam = camera(30); cam.far = 2500; cam.updateProjectionMatrix();
  const TLOOK = { aperture: 0.008, maxblur: 0.016, bloom: 0.26, bloomThreshold: 0.86, vignette: 0.32, grain: 0.014, warm: 0.03, exposure: 0.95 };
  const SLOOK = { aperture: 0, bloom: 0.55, bloomThreshold: 0.72, vignette: 0.45, grain: 0.014, warm: 0.0, exposure: 1.0 };

  // ── mundos e elenco ────────────────────────────────────────────────────
  const TW = beachTown(E), SP = space(E), P = SP.P, scene = TW.scene;
  // a malha do planeta só é recalculada quando o nível dos mares muda (cache do v2: planetSeas)
  let planetK = 0; const planetSeas = (k) => { if (Math.abs(k - planetK) > 1e-4) { P.update(k); planetK = k; } };
  const heroi = protagonista(); scene.add(heroi.group);
  const cone = sorvete(); heroi.handR.add(cone);
  const extras = [3, 7, 12, 18].map((s) => { const p = figurante(s); scene.add(p.group); return p; });
  const corredores = [51, 53, 56, 58].map((s) => { const p = figurante(s); scene.add(p.group); return p; });
  const todos = [heroi, ...extras, ...corredores];
  const voa = voadores({ n: 14, seed: 1 }); scene.add(voa.group);
  const brilho = particulas({ n: 260, cor: '#FFE066', tamanho: 0.05, seed: 2 }); scene.add(brilho.mesh);
  const streaks = windStreaks(320, '#F6E7C6'); scene.add(streaks);
  const wave = giantWave(); scene.add(wave);
  const lampGlow = new THREE.PointLight('#FFC27A', 0, 9, 1.6); lampGlow.position.set(1.6, 3.1, 4.9); scene.add(lampGlow);
  // sala de aula e rua: cenários próprios (cada um com sua scene); o professor é outro protagonista, na cena da sala
  const SA = salaDeAula(E), RU = ruaDaCidade(E, { carros: 14, pedestres: 24 });
  const prof = protagonista(); prof.group.position.set(1.3, 0, -3.75); prof.group.rotation.y = -50 * DEG; SA.scene.add(prof.group);

  // ── reset por quadro (como no v2) ──────────────────────────────────────
  const reset = () => {
    TW.night(0); lampGlow.intensity = 0; TW.setSun(38, -18); TW.sea.visible = true; wave.visible = false; streaks.visible = false; calmPalms(TW.palms);
    todos.forEach((p) => { p.reset(); p.group.visible = false; p.group.rotation.set(0, 0, 0); p.group.position.set(0, 0, 0); });
    heroi.group.visible = true; heroi.group.position.set(0, 0.18, 3.2); heroi.group.rotation.y = Math.PI / 2; cone.visible = false; cone.rotation.set(0, 0, 0);
    heroi.acc.glasses.position.set(0, 0.32, -0.05); heroi.acc.glasses.rotation.set(-0.3, 0, 0);
    voa.group.visible = false; brilho.mesh.visible = false;
    TW.crowd.forEach((p) => p.reset());
    TW.umbrellas.forEach((u) => u.canopy.rotation.set(0, 0, 0));
    planetSeas(0); P.spin.rotation.set(0, 0, 0); P.clouds.rotation.set(0, 0, 0); P.tilt.rotation.set(0, 0, 0.41); P.group.position.set(0, 0, 0);
    P.ring.material.opacity = 0; P.pin.visible = true; P.pin.scale.setScalar(1); SP.setSun(-7, 3.5, 6); cam.up.set(0, 1, 0);
    cam.fov = 30; prof.reset();             // sala e rua mudam o fov; quadro, alunos, carros, pedestres e noite da rua são refeitos a cada quadro delas
  };
  const _seg = new THREE.Vector3(), _d = new THREE.Vector3();
  /** esconde figurantes / objetos de praia bem na frente da lente (entre a câmera e o foco). Antes de testar, cada objeto volta a
   *  ficar visível (a multidão é reexibida pelo reset/TW.life), para o quadro não depender da cena anterior. */
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
  /** figurantes atravessando o quadro: [índice, x, z, sentido] */
  const caminhar = (lista, t) => lista.forEach(([k, x, z, dir]) => { const p = extras[k]; p.group.visible = true; p.group.position.set(x, 0.18, z); p.group.rotation.y = dir * Math.PI / 2; p.walk(t * 7 + k, 1); p.rosto('smile', t, { semente: k + 3 }); });

  // 1 · orla de dia: travelling lento pelo calçadão, figurantes caminhando
  cena(0, 'C01', 'orla de dia: travelling lento pelo calçadão, figurantes caminhando, carros e mar', (lt, d, t, blit) => {
    reset(); TW.life(t); heroi.group.visible = false;
    caminhar([[0, -2.5 - 1.25 * lt, 3.9, -1], [1, -10 + 1.2 * lt, 2.1, 1], [2, 1.5 - 1.1 * lt, 1.9, -1]], t);
    TW.shadowAt(-4, 3, 14);
    aplicarCamera(cam, travelling({ de: [8.5, 1.5, 6.2], para: [4.5, 1.7, 5.4], olharDe: [-10, 1.5, 2.4], olharPara: [-14, 1.7, 2.8] }, eio(lt / d)));
    townRender(V3(-4, 1.2, 3), { aperture: 0.003 }); blit();
  });

  // 2 · orla à noite: night(1), janelas e postes acesos, estrelas e lua
  cena(1, 'C02', 'orla à noite: night(1), postes e janelas acesos, estrelas', (lt, d, t, blit) => {
    reset(); TW.life(t); TW.night(1); TW.setSun(30, 200); lampGlow.intensity = 9; heroi.rosto('sleepy', t);
    TW.shadowAt(0, 3, 12);
    aplicarCamera(cam, travelling({ de: [7.5, 1.6, 7.6], para: [6.4, 1.7, 7.2], olharDe: [-6, 2.6, 1.5], olharPara: [-7, 2.8, 1.2] }, eio(lt / d)));
    townRender(V3(0, 1.4, 3.2), { bloom: 0.55, bloomThreshold: 0.7, exposure: 1.05, aperture: 0.003 }); blit();
  });

  // 3 · espaço: planeta girando, câmera em órbita
  cena(2, 'C03', 'espaço: planeta low poly girando, câmera orbita', (lt, d, t, blit) => {
    reset(); P.spin.rotation.y = 0.6 * t; P.clouds.rotation.y = 0.08 * t;
    aplicarCamera(cam, orbita({ alvo: [0, 0, 0], raio: 8.4, de: -0.45, ate: 0.35, altura: 0.9 }, eio(lt / d)));
    spaceRender(); blit();
    pilula('spin', 'ROTAÇÃO', `${fmt(1670)} km/h`, eob(seg(lt, 0.1, 0.5)));
    manchete(['E SE A TERRA', 'PARASSE DE', '*GIRAR*?'], seg(lt, 0.3, 1.3), seg(lt, d - 0.5, d - 0.1));
  });

  // 4 · rostos: closeBaixo trocando smile → surprised → scared → sleepy, piscando no sorriso
  const EXPR = [['smile', 0], ['surprised', 0.4], ['scared', 0.6], ['sleepy', 0.8]];
  cena(3, 'C04', 'closeBaixo no protagonista: smile (piscando) → surprised → scared → sleepy', (lt, d, t, blit) => {
    reset(); TW.life(t);
    const [nome] = EXPR.filter(([, f]) => lt >= f * d).pop();
    heroi.rosto(nome, t, { periodo: 0.9, dur: 0.15, semente: 4 });                 // semente: a piscada cai num quadro da folha
    heroi.pose({ head: [nome === 'surprised' ? -12 : nome === 'sleepy' ? 14 : 0, 0, nome === 'scared' ? 5 : 0], lean: [nome === 'scared' ? -5 : 0, 0, 0] });
    const h = headW(heroi); TW.shadowAt(0, 3, 9);
    aplicarCamera(cam, closeBaixo({ alvo: arr(h) }, eio(lt / d)));
    townRender(h); blit();
  });

  // 5 · poses de mão: apontar (com dedo), acenar, mão na cabeça, segurar o sorvete
  const FASES = ['apontar', 'acenar', 'maoNaCabeca', 'segurar'];
  cena(4, 'C05', 'plano médio: apontar (dedo) → acenar → maoNaCabeca → segurar sorvete', (lt, d, t, blit) => {
    reset(); TW.life(t);
    const q = d / 4, f = Math.min(3, Math.floor(lt / q)), k = eo(seg(lt - f * q, 0, 0.22));
    const poseDe = (nome) => (nome === 'acenar' ? acenarNoTempo(t, 1) : POSES[nome]);
    const alvo = misturarPoses(f ? poseDe(FASES[f - 1]) : POSES.neutro, poseDe(FASES[f]), k);
    heroi.posar(alvo).rosto(f === 2 ? 'surprised' : 'smile', t);
    if (f === 3) { cone.visible = true; cone.rotation.x = alvo.armR[0] * DEG; }
    TW.shadowAt(0, 3, 9);
    aplicarCamera(cam, travelling({ de: [4.7, 1.4, 0.0], para: [4.4, 1.4, 0.3], olharDe: [0.5, 1.2, 3.3] }, eio(lt / d))); cam.updateMatrixWorld();
    townRender(V3(0, 1.35, 3.2)); blit();
    const cabeca = headW(heroi).project(cam);                       // ponto 3D → pixel: o rótulo-guia aponta o protagonista
    rotuloGuia('VOCÊ', 250, 330, (cabeca.x * 0.5 + 0.5) * 1080, (0.5 - cabeca.y * 0.5) * 1920, eo(seg(lt, 0.2, 0.7)));
  });

  // 6 · vento: palmeiras dobrando, riscos de areia, objetos saindo do chão e voando; protagonista em susto
  cena(5, 'C06', 'vento: windPalms + windStreaks + voadores (k subindo), protagonista em susto', (lt, d, t, blit) => {
    reset(); TW.life(t);
    const kw = eo(seg(lt, 0, 0.7)), kv = seg(lt, 0.15, d - 0.15);
    braceCrowd(kw, t); windPalms(TW.palms, kw, t);
    heroi.posar('susto', eo(seg(lt, 0.15, 0.5))).face(kw > 0.3 ? 'scared' : 'surprised');
    voa.group.visible = true; voa.update(t, kv, { centro: [-3, 1, 3.6], vento: [0, 0.4, -1], alcance: 12 });
    streaks.update(t, kw, V3(-4, 0.3, 3), V3(16, 3, 14), 26);
    TW.shadowAt(-3, 3, 12);
    aplicarCamera(cam, travelling({ de: [8.2, 1.4, 4.4], para: [7.2, 1.45, 4.2], olharDe: [-6, 1.5, 2.9] }, eio(lt / d)));
    townRender(V3(-2, 1.2, 3.2), { aperture: 0.0016 }); blit();
  });

  // 7 · onda gigante subindo atrás de figurantes correndo, câmera baixa
  cena(6, 'C07', 'onda gigante (giantWave) subindo atrás de figurantes correndo, câmera baixa', (lt, d, t, blit) => {
    reset(); TW.life(t); heroi.group.visible = false; braceCrowd(1, t); windPalms(TW.palms, 1, t);
    TW.sea.visible = false; wave.visible = true; const k = eio(lt / d); wave.update(lerp(130, 104, k), lerp(18, 34, k), t);
    corredores.forEach((p, i) => { const x = [-0.6, 1.3, -1.9, 2.6][i], z = [23, 26.5, 30, 34][i] - lt * 3.2, ph = t * 9 + i * 1.7;
      p.group.visible = true; p.group.position.set(x, 0, z); p.group.rotation.y = Math.PI + [0.15, -0.2, 0.3, -0.1][i];
      p.walk(ph, 1.6, { lean: [14, 0, 0], head: [-8, 0, 0] }); p.face('scared'); });
    TW.umbrellas.forEach((u, i) => { u.canopy.rotation.set(-0.5 - 0.15 * Math.sin(t * 8 + i), 0, 0.1 * Math.sin(t * 7 + i)); });
    streaks.update(t, 1, V3(0, 0.3, 14), V3(26, 5, 22), 30);
    TW.shadowAt(0, 16, 22);
    aplicarCamera(cam, travelling({ de: [0.4, 1.1, 7.6], para: [0.2, 1.2, 8.3], olharDe: [0, 9, 60] }, k));
    townRender(V3(0, 1.5, 22), { aperture: 0.00012, bloom: 0.32 }, 9); blit();
  });

  // 8 · partículas em volta do protagonista
  cena(7, 'C08', 'partículas (InstancedMesh) flutuando em volta do protagonista, órbita lenta', (lt, d, t, blit) => {
    reset(); TW.life(t);
    heroi.posar('bracosAbertos', eo(seg(lt, 0.2, 0.8))).rosto('happy', t);
    brilho.mesh.visible = true; brilho.update(t, { centro: [0, 1, 3.2], raio: 3, subida: 0.35, vento: [0, 0, -0.3] });
    TW.shadowAt(0, 3, 9);
    aplicarCamera(cam, orbita({ alvo: [0, 1.3, 3.2], raio: 4.2, de: 0.75, ate: 1.25, altura: 0.15 }, eio(lt / d)));
    townRender(V3(0, 1.3, 3.2), { aperture: 0.004 }); blit();
  });

  // 9 · drone sobre a orla
  cena(8, 'C09', 'drone alto sobre a orla (câmera nomeada drone)', (lt, d, t, blit) => {
    reset(); TW.life(t); TW.shadowAt(-10, 6, 45);
    aplicarCamera(cam, drone({ centro: [-2, 0, 16] }, eio(lt / d)));
    townRender(V3(0, 0, 10), { aperture: 0.0002 }); blit();
  });

  // 10 · câmera lenta: a rajada passa devagar (comCameraLenta), objetos voando, palmeiras em flutter lento
  // comCameraLenta já entrega lt e d escalados por CAMERA_LENTA (tl/d segue sendo o progresso real) e desenha a etiqueta "CÂMERA LENTA" sozinha
  cena(9, 'C10', 'câmera lenta (comCameraLenta): rajada com voadores, riscos e palmeiras em flutter lento, etiqueta automática', comCameraLenta((tl, d, t, blit) => {
    reset(); const tt = tempo.linha(9) + tl;
    TW.life(tt); braceCrowd(1, tt); windPalms(TW.palms, 1, t, CAMERA_LENTA);
    heroi.posar('susto').face('scared');
    voa.group.visible = true; voa.update(tt, clamp(0.3 + tl * 0.8), { centro: [-3, 1, 3.6], vento: [0, 0.4, -1], alcance: 12 });
    streaks.update(tt, 1, V3(-6, 0.25, 2.5), V3(30, 4.5, 16), 30);
    TW.shadowAt(-3, 3, 12);
    aplicarCamera(cam, travelling({ de: [8.2, 1.4, 4.3], para: [7.6, 1.45, 4.2], olharDe: [-6, 1.6, 2.8] }, eio(tl / d)));   // lt e d chegam escalados: tl/d é o progresso real da cena
    townRender(V3(-2, 1.2, 3.2), { aperture: 0.0016 }); blit();
  }));
  cue(inicio(9) + 0.05, 'slowmo', { gain: 0.8 });

  // 11 · sala de aula: travelling do fundo até o quadro, "E = mc²" sendo escrito, professor apontando para o quadro
  /** giz no quadro: o texto aparece da esquerda para a direita conforme k (0..1) */
  const giz = (texto, k) => (g, w, h) => {
    g.font = '800 92px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText(texto).width, x0 = w * 0.42 - tw / 2;
    g.beginPath(); g.rect(0, 0, x0 + tw * k, h); g.clip();
    g.fillStyle = 'rgba(244, 241, 230, 0.93)'; g.fillText(texto, w * 0.42, h * 0.5);
    g.fillRect(x0, h * 0.8, tw, 5);
  };
  cena(10, 'C11', 'sala de aula: travelling do fundo até o quadro, "E = mc²" escrito no quadro, professor apontando', (lt, d, t, blit) => {
    reset(); cam.fov = 55;
    const k = eio(lt / d);
    SA.setTexto(giz('E = mc²', seg(lt, 0.1, d * 0.75)));
    prof.acc.cap.visible = false; prof.acc.glasses.visible = false;          // professor sem boné e sem óculos (o reset os reexibe)
    prof.posar('apontar', eo(seg(lt, 0.1, 0.7))).rosto('smile', t, { semente: 11 });
    SA.alunos.forEach((a, i) => a.rosto('neutral', t, { semente: 20 + i }));
    aplicarCamera(cam, travelling({ de: [-2.6, 3.05, 4.3], para: [1.6, 2.3, 0.9], olharDe: [1.4, 0.5, -3.2], olharPara: [-0.1, 1.5, -4.4] }, k));
    E.render(SA.scene, cam, { ...TLOOK, focus: cam.position.distanceTo(V3(0, 1.6, -4.4)), aperture: 0.0012, exposure: 1.0 }); blit();
  });

  // 12 · rua da cidade: câmera alta olhando ao longo da rua em diagonal, carros nas duas mãos, pedestres; o semáforo fica no
  //      verde quase a cena toda e só troca para amarelo no fim; anoitece na segunda metade
  cena(11, 'C12', 'rua da cidade: travelling alto ao longo da rua, carros em mão dupla, pedestres, semáforo; depois night(1)', (lt, d, t, blit) => {
    reset(); cam.fov = 47;
    const k = eio(lt / d), kn = eio(seg(lt, d * 0.5, d * 0.9)), tr = t + 0.8;   // fase: ciclo do semáforo de 4,5 a 7,4 s (amarelo no fim)
    RU.life(tr); RU.night(kn);
    aplicarCamera(cam, travelling({ de: [-3, 4.5, 11.2], para: [3, 4.5, 11.2], olharDe: [-20, 0.8, -1], olharPara: [-14, 0.8, -1] }, k));
    // primeiro plano limpo: na calçada de cá (z > 5,5), no trecho que a câmera atravessa, some quem ficaria colado na lente —
    // pedestres (o life os reexibe) e postes/árvores (reexibidos aqui antes do teste)
    const frente = (o) => o.position.z > 5.5 && o.position.x > cam.position.x - 16 && o.position.x < cam.position.x + 3;
    RU.pedestres.forEach((p) => { if (frente(p.group)) p.group.visible = false; });
    [...RU.lamps, ...RU.arvores].forEach((o) => { o.visible = !frente(o); });
    const foco = V3(cam.position.x - 15, 0.8, 0);
    RU.shadowAt(foco.x, 0, 22);
    E.render(RU.scene, cam, { ...TLOOK, focus: cam.position.distanceTo(foco), aperture: 0.0008, bloom: lerp(0.26, 0.55, kn), bloomThreshold: lerp(0.86, 0.7, kn), exposure: lerp(0.95, 1.05, kn) }); blit();
  });

  // 13 · cartão final: protagonista acenando em órbita lenta, cartão de seguir entra e o botão é "clicado" na segunda metade
  cena(12, 'C13', 'cartão final: protagonista acenando (orbita), cartaoFinal com botão Seguir → Seguindo ✓', (lt, d, t, blit) => {
    reset(); TW.life(t);
    heroi.posar(acenarNoTempo(t, 1)).rosto('happy', t, { semente: 13 });
    TW.shadowAt(0, 3, 9);
    aplicarCamera(cam, orbita({ alvo: [0, -1.1, 3.2], raio: 13, de: -0.3, ate: 0.15, altura: 2.5 }, eio(lt / d)));
    townRender(V3(0, 1.2, 3.2), { aperture: 0.002 }); blit();
    cartaoFinal({ marca: 'Conhecimento', textoDaUltimaLinha: 'Segue pra mais curiosidades.', k: eo(seg(lt, 0.15, 0.7)), clique: seg(lt, d * 0.55, d * 0.55 + 0.6) });
  });

  return { cenas, cues };
}
