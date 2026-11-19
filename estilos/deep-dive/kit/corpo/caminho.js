// Objeto que percorre um caminho (a bolinha no esôfago, no intestino…): o xg.position.copy(CURVE.getPointAt(u)) do v2.
//   noCaminho(obj, curva, u) -> o ponto (Vector3 novo, igual a obj.position)   u 0..1 ao longo da curva (preso nesse intervalo)
// O ponto está no referencial da curva: ponha o objeto no mesmo pai da curva (ex.: humano.spine para os tubos).
import { clamp } from '../motor/lib.js';

export function noCaminho(obj, curva, u) {
  const p = curva.getPointAt(clamp(u));
  obj.position.copy(p);
  return p;
}
