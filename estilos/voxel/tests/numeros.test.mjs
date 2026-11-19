import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerNumero, formatarNumeroLegenda } from '../kit/numeros.mjs';

const ws = (s) => s.split(' ');

test('lerNumero: números por extenso simples e compostos', () => {
  assert.deepEqual(lerNumero(ws('sete anos'), 0), { valor: 7, n: 1 });
  assert.deepEqual(lerNumero(ws('cem mil vezes'), 0), { valor: 100000, n: 2 });
  assert.deepEqual(lerNumero(ws('mais de trinta e seis milhões por ano'), 2), { valor: 36000000, n: 4 });
  assert.deepEqual(lerNumero(ws('dois mil e vinte e quatro'), 0), { valor: 2024, n: 6 });
  assert.deepEqual(lerNumero(ws('mil e quinhentos metros'), 0), { valor: 1500, n: 3 });
  assert.deepEqual(lerNumero(ws('trinta e seis milhões e quinhentos mil'), 0), { valor: 36500000, n: 7 });
  assert.deepEqual(lerNumero(ws('Três, dois, um'), 0), { valor: 3, n: 1 });
});

test('lerNumero: "e" no fim não entra; palavra comum não é número', () => {
  assert.deepEqual(lerNumero(ws('seis e meia'), 0), { valor: 6, n: 1 });
  assert.equal(lerNumero(ws('bate forte'), 0), null);
});

test('lerNumero: "um/uma" sozinho é artigo, a menos que permitido; com escala é número', () => {
  assert.equal(lerNumero(ws('um dia de folga'), 0), null);
  assert.deepEqual(lerNumero(ws('um dia de folga'), 0, { um: true }), { valor: 1, n: 1 });
  assert.deepEqual(lerNumero(ws('um milhão de pessoas'), 0), { valor: 1000000, n: 2 });
});

test('lerNumero: algarismos no texto (com escala, ponto de milhar e vírgula decimal)', () => {
  assert.deepEqual(lerNumero(ws('100 mil vezes'), 0), { valor: 100000, n: 2 });
  assert.deepEqual(lerNumero(ws('1.500 metros'), 0), { valor: 1500, n: 1 });
  assert.deepEqual(lerNumero(ws('36,5 milhões.'), 0), { valor: 36500000, n: 2 });
  assert.deepEqual(lerNumero(ws('7'), 0), { valor: 7, n: 1 });
});

test('formatarNumeroLegenda: algarismos no estilo brasileiro', () => {
  assert.deepEqual(formatarNumeroLegenda(7), ['7']);
  assert.deepEqual(formatarNumeroLegenda(2024), ['2024']);
  assert.deepEqual(formatarNumeroLegenda(100000), ['100', 'mil']);
  assert.deepEqual(formatarNumeroLegenda(12345), ['12.345']);
  assert.deepEqual(formatarNumeroLegenda(36000000), ['36', 'milhões']);
  assert.deepEqual(formatarNumeroLegenda(36500000), ['36,5', 'milhões']);
  assert.deepEqual(formatarNumeroLegenda(1000000), ['1', 'milhão']);
  assert.deepEqual(formatarNumeroLegenda(1500000), ['1,5', 'milhão']);
  assert.deepEqual(formatarNumeroLegenda(2000000000), ['2', 'bilhões']);
  assert.deepEqual(formatarNumeroLegenda(1234567), ['1.234.567']);
});

test('lerNumero: escala no plural sem número antes é palavra', () => {
  assert.equal(lerNumero(ws('testa milhões de senhas'), 1), null);
  assert.equal(lerNumero(ws('bilhões de pessoas'), 0), null);
  assert.deepEqual(lerNumero(ws('mil vezes'), 0), { valor: 1000, n: 1 });
  assert.deepEqual(lerNumero(ws('dois milhões'), 0), { valor: 2000000, n: 2 });
});

test('lerNumero: "e" só junta ordem menor (dois e três são dois números)', () => {
  assert.deepEqual(lerNumero(ws('dois e três meses'), 0), { valor: 2, n: 1 });
  assert.deepEqual(lerNumero(ws('vinte e três'), 0), { valor: 23, n: 3 });
  assert.deepEqual(lerNumero(ws('cento e dois'), 0), { valor: 102, n: 3 });
  assert.deepEqual(lerNumero(ws('trezentos e quarenta'), 0), { valor: 340, n: 3 });
  assert.deepEqual(lerNumero(ws('onze e três'), 0), { valor: 11, n: 1 });
  assert.deepEqual(lerNumero(ws('dois milhões e trezentos mil'), 0), { valor: 2300000, n: 5 });
  assert.deepEqual(lerNumero(ws('vinte e trinta'), 0), { valor: 20, n: 1 });
});

test('lerNumero: "por cento" depois do número marca pct', () => {
  assert.deepEqual(lerNumero(ws('cinquenta por cento dos casos'), 0), { valor: 50, n: 3, pct: true });
  assert.deepEqual(lerNumero(ws('50% dos casos'), 0), { valor: 50, n: 1 });
});
