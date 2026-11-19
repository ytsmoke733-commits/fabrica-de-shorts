// Tempo do roteiro: quando cada linha e cada palavra são faladas (voz/data/lines.json + words.json).
import fs from 'node:fs';
import path from 'node:path';

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

export function carregarTempo(dirVoz) {
  const ler = (f) => JSON.parse(fs.readFileSync(path.join(dirVoz, 'data', f), 'utf8'));
  return criarTempo(ler('lines.json'), ler('words.json'));
}
