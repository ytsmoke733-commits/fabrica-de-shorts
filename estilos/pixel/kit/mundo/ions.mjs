// Lógica pura dos íons de lítio da bateriaPorDentro() (sem three.js; testada em tests/ions.test.mjs).
//   vagaDoIon(i, colunas, niveis) -> { coluna, nivelCatodo, nivelAnodo }   onde o íon i mora em cada eletrodo
//   progressoDoIon(i, n, carga, janela) -> p em [0, 1]   (0 = no cátodo, 1 = no ânodo; suave nas pontas)
//   pontoDoIon(a, b, p) -> [x, y, z]                      (caminho de a até b: sai e chega na vertical)
// Nível 0 = a fileira de vagas encostada no separador; níveis maiores ficam mais longe dele. A posição depende só
// da carga (0 = descarregada, todos no cátodo; 1 = cheia, todos no ânodo): carregando (carga subindo) eles sobem do
// cátodo para o ânodo; descarregando (carga descendo) voltam pelo mesmo caminho, o último a chegar é o 1º a sair.

/** passo que embaralha as colunas (coprimo com o número de colunas, para visitar todas) */
function passoEmbaralha(c) {
  const mdc = (a, b) => (b ? mdc(b, a % b) : a);
  for (const p of [3, 5, 7, 11, 13]) if (p < c && mdc(p, c) === 1) return p;
  return 1;
}

/**
 * Vagas do íon i (0..colunas·niveis - 1). Os primeiros a sair moram no nível 0 do cátodo (perto do separador) e vão
 * para o nível mais fundo do ânodo; os últimos saem do fundo do cátodo e param no nível 0 do ânodo. Assim, na mesma
 * coluna, ninguém atravessa uma vaga ainda ocupada. Dentro de um nível as colunas saem embaralhadas.
 */
export function vagaDoIon(i, colunas, niveis) {
  const nivel = Math.floor(i / colunas), k = i % colunas;
  return { coluna: (k * passoEmbaralha(colunas)) % colunas, nivelCatodo: nivel, nivelAnodo: niveis - 1 - nivel };
}

/**
 * Progresso p do íon i de n para uma carga (0..1): o íon i parte em carga = i/(n-1)·(1 - janela) e chega uma janela
 * depois, com saída e chegada suaves (smoothstep). carga 0 -> todos 0; carga 1 -> todos 1; o íon i sai antes do i + 1.
 * A média dos p é exatamente 0,5 em carga 0,5 (e fica a menos de meia janela da carga no resto).
 */
export function progressoDoIon(i, n, carga, janela = 0.3) {
  const s = n > 1 ? (i / (n - 1)) * (1 - janela) : 0;
  const x = (carga - s) / janela;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x * x * (3 - 2 * x);
}

/**
 * Ponto do caminho de a até b ([x, y, z]) em p (0..1): cúbica de Bézier com as alças na vertical (o íon sai da vaga
 * subindo/descendo, cruza o meio na diagonal e entra na outra vaga na vertical). Mesma coluna = linha reta.
 */
export function pontoDoIon(a, b, p) {
  const d = (b[1] - a[1]) / 3;
  const c1 = [a[0], a[1] + d, a[2]], c2 = [b[0], b[1] - d, b[2]];
  const q = 1 - p, w0 = q * q * q, w1 = 3 * q * q * p, w2 = 3 * q * p * p, w3 = p * p * p;
  return [0, 1, 2].map((k) => w0 * a[k] + w1 * c1[k] + w2 * c2[k] + w3 * b[k]);
}
