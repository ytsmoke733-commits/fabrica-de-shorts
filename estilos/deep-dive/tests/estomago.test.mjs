import './three-no-node.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const THREE = await import('three');
const { estomagoPorDentro } = await import('../kit/corpo/estomago.js');
const { bolinha } = await import('../kit/objetos.js');

const S = estomagoPorDentro(null);
const instancias = (sc) => sc.children.filter((c) => c.isInstancedMesh);
/** tudo que o update escreve: parede, ácido, objeto (posição, rotação, escala, cor), bolhas, açúcar */
const snap = (X) => {
  const malhas = X.scene.children.filter((c) => c.isMesh && !c.isInstancedMesh && c !== X.objeto);
  return JSON.stringify({
    geo: malhas.map((m) => Array.from(m.geometry.attributes.position.array)),
    obj: [X.objeto.position.toArray(), X.objeto.rotation.toArray(), X.objeto.scale.toArray(), X.objeto.material.color.toArray()],
    inst: instancias(X.scene).map((m) => [m.count, Array.from(m.instanceMatrix.array.slice(0, m.count * 16))]),
  });
};

test('estomagoPorDentro: objeto padrão é uma bolinha (raio 0,22) na cena; 4 enzimas escondidas; pouso no ácido', () => {
  assert.ok(S.scene instanceof THREE.Scene);
  assert.equal(S.objeto.parent, S.scene);
  assert.equal(S.objeto.geometry, bolinha().mesh.geometry, 'a malha da bolinha');
  assert.equal(S.objeto.scale.x, 0.22);
  assert.equal(S.enzimas.length, 4);
  for (const e of S.enzimas) { assert.equal(e.parent, S.scene); assert.equal(e.visible, false); assert.ok(e.userData.up, 'mandíbula de cima'); }
  assert.ok(S.pouso.equals(new THREE.Vector3(0, -0.92, 0)));
});

test('estomagoPorDentro: objeto próprio, sem enzimas e sem açúcar', () => {
  const obj = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: '#3366FF' }));
  const X = estomagoPorDentro(null, { objeto: obj, enzimas: false, acucar: false });
  assert.equal(X.objeto, obj); assert.equal(obj.parent, X.scene);
  assert.deepEqual(X.enzimas, []);
  assert.equal(instancias(X.scene).length, 1, 'só as bolhas');
  X.update(1, { acucar: 0.5 });                                       // não quebra sem açúcar
  assert.equal(instancias(S.scene).length, 3, 'padrão: bolhas, açúcar e sabor');
});

test('estomago.update: queda 0 = objeto bem acima do pouso, 1 = no pouso; amassar escala a partir da escala inicial', () => {
  S.update(0, { queda: 0 }); assert.ok(Math.abs(S.objeto.position.y - (S.pouso.y + 2.6)) < 1e-9);
  S.update(0, { queda: 1, boiar: 0 }); assert.ok(S.objeto.position.distanceTo(S.pouso) < 1e-9);
  S.update(0, { amassar: 1 }); assert.ok(Math.abs(S.objeto.scale.x - 0.22 * 1.3) < 1e-9 && Math.abs(S.objeto.scale.y - 0.22 * 0.82) < 1e-9);
  const obj = new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshStandardMaterial()); obj.scale.setScalar(0.5);
  const X = estomagoPorDentro(null, { objeto: obj, enzimas: false });
  X.update(0, { amassar: 1 }); assert.ok(Math.abs(obj.scale.x - 0.65) < 1e-9);
  X.update(0, { amassar: 0 }); assert.equal(obj.scale.x, 0.5);
});

test('estomago.update: desbotar vai da cor inicial do objeto até a cor desbotada (#EBC6D2)', () => {
  const c0 = bolinha().mesh.material.color.getHexString();
  S.update(0, { desbotar: 1 }); assert.equal(S.objeto.material.color.getHexString(), new THREE.Color('#EBC6D2').getHexString());
  S.update(0, { desbotar: 0 }); assert.equal(S.objeto.material.color.getHexString(), c0);
});

test('estomago.update: bolhas controla quantas bolhas; açúcar e sabor só durante 0 < acucar < 1', () => {
  const [bolhas, acucar, sabor] = instancias(S.scene);
  S.update(0, { bolhas: 0 }); const poucas = bolhas.count;
  S.update(0, { bolhas: 1 }); assert.ok(bolhas.count > poucas * 3);
  S.update(0, { acucar: 0 }); assert.equal(acucar.count + sabor.count, 0);
  S.update(0, { acucar: 0.5 }); assert.ok(acucar.count > 0 && sabor.count > 0);
  S.update(0, { acucar: 1 }); assert.equal(acucar.count + sabor.count, 0);
});

test('estomago.update: função pura de (t, controles)', () => {
  const A = { bolhas: 0.7, desbotar: 0.4, amassar: 0.3, queda: 0.6, respingo: 0.2, apertar: 0.5, acucar: 0.4, cam: new THREE.Vector3(0.2, -0.4, 1.7) };
  S.update(2.3, A); const a = snap(S);
  S.update(9.1, { bolhas: 0.1, desbotar: 1, amassar: -0.6, apertar: 1, acucar: 0.9 }); S.update(2.3, A);
  assert.equal(snap(S), a);
});
