// Datilografia e datas curtas. Lógica pura: nada de canvas, tudo função de p ou t.
import { clamp } from './motor/lib.js';

export const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// '12 MAI 2017' (dia com 2 dígitos; mes de 1 a 12). Lança erro fora da faixa.
export function dataCurta(ano, mes, dia) {
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) throw new RangeError(`mês inválido: ${mes}`);
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) throw new RangeError(`dia inválido: ${dia}`);
  return `${String(dia).padStart(2, '0')} ${MESES[mes - 1]} ${ano}`;
}

// Quantas letras já apareceram com progresso p (0..1) num texto de `total` letras.
export const letrasVisiveis = (p, total) => Math.floor(clamp(p) * total);

// Prefixo do texto visível no progresso p.
export const datilografar = (texto, p) => texto.slice(0, letrasVisiveis(p, texto.length));

// Cursor piscando a 2,5 Hz (aceso na primeira metade de cada ciclo).
export const cursorAceso = (t) => Math.floor(t * 2.5) % 2 === 0;
