// Monta a vitrine do pixel como se fosse um vídeo: copia o kit, o tema, a base do modelo (vendor, tools, index.html)
// e o main.js do modelo para cá (tudo gitignored), e gera data/ com tempo sintético.
// Uso: node estilos/pixel/vitrine/preparar.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const AQUI = path.dirname(fileURLToPath(import.meta.url)), PIXEL = path.join(AQUI, '..');
const cp = (de, para) => { fs.rmSync(para, { recursive: true, force: true }); fs.cpSync(de, para, { recursive: true }); };
cp(path.join(PIXEL, 'kit'), path.join(AQUI, 'kit'));
for (const d of ['vendor', 'tools']) cp(path.join(PIXEL, 'modelo', d), path.join(AQUI, d));
fs.copyFileSync(path.join(PIXEL, 'modelo', 'index.html'), path.join(AQUI, 'index.html'));
fs.copyFileSync(path.join(PIXEL, 'temas', 'tema.json'), path.join(AQUI, 'tema.json'));
fs.mkdirSync(path.join(AQUI, 'src'), { recursive: true });
fs.copyFileSync(path.join(PIXEL, 'modelo', 'src', 'main.js'), path.join(AQUI, 'src', 'main.js'));   // src/cenas.js é o da vitrine
await import('./gerar-dados.mjs');                                  // data/ é gitignored: gera lines.json + words.json
console.log('vitrine pronta');
