// Envelope de fala (lip sync) opcional: { hz, v: [...] } -> env(t) em 0..1; sem dados, sempre 0.
export function criarEnvelope(json) {
  const v = json && Array.isArray(json.v) ? json.v : null, hz = json && json.hz;
  if (!v || !v.length || !(hz > 0)) return () => 0;
  return (t) => {
    const x = t * hz;
    if (!(x >= 0) || x > v.length - 1) return 0;
    const i = Math.floor(x), f = x - i, a = v[i], b = v[Math.min(i + 1, v.length - 1)];
    return a + (b - a) * f;
  };
}
export async function carregarEnvelope(url = 'data/env.json') {
  try {
    const r = await fetch(url);
    if (!r || !r.ok) return criarEnvelope(null);
    return criarEnvelope(await r.json());
  } catch { return criarEnvelope(null); }
}
