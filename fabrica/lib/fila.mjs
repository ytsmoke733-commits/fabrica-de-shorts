import fs from 'node:fs';
import path from 'node:path';

export const ETAPAS = ['pauta', 'roteiro', 'cenas', 'revisao', 'render', 'entregue', 'aprovado', 'postado'];
const arquivo = (root) => path.join(root, 'fila.json');

export function lerFila(root) {
  const f = arquivo(root);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : [];
}

export function salvarFila(root, fila) {
  fs.writeFileSync(arquivo(root), JSON.stringify(fila, null, 1) + '\n');
}

export function adicionar(root, { id, marca, estilo, dir }) {
  const fila = lerFila(root);
  if (fila.some((v) => v.id === id)) throw new Error(`vídeo já está na fila: ${id}`);
  const item = { id, marca, estilo, dir, etapa: 'roteiro', atualizado: new Date().toISOString(), erro: null };
  fila.push(item);
  salvarFila(root, fila);
  return item;
}

export function mudarEtapa(root, id, etapa, erro = null) {
  if (!ETAPAS.includes(etapa)) throw new Error(`etapa inválida: ${etapa} (use: ${ETAPAS.join(', ')})`);
  const fila = lerFila(root);
  const v = fila.find((x) => x.id === id);
  if (!v) throw new Error(`vídeo não está na fila: ${id}`);
  Object.assign(v, { etapa, erro, atualizado: new Date().toISOString() });
  salvarFila(root, fila);
  return v;
}

export const prontosParaRender = (root) => lerFila(root).filter((v) => v.etapa === 'render');

export function resumoErro(erro) {
  const linhas = String(erro).split('\n');
  if (linhas[0].startsWith('checagem:')) { const u = linhas.find((l) => l.startsWith('- ')); if (u) return u.slice(2); }
  return linhas[0];
}
