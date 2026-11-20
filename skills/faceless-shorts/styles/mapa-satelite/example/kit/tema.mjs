// Tema do voxel: cores da legenda e do HUD (o mundo 3D tem paleta própria em mundo/*).
export const CORES = ['texto', 'destaque', 'contorno', 'hud', 'painel', 'perigo'];
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function validarTema(t) {
  const erros = [];
  if (!t || typeof t !== 'object' || !t.cores) return ['tema sem "cores"'];
  for (const c of CORES) {
    if (!(c in t.cores)) erros.push(`falta a cor "${c}"`);
    else if (!HEX.test(t.cores[c])) erros.push(`cor "${c}" inválida: ${t.cores[c]}`);
  }
  if (!t.fontes || !t.fontes.sans) erros.push('falta fontes.sans');
  return erros;
}

export async function carregarTema(url = 'tema.json') {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`faltou ${url}`);
  const t = await r.json();
  const erros = validarTema(t);
  if (erros.length) throw new Error('tema inválido:\n- ' + erros.join('\n- '));
  return t;
}

export function rgba(hex, a) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.replace(/./g, (m) => m + m);
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}
