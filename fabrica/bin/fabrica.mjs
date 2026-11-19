#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, PLATAFORMAS } from '../lib/paths.mjs';
import { novoVideo } from '../lib/novo.mjs';
import { lerFila, mudarEtapa, resumoErro } from '../lib/fila.mjs';
import { checarScript } from '../lib/checagem.mjs';
import { checarIsolamento } from '../lib/isolamento.mjs';
import { rodarLote, entregarVideo, lerVideo } from '../lib/lote.mjs';
import { testarKits } from '../lib/kits.mjs';
import { importarNarracoes } from '../lib/narracao.mjs';
import { run } from '../lib/run.mjs';

const AJUDA = `uso: node fabrica/bin/fabrica.mjs <comando>
  novo <marca> <estilo> <slug>         cria o vídeo a partir do modelo do estilo e põe na fila
  checar <id>                          checa o roteiro (legendas, gancho, fontes, variantes, duração, proibidos)
  fila                                 mostra a fila
  etapa <id> <etapa>                   muda a etapa (pauta roteiro cenas revisao render entregue aprovado postado)
  lote                                 renderiza todos os vídeos na etapa "render"
  render-variante <id> <plataforma>    re-renderiza só uma plataforma (tiktok, reels, shorts)
  kits [estilo...]                     teste rápido dos kits (monta, checa e renderiza 1 plataforma)
  narracoes <pasta>                    usa narrações próprias: <slug>.mp3 por vídeo + cta-segue e cta-inscreve; manda para render`;

const item = (id) => { const v = lerFila(ROOT).find((x) => x.id === id); if (!v) throw new Error(`vídeo não está na fila: ${id}`); return v; };
const [cmd, ...a] = process.argv.slice(2);

try {
  if (cmd === 'novo') {
    const [marca, estilo, slug] = a;
    const r = novoVideo(ROOT, { marca, estilo, slug });
    console.log(`criado: ${r.dir}\nid: ${r.id}`);
  } else if (cmd === 'checar') {
    const { dir, script, marca, meta } = lerVideo(ROOT, item(a[0]));
    const erros = [...checarScript(script, { marca, estilo: meta.estilo }), ...checarIsolamento(dir)];
    console.log(erros.length ? `PROBLEMAS (${erros.length}):\n- ${erros.join('\n- ')}` : 'ROTEIRO OK');
    process.exitCode = erros.length ? 1 : 0;
  } else if (cmd === 'fila') {
    for (const v of lerFila(ROOT)) console.log(`${v.etapa.padEnd(9)} ${v.marca.padEnd(13)} ${v.estilo.padEnd(10)} ${v.id}${v.erro ? '  ⚠ ' + resumoErro(v.erro) : ''}`);
  } else if (cmd === 'etapa') {
    const v = mudarEtapa(ROOT, a[0], a[1]);
    console.log(`${v.id} → ${v.etapa}`);
  } else if (cmd === 'lote') {
    const dirLog = path.join(ROOT, 'lotes'); fs.mkdirSync(dirLog, { recursive: true });
    const arq = path.join(dirLog, new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.log');
    const log = (m) => { console.log(m); fs.appendFileSync(arq, m + '\n'); };
    const resumo = await rodarLote(ROOT, { run, log });
    log(`\nRESUMO: ${resumo.filter((r) => r.ok).length} ok, ${resumo.filter((r) => !r.ok).length} com falha (log: ${arq})`);
    process.exitCode = resumo.some((r) => !r.ok) ? 1 : 0;
  } else if (cmd === 'render-variante') {
    const [id, plat] = a;
    if (!PLATAFORMAS.includes(plat)) throw new Error(`plataforma inválida: ${plat} (use: ${PLATAFORMAS.join(', ')})`);
    const arquivos = await entregarVideo(ROOT, item(id), { run, log: console.log, so: [plat] });
    console.log(`OK: ${arquivos.join(', ')}`);
  } else if (cmd === 'kits') {
    const resumo = await testarKits(ROOT, { run, log: console.log, estilos: a.length ? a : undefined });
    const falhas = resumo.filter((r) => !r.ok).length;
    console.log(`\nRESUMO: ${resumo.length - falhas} ok, ${falhas} com falha`);
    process.exitCode = falhas ? 1 : 0;
  } else if (cmd === 'narracoes') {
    if (!a[0]) throw new Error('uso: narracoes <pasta>');
    const r = importarNarracoes(ROOT, path.resolve(a[0]));
    for (const id of r.importados) console.log(`render    ${id}`);
    console.log(`\n${r.importados.length} vídeo(s) com narração própria, prontos para o lote; ${r.semAudio.length} sem áudio na pasta`);
  } else {
    console.log(AJUDA);
  }
} catch (e) {
  console.error(`ERRO: ${e.message}`);
  process.exitCode = 1;
}
