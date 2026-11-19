import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACES, piscar, rostoNoTempo, PISCAVEIS } from '../kit/mundo/rostos.mjs';

test('FACES: as 9 do v2 + blink, todas 8×8', () => {
  for (const n of ['neutral', 'smile', 'happy', 'surprised', 'scared', 'hot', 'sleepy', 'wink', 'cool', 'blink']) {
    assert.ok(FACES[n], n); assert.equal(FACES[n].length, 8); assert.ok(FACES[n].every((l) => l.length === 8));
  }
  assert.ok(!FACES.blink.join('').includes('w'), 'olho fechado não tem branco');
});

test('piscar: determinístico, ~dur/periodo do tempo fechado', () => {
  let fechado = 0; const N = 6000;
  for (let k = 0; k < N; k++) fechado += piscar(k * 0.01) ? 1 : 0;
  const frac = fechado / N;
  assert.ok(frac > 0.02 && frac < 0.07, `fração ${frac}`);
  assert.equal(piscar(12.345), piscar(12.345));
});

test('rostoNoTempo: só expressões calmas piscam', () => {
  assert.deepEqual(PISCAVEIS, ['neutral', 'smile', 'happy', 'cool']);
  let viuBlink = false;
  for (let k = 0; k < 2000; k++) { const t = k * 0.01; if (rostoNoTempo('happy', t) === 'blink') viuBlink = true; assert.equal(rostoNoTempo('scared', t), 'scared'); }
  assert.ok(viuBlink);
});
