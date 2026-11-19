// Fundo do kit motion: gradiente do tema + grade em perspectiva que acelera a cada corte + poeira.
// Extraído de teste-motion-v2/gen.mjs (94-129); cores vêm das variáveis do tema.
import { cena } from './base.mjs';

const r2 = (x) => Math.round(x * 1000) / 1000;
const mix = (v, pct) => `color-mix(in srgb,var(${v}) ${pct}%,transparent)`;

export function fundo(duracao, { cortes = [] } = {}) {
  let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const dust = Array.from({ length: 42 }, (_, k) => {
    const x = Math.round(rnd() * 1080), y = Math.round(rnd() * 1920), s = (1.5 + rnd() * 4.5).toFixed(1), o = (0.12 + rnd() * 0.4).toFixed(2), dy = Math.round(120 + rnd() * 260), dx = Math.round((rnd() - 0.5) * 80);
    return { k, x, y, s, o, dy, dx, g: rnd() < 0.3 };
  });
  const css = `
#bg-ground{position:absolute;inset:0;background:radial-gradient(110% 60% at 50% 18%,var(--fundo2) 0%,color-mix(in srgb,var(--fundo) 85%,var(--fundo2)) 45%,color-mix(in srgb,var(--fundo) 70%,black) 100%)}
#bg-glow{position:absolute;left:-200px;top:820px;width:1480px;height:620px;border-radius:50%;background:radial-gradient(closest-side,${mix('--acento', 16)},${mix('--acento', 4)} 60%,transparent)}
#bg-floorw{position:absolute;left:0;top:1130px;width:1080px;height:790px;overflow:hidden;perspective:520px;perspective-origin:50% 0%}
#bg-floor{position:absolute;left:-1460px;top:0;width:4000px;height:2400px;transform-origin:50% 0%;transform:rotateX(76deg);
  background-image:linear-gradient(${mix('--acento', 30)} 3px,transparent 3px),linear-gradient(90deg,${mix('--acento', 30)} 3px,transparent 3px);
  background-size:160px 160px;background-position:0 0;
  -webkit-mask-image:linear-gradient(to bottom,transparent 0%,#000 26%);mask-image:linear-gradient(to bottom,transparent 0%,#000 26%)}
#bg-horizon{position:absolute;left:0;top:1128px;width:1080px;height:3px;background:linear-gradient(90deg,transparent,${mix('--acento', 55)},transparent);box-shadow:0 0 30px ${mix('--acento', 50)}}
#bg-floorfade{position:absolute;left:0;top:1130px;width:1080px;height:790px;background:linear-gradient(to bottom,${mix('--fundo', 0)} 0%,${mix('--fundo', 15)} 50%,${mix('--fundo', 75)} 100%)}
.dust{position:absolute;border-radius:50%;background:var(--texto)}
.dust.g{background:var(--acento)}
#bg-vig{position:absolute;inset:0;background:radial-gradient(85% 60% at 50% 42%,transparent 50%,rgba(0,0,0,.7) 100%)}`;
  const html = `
    <div id="bg-ground"></div>
    <div id="bg-glow" data-layout-ignore></div>
    <div id="bg-floorw" data-layout-ignore><div id="bg-floor"></div></div>
    <div id="bg-floorfade" data-layout-ignore></div>
    <div id="bg-horizon" data-layout-ignore></div>
    ${dust.map((p) => `<div class="dust${p.g ? ' g' : ''}" id="bg-d${p.k}" style="left:${p.x}px;top:${p.y}px;width:${p.s}px;height:${p.s}px;opacity:${p.o}" data-layout-ignore></div>`).join('\n    ')}
    <div id="bg-vig"></div>`;
  const js = `
// o chão rola em direção ao espectador; dá um surto em cada corte
tl.fromTo($('bg-floor'), { backgroundPosition: '0px 0px' }, { backgroundPosition: '0px 1600px', duration: ${duracao}, ease: 'none' }, 0);
${cortes.map((c) => `tl.to($('bg-floor'), { backgroundPosition: '+=0px +=320px', duration: 0.45, ease: 'power3.out' }, ${r2(Math.max(0, c - 0.12))});`).join('\n')}
tl.fromTo($('bg-glow'), { opacity: 0.7, scaleX: 1 }, { opacity: 1, scaleX: 1.12, duration: ${duracao}, ease: 'sine.inOut' }, 0);
${dust.map((p) => `tl.fromTo($('bg-d${p.k}'), { x: 0, y: 0 }, { x: ${p.dx}, y: ${-p.dy}, duration: ${duracao}, ease: 'none' }, 0);`).join('\n')}`;
  return cena('bg', duracao, [{ css, html, js }]);
}
