import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerNumero as lerFabrica } from '../lib/numeros.mjs';
import { lerNumero as lerKit } from '../../estilos/motion/kit/numeros.mjs';
import { lerNumero as lerVoxel } from '../../estilos/voxel/kit/numeros.mjs';
import { lerNumero as lerPixel } from '../../estilos/pixel/kit/numeros.mjs';

// A fábrica (checar) e os kits motion, voxel e pixel (legendas) precisam ler os números do mesmo jeito.
const FRASES = [
  'Três, dois, um.',
  'Conta um dois três.',
  'Dez, onze e doze.',
  'Às dez uma pessoa ligou.',
  'dois e três',
  'vinte e três',
  'cento e vinte e três',
  'mil e quinhentos',
  'dois mil e vinte e quatro',
  'trinta e seis milhões e quinhentos mil',
  'testa milhões de senhas',
  'cinquenta por cento dos',
  'cinquenta, por cento dos',
  'um dia',
  'um milhão',
  'uma pessoa ligou',
  'cem mil vezes',
  'vinte e um anos',
  'mil',
  'dois milhões e meio',
  'zero e um',
  'cento e cem',
  'gira a mil seiscentos e setenta quilômetros por hora.',
];

for (const frase of FRASES) {
  test(`lerNumero igual nos kits motion/voxel/pixel e na fábrica: "${frase}"`, () => {
    const ws = frase.split(/\s+/);
    for (let k = 0; k < ws.length; k++) {
      for (const op of [undefined, { um: true }]) {
        assert.deepEqual(lerFabrica(ws, k, op), lerKit(ws, k, op), `motion, posição ${k}, opções ${JSON.stringify(op)}`);
        assert.deepEqual(lerFabrica(ws, k, op), lerVoxel(ws, k, op), `voxel, posição ${k}, opções ${JSON.stringify(op)}`);
        assert.deepEqual(lerFabrica(ws, k, op), lerPixel(ws, k, op), `pixel, posição ${k}, opções ${JSON.stringify(op)}`);
      }
    }
  });
}

test('algarismos também iguais', () => {
  for (const ws of [['36', 'milhões'], ['3,'], ['100', 'mil'], ['50%'], ['2.024'], ['1.670']]) {
    assert.deepEqual(lerFabrica(ws, 0), lerKit(ws, 0));
    assert.deepEqual(lerFabrica(ws, 0), lerVoxel(ws, 0));
  }
});
