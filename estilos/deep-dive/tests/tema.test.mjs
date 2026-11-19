import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validarTema, rgba, CORES } from '../kit/tema.mjs';

const TEMA = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'temas', 'tema.json'), 'utf8'));

test('tema do deep-dive é válido e traz as cores do v2', () => {
  assert.deepEqual(validarTema(TEMA), []);
  assert.deepEqual(CORES, ['texto', 'destaque', 'contorno', 'hud', 'painel', 'perigo']);
  assert.equal(TEMA.cores.contorno, '#111');
  assert.equal(TEMA.cores.destaque, '#FFD43B');
  assert.equal(TEMA.cores.hud, '#4FD1E8');
});

test('validarTema acusa cor faltando ou inválida', () => {
  const sem = { ...TEMA, cores: { ...TEMA.cores } }; delete sem.cores.hud;
  assert.ok(validarTema(sem).some((e) => e.includes('hud')));
  assert.ok(validarTema({ ...TEMA, cores: { ...TEMA.cores, texto: 'branco' } }).some((e) => e.includes('texto')));
});

test('rgba converte hex com alfa', () => {
  assert.equal(rgba('#09101E', 0.72), 'rgba(9,16,30,0.72)');
  assert.equal(rgba('#fff', 0.5), 'rgba(255,255,255,0.5)');
});
