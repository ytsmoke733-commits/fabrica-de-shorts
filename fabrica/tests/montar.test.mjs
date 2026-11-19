import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { montarVideo } from '../lib/montar.mjs';
import { ESTILOS } from '../lib/estilos.mjs';

function raiz() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fab-m-'));
  const base = path.join(root, 'estilos', 'xpto');
  fs.mkdirSync(path.join(base, 'modelo', 'voz'), { recursive: true });
  fs.mkdirSync(path.join(base, 'kit'), { recursive: true });
  fs.mkdirSync(path.join(base, 'temas'), { recursive: true });
  fs.writeFileSync(path.join(base, 'modelo', 'voz', 'script.json'), '{"lines":[]}');
  fs.writeFileSync(path.join(base, 'modelo', 'gen.mjs'), '// gen');
  fs.writeFileSync(path.join(base, 'kit', 'tempo.mjs'), '// kit');
  fs.writeFileSync(path.join(base, 'temas', 'tema-a.json'), '{"nome":"a"}');
  return root;
}

test('montarVideo copia modelo, kit e tema', () => {
  const root = raiz();
  ESTILOS.__teste = { motor: 'hyperframes', modelo: 'estilos/xpto/modelo', kit: 'estilos/xpto/kit', tema: 'tema-a' };
  try {
    const dest = path.join(root, 'v');
    assert.deepEqual(montarVideo(root, '__teste', dest), { motor: 'hyperframes' });
    assert.ok(fs.existsSync(path.join(dest, 'gen.mjs')));
    assert.ok(fs.existsSync(path.join(dest, 'kit', 'tempo.mjs')));
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dest, 'tema.json'), 'utf8')), { nome: 'a' });
  } finally { delete ESTILOS.__teste; }
});

test('montarVideo sem kit/tema copia só o modelo', () => {
  const root = raiz();
  ESTILOS.__teste = { motor: 'fs3d', modelo: 'estilos/xpto/modelo' };
  try {
    const dest = path.join(root, 'v2');
    montarVideo(root, '__teste', dest);
    assert.ok(!fs.existsSync(path.join(dest, 'kit')));
    assert.ok(!fs.existsSync(path.join(dest, 'tema.json')));
  } finally { delete ESTILOS.__teste; }
});

test('montarVideo acusa tema inexistente', () => {
  const root = raiz();
  ESTILOS.__teste = { motor: 'hyperframes', modelo: 'estilos/xpto/modelo', kit: 'estilos/xpto/kit', tema: 'tema-z' };
  try {
    assert.throws(() => montarVideo(root, '__teste', path.join(root, 'v3')), /tema não encontrado/);
  } finally { delete ESTILOS.__teste; }
});
