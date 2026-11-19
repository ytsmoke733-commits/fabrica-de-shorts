import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checarIsolamento } from '../lib/isolamento.mjs';

function video(arquivos) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fab-i-'));
  for (const [rel, txt] of Object.entries(arquivos)) { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), txt); }
  return dir;
}

test('vídeo que só importa de ./kit passa', () => {
  const dir = video({ 'gen.mjs': "import { criarTempo } from './kit/tempo.mjs';", 'src/shots.js': "import * as K from './core/kit.js';" });
  assert.deepEqual(checarIsolamento(dir), []);
});

test('import de estilos/ é acusado, com o arquivo', () => {
  const dir = video({ 'gen.mjs': "import { x } from '../../../estilos/voxel/kit/voxel.mjs';" });
  const erros = checarIsolamento(dir);
  assert.equal(erros.length, 1);
  assert.match(erros[0], /gen\.mjs: importa de fora do vídeo/);
});

test('node_modules e vendor são ignorados', () => {
  const dir = video({ 'node_modules/a/i.js': "import 'estilos/x';", 'vendor/b.js': "import 'estilos/y';" });
  assert.deepEqual(checarIsolamento(dir), []);
});

test('import com separador do Windows também é acusado', () => {
  const dir = video({ 'gen.mjs': "import x from '..\\..\\estilos\\voxel\\kit.mjs';" });
  const erros = checarIsolamento(dir);
  assert.equal(erros.length, 1);
  assert.match(erros[0], /gen\.mjs: importa de fora do vídeo/);
});
