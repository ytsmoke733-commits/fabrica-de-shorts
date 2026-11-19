// Contexto 2D falso para os testes de desenho: aceita qualquer método, guarda as propriedades e registra cada chamada
// com o estado do momento (fillStyle, strokeStyle, font). measureText mede 0,6 do tamanho da fonte por letra (como mono).
export function ctxFalso() {
  const estado = { fillStyle: '#000', strokeStyle: '#000', font: '10px sans-serif', globalAlpha: 1 };
  const chamadas = [];
  const px = () => +(/(\d+(?:\.\d+)?)px/.exec(estado.font) || [0, 10])[1];
  const especiais = {
    measureText: (s) => ({ width: String(s).length * 0.6 * px() }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
  };
  const g = new Proxy(estado, {
    get(o, k) {
      if (k === 'chamadas') return chamadas;
      if (k === 'textos') return chamadas.filter((c) => c.nome === 'fillText').map((c) => c.args[0]);
      if (k in especiais) return especiais[k];
      if (k in o) return o[k];
      return (...args) => { chamadas.push({ nome: k, args, fillStyle: o.fillStyle, strokeStyle: o.strokeStyle, font: o.font, alpha: o.globalAlpha }); };
    },
    set(o, k, v) { o[k] = v; return true; },
  });
  return g;
}
