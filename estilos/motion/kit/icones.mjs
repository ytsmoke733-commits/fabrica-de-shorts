// Ícones SVG próprios do kit motion. Cores são strings CSS, normalmente var(--...) do tema.
// cursor/cadeado/olho extraídos de teste-motion-v2/gen.mjs (84-93); coração, check e raio são novos.

export const cursor = (id) => `<svg class="cursor" id="${id}" viewBox="0 0 70 84" data-layout-ignore><path d="M6 4 L6 66 L22 52 L33 78 L45 73 L34 48 L56 48 Z" style="fill:var(--texto);stroke:var(--fundo)" stroke-width="5" stroke-linejoin="round"/></svg>`;

export const cadeado = (tam, cor, aberto = false) => `<svg viewBox="0 0 100 120" width="${tam}" height="${tam * 1.2}"><path d="M28 54 V36 a22 22 0 0 1 44 0 ${aberto ? 'V22' : 'V54'}" fill="none" style="stroke:${cor}" stroke-width="11" stroke-linecap="round"/><rect x="12" y="52" width="76" height="62" rx="14" style="fill:${cor}"/><circle cx="50" cy="80" r="8" style="fill:var(--fundo)"/><rect x="46" y="82" width="8" height="16" rx="3" style="fill:var(--fundo)"/></svg>`;

export const olho = (aberto, cor) => aberto
  ? `<svg viewBox="0 0 60 40" width="66" height="44"><path d="M4 20 Q30 -6 56 20 Q30 46 4 20 Z" fill="none" style="stroke:${cor}" stroke-width="5"/><circle cx="30" cy="20" r="9" style="fill:${cor}"/></svg>`
  : `<svg viewBox="0 0 60 40" width="66" height="44"><path d="M4 20 Q30 -6 56 20 Q30 46 4 20 Z" fill="none" style="stroke:${cor}" stroke-width="5"/><circle cx="30" cy="20" r="8" style="fill:${cor}"/><line x1="8" y1="36" x2="52" y2="4" style="stroke:${cor}" stroke-width="5" stroke-linecap="round"/></svg>`;

export const coracao = (tam, cor) => `<svg viewBox="0 0 100 90" width="${tam}" height="${tam * 0.9}"><path d="M50 84 C14 58 4 38 4 26 C4 12 15 4 27 4 C37 4 46 10 50 19 C54 10 63 4 73 4 C85 4 96 12 96 26 C96 38 86 58 50 84 Z" style="fill:${cor}"/></svg>`;

export const check = (tam, cor) => `<svg viewBox="0 0 100 100" width="${tam}" height="${tam}"><path d="M16 54 L40 78 L86 24" fill="none" style="stroke:${cor}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const raio = (tam, cor) => `<svg viewBox="0 0 80 110" width="${tam * 0.73}" height="${tam}"><path d="M48 4 L8 62 H36 L28 106 L72 44 H44 Z" style="fill:${cor}" stroke-linejoin="round"/></svg>`;
