// Narração própria (ex.: ElevenLabs) no lugar da voz gerada.
// Cada vídeo pode ter <dir>/narracao/ com corpo.<ext> (tudo menos a chamada final),
// cta-segue.<ext> (tiktok e reels) e cta-inscreve.<ext> (shorts).
import fs from 'node:fs';
import path from 'node:path';
import { lerFila, salvarFila } from './fila.mjs';

export const EXTENSOES = ['.mp3', '.wav', '.m4a'];
const CTA = { tiktok: 'cta-segue', reels: 'cta-segue', shorts: 'cta-inscreve' };

function achar(pasta, base) {
  for (const ext of EXTENSOES) { const f = path.join(pasta, base + ext); if (fs.existsSync(f)) return f; }
  return null;
}

export function narracaoDaVariante(dir, plataforma) {
  const pasta = path.join(dir, 'narracao');
  const corpo = achar(pasta, 'corpo');
  if (!corpo) return null;
  const nome = CTA[plataforma];
  const cta = nome && achar(pasta, nome);
  if (!cta) throw new Error(`narracao/ não tem ${nome ?? 'chamada'} (${EXTENSOES.join(' ')}) para ${plataforma}`);
  return { corpo, cta };
}

export function temposDoScript(s) {
  const pen = s.lines.length >= 2 ? s.lines[s.lines.length - 2] : {};
  return { lead: s.lead ?? 0.45, gap: pen.gap ?? s.gap ?? 0.32, outro: s.outro ?? 0.9 };
}

// corpo e chamada sem silêncio nas pontas, em 24 kHz mono, com lead/gap/outro de silêncio
export function comandoNarracao({ corpo, cta }, saida, { lead, gap, outro }) {
  const limpar = 'aformat=sample_rates=24000:channel_layouts=mono,'
    + 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,'
    + 'silenceremove=start_periods=1:start_threshold=-45dB,areverse';
  const sil = (d, n) => `anullsrc=r=24000:cl=mono,atrim=duration=${d}[${n}]`;
  const filtro = [`[0:a]${limpar}[c]`, `[1:a]${limpar}[t]`, sil(lead, 's0'), sil(gap, 's1'), sil(outro, 's2'),
    '[s0][c][s1][t][s2]concat=n=5:v=0:a=1[o]'].join(';');
  return { cmd: 'ffmpeg', args: ['-v', 'error', '-y', '-i', corpo, '-i', cta, '-filter_complex', filtro, '-map', '[o]', '-ar', '24000', '-ac', '1', saida] };
}

// O áudio montado começa mudo por `lead` s, mas o Whisper põe a 1ª palavra perto de 0 s:
// nenhuma palavra (nem a 1ª linha) pode começar antes de `lead`.
export function ajustarInicio(dirVoz, lead) {
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const fw = path.join(dirVoz, 'data', 'words.json'), fl = path.join(dirVoz, 'data', 'lines.json');
  const words = JSON.parse(fs.readFileSync(fw, 'utf8'));
  for (const w of words) if (w.s < lead) { w.s = r3(lead); w.e = r3(Math.max(w.e, w.s + 0.05)); }
  fs.writeFileSync(fw, JSON.stringify(words, null, 1));
  const lines = JSON.parse(fs.readFileSync(fl, 'utf8'));
  if (lines.lines?.length) lines.lines[0].start = r3(Math.max(lines.lines[0].start, lead));
  fs.writeFileSync(fl, JSON.stringify(lines, null, 1));
}

const slugDe = (dir) => path.basename(dir).replace(/^\d{4}-\d{2}-\d{2}-/, '');

// pasta com <slug>.<ext> por vídeo + cta-segue.<ext> e cta-inscreve.<ext>
export function importarNarracoes(root, pasta) {
  const ctas = ['cta-segue', 'cta-inscreve'].map((n) => {
    const f = achar(pasta, n);
    if (!f) throw new Error(`faltou ${n} (${EXTENSOES.join(' ')}) em ${pasta}`);
    return [n, f];
  });
  const fila = lerFila(root);
  const importados = [], semAudio = [];
  for (const v of fila) {
    const corpo = achar(pasta, slugDe(v.dir));
    if (!corpo) { semAudio.push(v.id); continue; }
    const dest = path.join(root, v.dir, 'narracao');
    fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(dest, { recursive: true });
    fs.copyFileSync(corpo, path.join(dest, 'corpo' + path.extname(corpo)));
    for (const [n, f] of ctas) fs.copyFileSync(f, path.join(dest, n + path.extname(f)));
    Object.assign(v, { etapa: 'render', erro: null, atualizado: new Date().toISOString() });
    importados.push(v.id);
  }
  salvarFila(root, fila);
  return { importados, semAudio };
}
