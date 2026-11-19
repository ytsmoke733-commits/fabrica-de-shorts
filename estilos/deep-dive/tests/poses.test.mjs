import { test } from 'node:test'; import assert from 'node:assert/strict';
import { POSES_CORPO, POSE_CORPO_BASE, misturarPosesCorpo } from '../kit/personagem/poses.mjs';
test('poses do corpo do v2 existem com o formato do Human', () => {
  for (const n of ['emPe', 'reagir', 'barriga', 'sentado', 'dormindo']) assert.ok(POSES_CORPO[n], n);
  assert.ok(POSES_CORPO.sentado.hipsY < POSE_CORPO_BASE.hipsY);
});
test('misturarPosesCorpo vai da base ao alvo', () => {
  const m0 = misturarPosesCorpo(POSE_CORPO_BASE, POSES_CORPO.sentado, 0), m1 = misturarPosesCorpo(POSE_CORPO_BASE, POSES_CORPO.sentado, 1);
  assert.equal(m0.hipsY, POSE_CORPO_BASE.hipsY); assert.equal(m1.hipsY, POSES_CORPO.sentado.hipsY);
});
test('POSE_CORPO_BASE usa os padrões do Human.pose do v2 (braços 6° para fora, cotovelo 10°, pernas 2°)', () => {
  assert.deepEqual(POSE_CORPO_BASE.shL, [0, 0, 6]); assert.deepEqual(POSE_CORPO_BASE.shR, [0, 0, 6]);
  assert.equal(POSE_CORPO_BASE.elL, 10); assert.equal(POSE_CORPO_BASE.elR, 10);
  assert.deepEqual(POSE_CORPO_BASE.hipL, [0, 0, 2]); assert.deepEqual(POSE_CORPO_BASE.hipR, [0, 0, 2]);
  assert.equal(POSE_CORPO_BASE.knL, 2); assert.equal(POSE_CORPO_BASE.knR, 2);
});
