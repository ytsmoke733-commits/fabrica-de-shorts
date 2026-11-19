import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resumoErro } from '../lib/fila.mjs';

test('resumo de erro de checagem mostra a primeira linha útil', () => {
  assert.equal(resumoErro('checagem:\n- falta "gancho"\n- outra'), 'falta "gancho"');
});
test('resumo de outro erro mostra a primeira linha', () => {
  assert.equal(resumoErro('falhou: x\ndetalhe'), 'falhou: x');
});
