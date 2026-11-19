import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MESES, dataCurta, letrasVisiveis, datilografar, cursorAceso } from '../kit/datilografia.mjs';

test('dataCurta formata dia com 2 dígitos e mês abreviado', () => {
  assert.equal(dataCurta(2017, 5, 12), '12 MAI 2017');
  assert.equal(dataCurta(2000, 5, 4), '04 MAI 2000');
  assert.equal(MESES.length, 12);
});
test('dataCurta lança erro fora da faixa', () => {
  assert.throws(() => dataCurta(2017, 13, 1));
  assert.throws(() => dataCurta(2017, 0, 1));
  assert.throws(() => dataCurta(2017, 5, 32));
});
test('datilografar revela letras conforme p', () => {
  assert.equal(datilografar('ABC', 0), '');
  assert.equal(datilografar('ABC', 0.5), 'A');
  assert.equal(datilografar('ABC', 1), 'ABC');
  assert.equal(datilografar('ABC', 2), 'ABC');
  assert.equal(letrasVisiveis(-1, 10), 0);
});
test('cursorAceso pisca a 2,5 Hz', () => {
  assert.equal(cursorAceso(0), true);
  assert.equal(cursorAceso(0.4), false);
  assert.equal(cursorAceso(0.8), true);
});
