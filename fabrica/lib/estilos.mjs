import path from 'node:path';

// modelo = pasta (relativa ao ROOT) copiada ao criar um vídeo; motor = como renderiza
// kit (opcional) = pasta do kit copiada para <video>/kit/; tema (opcional) = nome em <kit>/../temas/<tema>.json, copiado para <video>/tema.json
export const ESTILOS = {
  'deep-dive': { motor: 'fs3d', modelo: 'estilos/deep-dive/modelo', kit: 'estilos/deep-dive/kit', tema: 'tema' },
  voxel: { motor: 'fs3d', modelo: 'estilos/voxel/modelo', kit: 'estilos/voxel/kit', tema: 'tema' },
  motion: { motor: 'hyperframes', modelo: 'estilos/motion/modelo', kit: 'estilos/motion/kit', tema: 'tema-a' },
  'motion-b': { motor: 'hyperframes', modelo: 'estilos/motion/modelo-b', kit: 'estilos/motion/kit', tema: 'tema-b' },
  'caso-real': { motor: 'fs3d', modelo: 'estilos/caso-real/modelo', kit: 'estilos/caso-real/kit', tema: 'tema' },
  pixel: { motor: 'fs3d', modelo: 'estilos/pixel/modelo', kit: 'estilos/pixel/kit', tema: 'tema' },
  'mapa-satelite': { motor: 'fs3d', modelo: 'estilos/mapa-satelite/modelo', kit: 'estilos/mapa-satelite/kit', tema: 'tema' },
};
// estilos já transformados em kit (hoje, todos)
export const estilosComKit = () => Object.keys(ESTILOS).filter((id) => ESTILOS[id].kit);
export const SCRIPT_REL = { fs3d: 'script.json', hyperframes: path.join('voz', 'script.json') };

export function estilo(id) {
  const e = ESTILOS[id];
  if (!e) throw new Error(`estilo sem modelo ainda: ${id} (existentes: ${Object.keys(ESTILOS).join(', ')})`);
  return e;
}
export const scriptPath = (dir, motor) => path.join(dir, SCRIPT_REL[motor]);
