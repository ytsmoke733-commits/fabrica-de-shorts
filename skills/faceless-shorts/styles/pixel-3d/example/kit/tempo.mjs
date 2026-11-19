// Tempo do roteiro: quando cada linha e cada palavra são faladas (data/lines.json + words.json do vídeo).
// Cópia de estilos/motion/kit/tempo.mjs (API igual); só o carregamento muda: no pixel roda no navegador (fetch).

export const norm = (w) => String(w).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9']+/g, '');

export function criarTempo(lines, words) {
  const L = lines.lines;
  const checaLinha = (i) => { if (!Number.isInteger(i) || !L[i]) throw new Error(`linha ${i} não existe (roteiro tem ${L.length})`); return L[i]; };
  // Exatas primeiro; prefixo só se não houver nenhuma exata. ocorrencia é 1-based.
  const acha = (txt, i, ocorrencia = 1) => {
    checaLinha(i);
    const n = norm(txt);
    if (!n) throw new Error(`palavra "${txt}" inválida (vazia depois de normalizar)`);
    const daLinha = words.filter((x) => x.line === i);
    const exatas = daLinha.filter((x) => norm(x.w) === n);
    const casam = exatas.length ? exatas : daLinha.filter((x) => norm(x.w).startsWith(n));
    const w = casam[ocorrencia - 1];
    if (!w) {
      const sufixo = ocorrencia === 1 ? '' : ` (ocorrência ${ocorrencia})`;
      throw new Error(`palavra "${txt}"${sufixo} não encontrada na linha ${i}`);
    }
    return w;
  };
  return {
    duracao: lines.duration,
    nLinhas: L.length,
    ultima: L.length - 1,
    linha: (i) => checaLinha(i).start,
    fimLinha: (i) => checaLinha(i).end,
    palavra: (txt, i, ocorrencia = 1) => acha(txt, i, ocorrencia).s,
    fimPalavra: (txt, i, ocorrencia = 1) => acha(txt, i, ocorrencia).e,
    palavrasDaLinha: (i) => (checaLinha(i), words.filter((w) => w.line === i)),
  };
}

// No navegador: lê data/lines.json e data/words.json do próprio vídeo.
export async function carregarTempo(base = 'data') {
  const get = async (f) => { const r = await fetch(`${base}/${f}`, { cache: 'no-store' }); if (!r.ok) throw new Error(`faltou ${base}/${f}: rode voice.py + words.py`); return r.json(); };
  const [lines, words] = await Promise.all([get('lines.json'), get('words.json')]);
  return criarTempo(lines, words);
}
