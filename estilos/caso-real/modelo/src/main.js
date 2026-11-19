// Boot do vídeo-modelo (igual ao vitrine/src/main.js; porte de estilos/deep-dive/modelo/src/main.js, sem envelope de fala e sem balão): fontes → tema + roteiro
// + tempo → motor 3D → legendas → cenas. draw(t) desenha o instante t (função pura de t): a cena desenha no canvas 2D (e,
// quando tem 3D, renderiza no canvas WebGL escondido e o copia com blit), e as legendas vão por cima.
// window.OP é a API que tools/capture.mjs dirige.
import { W, H, setCtx, ctx, clamp } from '../kit/motor/lib.js';
import { makeEngine, RES, AA } from '../kit/motor/engine.js';
import { carregarTempo } from '../kit/tempo.mjs';
import { carregarTema } from '../kit/tema.mjs';
import { usarTema } from '../kit/hud.mjs';
import { usarTemaEvidencias } from '../kit/evidencias.mjs';
import { planejarLegendas, desenharLegenda } from '../kit/legendas.mjs';
import { montarCenas } from './cenas.js';

const cv = document.getElementById('cv'), GL = document.getElementById('gl');
setCtx(cv.getContext('2d'));
const OP = (window.OP = { ready: false });
let tempo, tema, legendas;

function draw(t) {
  t = clamp(t, 0, tempo.duracao - 1e-4);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
  const S = OP._shots; let i = S.length - 1; while (i > 0 && S[i].at > t) i--;
  const sh = S[i], end = i < S.length - 1 ? S[i + 1].at : tempo.duracao, d = end - sh.at, lt = t - sh.at;
  const blit = () => ctx.drawImage(GL, 0, 0, W, H);
  ctx.save(); sh.draw(lt, d, t, blit); ctx.restore();
  ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
  const fade = Math.min(clamp(t / 0.25), clamp((tempo.duracao - t) / 0.4));
  if (fade < 1) { ctx.fillStyle = '#000'; ctx.globalAlpha = 1 - fade; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  desenharLegenda(legendas, t, tema);
}

(async () => {
  try {
    await document.fonts.load('900 100px Inter'); await document.fonts.load('800 100px Inter'); await document.fonts.load('700 100px FreeMono');
    const script = await (await fetch('script.json', { cache: 'no-store' })).json();
    tema = await carregarTema('tema.json'); usarTema(tema); usarTemaEvidencias(tema);
    tempo = await carregarTempo('data');
    legendas = planejarLegendas(tempo, script.lines);
    GL.width = Math.round(1080 * RES); GL.height = Math.round(1920 * RES);
    const E = makeEngine(GL, { w: GL.width, h: GL.height, samples: AA });
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
