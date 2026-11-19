// Base do kit motion: CSS comum, helpers GSAP e escrita das composições do HyperFrames.
// Extraído de teste-motion-v2/gen.mjs (cores fixas trocadas por variáveis do tema).
import fs from 'node:fs';
import path from 'node:path';
import { cssVars } from './tema.mjs';

export const CSS_COMUM = `
#root{position:absolute;inset:0;overflow:hidden;color:var(--texto);font-family:var(--sans),sans-serif}
.cam{position:absolute;inset:0;transform-origin:50% 36%}
.card{position:absolute;border-radius:34px;background:linear-gradient(180deg,color-mix(in srgb,var(--cartao) 94%,transparent),color-mix(in srgb,var(--cartao2) 94%,transparent));
  border:2px solid rgba(255,255,255,.09);box-shadow:0 50px 120px rgba(0,0,0,.6),inset 0 2px 0 rgba(255,255,255,.05)}
.ghostcard{position:absolute;border-radius:30px;background:rgba(28,31,36,.55);border:2px solid rgba(255,255,255,.05);filter:blur(3px)}
.bar3{position:absolute;left:34px;top:30px;display:flex;gap:14px}
.bar3 i{width:22px;height:22px;border-radius:50%;display:block}
.bar3 i:first-child{background:var(--janela1)}.bar3 i:nth-child(2){background:var(--janela2)}.bar3 i:nth-child(3){background:var(--janela3)}
.mono{font-family:var(--mono),monospace}
.lbl{font:700 30px/1 var(--mono),monospace;letter-spacing:.14em;color:var(--apagado);text-transform:uppercase}
.cursor{position:absolute;left:0;top:0;width:70px;height:84px;filter:drop-shadow(0 8px 14px rgba(0,0,0,.6))}
.ring{position:absolute;width:120px;height:120px;border-radius:50%;border:5px solid var(--acento);opacity:0}
`;

export const HELPERS = `
const $ = (id) => document.getElementById(id);
const ZW = String.fromCharCode(8203);
const grp = (s) => s.replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
function count(el, from, to, t0, dur, f, ease) {
  const n = Math.max(2, Math.round(dur * 30)); const Ez = gsap.parseEase(ease || 'power1.inOut');
  for (let k = 0; k <= n; k++) tl.set(el, { textContent: f(from + (to - from) * Ez(k / n)) }, t0 + dur * k / n);
}
function typeText(el, text, t0, dur) {
  const n = text.length;
  for (let k = 0; k <= n; k++) tl.set(el, { textContent: ZW + text.slice(0, k) }, t0 + dur * k / n);
}
function spring(el, t, from, d) { const f = Object.assign({ opacity: 0, y: 60, scale: 0.86 }, from || {}); const blur = f.filter; delete f.filter;
  tl.fromTo(el, f, { opacity: 1, y: 0, x: 0, scale: 1, rotation: 0, duration: d || 0.6, ease: 'back.out(1.9)' }, t);
  if (blur) tl.fromTo(el, { filter: blur }, { filter: 'blur(0px)', duration: (d || 0.6) * 0.6, ease: 'power2.out' }, t); }
function pop(el, t, s) { tl.fromTo(el, { scale: s || 1.18 }, { scale: 1, duration: 0.42, ease: 'elastic.out(1,0.5)', immediateRender: false }, t); }
function click(ring, t) { tl.fromTo(ring, { opacity: 0.9, scale: 0.3 }, { opacity: 0, scale: 1.3, duration: 0.4, ease: 'power2.out' }, t); }
`;

// Junta as partes ({ css, html, js }) de uma cena, na ordem.
export function cena(id, duracao, partes) {
  const j = (k) => partes.map((p) => p[k] || '').join('\n');
  return { id, d: duracao, css: j('css'), html: j('html'), js: j('js') };
}

function arquivoComposicao(id, d, css, html, js, tema) {
  return `<template>
  <div id="root" data-composition-id="${id}" data-width="1080" data-height="1920" data-duration="${d}">
    <style>:root{${cssVars(tema)}}${CSS_COMUM}${css}</style>
${html}
    <script>
      (function () {
        const tl = gsap.timeline({ paused: true });
${HELPERS}
${js}
        window.__timelines["${id}"] = tl;
      })();
    </script>
  </div>
</template>
`;
}

export function escreverComposicao(dirVideo, c, tema) {
  fs.mkdirSync(path.join(dirVideo, 'compositions'), { recursive: true });
  fs.writeFileSync(path.join(dirVideo, 'compositions', c.id + '.html'), arquivoComposicao(c.id, c.d, c.css, c.html, c.js, tema));
}

const host = ({ id, a, d, faixa, z, tipo = 'graphics' }) =>
  `      <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${a}" data-duration="${d}" data-track-index="${faixa}" data-track-kind="${tipo}" data-width="1080" data-height="1920" style="z-index:${z}"></div>`;

export function escreverIndex(dirVideo, { titulo, duracao, cenas, tema }) {
  fs.mkdirSync(path.join(dirVideo, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dirVideo, 'index.html'), `<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>${titulo}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      :root{${cssVars(tema)}}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: var(--fundo); }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: var(--fundo); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${duracao}" data-width="1080" data-height="1920" data-fps="30">
${cenas.map(host).join('\n')}
      <audio id="mix" class="clip" src="assets/mix.wav" data-start="0" data-duration="${duracao}" data-track-index="9" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`);
}

export function escreverCues(dirVoz, duracao, cues) {
  fs.mkdirSync(path.join(dirVoz, 'data'), { recursive: true });
  const ordenadas = [...cues].sort((a, b) => a.t - b.t);
  fs.writeFileSync(path.join(dirVoz, 'data', 'cues.json'), JSON.stringify({ duration: duracao, cues: ordenadas }, null, 1));
}

// Amplia uma parte { css, html, js } (um cartão) por `escala` em torno do ponto `de` ([x, y] do cartão no canvas)
// e leva esse ponto até `para` (padrão: o próprio `de`). Os ids e os tempos do cartão não mudam.
export function escalar(parte, { escala, de, para = de }) {
  if (!(escala > 0) || !Array.isArray(de) || de.length !== 2) throw new Error('escalar: informe escala > 0 e de: [x, y]');
  const dx = Math.round((para[0] - de[0]) * 100) / 100, dy = Math.round((para[1] - de[1]) * 100) / 100;
  return { ...parte, html: `<div style="position:absolute;inset:0;transform-origin:${de[0]}px ${de[1]}px;transform:translate(${dx}px,${dy}px) scale(${escala})" data-layout-ignore>${parte.html || ''}</div>` };
}
