import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POSES, POSE_BASE, misturarPoses, acenarNoTempo } from '../kit/mundo/poses.mjs';

test('POSES tem as poses de mão pedidas pela spec', () => {
  for (const n of ['neutro', 'apontar', 'apontarChao', 'acenar', 'maoNaCabeca', 'segurar', 'bracosAbertos', 'susto']) assert.ok(POSES[n], n);
  assert.equal(POSES.apontar.dedo, 'R');
});

test('misturarPoses: k=0 é a base, k=1 é o alvo, meio a meio no meio', () => {
  const a = misturarPoses(POSES.neutro, POSES.apontar, 0), b = misturarPoses(POSES.neutro, POSES.apontar, 1), m = misturarPoses(POSES.neutro, POSES.apontar, 0.5);
  assert.deepEqual(a.armR, POSE_BASE.armR);
  assert.deepEqual(b.armR, POSES.apontar.armR);
  assert.equal(m.armR[0], (POSE_BASE.armR[0] + POSES.apontar.armR[0]) / 2);
  assert.equal(a.dedo, null); assert.equal(b.dedo, 'R');
});

test('acenarNoTempo balança o braço', () => {
  assert.notDeepEqual(acenarNoTempo(0.0).armR, acenarNoTempo(0.17).armR);
  assert.deepEqual(acenarNoTempo(0.3, 0).armR, POSE_BASE.armR);
});
