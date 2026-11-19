// Posições dos marcos numa linha do tempo horizontal. Lógica pura.

// n pontos igualmente espaçados de x0 a x1; `lado` alterna -1 (rótulo acima) e 1 (abaixo).
// Com n = 1 o ponto fica no centro.
export function posicoesNaLinha(n, { x0, x1, y }) {
  return Array.from({ length: n }, (_, i) => ({
    x: n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1),
    y,
    lado: i % 2 === 0 ? -1 : 1,
  }));
}
