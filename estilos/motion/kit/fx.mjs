// Transições do kit motion: forma gigante girando sobre um flash e túnel de retângulos em zoom.
// Extraído de teste-motion-v2/gen.mjs (486-525); t é o instante do corte, em segundos absolutos.
import { cena } from './base.mjs';
import { cadeado, raio, coracao } from './icones.mjs';

const r2 = (x) => Math.round(x * 1000) / 1000;
const chave = (t) => String(r2(t)).replace('.', '_');
const FUNDO = 'var(--fundo)';

// forma -> { html, eixo }. 'v' sobe de baixo pra cima; 'h' cruza da esquerda pra direita.
const FORMAS = {
  asterisco: { eixo: 'v', html: (id) => `<div class="giant" id="${id}" data-layout-ignore>*</div>` },
  cadeado: { eixo: 'h', html: (id) => `<div class="giantsvg" id="${id}" data-layout-ignore>${cadeado(700, FUNDO)}</div>` },
  raio: { eixo: 'h', html: (id) => `<div class="giantsvg" id="${id}" data-layout-ignore>${raio(840, FUNDO)}</div>` },
  coracao: { eixo: 'h', html: (id) => `<div class="giantsvg" id="${id}" data-layout-ignore>${coracao(760, FUNDO)}</div>` },
};

export function flashForma(t, forma, cor) {
  const f = FORMAS[forma];
  if (!f) throw new Error(`forma "${forma}" desconhecida (use: ${Object.keys(FORMAS).join(', ')})`);
  const k = chave(t), fl = `fx-f${k}`, fm = `fx-s${k}`;
  const css = `
.fl{position:absolute;inset:0}
.giant{position:absolute;left:0;width:1080px;text-align:center;color:var(--fundo);top:260px;font:900 1500px/1 var(--sans),sans-serif}
.giantsvg{position:absolute;left:190px;top:560px;width:700px;height:840px;display:flex;align-items:center;justify-content:center}`;
  const html = `
    <div class="fl" id="${fl}" style="background:${cor}" data-layout-ignore></div>
    ${f.html(fm)}`;
  const v = f.eixo === 'v';
  const js = `
gsap.set('#${fl},#${fm}', { opacity: 0 });
tl.fromTo($('${fl}'), { opacity: 1, clipPath: '${v ? 'inset(0 0 100% 0)' : 'inset(0 100% 0 0)'}' }, { opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 0.1, ease: 'power2.in', immediateRender: false }, ${r2(t - 0.1)});
tl.to($('${fl}'), { clipPath: '${v ? 'inset(100% 0 0% 0)' : 'inset(0 0 0 100%)'}', duration: 0.14, ease: 'power2.out' }, ${r2(t + 0.08)});
tl.set($('${fl}'), { opacity: 0 }, ${r2(t + 0.23)});
tl.fromTo($('${fm}'), ${v ? '{ opacity: 1, y: 1300, rotation: -90, scale: 0.6 }, { opacity: 1, y: -1500, rotation: 120, scale: 1.2' : '{ opacity: 1, x: -1100, rotation: -20 }, { opacity: 1, x: 1200, rotation: 15'}, duration: 0.34, ease: 'power1.inOut', immediateRender: false }, ${r2(t - 0.12)});
tl.set($('${fm}'), { opacity: 0 }, ${r2(t + 0.23)});`;
  return { css, html, js };
}

// duracao = tempo total do túnel; os 8 retângulos entram escalonados dentro dela (o v2 usa ~0.67 s).
export function tunel(t, duracao, cor) {
  const k = chave(t), N = 8;
  const passo = Math.max(0.02, (duracao - 0.42) / (N - 1));
  const a = t - 0.36;
  const css = `
.tn{position:absolute;left:540px;top:760px;width:620px;height:900px;margin-left:-310px;margin-top:-450px;border-radius:90px;border:7px solid var(--tn-cor);box-shadow:0 0 40px color-mix(in srgb,var(--tn-cor) 70%,transparent),inset 0 0 40px color-mix(in srgb,var(--tn-cor) 40%,transparent)}
.fxdark{position:absolute;inset:0;background:color-mix(in srgb,var(--fundo) 50%,black)}`;
  const html = `
    <div class="fxdark" id="fx-dark${k}" data-layout-ignore></div>
    ${Array.from({ length: N }, (_, i) => `<div class="tn" id="fx-tn${k}_${i}" style="--tn-cor:${cor}" data-layout-ignore></div>`).join('')}`;
  const js = `
gsap.set('#fx-dark${k},[id^="fx-tn${k}_"]', { opacity: 0 });
tl.fromTo($('fx-dark${k}'), { opacity: 0 }, { opacity: 0.75, duration: 0.25, ease: 'power2.in', immediateRender: false }, ${r2(t - 0.3)});
tl.to($('fx-dark${k}'), { opacity: 0, duration: 0.25, ease: 'power2.out' }, ${r2(t)});
${Array.from({ length: N }, (_, i) => `tl.fromTo($('fx-tn${k}_${i}'), { opacity: 0, scale: 0.05 }, { keyframes: [{ opacity: 1, scale: 0.6, duration: 0.18 }, { opacity: 0, scale: 3.4, duration: 0.24 }], ease: 'power2.in', immediateRender: false }, ${r2(a + i * passo)});`).join('\n')}`;
  return { css, html, js };
}

export function transicoes(duracao, lista) {
  const css = [...new Set(lista.map((p) => p.css).filter(Boolean))].map((c) => ({ css: c }));
  return cena('fx', duracao, [...css, ...lista.map((p) => ({ html: p.html, js: p.js }))]);
}
