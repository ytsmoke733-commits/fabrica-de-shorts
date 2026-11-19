// Não é teste (não casa com *.test.mjs): faz 'three' e 'three/addons/…' resolverem para o three vendorizado em
// modelo/vendor, para os testes poderem carregar os módulos 3D do kit (humano.js) no Node, sem npm.
// Importe ANTES do módulo 3D (import estático deste arquivo + import() dinâmico do módulo).
import { registerHooks } from 'node:module';

const THREE_URL = new URL('../modelo/vendor/three.module.js', import.meta.url).href;
const ADDONS = new URL('../modelo/vendor/addons/', import.meta.url).href;
registerHooks({
  resolve(especificador, contexto, proximo) {
    if (especificador === 'three') return { url: THREE_URL, shortCircuit: true };
    if (especificador.startsWith('three/addons/')) return { url: ADDONS + especificador.slice('three/addons/'.length), shortCircuit: true };
    return proximo(especificador, contexto);
  },
});
