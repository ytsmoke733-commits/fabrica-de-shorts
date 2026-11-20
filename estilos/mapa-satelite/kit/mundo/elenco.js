// Elenco do voxel (extraído de teste-lowpoly-v2): o protagonista do v2, figurantes sorteados por semente e o sorvete.
import { rnd } from '../motor/lib.js';
import { vox } from './blocos.js';
import { VoxelPerson, SKINS, HAIRS, SHIRTS, PANTS } from './pessoa.js';

/** o "hero" do v2 (shots.js): camisa floral, bermuda, boné e óculos (sem o sorvete na mão) */
export function protagonista() {
  return VoxelPerson({ skin: '#B87A52', hair: '#3A2418', hairStyle: 'short', beard: true, shirtStyle: 'floral', shirt: '#2BA6A0', shirt2: '#F2C14E',
    pants: '#E9E2D2', shorts: true, shoes: '#F1EEE6', accessory: ['cap', 'glasses'], capColor: '#E2483A' });
}

/** a random figurante from a seed (variety of skin, hair, clothes, accessories) */
export function figurante(seed) {
  const r = (k) => rnd(seed * 17.3 + k * 3.7);
  const pick = (arr, k) => arr[Math.floor(r(k) * arr.length) % arr.length];
  const styles = ['short', 'buzz', 'long', 'bun', 'curly', 'bald', 'pony'];
  const hs = pick(styles, 1), accs = [];
  const a = r(2); if (a < 0.28) accs.push('cap'); else if (a < 0.48) accs.push('sunhat');
  if (r(3) < 0.35) accs.push('glasses'); if (r(4) < 0.18) accs.push('backpack'); else if (r(4) < 0.26) accs.push('camera');
  return VoxelPerson({ skin: pick(SKINS, 5), hair: pick(HAIRS, 6), hairStyle: hs, beard: (hs === 'short' || hs === 'buzz' || hs === 'bald') && r(7) < 0.4,
    shirt: pick(SHIRTS, 8), shirt2: pick(SHIRTS, 9), pants: pick(PANTS, 10), shirtStyle: pick(['tee', 'collar', 'tank', 'floral', 'tee'], 11), shorts: r(12) < 0.5,
    shoes: pick(['#F1EEE6', '#2A2A2E', '#E2483A', '#4C7DDC', '#C9A06A'], 13), accessory: accs, capColor: pick(['#E2483A', '#2C3A68', '#F2C14E', '#2BA6A0', '#F5F1E8'], 14),
    hatColor: pick(['#E9CF8E', '#F5F1E8', '#D9B070'], 15), bagColor: pick(['#E8913A', '#4C7DDC', '#5DB86A', '#E2557B'], 16) });
}

/** an ice cream cone (for a hand): bottom of the cone at y 0 */
export function sorvete() {
  const v = vox();
  for (let i = 0; i < 4; i++) { const s = 0.04 + i * 0.022; v.box(0, 0.03 + i * 0.045, 0, s, 0.05, s, i % 2 ? '#D49A55' : '#C4863F'); }
  v.box(0, 0.22, 0, 0.12, 0.08, 0.12, '#F7B8C8', 'base', 0, 0, 0, 0.012); v.box(0, 0.29, 0, 0.1, 0.07, 0.1, '#FFF3D9', 'base', 0, 0, 0, 0.012); v.box(0.01, 0.34, 0, 0.04, 0.04, 0.04, '#E2483A');
  return v.build();
}