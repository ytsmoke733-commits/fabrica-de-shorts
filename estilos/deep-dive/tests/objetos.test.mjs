import './three-no-node.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const THREE = await import('three');
const { bolinha } = await import('../kit/objetos.js');

test('bolinha: raio e cor pedidos, setCor troca só a cor dela', () => {
  const a = bolinha(), b = bolinha({ cor: '#00FF00', raio: 0.02 });
  assert.equal(a.mesh.scale.x, 0.0095); assert.equal(b.mesh.scale.x, 0.02);
  assert.equal(a.mesh.material.color.getHexString(), new THREE.Color('#FF7AAE').getHexString());
  a.setCor('#EBC6D2');
  assert.equal(a.mesh.material.color.getHexString(), new THREE.Color('#EBC6D2').getHexString());
  assert.equal(b.mesh.material.color.getHexString(), new THREE.Color('#00FF00').getHexString(), 'material próprio');
  assert.equal(a.mesh.geometry, b.mesh.geometry, 'malha compartilhada');
});

test('bolinha: brilho (emissive) e sheen derivam da cor, também no setCor', () => {
  const hsl = (c) => c.getHSL({}, THREE.SRGBColorSpace);
  const perto = (c, hex) => { const a = c.clone().convertLinearToSRGB(), b = new THREE.Color(hex).convertLinearToSRGB(); return Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b)) < 3 / 255; };
  const a = bolinha();
  assert.ok(perto(a.mesh.material.emissive, '#FF4F94'), 'rosa padrão: brilho do v2');
  assert.ok(perto(a.mesh.material.sheenColor, '#FFD0E2'), 'rosa padrão: sheen do v2');
  for (const b of [bolinha({ cor: '#3366FF' }), (a.setCor('#3366FF'), a)]) {
    const h = hsl(new THREE.Color('#3366FF')).h;
    assert.ok(Math.abs(hsl(b.mesh.material.emissive).h - h) < 0.01, 'brilho no matiz da cor');
    assert.ok(Math.abs(hsl(b.mesh.material.sheenColor).h - h) < 0.01, 'sheen no matiz da cor');
    assert.ok(hsl(b.mesh.material.emissive).l < hsl(b.mesh.material.color).l && hsl(b.mesh.material.sheenColor).l > hsl(b.mesh.material.color).l);
  }
});
