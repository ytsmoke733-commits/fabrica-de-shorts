import fs from 'node:fs';
import path from 'node:path';

const PULAR = new Set(['node_modules', 'vendor', '.variantes', 'data', 'renders', 'review', 'entrega', '.hyperframes']);
const EXT = /\.(m?js|html)$/;
const REF = /(?:from\s*|import\s*\(\s*|import\s+|src\s*=\s*)["']([^"']+)["']/g;

export function checarIsolamento(dir) {
  const erros = [];
  (function andar(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!PULAR.has(e.name)) andar(path.join(d, e.name)); continue; }
      if (!EXT.test(e.name)) continue;
      const f = path.join(d, e.name), txt = fs.readFileSync(f, 'utf8');
      for (const m of txt.matchAll(REF)) if (/estilos[\\/]/.test(m[1])) erros.push(`${path.relative(dir, f)}: importa de fora do vídeo (${m[1]}) — use ./kit/`);
    }
  })(dir);
  return erros;
}
