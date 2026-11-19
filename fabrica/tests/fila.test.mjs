import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ETAPAS, lerFila, adicionar, mudarEtapa, prontosParaRender } from '../lib/fila.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fab-'));

test('fila vazia quando não existe arquivo', () => {
  assert.deepEqual(lerFila(tmp()), []);
});

test('adicionar cria item em roteiro e recusa id repetido', () => {
  const root = tmp();
  const it = adicionar(root, { id: 'v1', marca: 'conhecimento', estilo: 'motion', dir: 'marcas/conhecimento/videos/v1' });
  assert.equal(it.etapa, 'roteiro');
  assert.equal(lerFila(root).length, 1);
  assert.throws(() => adicionar(root, { id: 'v1', marca: 'conhecimento', estilo: 'motion', dir: 'x' }), /já está na fila/);
});

test('mudarEtapa valida a etapa e guarda o erro', () => {
  const root = tmp();
  adicionar(root, { id: 'v1', marca: 'm', estilo: 'motion', dir: 'd' });
  assert.throws(() => mudarEtapa(root, 'v1', 'voando'), /etapa inválida/);
  assert.throws(() => mudarEtapa(root, 'nao', 'render'), /não está na fila/);
  const v = mudarEtapa(root, 'v1', 'render', 'falhou x');
  assert.equal(v.etapa, 'render');
  assert.equal(lerFila(root)[0].erro, 'falhou x');
});

test('prontosParaRender só devolve etapa render', () => {
  const root = tmp();
  adicionar(root, { id: 'a', marca: 'm', estilo: 'motion', dir: 'a' });
  adicionar(root, { id: 'b', marca: 'm', estilo: 'motion', dir: 'b' });
  mudarEtapa(root, 'b', 'render');
  assert.deepEqual(prontosParaRender(root).map((v) => v.id), ['b']);
  assert.deepEqual(ETAPAS, ['pauta', 'roteiro', 'cenas', 'revisao', 'render', 'entregue', 'aprovado', 'postado']);
});
