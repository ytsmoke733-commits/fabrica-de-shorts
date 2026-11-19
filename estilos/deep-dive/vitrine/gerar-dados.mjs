// Gera data/lines.json, data/words.json e data/env.json da vitrine a partir do script.json (sem voz: tempo sintético).
// Cada linha dura 2,5 s (start = 0,3 + 2,5·i); as palavras ficam igualmente espaçadas em [start, start + 2,2];
// duration = fim da última linha + 0,6. env.json (lip sync, 100 Hz) é um seno de sílabas (~5 por segundo) enquanto
// alguma linha é falada e 0 nas pausas, para a boca falar na vitrine.   Uso: node estilos/deep-dive/vitrine/gerar-dados.mjs
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
const HZ = 100, falando = (t) => lines.some((l) => t >= l.start && t <= l.end);
const v = Array.from({ length: Math.ceil(duration * HZ) + 1 }, (_, i) => { const t = i / HZ; return falando(t) ? r3(Math.abs(Math.sin(Math.PI * 5.2 * t))) : 0; });
fs.mkdirSync(path.join(AQUI, 'data'), { recursive: true });
fs.writeFileSync(path.join(AQUI, 'data', 'lines.json'), JSON.stringify({ duration, lines }, null, 1));
fs.writeFileSync(path.join(AQUI, 'data', 'words.json'), JSON.stringify(words, null, 1));
fs.writeFileSync(path.join(AQUI, 'data', 'env.json'), JSON.stringify({ hz: HZ, v }));
console.log(`data/lines.json + words.json + env.json: ${lines.length} linhas, ${words.length} palavras, ${duration} s`);
