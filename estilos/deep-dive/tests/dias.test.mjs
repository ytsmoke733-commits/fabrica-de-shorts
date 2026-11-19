import { test } from 'node:test'; import assert from 'node:assert/strict';
import { passagemDeDias, rotinaDaHora } from '../kit/dias.mjs';
test('rotina por faixa de hora', () => { assert.equal(rotinaDaHora(8), 'anda'); assert.equal(rotinaDaHora(18), 'senta'); assert.equal(rotinaDaHora(2), 'dorme'); assert.equal(rotinaDaHora(32), 'anda'); });
test('passagem de 2 dias começando às 8 h', () => {
  assert.deepEqual(passagemDeDias(0), { hora: 8, dia: 1, rotina: 'anda' });
  assert.equal(passagemDeDias(1).hora, 56); assert.equal(passagemDeDias(1).dia, 3);
  assert.equal(passagemDeDias(0.5, { dias: 1, horaInicio: 0 }).hora, 12);
});
