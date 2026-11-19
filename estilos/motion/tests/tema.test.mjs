import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarTema, carregarTema, cssVars } from '../kit/tema.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

test('tema-a é válido e vira variáveis CSS', () => {
  const t = carregarTema(path.join(AQUI, '..', 'temas', 'tema-a.json'));
  assert.deepEqual(validarTema(t), []);
  const css = cssVars(t);
  assert.match(css, /--fundo:#150B24;/);
  assert.match(css, /--acento:#FFB020;/);
});

test('tema sem cor obrigatória é inválido', () => {
  const erros = validarTema({ nome: 'x', cores: { fundo: '#000' }, fontes: {} });
  assert.ok(erros.some((e) => e.includes('acento')));
});

test('cor com canal alfa (#rrggbbaa) ou com 4 dígitos é inválida', () => {
  const t = carregarTema(path.join(AQUI, '..', 'temas', 'tema-a.json'));
  for (const ruim of ['#ff00ff80', '#f0f8']) assert.ok(validarTema({ ...t, cores: { ...t.cores, acento: ruim } }).some((e) => e.includes('acento')), ruim);
  assert.deepEqual(validarTema({ ...t, cores: { ...t.cores, acento: '#f0f' } }), []);
});

const TEMAS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'temas');
test('tema B é válido, verde no acento e sem vermelho fora do perigo', () => {
  const b = carregarTema(path.join(TEMAS, 'tema-b.json'));
  assert.equal(b.cores.acento, '#3CFF7A');
  // vermelho só no perigo: alerta é âmbar e as bolinhas da janela são cinza/verde
  assert.equal(b.cores.alerta, '#F2C14E');
  assert.match(cssVars(b), /--janela1:#3B4743;--janela2:#3B4743;--janela3:#3CFF7A;/);
  assert.match(cssVars(b), /--cartao:#161C1B;/);
});
test('cores opcionais têm padrão igual ao visual do tema A', () => {
  const a = carregarTema(path.join(TEMAS, 'tema-a.json'));
  const css = cssVars(a);
  assert.match(css, /--cartao:#202329;/);
  assert.match(css, /--cartao2:#111317;/);
  assert.match(css, /--janela1:#FF4D6D;--janela2:#FF7A3C;--janela3:#FFB020;/);
});
test('cor opcional inválida é recusada', () => {
  const a = carregarTema(path.join(TEMAS, 'tema-a.json'));
  // validarTema devolve a lista de erros (não lança)
  const erros = validarTema({ ...a, cores: { ...a.cores, cartao: 'cinza' } });
  assert.ok(erros.some((e) => /cartao/.test(e)));
});
