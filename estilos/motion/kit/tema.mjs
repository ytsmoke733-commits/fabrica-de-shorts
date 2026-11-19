import fs from 'node:fs';

export const CORES_OBRIGATORIAS = ['fundo', 'fundo2', 'texto', 'apagado', 'fraco', 'acento', 'perigo', 'alerta', 'destaque'];

// Opcionais: padrão = visual original do kit (cartão cinza, bolinhas vermelha/laranja/acento)
export const CORES_OPCIONAIS = {
  cartao: () => '#202329', cartao2: () => '#111317',
  janela1: (c) => c.perigo, janela2: (c) => c.alerta, janela3: (c) => c.acento,
};
const COR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const opcional = (t, nome) => t.cores[nome] || CORES_OPCIONAIS[nome](t.cores);

export function validarTema(t) {
  const erros = [];
  if (!t || typeof t !== 'object') return ['tema deve ser um objeto'];
  if (!t.cores || typeof t.cores !== 'object') return ['tema sem "cores"'];
  for (const c of CORES_OBRIGATORIAS) if (!COR_RE.test(t.cores[c] || '')) erros.push(`cor ausente ou inválida: ${c}`);
  for (const c of Object.keys(CORES_OPCIONAIS)) if (t.cores[c] !== undefined && !COR_RE.test(t.cores[c])) erros.push(`cor "${c}" inválida: ${t.cores[c]}`);
  if (!t.fontes || !t.fontes.sans || !t.fontes.serif) erros.push('fontes.sans e fontes.serif são obrigatórias');
  return erros;
}

export function carregarTema(arquivo) {
  const t = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  const erros = validarTema(t);
  if (erros.length) throw new Error(`tema inválido: ${erros.join('; ')}`);
  return t;
}

export const cssVars = (t) => CORES_OBRIGATORIAS.map((c) => `--${c}:${t.cores[c]};`).join('')
  + Object.keys(CORES_OPCIONAIS).map((c) => `--${c}:${opcional(t, c)};`).join('')
  + `--sans:'${t.fontes.sans}';--serif:'${t.fontes.serif}';--mono:'${t.fontes.mono || 'monospace'}';`;
