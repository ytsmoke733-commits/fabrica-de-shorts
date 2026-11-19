// Cartões de interface do kit motion. Cada função devolve uma parte { css, html, js } para cena(...).
// Extraído de teste-motion-v2/gen.mjs (login 130-197, ranking 198-267, terminal+régua 268-360,
// medidor 361-441, seguir 442-485); painel é novo. Cores só por var(--...); tempos t* absolutos na cena.
import { cursor, cadeado, olho, check } from './icones.mjs';

const r2 = (x) => Math.round(x * 1000) / 1000;
// Formatação pura de contador: número cru -> texto pt-BR (injetada no js gerado via toString).
export function formatarNumero(n, formato = 'pt-BR') { return Math.round(n).toLocaleString(formato); }
const ptbr = (n) => formatarNumero(n);

// Resolve as variáveis do tema em tempo de execução (o GSAP não interpola var(...)):
// V('acento') -> '#RRGGBB'; A('acento', .3) -> 'rgba(r,g,b,.3)'.
const COR = (id) => `
const V = (n) => { const c = getComputedStyle($('${id}')).getPropertyValue('--' + n).trim(); if (!c) throw new Error('cor do tema não resolvida: --' + n); return c; };
const A = (n, a) => { let c = V(n).replace('#', ''); if (c.length === 3) c = c.replace(/./g, (m) => m + m);
  if (!/^[0-9a-fA-F]{6}$/.test(c)) throw new Error('cor do tema inválida: --' + n);
  return 'rgba(' + parseInt(c.slice(0, 2), 16) + ',' + parseInt(c.slice(2, 4), 16) + ',' + parseInt(c.slice(4, 6), 16) + ',' + a + ')'; };
const fmtN = ${formatarNumero.toString()};`;

const bloco = (id, js) => `{${COR(id)}\n${js}\n}`;
const FOCO = (cor) => `color-mix(in srgb,var(--${cor}) 12%,transparent)`;

// ---------- login ----------
export function login({ id, titulo, campo, valor, tEntrada, tDigitos, tMostrar, y = 270 }) {
  const n = Math.min(valor.length, tDigitos.length);
  const cx = 847, cy = y + 312; // centro do olho
  const css = `
#${id}-card{left:110px;top:${y}px;width:860px;height:580px}
#${id}-lock{position:absolute;left:60px;top:60px;width:110px;height:110px;border-radius:30px;background:${FOCO('acento')};border:2px solid color-mix(in srgb,var(--acento) 35%,transparent);display:flex;align-items:center;justify-content:center}
#${id}-title{position:absolute;left:196px;top:92px;font:800 58px/1 var(--sans),sans-serif;letter-spacing:-.02em}
#${id}-l{position:absolute;left:60px;top:216px;font:700 28px/1 var(--mono),monospace;letter-spacing:.12em;color:var(--apagado);text-transform:uppercase}
#${id}-f{position:absolute;left:60px;top:256px;width:740px;height:112px;border-radius:22px;background:var(--fundo);border:3px solid var(--fraco)}
#${id}-dots{position:absolute;left:34px;top:24px;display:flex;gap:14px}
#${id}-dots i{display:block;width:30px;height:30px;border-radius:50%;background:var(--texto);margin-top:16px}
#${id}-txt{position:absolute;left:34px;top:0;height:112px;font:700 56px/112px var(--mono),monospace;color:var(--acento);opacity:0;white-space:pre}
#${id}-caret{position:absolute;left:34px;top:24px;width:5px;height:64px;background:var(--acento)}
#${id}-eye{position:absolute;right:30px;top:32px;width:66px;height:44px}
#${id}-eye svg{position:absolute;left:0;top:0}
#${id}-btn{position:absolute;left:60px;top:420px;width:740px;height:100px;border-radius:24px;background:var(--acento);color:var(--fundo);font:800 40px/100px var(--sans),sans-serif;text-align:center}
#${id}-ring{left:${cx - 60}px;top:${cy - 60}px}`;
  const html = `
    <div id="${id}">
      <div class="card" id="${id}-card">
        <div id="${id}-lock">${cadeado(56, 'var(--acento)')}</div>
        <div id="${id}-title">${titulo}</div>
        <div id="${id}-l">${campo}</div>
        <div id="${id}-f"><div id="${id}-dots">${'<i></i>'.repeat(valor.length)}</div><div id="${id}-txt">${valor}</div><div id="${id}-caret"></div>
          <div id="${id}-eye"><span id="${id}-eoff">${olho(false, 'var(--apagado)')}</span><span id="${id}-eon" style="opacity:0">${olho(true, 'var(--acento)')}</span></div></div>
        <div id="${id}-btn">${titulo}</div>
      </div>
      <div class="ring" id="${id}-ring" data-layout-ignore></div>
      ${cursor(`${id}-cur`)}
    </div>`;
  const js = bloco(id, `
spring($('${id}-card'), ${r2(tEntrada)}, { y: 70, scale: 0.93, rotation: -2 }, 0.7);
gsap.set('#${id}-dots i', { opacity: 0, scale: 0 });
gsap.set($('${id}-caret'), { opacity: 0 });
tl.to($('${id}-f'), { borderColor: V('acento'), boxShadow: '0 0 0 8px ' + A('acento', .15) + ', 0 0 40px ' + A('acento', .35), duration: 0.25, ease: 'power2.out' }, ${r2(tDigitos[0] - 0.1)});
tl.set($('${id}-caret'), { opacity: 1 }, ${r2(tDigitos[0] - 0.1)});
${tDigitos.slice(0, n).map((t, k) => `tl.fromTo('#${id}-dots i:nth-child(${k + 1})', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.22, ease: 'back.out(3)' }, ${r2(t)});
tl.set($('${id}-caret'), { x: ${44 * (k + 1)} }, ${r2(t)});`).join('\n')}
// cursor voa até o olho e clica em "mostrar"
tl.fromTo($('${id}-cur'), { x: 1150, y: 1500 }, { x: ${cx - 15}, y: ${cy - 2}, duration: 0.6, ease: 'power3.out' }, ${r2(Math.max(0, tMostrar - 0.7))});
tl.to($('${id}-cur'), { scale: 0.85, duration: 0.06, yoyo: true, repeat: 1 }, ${r2(tMostrar)});
click($('${id}-ring'), ${r2(tMostrar + 0.04)});
tl.to($('${id}-eoff'), { opacity: 0, duration: 0.08 }, ${r2(tMostrar + 0.06)});
tl.to($('${id}-eon'), { opacity: 1, duration: 0.08 }, ${r2(tMostrar + 0.06)});
tl.set('#${id}-dots', { opacity: 0 }, ${r2(tMostrar + 0.08)});
tl.set($('${id}-caret'), { opacity: 0 }, ${r2(tMostrar + 0.08)});
tl.fromTo($('${id}-txt'), { opacity: 0, scale: 1.2, transformOrigin: '0% 50%' }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)', immediateRender: false }, ${r2(tMostrar + 0.08)});
tl.to($('${id}-cur'), { x: 1150, y: 1500, duration: 0.5, ease: 'power3.in' }, ${r2(tMostrar + 0.5)});`);
  return { css, html, js };
}

// ---------- ranking ----------
export function ranking({ id, titulo, itens, destaque = 0, tEntrada, tDestaque, y = 270 }) {
  const max = Math.max(...itens.map((i) => i.valor), 1);
  const alt = 128 + itens.length * 84 + 30;
  const linha = (it, k) => `<div class="${id}-row" id="${id}-r${k}" style="top:${128 + k * 84}px"><div class="${id}-n">#${k + 1}</div><div class="${id}-v">${it.rotulo}</div><div class="${id}-barw"><div class="${id}-bar" id="${id}-b${k}" style="width:${Math.round((it.valor / max) * 100)}%"></div></div></div>`;
  const css = `
#${id}-panel{left:90px;top:${y}px;width:900px;height:${alt}px}
#${id}-ptitle{position:absolute;left:44px;top:40px;font:800 46px/1 var(--sans),sans-serif;letter-spacing:-.01em}
.${id}-row{position:absolute;left:30px;width:840px;height:78px;border-radius:18px;display:flex;align-items:center;border:3px solid transparent}
.${id}-n{width:84px;text-align:center;font:800 34px/1 var(--mono),monospace;color:var(--apagado)}
.${id}-v{width:300px;font:700 40px/1 var(--mono),monospace;color:var(--texto)}
.${id}-barw{flex:1;height:16px;border-radius:8px;background:rgba(255,255,255,.05);margin-right:30px;overflow:hidden}
.${id}-bar{height:16px;border-radius:8px;background:var(--fraco);transform-origin:0 50%}
#${id}-r${destaque}{background:${FOCO('acento')};border-color:color-mix(in srgb,var(--acento) 35%,transparent)}
#${id}-r${destaque} .${id}-n,#${id}-r${destaque} .${id}-v{color:var(--acento)}
#${id}-r${destaque} .${id}-v{font-size:46px}
#${id}-b${destaque}{background:var(--acento)}`;
  const html = `
    <div id="${id}">
      <div class="card" id="${id}-panel">
        <div id="${id}-ptitle">${titulo}</div>
        ${itens.map(linha).join('\n        ')}
      </div>
    </div>`;
  const outros = itens.map((_, k) => k).filter((k) => k !== destaque);
  const js = bloco(id, `
spring($('${id}-panel'), ${r2(tEntrada)}, { y: 260, scale: 0.9 }, 0.62);
${outros.map((k, j) => `tl.fromTo($('${id}-r${k}'), { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 0.4, ease: 'back.out(1.8)' }, ${r2(tEntrada + 0.3 + j * 0.08)});
tl.fromTo($('${id}-b${k}'), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, ${r2(tEntrada + 0.43 + j * 0.08)});`).join('\n')}
// item em destaque entra e pulsa
gsap.set($('${id}-r${destaque}'), { borderColor: A('acento', .35), boxShadow: 'none' });
tl.fromTo($('${id}-r${destaque}'), { opacity: 0, x: -90 }, { opacity: 1, x: 0, duration: 0.45, ease: 'back.out(2)' }, ${r2(tDestaque - 0.5)});
tl.fromTo($('${id}-b${destaque}'), { scaleX: 0 }, { scaleX: 0.85, duration: 0.5, ease: 'none' }, ${r2(tDestaque - 0.5)});
tl.to($('${id}-b${destaque}'), { scaleX: 1, duration: 0.3, ease: 'power3.out' }, ${r2(tDestaque)});
tl.to($('${id}-r${destaque}'), { borderColor: V('acento'), boxShadow: '0 0 50px ' + A('acento', .35), duration: 0.15 }, ${r2(tDestaque)});
pop($('${id}-r${destaque}'), ${r2(tDestaque)}, 1.14);`);
  return { css, html, js };
}

// ---------- terminal ----------
export function terminal({ id, comando, de, ate, rotulo, tInicio, tFim, tAchou, textoAchou, y = 226 }) {
  const dig = String(Math.round(ate)).length;
  const stream = Array.from({ length: 26 }, (_, k) => `<div>${String(Math.round(ate) - 26 + k).padStart(dig, '0')} <b>✗</b></div>`).join('');
  const frac = r2(Math.min(1, ate / 10 ** dig));
  const t0 = r2(Math.max(0, tInicio - 0.3));
  const css = `
#${id}-term{left:80px;top:${y}px;width:920px;height:600px;background:linear-gradient(180deg,color-mix(in srgb,var(--fundo) 97%,transparent),color-mix(in srgb,var(--fundo) 90%,black))}
#${id}-sep{position:absolute;left:0;top:82px;width:920px;height:2px;background:rgba(255,255,255,.07)}
#${id}-cmd{position:absolute;left:44px;top:118px;font:500 33px/1.3 var(--mono),monospace;color:var(--texto);white-space:pre}
#${id}-streamw{position:absolute;right:40px;top:110px;width:250px;height:330px;overflow:hidden;-webkit-mask-image:linear-gradient(transparent,#000 30%,#000 70%,transparent);mask-image:linear-gradient(transparent,#000 30%,#000 70%,transparent)}
#${id}-stream{font:500 26px/1.45 var(--mono),monospace;color:var(--fraco);text-align:right}
#${id}-stream b{color:var(--perigo);font-weight:700;opacity:.6}
#${id}-alab{position:absolute;left:44px;top:196px}
#${id}-num{position:absolute;left:36px;top:240px;font:800 132px/1 var(--mono),monospace;color:var(--acento);letter-spacing:-.02em;text-shadow:0 0 34px color-mix(in srgb,var(--acento) 45%,transparent)}
#${id}-pw{position:absolute;left:44px;top:420px;width:832px;height:14px;border-radius:7px;background:rgba(255,255,255,.06);overflow:hidden}
#${id}-p{width:832px;height:14px;border-radius:7px;background:var(--acento);transform-origin:0 50%}
#${id}-plab{position:absolute;left:44px;top:452px;font:500 28px/1 var(--mono),monospace;color:var(--apagado)}
#${id}-found{position:absolute;left:44px;top:506px;padding:14px 24px;border-radius:16px;border:3px solid var(--perigo);background:${FOCO('perigo')};font:800 40px/1 var(--mono),monospace;color:var(--perigo)}`;
  const html = `
    <div id="${id}">
      <div class="card" id="${id}-term">
        <div class="bar3"><i></i><i></i><i></i></div>
        <div id="${id}-sep"></div>
        <div id="${id}-cmd">${comando}</div>
        <div id="${id}-streamw" data-layout-ignore><div id="${id}-stream">${stream}</div></div>
        <div class="lbl" id="${id}-alab">${rotulo}</div>
        <div id="${id}-num">${ptbr(ate)}</div>
        <div id="${id}-pw"><div id="${id}-p"></div></div>
        <div id="${id}-plab">de ${ptbr(10 ** dig)} possíveis</div>
        <div id="${id}-found">✓ ${textoAchou}</div>
      </div>
    </div>`;
  const js = bloco(id, `
spring($('${id}-term'), ${t0}, { y: 200, scale: 0.88, rotation: 3, filter: 'blur(8px)' }, 0.55);
tl.set($('${id}-num'), { textContent: ZW + ${JSON.stringify(ptbr(de))} }, 0);
// o contador anima o número cru e formata ao escrever (o GSAP lê "100.000" como 100)
tl.set($('${id}-cmd'), { textContent: ZW }, 0);
typeText($('${id}-cmd'), ${JSON.stringify(comando)}, ${r2(t0 + 0.1)}, 0.42);
tl.fromTo($('${id}-stream'), { y: 0 }, { y: -700, duration: ${r2(Math.max(0.2, tAchou - tInicio + 0.2))}, ease: 'power2.in' }, ${r2(tInicio - 0.1)});
count($('${id}-num'), ${de}, ${ate}, ${r2(tInicio)}, ${r2(tFim - tInicio)}, (v) => ZW + fmtN(v, 'pt-BR'), 'power2.in');
tl.fromTo($('${id}-p'), { scaleX: 0 }, { scaleX: ${frac}, duration: ${r2(tFim - tInicio)}, ease: 'power2.in' }, ${r2(tInicio)});
tl.to($('${id}-num'), { color: V('perigo'), textShadow: '0 0 40px ' + A('perigo', .6), duration: 0.1 }, ${r2(tAchou)});
tl.to($('${id}-p'), { backgroundColor: V('perigo'), duration: 0.1 }, ${r2(tAchou)});
pop($('${id}-num'), ${r2(tAchou)}, 1.12);
tl.fromTo($('${id}-found'), { opacity: 0, scale: 0.6, x: -40 }, { opacity: 1, scale: 1, x: 0, duration: 0.45, ease: 'elastic.out(1,0.55)' }, ${r2(tAchou + 0.04)});
tl.to($('${id}-term'), { borderColor: A('perigo', .7), boxShadow: '0 50px 120px rgba(0,0,0,.6), 0 0 60px ' + A('perigo', .35), duration: 0.15 }, ${r2(tAchou)});`);
  return { css, html, js };
}

// ---------- régua ----------
export function regua({ id, rotulo, max, valor, tInicio, tFim, selo, cor = 'perigo', y = 520 }) {
  const fim = Math.round(Math.min(1, Math.max(0, valor / max)) * 832 * 10) / 10;
  const css = `
#${id}-card{left:80px;top:${y}px;width:920px;height:640px}
#${id}-tlab{position:absolute;left:44px;top:44px;font:700 46px/1 var(--mono),monospace;letter-spacing:.14em;color:var(--apagado);text-transform:uppercase}
#${id}-selo{position:absolute;left:0;top:118px;width:920px;text-align:center;font:800 340px/1 var(--sans),sans-serif;color:var(--${cor});letter-spacing:-.04em;text-shadow:0 0 60px color-mix(in srgb,var(--${cor}) 40%,transparent)}
#${id}-rul{position:absolute;left:44px;top:510px;width:832px;height:70px}
#${id}-rul .tick{position:absolute;bottom:0;width:4px;background:var(--fraco)}
#${id}-rul .tl{position:absolute;top:-58px;font:700 42px/1 var(--mono),monospace;color:var(--apagado)}
#${id}-mark{position:absolute;left:44px;top:488px;width:9px;height:112px;border-radius:4px;background:var(--${cor});box-shadow:0 0 22px color-mix(in srgb,var(--${cor}) 90%,transparent)}`;
  const html = `
    <div id="${id}">
      <div class="card" id="${id}-card">
        <div class="lbl" id="${id}-tlab">${rotulo}</div>
        <div id="${id}-selo">${selo}</div>
        <div id="${id}-rul">${Array.from({ length: 11 }, (_, k) => `<div class="tick" style="left:${k * 82.8}px;height:${k % 5 ? 28 : 52}px"></div>`).join('')}<div class="tl" style="left:0">0</div><div class="tl" style="right:0">${max}</div></div>
        <div id="${id}-mark"></div>
      </div>
    </div>`;
  const js = bloco(id, `
spring($('${id}-card'), ${r2(Math.max(0, tInicio - 0.3))}, { y: 260, scale: 0.9 }, 0.55);
tl.fromTo($('${id}-mark'), { x: 0 }, { x: ${fim}, duration: ${r2(tFim - tInicio)}, ease: 'none' }, ${r2(tInicio)});
gsap.set($('${id}-selo'), { opacity: 0 });
tl.set($('${id}-selo'), { opacity: 1 }, ${r2(tFim)});
tl.fromTo($('${id}-selo'), { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2.2)', immediateRender: false }, ${r2(tFim)});
tl.to($('${id}-card'), { borderColor: A('${cor}', .75), boxShadow: '0 50px 120px rgba(0,0,0,.6), 0 0 60px ' + A('${cor}', .3), duration: 0.15 }, ${r2(tFim)});`);
  return { css, html, js };
}

// ---------- medidor ----------
export function medidor({ id, titulo, palavras, tPalavras, rotulos = ['FRACA', 'BOA', 'FORTE'], y = 226 }) {
  const n = palavras.length;
  const tam = palavras.map((_, k) => palavras.slice(0, k + 1).join('-').length);
  const idx = (k) => Math.min(rotulos.length - 1, Math.floor(((k + 1) * rotulos.length) / (n + 1)));
  const cor = ['perigo', 'alerta', 'acento'];
  const corIdx = (k) => cor[Math.min(2, idx(k))];
  const tFinal = tPalavras[n - 1];
  const css = `
#${id}-card{left:80px;top:${y}px;width:920px;height:780px}
#${id}-title{position:absolute;left:44px;top:44px;font:800 52px/1 var(--sans),sans-serif;letter-spacing:-.02em}
#${id}-field{position:absolute;left:44px;top:140px;width:832px;height:260px;border-radius:24px;background:var(--fundo);border:3px solid var(--fraco)}
#${id}-chips{position:absolute;left:30px;top:34px;width:780px;display:flex;flex-wrap:wrap;gap:22px 14px;align-items:center}
.${id}-chip{display:inline-flex;align-items:center;height:104px;padding:0 30px;border-radius:22px;background:${FOCO('acento')};border:3px solid color-mix(in srgb,var(--acento) 60%,transparent);font:700 64px/1 var(--mono),monospace;color:var(--acento)}
.${id}-hy{font:700 64px/1 var(--mono),monospace;color:var(--apagado)}
#${id}-mlbl{position:absolute;left:44px;top:436px}
#${id}-force{position:absolute;right:44px;top:428px;font:800 40px/1 var(--sans),sans-serif;color:var(--perigo);text-transform:uppercase;letter-spacing:.04em}
#${id}-meter{position:absolute;left:44px;top:490px;width:832px;height:26px;display:flex;gap:14px}
.${id}-seg{flex:1;height:26px;border-radius:13px;background:rgba(255,255,255,.07);overflow:hidden}
.${id}-segf{width:100%;height:26px;border-radius:13px;transform-origin:0 50%}
.${id}-stat{position:absolute;top:570px;width:400px;height:150px;border-radius:24px;background:rgba(255,255,255,.035);border:2px solid rgba(255,255,255,.06)}
#${id}-s1{left:44px}#${id}-s2{left:476px}
.${id}-stat .lbl{position:absolute;left:30px;top:26px;font-size:28px}
.${id}-sv{position:absolute;left:28px;top:64px;font:800 70px/1 var(--sans),sans-serif;color:var(--texto);letter-spacing:-.03em}
#${id}-check{position:absolute;left:774px;top:-30px;width:90px;height:90px;border-radius:50%;background:var(--acento);display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px color-mix(in srgb,var(--acento) 60%,transparent)}`;
  const html = `
    <div id="${id}">
      <div class="card" id="${id}-card">
        <div id="${id}-title">${titulo}</div>
        <div id="${id}-field"><div id="${id}-chips">${palavras.map((p, k) => `${k ? `<span class="${id}-hy" id="${id}-h${k}">-</span>` : ''}<span class="${id}-chip" id="${id}-c${k}">${p}</span>`).join('')}</div></div>
        <div class="lbl" id="${id}-mlbl">força</div>
        <div id="${id}-force">${rotulos[0]}</div>
        <div id="${id}-meter">${rotulos.map((_, k) => `<div class="${id}-seg"><div class="${id}-segf" id="${id}-f${k}" style="background:var(--${cor[Math.min(2, k)]})"></div></div>`).join('')}</div>
        <div class="${id}-stat" id="${id}-s1"><div class="lbl">caracteres</div><div class="${id}-sv" id="${id}-n1">0</div></div>
        <div class="${id}-stat" id="${id}-s2"><div class="lbl">palavras</div><div class="${id}-sv" id="${id}-n2">0</div></div>
        <div id="${id}-check">${check(50, 'var(--fundo)')}</div>
      </div>
    </div>`;
  const js = bloco(id, `
spring($('${id}-card'), ${r2(Math.max(0, tPalavras[0] - 0.5))}, { y: 240, scale: 0.88, rotation: -3, filter: 'blur(8px)' }, 0.6);
gsap.set('.${id}-segf', { scaleX: 0 });
gsap.set('.${id}-chip,.${id}-hy', { opacity: 0 });
gsap.set($('${id}-check'), { opacity: 0, scale: 0 });
gsap.set($('${id}-force'), { color: V('perigo') });
${tPalavras.map((t, k) => `${k ? `tl.fromTo($('${id}-h${k}'), { opacity: 0 }, { opacity: 1, duration: 0.1 }, ${r2(t - 0.02)});\n` : ''}tl.fromTo($('${id}-c${k}'), { opacity: 0, scale: 0.4, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'elastic.out(1,0.55)' }, ${r2(t)});
${rotulos.map((_, j) => `tl.to($('${id}-f${j}'), { scaleX: ${Math.round(Math.min(1, Math.max(0, ((k + 1) / n) * rotulos.length - j)) * 100) / 100}, duration: 0.3, ease: 'power3.out' }, ${r2(t + 0.03)});`).join('\n')}
tl.set($('${id}-force'), { textContent: ${JSON.stringify(rotulos[idx(k)])}, color: V('${corIdx(k)}') }, ${r2(t + 0.03)});
count($('${id}-n1'), ${k ? tam[k - 1] : 0}, ${tam[k]}, ${r2(t)}, 0.22, (v) => ZW + Math.round(v), 'power2.out');
tl.set($('${id}-n2'), { textContent: ZW + '${k + 1}' }, ${r2(t + 0.03)});
pop($('${id}-n2'), ${r2(t + 0.03)}, 1.25);`).join('\n')}
// fim: tudo em acento, check pulsa
tl.to('.${id}-segf', { backgroundColor: V('acento'), scaleX: 1, duration: 0.2, stagger: 0.04 }, ${r2(tFinal + 0.2)});
tl.set($('${id}-force'), { textContent: ${JSON.stringify(rotulos[rotulos.length - 1])}, color: V('acento') }, ${r2(tFinal + 0.2)});
pop($('${id}-force'), ${r2(tFinal + 0.2)}, 1.3);
tl.to($('${id}-check'), { opacity: 1, scale: 1, duration: 0.5, ease: 'elastic.out(1,0.5)' }, ${r2(tFinal + 0.25)});
tl.to($('${id}-card'), { boxShadow: '0 50px 120px rgba(0,0,0,.6), 0 0 70px ' + A('acento', .28), borderColor: A('acento', .5), duration: 0.25 }, ${r2(tFinal + 0.2)});`);
  return { css, html, js };
}

// ---------- painel (número gigante) ----------
export function painel({ id, rotulo, de, ate, sufixo = '', tInicio, tFim, formato = 'pt-BR', y = 640 }) {
  const fmt = (n) => formatarNumero(n, formato);
  const finalTxt = fmt(ate) + sufixo;
  const tam = Math.min(300, Math.floor(960 / (finalTxt.length * 0.62)));
  const css = `
#${id}-num{position:absolute;left:0;top:${y}px;width:1080px;text-align:center;font:800 ${tam}px/1 var(--mono),monospace;letter-spacing:-.04em;color:var(--texto);white-space:pre}
#${id}-lab{position:absolute;left:0;top:${y + tam + 40}px;width:1080px;text-align:center;font:700 44px/1 var(--mono),monospace;letter-spacing:.14em;color:var(--apagado);text-transform:uppercase}`;
  const html = `
    <div id="${id}">
      <div id="${id}-num">${finalTxt}</div>
      <div id="${id}-lab">${rotulo}</div>
    </div>`;
  const js = bloco(id, `
tl.set($('${id}-num'), { textContent: ZW + ${JSON.stringify(fmt(de) + sufixo)} }, 0);
spring($('${id}-num'), ${r2(Math.max(0, tInicio - 0.25))}, { y: 80, scale: 0.8 }, 0.55);
spring($('${id}-lab'), ${r2(Math.max(0, tInicio - 0.1))}, { y: 40, scale: 0.9 }, 0.5);
// anima o número cru e formata na escrita (o GSAP lê "100.000" como 100)
count($('${id}-num'), ${de}, ${ate}, ${r2(tInicio)}, ${r2(tFim - tInicio)}, (v) => ZW + fmtN(v, ${JSON.stringify(formato)}) + ${JSON.stringify(sufixo)}, 'power2.out');
tl.to($('${id}-num'), { color: V('acento'), textShadow: '0 0 50px ' + A('acento', .5), duration: 0.15 }, ${r2(tFim)});
pop($('${id}-num'), ${r2(tFim)}, 1.12);`);
  return { css, html, js };
}

// ---------- seguir ----------
export function seguir({ id, marca, chamada, tEntrada, tClique, y = 390 }) {
  const feito = /inscrev/i.test(chamada) ? 'Inscrito ✓' : 'Seguindo ✓';
  const bx = 540, by = y + 360; // centro do botão
  const css = `
#${id}-card{left:150px;top:${y}px;width:780px;height:520px;text-align:center}
#${id}-av{position:absolute;left:310px;top:-80px;width:160px;height:160px;border-radius:50%;background:var(--fundo);border:5px solid var(--acento);display:flex;align-items:center;justify-content:center;box-shadow:0 0 50px color-mix(in srgb,var(--acento) 40%,transparent)}
#${id}-name{position:absolute;left:0;top:140px;width:780px;font:800 60px/1 var(--sans),sans-serif;letter-spacing:-.02em}
#${id}-btn{position:absolute;left:190px;top:300px;width:400px;height:120px;border-radius:60px;background:var(--acento);color:var(--fundo);font:800 48px/120px var(--sans),sans-serif}
#${id}-btn2{position:absolute;left:190px;top:300px;width:400px;height:120px;border-radius:60px;border:4px solid var(--acento);color:var(--acento);font:800 46px/112px var(--sans),sans-serif;background:var(--fundo)}
#${id}-ring{left:${bx - 60}px;top:${by - 60}px}`;
  const html = `
    <div id="${id}">
      <div class="card" id="${id}-card">
        <div id="${id}-av">${cadeado(74, 'var(--acento)')}</div>
        <div id="${id}-name">${marca}</div>
        <div id="${id}-btn">${chamada}</div>
        <div id="${id}-btn2">${feito}</div>
      </div>
      <div class="ring" id="${id}-ring" data-layout-ignore></div>
      ${cursor(`${id}-cur`)}
    </div>`;
  const js = bloco(id, `
spring($('${id}-card'), ${r2(tEntrada)}, { y: 200, scale: 0.7, filter: 'blur(10px)' }, 0.6);
spring($('${id}-av'), ${r2(tEntrada + 0.12)}, { y: 60, scale: 0.3 }, 0.6);
gsap.set($('${id}-btn2'), { opacity: 0 });
tl.fromTo($('${id}-cur'), { x: 1150, y: 1300 }, { x: ${bx - 6}, y: ${by - 4}, duration: 0.45, ease: 'power3.out' }, ${r2(Math.max(0, tClique - 0.5))});
tl.to($('${id}-cur'), { scale: 0.85, duration: 0.06, yoyo: true, repeat: 1 }, ${r2(tClique)});
click($('${id}-ring'), ${r2(tClique + 0.03)});
tl.to($('${id}-btn'), { opacity: 0, scale: 0.9, duration: 0.12 }, ${r2(tClique + 0.05)});
tl.fromTo($('${id}-btn2'), { opacity: 0, scale: 1.2 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'elastic.out(1,0.5)', immediateRender: false }, ${r2(tClique + 0.05)});
tl.to($('${id}-cur'), { x: 1150, y: 1500, duration: 0.5, ease: 'power3.in' }, ${r2(tClique + 0.45)});`);
  return { css, html, js };
}
