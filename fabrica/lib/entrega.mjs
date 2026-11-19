import { plataformasDaMarca } from './marca.mjs';

const NOME = { tiktok: 'TikTok', reels: 'Instagram Reels', shorts: 'YouTube Shorts' };

export function montarPostar(script, marca) {
  const { titulo, descricao, hashtags } = script.postar;
  const tags = hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`).replace(/\s+/g, '')).join(' ');
  const blocos = plataformasDaMarca(marca).map((p) => {
    const t = p === 'shorts' ? `${tags} #shorts` : tags;
    return `## ${NOME[p]}\n- Arquivo: \`${p}.mp4\`\n- Título: ${titulo}\n- Descrição:\n\n${descricao}\n\n${t}\n`;
  });
  const fontes = script.sources.map((s) => `- ${s}`).join('\n');
  return `# ${titulo}\n\nMarca: ${marca.nome}\n\n${blocos.join('\n')}\n## Fontes (para responder comentários)\n${fontes}\n`;
}

export const comandoCapa = (mp4, jpg, t = 1.0) => ({ cmd: 'ffmpeg', args: ['-v', 'error', '-y', '-ss', String(t), '-i', mp4, '-frames:v', '1', '-q:v', '2', jpg] });
export const comandoFolha = (mp4, jpg) => ({ cmd: 'ffmpeg', args: ['-v', 'error', '-y', '-i', mp4, '-vf', 'fps=1,scale=216:384,tile=10x3:padding=4', '-frames:v', '1', jpg] });
export const comandoDuracao = (mp4) => ({ cmd: 'ffprobe', args: ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4] });
