// Rostos do voxel: mapas 8×8 (b sobrancelha · w branco do olho · k pupila · m boca · t dente · r língua · s suor · c rubor) e piscada.

export const FACES = {
  neutral:   ['........', '.bb..bb.', '........', '.wk..kw.', '.kk..kk.', '........', '..mmmm..', '........'],
  smile:     ['........', '.bb..bb.', '........', '.wk..kw.', '.kk..kk.', '.m....m.', '..mmmm..', '........'],
  happy:     ['........', '.bb..bb.', '........', '.wk..kw.', '.kk..kk.', 'cmttttmc', '..mrrm..', '........'],
  surprised: ['.bb..bb.', '........', '.wk..kw.', '.kk..kk.', '.kk..kk.', '...mm...', '...mm...', '........'],
  scared:    ['..b..b..', '.b....b.', '.wk..kw.', '.kk..kk.', '........', '..mmmm..', '.mttttm.', '........'],
  hot:       ['.......s', '.bb..bb.', '.......s', '.kk..kk.', '........', '..mmmm..', '..mrrm..', '........'],
  sleepy:    ['........', '........', '.bb..bb.', '........', '.kk..kk.', '........', '...mm...', '........'],
  wink:      ['........', '.bb..bb.', '........', '.wk.....', '.kk..kk.', '.m....m.', '..mmmm..', '........'],
  cool:      ['........', '.bb.....', '.....bb.', '.wk..kw.', '.kk..kk.', '......m.', '..mmmm..', '........'],
  blink:     ['........', '.bb..bb.', '........', '........', '.kk..kk.', '........', '..mmmm..', '........'],
};
export const FACECOL = { k: '#15151A', w: '#FFFFFF', m: '#5B2626', t: '#FFFFFF', r: '#E06A78', s: '#9FE6FF' };

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const PISCAVEIS = ['neutral', 'smile', 'happy', 'cool'];
// pisca uma vez por "periodo" (com sorteio determinístico do instante), olhos fechados por "dur" segundos
export function piscar(t, { periodo = 3.4, dur = 0.13, semente = 1 } = {}) {
  const n = Math.floor(t / periodo);
  const ini = n * periodo + 0.1 + rnd(n + semente * 97) * (periodo - dur - 0.2);
  return t >= ini && t < ini + dur;
}
export const rostoNoTempo = (nome, t, opcoes) => (PISCAVEIS.includes(nome) && piscar(t, opcoes) ? 'blink' : nome);
