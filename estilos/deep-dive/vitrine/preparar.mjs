// Monta a vitrine como se fosse um vídeo: copia o kit, o tema e a base do modelo para cá (tudo gitignored).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const AQUI = path.dirname(fileURLToPath(import.meta.url)), DEEP = path.join(AQUI, '..');
const cp = (de, para) => { fs.rmSync(para, { recursive: true, force: true }); fs.cpSync(de, para, { recursive: true }); };
cp(path.join(DEEP, 'kit'), path.join(AQUI, 'kit'));
for (const d of ['vendor', 'fonts', 'tools']) cp(path.join(DEEP, 'modelo', d), path.join(AQUI, d));
fs.copyFileSync(path.join(DEEP, 'modelo', 'index.html'), path.join(AQUI, 'index.html'));
fs.copyFileSync(path.join(DEEP, 'temas', 'tema.json'), path.join(AQUI, 'tema.json'));
await import('./gerar-dados.mjs');                                  // data/ é gitignored: gera lines.json + words.json + env.json
console.log('vitrine pronta');
