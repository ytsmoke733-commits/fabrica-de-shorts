// Camadas de texto comuns do kit motion: pílula de dado (topo), manchete com palavra destacada,
// etiqueta "CÂMERA LENTA". Cada função devolve { css, html, js }; tempos absolutos na cena; cores por var(--...).
const r2 = (x) => Math.round(x * 1000) / 1000;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function pilula({ id, texto, tEntrada, tSaida, y = 150 }) {
  const fim = tSaida ?? tEntrada + 3;
  const piscadas = Math.max(0, Math.floor((fim - tEntrada) / 0.5) - 1);
  const css = `
#${id}{position:absolute;left:0;top:${y}px;width:1080px;display:flex;justify-content:center}
#${id}-p{display:inline-flex;align-items:center;gap:18px;padding:18px 34px;border-radius:999px;background:color-mix(in srgb,var(--fundo2) 88%,transparent);border:2px solid color-mix(in srgb,var(--acento) 45%,transparent);font:700 34px/1 var(--mono),monospace;letter-spacing:.08em;color:var(--texto);text-transform:uppercase;box-shadow:0 20px 60px rgba(0,0,0,.45)}
#${id}-dot{display:block;width:16px;height:16px;border-radius:50%;background:var(--acento);box-shadow:0 0 18px var(--acento)}`;
  const html = `
    <div id="${id}"><div id="${id}-p"><i id="${id}-dot"></i><span id="${id}-t">${esc(texto)}</span></div></div>`;
  const js = `
tl.fromTo('#${id}-p', { opacity: 0, y: -40, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.8)' }, ${r2(tEntrada)});
${piscadas ? `tl.fromTo('#${id}-dot', { opacity: 1 }, { opacity: 0.25, duration: 0.5, repeat: ${piscadas}, yoyo: true, ease: 'none' }, ${r2(tEntrada + 0.45)});` : ''}
${tSaida != null ? `tl.to('#${id}-p', { opacity: 0, y: -30, duration: 0.3, ease: 'power2.in' }, ${r2(tSaida)});` : ''}`;
  return { css, html, js };
}

export function manchete({ id, texto, tEntrada, y = 330, tamanho = 104 }) {
  const ws = String(texto).trim().split(/\s+/);
  if (ws.filter((w) => w.startsWith('*')).length !== 1) throw new Error(`manchete "${texto}": marque exatamente uma palavra com *`);
  const k0 = ws.findIndex((w) => w.startsWith('*'));
  const css = `
#${id}{position:absolute;left:60px;top:${y}px;width:960px;display:flex;flex-wrap:wrap;justify-content:center;align-items:baseline;gap:0 ${Math.round(tamanho * 0.26)}px}
.${id}-w{position:relative;isolation:isolate;display:inline-block;font:800 ${tamanho}px/1.08 var(--sans),sans-serif;letter-spacing:-.03em;color:var(--texto)}
.${id}-key{font:italic 700 ${Math.round(tamanho * 1.12)}px/1.08 var(--serif),serif;letter-spacing:-.01em;color:var(--acento);text-shadow:0 0 34px color-mix(in srgb,var(--acento) 35%,transparent)}
#${id}-mark{position:absolute;left:-.08em;right:-.08em;bottom:.08em;height:.32em;border-radius:6px;background:color-mix(in srgb,var(--acento) 22%,transparent);transform-origin:0 50%;z-index:-1}`;
  const html = `
    <div id="${id}">${ws.map((w, k) => (k === k0
    ? `<span class="${id}-w ${id}-key" id="${id}-w${k}">${esc(w.slice(1))}<i id="${id}-mark"></i></span>`
    : `<span class="${id}-w" id="${id}-w${k}">${esc(w)}</span>`)).join('')}</div>`;
  const js = `
${ws.map((_, k) => `tl.fromTo('#${id}-w${k}', { opacity: 0, y: 50, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'back.out(1.8)' }, ${r2(tEntrada + k * 0.06)});`).join('\n')}
tl.fromTo('#${id}-mark', { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'expo.out' }, ${r2(tEntrada + k0 * 0.06 + 0.25)});`;
  return { css, html, js };
}

export function etiqueta({ id, texto = 'CÂMERA LENTA', tEntrada, tSaida, x = 60, y = 150 }) {
  const css = `
#${id}{position:absolute;left:${x}px;top:${y}px;display:flex;align-items:center;gap:16px;padding:14px 24px;border-radius:14px;background:color-mix(in srgb,var(--fundo) 80%,transparent);border:2px solid color-mix(in srgb,var(--texto) 30%,transparent);font:700 30px/1 var(--mono),monospace;letter-spacing:.16em;color:var(--texto)}
#${id}-x{color:var(--acento);letter-spacing:.04em}`;
  const html = `
    <div id="${id}" data-layout-ignore><span id="${id}-t" style="display:inline-block">${esc(texto)}</span><span id="${id}-x">0,25×</span></div>`;
  const js = `
tl.fromTo('#${id}', { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }, ${r2(tEntrada)});
tl.fromTo('#${id}-t', { x: -14 }, { x: 0, duration: 0.8, ease: 'power2.out' }, ${r2(tEntrada)});
${tSaida != null ? `tl.to('#${id}', { opacity: 0, duration: 0.25 }, ${r2(tSaida)});` : ''}`;
  return { css, html, js };
}
