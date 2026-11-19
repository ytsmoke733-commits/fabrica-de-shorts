import fs from 'node:fs';
import path from 'node:path';

// caminhos relativos (com o separador do sistema) que nunca são copiados de um projeto
export const NAO_COPIAR = new Set([
  'data', 'renders', 'review', '.variantes', 'entrega', 'node_modules', 'check.json', 'check2.json',
  path.join('voz', 'data'), path.join('video', 'renders'), path.join('video', 'node_modules'),
]);

export function copiarProjeto(src, dst, rel = '') {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const r = path.join(rel, e.name);
    if (NAO_COPIAR.has(r)) continue;
    const a = path.join(src, e.name), b = path.join(dst, e.name);
    if (e.isDirectory()) copiarProjeto(a, b, r);
    else fs.copyFileSync(a, b);
  }
}
