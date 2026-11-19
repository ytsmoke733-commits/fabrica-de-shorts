// Gera data/lines.json e data/words.json da vitrine a partir do script.json (sem voz: tempo sintético).
// Cada linha dura 2,5 s (start = 0,3 + 2,5·i); as palavras ficam igualmente espaçadas em [start, start + 2,2];
// duration = fim da última linha + 0,6.   Uso: node estilos/voxel/vitrine/gerar-dados.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const r3 = (x) => Math.round(x * 1000) / 1000;
const script = JSON.parse(fs.readFileSync(path.join(AQUI, 'script.json'), 'utf8'));
const lines = [], words = [];
script.lines.forEach((l, i) => {
  const start = 0.3 + 2.5 * i, end = start + 2.2, ws = l.text.trim().split(/\s+/), passo = (end - start) / ws.length;
  lines.push({ i, text: l.text, start: r3(start), end: r3(end) });
  ws.forEach((w, j) => words.push({ w, line: i, s: r3(start + j * passo), e: r3(start + (j + 1) * passo) }));
});
const duration = r3(lines[lines.length - 1].end + 0.6);
fs.mkdirSync(path.join(AQUI, 'data'), { recursive: true });
fs.writeFileSync(path.join(AQUI, 'data', 'lines.json'), JSON.stringify({ duration, lines }, null, 1));
fs.writeFileSync(path.join(AQUI, 'data', 'words.json'), JSON.stringify(words, null, 1));
console.log(`data/lines.json + data/words.json: ${lines.length} linhas, ${words.length} palavras, ${duration} s`);
