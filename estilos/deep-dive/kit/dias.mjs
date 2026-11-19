// Passagem de dias (regra do S18 do v2): função pura de u (0..1).
export function rotinaDaHora(h) {
  const x = ((h % 24) + 24) % 24;
  if (x >= 6.5 && x < 17) return 'anda';
  if (x >= 17 && x < 23) return 'senta';
  return 'dorme';
}
export function passagemDeDias(u, { dias = 2, horaInicio = 8 } = {}) {
  const hora = horaInicio + u * 24 * dias;
  return { hora, dia: 1 + Math.floor(hora / 24), rotina: rotinaDaHora(hora) };
}
