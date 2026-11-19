// Boot do vídeo-modelo pixel: tema + roteiro + tempo -> motor pixel (3D em 270x480, ampliado 4x sem suavizar) -> cenas -> legenda pixel.
// draw(t) é função pura de t; window.OP é a API que tools/capture.mjs dirige.
import { W, H, setCtx, ctx, clamp } from '../kit/motor/lib.js';
import { makePixelEngine } from '../kit/motor/pixel.js';
import { carregarTempo } from '../kit/tempo.mjs';
import { carregarTema } from '../kit/tema.mjs';
import { planejarLegendas, desenharLegenda } from '../kit/legendas.mjs';
import { usarTema } from '../kit/hud.mjs';
import { montarCenas } from './cenas.js';

const cv = document.getElementById('cv'), GL = document.getElementById('gl');
setCtx(cv.getContext('2d'));
const OP = (window.OP = { ready: false });
let tempo, tema, legendas;

function draw(t) {
  t = clamp(t, 0, tempo.duracao - 1e-4);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false;
  const S = OP._shots; let i = S.length - 1; while (i > 0 && S[i].at > t) i--;
  const sh = S[i], end = i < S.length - 1 ? S[i + 1].at : tempo.duracao, d = end - sh.at, lt = t - sh.at;
  const blit = () => { ctx.imageSmoothingEnabled = false; ctx.drawImage(GL, 0, 0, W, H); };
  ctx.save(); sh.draw(lt, d, t, blit); ctx.restore();
  ctx.globalAlpha = 1;
  const fade = Math.min(clamp(t / 0.25), clamp((tempo.duracao - t) / 0.4));
  if (fade < 1) { ctx.fillStyle = '#000'; ctx.globalAlpha = 1 - fade; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  desenharLegenda(legendas, t, tema);
}

(async () => {
  try {
    const script = await (await fetch('script.json', { cache: 'no-store' })).json();
    tema = await carregarTema('tema.json'); usarTema(tema);
    tempo = await carregarTempo('data');
    legendas = planejarLegendas(tempo, script.lines);
    const E = makePixelEngine(GL);
    const { cenas, cues } = montarCenas(E, { tempo, tema, script });
    cenas.sort((a, b) => a.at - b.at);
    OP._shots = cenas; OP.script = script;
    OP.duration = () => tempo.duracao;
    OP.draw = draw;
    OP.frame = (t, q = 0.92) => { draw(t); return cv.toDataURL('image/jpeg', q); };
    OP.shots = () => cenas.map((s, i) => ({ id: s.id, at: +s.at.toFixed(3), end: +(i < cenas.length - 1 ? cenas[i + 1].at : tempo.duracao).toFixed(3), note: s.note || '' }));
    OP.captions = () => legendas.map((c) => ({ s: +c.s.toFixed(3), e: +c.e.toFixed(3), text: c.palavras.map((w) => (w.hi ? '*' : '') + w.txt).join(' ') }));
    OP.cues = () => cues.slice().sort((a, b) => a.t - b.t);
    OP.ready = true;
    const q = new URLSearchParams(location.search);
    if (!q.has('capture')) {
      if (q.has('t')) draw(+q.get('t'));
      else {
        const audio = new Audio('data/mix.wav'); let t0 = null; const btn = document.getElementById('play'); btn.hidden = false;
        btn.onclick = () => { btn.hidden = true; t0 = performance.now(); audio.currentTime = 0; audio.play().catch(() => {}); };
        const loop = (now) => { const t = t0 == null ? 0 : (now - t0) / 1000; draw(t); if (t0 != null && t > tempo.duracao) { t0 = null; btn.hidden = false; } requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      }
    }
  } catch (e) { OP.bootError = String(e && e.stack || e); console.error(e); }
})();
