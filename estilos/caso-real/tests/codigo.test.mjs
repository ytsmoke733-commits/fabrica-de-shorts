import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TERMOS_PROIBIDOS, VOCABULARIO, linhasDeCodigo, alertaGenerico } from '../kit/codigo.mjs';

const proibida = (s) => TERMOS_PROIBIDOS.some((r) => r.test(s));

test('linhasDeCodigo é determinístico por semente', () => {
  assert.deepEqual(linhasDeCodigo(7, 12), linhasDeCodigo(7, 12));
  assert.notDeepEqual(linhasDeCodigo(7, 12), linhasDeCodigo(8, 12));
  assert.equal(linhasDeCodigo(7, 12).length, 12);
});
test('vocabulário tem cerca de 40 linhas e todas vêm do vocabulário', () => {
  assert.ok(VOCABULARIO.length >= 36 && VOCABULARIO.length <= 46);
  for (const l of linhasDeCodigo(3, 30)) assert.ok(VOCABULARIO.includes(l));
});
test('nenhuma linha do vocabulário nem alerta casa com termos proibidos', () => {
  for (const l of VOCABULARIO) assert.ok(!proibida(l), l);
  for (const t of ['bloqueado', 'invasao', 'ok']) for (const l of alertaGenerico(t)) assert.ok(!proibida(l), l);
});
test('o próprio filtro pega termos perigosos', () => {
  assert.ok(proibida('rm -rf /'));
  assert.ok(proibida('DROP TABLE x'));
  assert.ok(proibida('curl http://x'));
  assert.ok(proibida('0xdeadbeef01'));
});
test('alertaGenerico devolve os textos fixos', () => {
  assert.deepEqual(alertaGenerico('bloqueado'), ['SEUS ARQUIVOS FORAM BLOQUEADOS', 'acesso negado']);
  assert.deepEqual(alertaGenerico('invasao'), ['ACESSO NÃO AUTORIZADO', 'registro salvo']);
  assert.deepEqual(alertaGenerico('ok'), ['SISTEMA ATUALIZADO', 'tudo certo']);
});
