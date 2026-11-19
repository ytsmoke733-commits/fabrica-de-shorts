import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chamadaDaPlataforma, comCameraLenta, fmt, escalaQueCabe } from '../kit/hud.mjs';

test('chamada do cartão final segue a variante da plataforma', () => {
  assert.deepEqual(chamadaDaPlataforma('Segue pra mais curiosidades.'), { botao: 'Seguir', feito: 'Seguindo ✓' });
  assert.deepEqual(chamadaDaPlataforma('Se inscreve pra mais curiosidades.'), { botao: 'Inscrever-se', feito: 'Inscrito ✓' });
});

test('comCameraLenta desacelera o tempo local e desenha a etiqueta', () => {
  const vistos = [], etiquetas = [];
  const draw = comCameraLenta((lt, d, t) => vistos.push([lt, d, t]), { fator: 0.5, etiqueta: (k, t) => etiquetas.push([k, t]) });
  draw(1, 3, 10, () => {});
  assert.deepEqual(vistos, [[0.5, 1.5, 10]]);
  assert.deepEqual(etiquetas, [[1, 10]]);
});

test('fmt usa ponto de milhar', () => { assert.equal(fmt(1670), '1.670'); assert.equal(fmt(36500000), '36.500.000'); });

test('escalaQueCabe encolhe só texto mais largo que o espaço (nome da marca no cartão final)', () => {
  assert.equal(escalaQueCabe(400, 566), 1);
  assert.equal(escalaQueCabe(566, 566), 1);
  assert.ok(Math.abs(escalaQueCabe(620, 566) - 566 / 620) < 1e-9);
  assert.equal(escalaQueCabe(0, 566), 1);
});
