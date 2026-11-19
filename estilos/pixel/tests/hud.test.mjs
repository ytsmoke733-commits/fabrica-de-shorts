import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chamadaDaPlataforma, tamanhoQueCabe, arroba, arrobaDoCartao, letrasVisiveis } from '../kit/hud.mjs';
import { larguraTexto } from '../kit/pixelfonte.mjs';

test('chamada do cartão final segue a variante da plataforma', () => {
  assert.deepEqual(chamadaDaPlataforma('Segue pra mais curiosidades.'), { botao: 'Seguir', feito: 'Seguindo ✓' });
  assert.deepEqual(chamadaDaPlataforma('Se inscreve pra mais curiosidades.'), { botao: 'Inscrever-se', feito: 'Inscrito ✓' });
  assert.deepEqual(chamadaDaPlataforma(undefined), { botao: 'Seguir', feito: 'Seguindo ✓' });
});

test('tamanhoQueCabe escolhe o maior pixel que cabe, sem passar do mínimo', () => {
  assert.equal(tamanhoQueCabe('CONHECIMENTO', 540), 6);
  const s = tamanhoQueCabe('CONHECIMENTO GERAL E CIÊNCIA', 540);
  assert.ok(s < 6 && larguraTexto('CONHECIMENTO GERAL E CIÊNCIA', s) <= 540);
  assert.equal(tamanhoQueCabe('X'.repeat(400), 540), 3);
});

test('arroba tira acento, espaço e maiúscula', () => {
  assert.equal(arroba('Conhecimento Geral'), '@conhecimentogeral');
  assert.equal(arroba('Super Invenções'), '@superinvencoes');
});

test('letrasVisiveis datilografa o valor e completa antes do fim da entrada', () => {
  assert.equal(letrasVisiveis('2,45 GHZ', 0), 0);
  assert.equal(letrasVisiveis('2,45 GHZ', 0.3), 4);
  assert.equal(letrasVisiveis('2,45 GHZ', 0.7), 8);
  assert.equal(letrasVisiveis('2,45 GHZ', 1), 8);
});

test('arrobaDoCartao usa o @ do perfil quando existe; senão deriva do nome', () => {
  assert.equal(arrobaDoCartao('Meu Canal', '@meucanal'), '@meucanal');
  assert.equal(arrobaDoCartao('Meu Canal', 'meucanal'), '@meucanal');
  assert.equal(arrobaDoCartao('Meu Canal'), '@meucanal');
  assert.equal(arrobaDoCartao('Meu Canal', ''), '@meucanal');
});
