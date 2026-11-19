import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepararVariante, passos, renderizarVariante } from '../lib/render.mjs';

function projeto(motor) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fab-v-'));
  const script = { lang: 'pt', lines: [{ text: 'a' }, { text: 'b', caps: '*b', variantes: {
    tiktok: { text: 'segue', caps: '*segue' }, shorts: { text: 'se inscreve', caps: 'se *inscreve' } } }] };
  const sp = motor === 'fs3d' ? path.join(dir, 'script.json') : path.join(dir, 'voz', 'script.json');
  fs.mkdirSync(path.dirname(sp), { recursive: true });
  fs.writeFileSync(sp, JSON.stringify(script));
  fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'data', 'velho.wav'), 'x');
  return { dir, sp };
}

test('prepararVariante troca só a última linha e não copia data/', () => {
  const { dir } = projeto('fs3d');
  const work = prepararVariante(dir, 'fs3d', 'shorts');
  const s = JSON.parse(fs.readFileSync(path.join(work, 'script.json'), 'utf8'));
  assert.equal(s.lines[0].text, 'a');
  assert.deepEqual(s.lines[1], { text: 'se inscreve', caps: 'se *inscreve' });
  assert.ok(!fs.existsSync(path.join(work, 'data')));
  assert.ok(work.endsWith(path.join('.variantes', 'shorts')));
});

const nomes = (ps) => ps.map((p) => p.args?.[0]?.split(/[\\/]/).pop() ?? 'copiar');

test('prepararVariante sem caps na variante remove caps da linha', () => {
  const { dir, sp } = projeto('fs3d');
  const s = JSON.parse(fs.readFileSync(sp, 'utf8'));
  s.lines[1].variantes.tiktok = { text: 'segue' };
  fs.writeFileSync(sp, JSON.stringify(s));
  const work = prepararVariante(dir, 'fs3d', 'tiktok');
  const r = JSON.parse(fs.readFileSync(path.join(work, 'script.json'), 'utf8'));
  assert.deepEqual(r.lines[1], { text: 'segue' });
});

test('passos fs3d inclui env.py só quando tools/env.py existe', () => {
  const com = fs.mkdtempSync(path.join(os.tmpdir(), 'fab-e-'));
  fs.mkdirSync(path.join(com, 'tools'), { recursive: true });
  fs.writeFileSync(path.join(com, 'tools', 'env.py'), '');
  assert.deepEqual(nomes(passos('fs3d', com, 'OUT.mp4')), ['voice.py', 'words.py', 'env.py', 'capture.mjs', 'capture.mjs', 'mix.py', 'capture.mjs']);
  const sem = fs.mkdtempSync(path.join(os.tmpdir(), 'fab-e-'));
  assert.deepEqual(nomes(passos('fs3d', sem, 'OUT.mp4')), ['voice.py', 'words.py', 'capture.mjs', 'capture.mjs', 'mix.py', 'capture.mjs']);
});

test('passos hyperframes e motor desconhecido', () => {
  const h = passos('hyperframes', 'W', 'OUT.mp4');
  assert.equal(h.at(-1).cmd, 'hyperframes');
  assert.ok(h.some((p) => p.copiar));
  assert.throws(() => passos('outro', 'W', 'O'), /motor desconhecido/);
});

test('renderizarVariante roda os passos e falha com mensagem quando um passo falha', async () => {
  const { dir } = projeto('fs3d');
  const chamadas = [];
  const ok = async (cmd, args) => { chamadas.push(args.join(' ')); return { code: 0, out: args.includes('check') ? 'CHECK OK' : '' }; };
  const saida = await renderizarVariante(dir, 'fs3d', 'tiktok', ok);
  assert.equal(saida, path.join(dir, 'entrega', 'tiktok.mp4'));
  assert.equal(chamadas.length, 6); // projeto de teste não tem tools/env.py
  const semCheck = async (cmd, args) => ({ code: 0, out: '' });
  await assert.rejects(renderizarVariante(dir, 'fs3d', 'tiktok', semCheck), /CHECK OK/);
  const quebra = async () => ({ code: 1, out: 'erro feio' });
  await assert.rejects(renderizarVariante(dir, 'fs3d', 'tiktok', quebra), /falhou: .*erro feio/s);
});
