import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validarMarca, carregarMarca, plataformasDaMarca } from '../lib/marca.mjs';

const BOA = { id: 'x', nome: 'X', nicho: 'n', perfis: { tiktok: '@a', youtube: '@b' }, estilos: ['motion'], voz: 'pm_alex', proibido: [] };

test('marca completa não tem erros', () => {
  assert.deepEqual(validarMarca(BOA), []);
});

test('marca sem estilos e sem voz acusa os dois campos', () => {
  const { estilos, voz, ...resto } = BOA;
  const erros = validarMarca(resto);
  assert.ok(erros.some((e) => e.includes('estilos')));
  assert.ok(erros.some((e) => e.includes('voz')));
});

test('estilos vazio é inválido', () => {
  assert.ok(validarMarca({ ...BOA, estilos: [] }).some((e) => e.includes('estilos')));
});

test('perfis null é inválido', () => {
  assert.ok(validarMarca({ ...BOA, perfis: null }).some((e) => e.includes('perfis')));
});

test('plataformas seguem os perfis', () => {
  assert.deepEqual(plataformasDaMarca(BOA), ['tiktok', 'shorts']);
  assert.deepEqual(plataformasDaMarca({ ...BOA, perfis: { tiktok: '@a', instagram: '@i', youtube: '@y' } }), ['tiktok', 'reels', 'shorts']);
});

test('carregarMarca lê do disco e rejeita marca inválida', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fab-'));
  fs.mkdirSync(path.join(root, 'marcas', 'x'), { recursive: true });
  fs.writeFileSync(path.join(root, 'marcas', 'x', 'marca.json'), JSON.stringify(BOA));
  assert.equal(carregarMarca(root, 'x').nome, 'X');
  fs.writeFileSync(path.join(root, 'marcas', 'x', 'marca.json'), JSON.stringify({ id: 'x' }));
  assert.throws(() => carregarMarca(root, 'x'), /inválida/);
  assert.throws(() => carregarMarca(root, 'nao-existe'), /não encontrada/);
});
