# Estilo caso-real (kit)

## 1. O que é o estilo

Vídeos verticais 1080x1920 de **casos reais de segurança digital** para a Marca B (Hacker e tecnologia): "o que aconteceu, como foi parado e como você se protege". Lugares escuros (quarto, escritório, sala de servidores, rua, corredor), pessoas **sem rosto**, evidências de investigação (pasta do caso, polaroides, recorte de jornal, círculo vermelho, barbante), mapa-múndi em pontos, linha do tempo e telas de computador com código genérico. É o visual do Night File (mistérios e true crime) com o tema verde da Marca B. Tudo é código: o three.js (vendorizado em `vendor/`) renderiza num canvas WebGL escondido, o canvas 2D recebe o 3D e desenha evidências, HUD e legenda, e o Chrome headless captura quadro a quadro.

| item | valor |
|---|---|
| estilo na fábrica | `caso-real` (`fabrica/lib/estilos.mjs`: motor `fs3d`, modelo `estilos/caso-real/modelo`, kit `estilos/caso-real/kit`, tema `tema`) |
| marca | Marca B, `hacker` (tiktok, reels, shorts; estilos permitidos `motion-b` e `caso-real`) |
| tema | `temas/tema.json` (única) |
| vídeo-modelo | `modelo/` ("O vírus que trancou 200 mil computadores", WannaCry, 12 MAI 2017; ~26 s, 5 linhas, em português) |
| vitrine | `vitrine/` (uma cena de 3 s por peça do kit; não é vídeo para publicar) |
| testes do kit | `cd estilos/caso-real && node --test "tests/*.test.mjs"` (hoje 94) |

- **Motor `fs3d`:** o mesmo do voxel e do deep-dive. O vídeo é uma página (`index.html` + `src/main.js` + `src/cenas.js`) que expõe `window.OP`; `tools/capture.mjs` a dirige (`check`, `cues`, `sheet`, `frames`, `video`, `preview`). Voz e tempo vêm de `voice.py` e `words.py` (scripts da fábrica, rodados pelo `lote`). O caso-real **não tem `env.py` nem envelope de fala** (as pessoas não têm boca).
- **Cada vídeo carrega cópia do kit** (`<video>/kit/`) e do tema (`<video>/tema.json`). O código do vídeo só importa de `../kit/` (de `src/`), nunca de `estilos/`; o `fabrica checar` confere. Sem dependências npm: three.js só o vendorizado.
- **O modelo é a melhor referência de uso real** (`modelo/src/cenas.js`, 5 linhas = 7 cenas); a **vitrine** (`vitrine/src/cenas.js`) mostra cada peça isolada, inclusive as que o modelo não usa (rua, corredor, `papel`, `tarjas`, `marcador`, `relogio`, `polaroid` em todos os tipos, os 3 materiais lado a lado, o alerta `invasao`).
- **Câmeras e HUD são cópias do deep-dive/voxel.** Este guia só documenta o que muda; para o detalhe leia `estilos/deep-dive/STYLE.md` (5.2, 5.9, 5.10) e, por ele, `estilos/voxel/STYLE.md` (5.2 câmeras, 5.6 HUD). O personagem (`personagem/humano.js`, `poses.mjs`, `gestos.mjs`) também é cópia do deep-dive (`posar`, `breathe`, `walk`, `gesto`): o caso-real só o usa **sem rosto**, via `pessoas.js`.

## 2. Regras visuais

1. **Uma luz por cena, o resto escuro.** Cada lugar tem UMA luz que manda: a luminária de teto (servidores, escritório, corredor da frente, rua = o poste, parede = a SpotLight da frente) **ou** a tela do computador (quarto). O resto é preenchimento fraco (`HemisphereLight`) e detalhe sem luz (LEDs, janelas, faróis). Dois casos que parecem exceção e não são: o **corredor tem 2 luminárias** (a da frente firme, a do fundo com defeito, que pisca) e a **rua e os servidores têm preenchimento frio fraco** (céu azulado, visor da porta de saída); a luz principal continua uma.
2. **Vermelho = a pessoa do caso / o ataque + as marcas de evidência.** Vermelho aparece **só** em: a pessoa do caso (`pessoa('alvo')`), as conexões do mapa e as cidades ligadas, o marco atual da linha do tempo, o alarme (LEDs vermelhos), os alertas `bloqueado` e `invasao` da tela (e a luz da tela virando vermelha), as telas bloqueadas do escritório, o círculo vermelho, o carimbo da ficha, o barbante e os alfinetes da parede, e a **linha 2 da data datilografada**. Nada mais é vermelho (nem fundo, nem HUD).
3. **Verde `#3CFF7A` = a marca e as telas.** Destaque da legenda, texto das telas, luz da tela, HUD (`pilula`, `rotuloGuia`, `cartaoFinal`). O alerta `ok` ("SISTEMA ATUALIZADO") é verde. Verde e vermelho não se misturam num mesmo elemento.
4. **Pessoas sem rosto, nunca sangue nem arma.** Nada de rosto, olhos ou boca (o `face()` nunca é chamado). Sem sangue, sem armas, sem violência. A pessoa é silhueta: `testemunha` (quase preta com borda vermelha), `alvo` (brasa acesa) ou `memoria` (fantasma).
5. **Vítimas são testemunhas.** Quem sofre o ataque (as pessoas do escritório, quem anda na rua) é `testemunha`. Quem resolve ou protagoniza pode ser o `alvo` (no modelo, o pesquisador que parou o ataque é o `alvo`), **mas nem o roteiro nem o alerta verde podem sugerir que ele é o culpado**: o alvo é "a pessoa do caso", não "o criminoso". Nas polaroides da parede do modelo não há pessoas (`'tela'`, `'casa'`, `'vazio'`) justamente para a parede de "suspeitos" não apontar ninguém.
6. **Planos lentos de 3 a 5 s, câmera sempre andando.** Empurrão ou travelling suave por `eio(lt / d)` em todo plano. Plano **menor que 3 s só quando o corte está amarrado a uma palavra** (o mapa do modelo corta em "duzentos"; a linha do tempo corta em "correção"); nunca menos de 1 s. No máximo 2 planos por linha falada.
7. **Grão de filme e vinheta por cima de tudo.** Toda cena termina com `filme(t)` (vinheta + grão), antes das legendas. O grão troca 24 vezes por segundo e é função de `t`.
8. **Lente aberta em lugar escuro.** Cenas 3D com `fov: 58` (a vitrine e o modelo passam `{ fov: 58 }` ao `render`), fov 40 nos closes, fov 34 nos planos com recorte de parede. Ver armadilhas (9).
9. **Todo quadro é função pura de `t`.** Cada `draw` refaz pose, visibilidade, material e luz; nenhum contador global (9).
10. **Layout vertical** (1080x1920): pílula y 128-220 (`PX 44`), data datilografada em (80, 300), mapa a partir de y ~520-640, cartão final y 620-1020, **legenda y 1560**. Deixe a direita livre no terço inferior (botões do TikTok).
11. **Fade preto** de 0,25 s no começo e 0,4 s no fim (feito pelo `draw` do `main.js`).

## 3. Regras de conteúdo

A Marca B é **educativa**: "como funciona e como se proteger". O caso-real só conta **casos reais**.

1. **Caso real com fonte primária.** Todo vídeo tem `sources` com pelo menos 1 fonte de verdade (órgão, empresa afetada, boletim de segurança, relatório oficial, imprensa de peso), com a data. O vídeo-modelo cita Europol (declaração do diretor), o National Audit Office (consultas canceladas), o boletim de segurança da Microsoft (a correção, 2 meses antes) e o NCSC/BBC (como o ataque foi freado). Número na tela sem fonte em `sources` não entra.
2. **Nada de passo a passo, ferramenta, exploit ou código real.** Proibido: ensinar a invadir, nomes ou links de ferramentas de ataque, pirataria, cheats, código de ataque na tela. O vídeo-modelo cita **"WannaCry"** (o nome do ataque, que é notícia) e o **boletim de correção**, **nunca o nome do exploit**. A tela só mostra o código genérico de `kit/codigo.mjs` (vocabulário fixo, os testes varrem os termos proibidos). A marca ainda tem uma lista `proibido` (`marcas/hacker/marca.json`) que o `fabrica checar` aplica ao roteiro.
3. **Termine em proteção.** A última linha é sempre o que o espectador faz (atualizar o sistema, ativar a verificação em 2 etapas...) mais a chamada final (a variante por plataforma).
4. **Respeito às vítimas.** Hospitais, pacientes, empresas, pessoas: mostre o impacto sem exibir sofrimento, sem dados pessoais, sem rosto. Vítima é testemunha (2, regra 5).
5. **Nunca acusar pessoa viva sem condenação ou admissão pública.** Se a pessoa não foi condenada nem admitiu, ela **não** é nomeada como culpada, nem pelo texto, nem pela imagem (o `alvo` vermelho não vale como acusação), nem pelo alerta. Prefira "o ataque", "os responsáveis, segundo a investigação", "um pesquisador". Quem **resolveu** o caso pode ser citado como o protagonista que o resolveu.
6. **Números e datas.** Na tela: algarismos sempre (`200 mil`, `150`, `2 meses`, `12 MAI 2017`); a voz fala por extenso. Datas datilografadas no formato `12 MAI 2017` (`dataCurta`).

## 4. Tema

`temas/tema.json` (única, copiada para `<video>/tema.json`):

```json
{ "nome": "tema",
  "cores": { "texto": "#EAE3D2", "destaque": "#3CFF7A", "contorno": "#06070A", "hud": "#3CFF7A", "painel": "#0B0F0E", "perigo": "#E4322B",
             "alvo": "#E4322B", "brasa": "#8E1D1A", "papel": "#D8CFBA", "pasta": "#B8955A", "luz": "#F1D9A6", "fita": "#E9C46A", "vazio": "#0A0C11" },
  "fontes": { "sans": "Inter", "mono": "FreeMono" } }
```

- As **6 cores base** (`texto destaque contorno hud painel perigo`) são as que `validarTema` exige (`kit/tema.mjs`: `CORES`, `validarTema`, `carregarTema`, `rgba`). As 7 **extras** (`alvo brasa papel pasta luz fita vazio`) são do caso-real e têm fallback em `evidencias.mjs` (o `PADRAO`, os valores do Night File) se o tema não as trouxer.
- Usos: `texto` (legenda, texto do HUD, "lixo" dos mapas), `destaque` (palavra em destaque, código das telas, luz da tela), `hud` (bordas, ícones), `painel` (fundo das telas e dos cartões), `perigo` (carimbo, círculo, conexões, alertas), `alvo` (a pessoa do caso, os alfinetes, o barbante), `brasa` (a memória, a borda da testemunha), `papel` e `pasta` (polaroide, ficha, relatório), `luz` (a poça de luz do fundo e as luminárias), `fita` (marcador, fita da parede), `vazio` (o fundo dos planos 2D), `contorno` (tinta sobre papel).
- Fontes: `sans` (Inter, títulos e rótulos) e `mono` (FreeMono 700, datas, legenda, código). O `main.js` carrega `900 100px Inter`, `800 100px Inter` e `700 100px FreeMono` por nome fixo; trocar `fontes` no tema não basta (mexa no `@font-face` do `index.html` e nos `document.fonts.load`).
- **No boot chame as duas:** `usarTema(tema)` (do `hud.mjs`: pílula, cartão final, rótulo) **e** `usarTemaEvidencias(tema)` (do `evidencias.mjs`: evidências, painéis, tela, monitor, pessoas e lugares leem daqui, por `corDoTema(nome)` e `fonteDoTema(tipo, peso, px)`). O `main.js` do modelo já faz.
- O mundo 3D tem paleta própria dos lugares (neutros azulados escuros); só as cores do tema aparecem nos elementos do caso.

## 5. Tempo e legenda datilografada

**Tempo (`kit/tempo.mjs`)**, igual ao deep-dive e ao voxel (seção 4 do `voxel/STYLE.md`): `const tempo = await carregarTempo('data')`; `tempo.linha(i)`, `tempo.fimLinha(i)`, `tempo.palavra('texto', i, ocorrencia)`, `tempo.fimPalavra(...)`, `tempo.palavrasDaLinha(i)`, `tempo.ultima`, `tempo.duracao`. **Proibido índice global de palavra**: o tempo é sempre preso a uma linha. Exemplos do modelo: `tempo.palavra('vírus', 0)`, `tempo.palavra('hospitais', 1)`, `tempo.palavra('reais', ULT) + 0.15` com `ULT = tempo.ultima`. Palavra ambígua? Use a ocorrência (1-based).

Os helpers `cue`, `corte` e `cena` (e os imports) estão no cabeçalho do `cenas.js`, em 6.0.

Convenção das cenas: `montarCenas(E, { tempo, script })` devolve `{ cenas, cues }`; cada cena é `{ id, at, note, draw }` com `draw(lt, d, t, blit)` (`lt` tempo local, `d` duração, `t` tempo do filme, `blit()` copia o 3D para o canvas 2D; evidências e HUD vão **depois** do `blit`).

**Legenda (`kit/legendas.mjs`):**

```js
legendas = planejarLegendas(tempo, script.lines);     // blocos { linha, s, e, palavras: [{ txt, hi }] }
desenharLegenda(legendas, t, tema);                    // por último no draw, depois da cena
```

- `LEGENDA = { y: 1560, size: 86, maxW: 940 }`. **Fonte mono (`tema.fontes.mono`, 700), caixa normal** (a legenda sai como escrita nas `caps`, sem caixa alta), branca (`texto`) com **uma palavra em `destaque` (verde)**, sombra preta, **datilografada**: as letras do bloco surgem uma a uma em 0,35 s (`letrasVisiveis` de `datilografia.mjs`).
- **Caps** (`script.json`): `"caps": "Em *maio | de *2017, | um *vírus"`: blocos separados por `|`, **1 a 3 palavras por bloco, exatamente um `*`** em cada. O `*` marca o destaque. Números em algarismos (`*200 mil`, `*150`) com o **mesmo valor** do falado ("duzentos mil"); o `checar` confere. Palavra de número por extenso é recusada.
- `gruposDaLinha` e `numeros.mjs` são **cópias do motion** (vigiadas, ver 9). Sem `caps`, a legenda se agrupa sozinha a partir do texto.

**Datilografia e datas (`kit/datilografia.mjs`)**, lógica pura:

```js
dataCurta(2017, 5, 12)            // '12 MAI 2017' (lança RangeError se mês/dia fora da faixa); MESES = ['JAN', ..., 'DEZ']
letrasVisiveis(p, total)          // quantas letras já apareceram com progresso p 0..1
datilografar('12 MAI 2017', p)    // o prefixo visível
cursorAceso(t)                    // cursor piscando a 2,5 Hz
```

## 6. Componentes

### 6.0 Cabeçalho do `cenas.js` (ponto de partida dos exemplos)

**Todos os trechos de código da seção 6 são recortes de `modelo/src/cenas.js` (ou de `vitrine/src/cenas.js`, quando dito). O arquivo inteiro é o ponto de partida**: o `novo` já o copia para o vídeo. Os trechos usam os símbolos do cabeçalho abaixo, que é o do modelo (imports das linhas 17-32 do arquivo, mais os helpers de dentro de `montarCenas`):

```js
import * as THREE from 'three';
import { ctx, setCtx, W, H, lerp, seg, eo, eio, eob } from '../kit/motor/lib.js';   // ctx 2D global (setCtx troca), 1080x1920, lerp, seg(t,a,b)=progresso 0..1, easings eo/eio/eob
import { camera } from '../kit/motor/engine.js';                                   // camera(fov) = PerspectiveCamera 1080x1920
import { NOITE } from '../kit/luz.js';
import { pessoa, POSES_CASO, digitar } from '../kit/pessoas.js';
import { misturarPosesCorpo } from '../kit/personagem/poses.mjs';
import { quarto } from '../kit/lugares/quarto.js';
import { escritorio } from '../kit/lugares/escritorio.js';
import { servidores } from '../kit/lugares/servidores.js';
import { paredeDoCaso } from '../kit/lugares/parede.js';
import { pilula, cartaoFinal } from '../kit/hud.mjs';
import { rgba } from '../kit/tema.mjs';
import { ficha, polaroid, circuloVermelho, dataDatilografada, recorteDeJornal, filme, corDoTema, fonteDoTema } from '../kit/evidencias.mjs';
import { mapaMundi, linhaDoTempo } from '../kit/paineis.mjs';
import { desenharTela } from '../kit/tela.mjs';
import { linhasDeCodigo } from '../kit/codigo.mjs';
// a vitrine importa ainda: luminaria (kit/luz.js), rua, corredor (kit/lugares/), papel, tarjas, marcador, relogio (evidencias.mjs)

const V3 = (x, y, z) => new THREE.Vector3(x, y, z), lerpV = (a, b, k) => a.clone().lerp(b, k);   // vetor e interpolação de vetores

/** fundo `vazio` com a única luz da cena 2D: uma poça quente em (x, y) */
function fundo(x = 540, y = 900, raio = 900, forca = 0.12) {
  ctx.fillStyle = corDoTema('vazio'); ctx.fillRect(-300, -300, W + 600, H + 600);
  const g = ctx.createRadialGradient(x, y, 0, x, y, raio); g.addColorStop(0, rgba(corDoTema('luz'), forca)); g.addColorStop(1, rgba(corDoTema('luz'), 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
/** empurrão lento da câmera 2D em volta de (cx, cy): escala 1 → 1 + a ao longo da cena */
function empurrar(lt, d, cx = 540, cy = 900, a = 0.04) {
  const s = 1 + a * eio(lt / d); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
}

export function montarCenas(E, { tempo, script }) {            // E = o motor 3D (makeEngine, criado no main.js)
  const cenas = [], cues = [];
  const cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const corte = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);          // um corte por linha, um pouco antes da fala
  const cena = (at, id, note, draw) => {                                // toda cena termina com o filme por cima
    cenas.push({ id, at, note, draw: (lt, d, t, blit) => { draw(lt, d, t, blit); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; filme(t); } });
    return at;
  };
  const cam = camera(34);                                               // a câmera 3D única; render e olhar (6.2) a usam
  // ... render e olhar (6.2), os lugares (6.4) e as cenas
  return { cenas, cues };
}
```

Variáveis locais que os trechos usam sem definir (do modelo ou da vitrine; as só da vitrine levam **(vitrine)**):

| nome | o que é |
|---|---|
| `lt`, `d`, `t`, `blit` | argumentos do `draw`: tempo local, duração da cena, tempo do filme, copia o 3D para o canvas 2D |
| `k` | progresso da câmera: `const k = eio(lt / d)` (`kj`, `kf`, `kc`, `kb`, `ki`, `ka`: progressos de outros elementos, sempre um `seg(...)` entre 0 e 1) |
| `at0b`, `at1` ... `at4`, `at2b` | início de cada cena (`corte(i)`, ou a palavra de corte menos 0,08 s: `at0b = tempo.palavra('duzentos', 0) - 0.08`) |
| `fim0`, `fimTL`, `fim3` | fim da fala da linha (`tempo.fimLinha(0)`, `tempo.fimLinha(2)`) ou o início da próxima cena (`tempo.linha(4) - 0.08`) |
| `tVirus`, `tComp`, `tHosp`, `tCanc`, `tCons`, `tFalha`, `tCorr`, `tReg`, `tSis`, `tCartao`, `tClique` | instantes de palavras: `tempo.palavra('vírus', 0)`, ..., `tempo.palavra('registrando', 3)`, `tempo.palavra('mais', ULT) - 0.3`, `tempo.palavra('reais', ULT) + 0.15` |
| `ULT`, `TXT`, `MARCA` | `tempo.ultima`, `script.lines.at(-1).text`, `script.marca_nome \|\| 'Hacker'` |
| `S`, `O`, `Q`, `PW`, `R`, `C` | os lugares, criados uma vez em `montarCenas`: `servidores({ racks: 6 })`, `escritorio({ fileiras: 3, mesasPorFileira: 4 })`, `quarto()`, `paredeDoCaso(fotos)`, `rua()` **(vitrine)**, `corredor()` **(vitrine)** |
| `FIM_S`, `TELA_Q`, `MESAS` | `S.pontos.corredor[1]`; o ponto 3D da tela do quarto (`Q.monitor.tela.malha.getWorldPosition(new THREE.Vector3())`); `[1, 5]`, as 2 mesas com testemunha |
| `pesquisador`, `sentadas`, `passante`, `alvoC`, `TRIO` | as `pessoa(...)` de cada cena, criadas uma vez (6.1); `passante`, `alvoC` e `TRIO` são só da vitrine |
| `DESTINOS` | `['Madri', 'Moscou', 'Nova York', 'Mumbai', 'São Paulo', 'Pequim', 'Joanesburgo', 'Sydney']` (cidades de `CIDADES`) |
| `EVENTOS`, `JORNAL`, `SEED_TELA`, `LINHAS_TELA`, `MARCADA` | os dados da linha do tempo, `{ x: 540, y: 860, s: 1.3, rot: -0.04 }` do recorte, e a tela do círculo (6.3) |
| `j`, `i` | índice de pessoa (`sentadas.forEach((h, j) => ...)`) e da mesa dela (`MESAS[j]`) |

### 6.1 Pessoas (`kit/pessoas.js`)

`pessoa(tipo, opcoes)` = `new Human({ ...opcoes, face: false })` com **um material só** em todas as partes. Três tipos (`'testemunha'`, `'alvo'`, `'memoria'`; outro lança erro):

| tipo | material | uso |
|---|---|---|
| `'testemunha'` | `materialTestemunha()`: quase preto (`#07080B`) com borda vermelha (fresnel) | quem estava lá; as vítimas |
| `'alvo'` | `materialAlvo(i = 2.2)`: vermelho brasa aceso **com volume** (emissive por N·V) | a pessoa do caso (o único vermelho cheio) |
| `'memoria'` | `materialMemoria()`: o shader da testemunha em brasa, a 45% de opacidade, com pré-passada de profundidade | lembrança, quem já não está |

**O alvo tem volume e intensidade ajustável por tomada.** O emissive varia com N·V: `VOLUME_ALVO = { centro: 0.6, borda: 0.35 }` (60% no centro do corpo de frente para a câmera, 100% nas bordas, mais uma borda quente puxada para laranja); `uCentro`/`uBorda` ficam em `material.userData.volume`. A intensidade (`emissiveIntensity`) **depende do plano**: `close ~0.85`, **corpo inteiro ~1.4** (padrão do material: 2.2). A cena ajusta **todo quadro**, na parte 0 (todas as partes dividem o mesmo material):

```js
pesquisador.parts[0].material.emissiveIntensity = 0.85;       // close (modelo, cena quarto): menos emissive, senão o vermelho lava
TRIO[1].h.parts[0].material.emissiveIntensity = 1.4;          // corpo inteiro sob a luminária (vitrine, cena materiais)
alvoC.parts[0].material.emissiveIntensity = 1.3;              // corredor, de frente ao fundo
```

**Poses** (`POSES_CASO`, no formato do `POSES_CORPO`, para `h.posar(POSES_CASO.x, k)`; sentadas usam `hipsY` **0.53**, que põe a coxa num assento de 0,43 m = `ALTURA_ASSENTO`, pés no chão; o 0,66 do Night File era de outro corpo):

| pose | o que é |
|---|---|
| `sentadoDigitando` | curvado para a tela, antebraços quase na horizontal, mãos no teclado |
| `sentadoOlhando` | encostado, cabeça erguida para a tela, mãos paradas na beira da mesa |
| `emPeOlhando` | em pé, parado, cabeça um pouco erguida (olhando a luz/tela) |
| `deCostas` | igual a em pé; quem vira de costas é o grupo (`h.group.rotation.y`) |
| `bracosCruzados` | braços cruzados na frente do peito |

`digitar(h, t, k = 1)` põe as mãos no teclado: palma para baixo (pronação 90°), dedos caídos (flexão 18°) e soma o ritmo de `digitacaoNoTempo(t)` nos cotovelos e punhos; `k = 0` deixa a pose como veio. **Chame depois do `posar`** (o `pose()` zera os punhos). Exemplos do modelo:

```js
// duas testemunhas olham e param de digitar quando a tela bloqueia
h.posar(misturarPosesCorpo(POSES_CASO.sentadoDigitando, POSES_CASO.sentadoOlhando, eo(seg(t, tHosp + 0.15 + i * 0.18, tHosp + 0.8 + i * 0.18))));
digitar(h, t + j, 1 - kb);
// o pesquisador no quarto: parou de digitar quando o alerta ok entra
pesquisador.group.position.copy(Q.pontos.mesa); pesquisador.group.rotation.set(0, Math.PI, 0);
pesquisador.posar(POSES_CASO.sentadoDigitando); digitar(pesquisador, t, 1 - seg(t, tReg, tReg + 0.4));
// em pé, respirando (vitrine)
h.posar(POSES_CASO.emPeOlhando); h.breathe(t, 1);
// andando pela calçada (vitrine): 1 ciclo do walk = 2 passos de 0,7 m
passante.walk(anda / PASSO * Math.PI * 2, 1);
```

- `misturarPosesCorpo(a, b, k)` (de `personagem/poses.mjs`) mistura duas poses para o `posar`.
- A pessoa sentada vai **na mesma posição e rotação da cadeira**: `group.position.copy(Q.pontos.mesa); group.rotation.set(0, Math.PI, 0)` (de frente para a tela, olhando −z).
- **Crie cada `pessoa` uma vez, fora do `draw`** (a escultura é cara e tem cache pelas opções; trocar as opções por quadro esculpe de novo). Duas pessoas iguais no mesmo lugar? Crie duas (a vitrine cria `alvo` e `sombra`).
- Para variar a cor de uma pessoa, mexa no material **dela** (`sombra.parts[0].material.color.set('#0A0B0D')`); a vitrine faz o "alvo apagado" assim, e sobe `emissiveIntensity` e `userData.volume.uCentro.value` junto com o alerta.

### 6.2 Luz (`kit/luz.js`)

```js
NOITE = { exposure: 1.25, bloom: 0.85, bloomThreshold: 0.55, vignette: 0.6, grain: 0.05, warm: 0 }   // o look do E.render em lugar escuro
cone(h, r, cor, a)                                  // cone de luz visível (volume falso, aditivo), ápice em (0,0,0) apontando para baixo
luminaria(scene, x, y, z, I, { cone })              // luminária de teto: SpotLight quente com sombra + disco aceso + cone → { luz, cone, disco }
brilhoDeTela(pai, pos, cor, I, frente)              // luz da tela: SpotLight larga, sem sombra, virada para a frente dela
```

- `NOITE` é espalhado no render e sobrescrito por cena: `{ ...NOITE, focus, aperture: 0.0012, t, ...extra }`. O render do modelo (copie):

```js
const cam = camera(34);
const render = (scene, foco, t, extra = {}) => {
  const fov = extra.fov || 34; if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  E.render(scene, cam, { ...NOITE, focus: cam.position.distanceTo(foco), aperture: 0.0012, t, ...extra });
};
const olhar = (pos, alvo) => { cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(alvo); cam.updateMatrixWorld(true); };
```

  O `foco` é o ponto onde o DOF fica nítido (o resto desfoca). Nos closes, `aperture: 0.0016` ou `0.0025` e `bloomThreshold: 0.8` (o modelo, no quarto) seguram o bloom da tela.
- `luminaria`: o cone tem **1,35 m de raio no chão**; a câmera nunca entra nele (9). A SpotLight faz sombra (2048). `escritorio` e `servidores` acendem só uma; o `corredor` tem duas (6.4).
- `brilhoDeTela`: o vendor não traz o `RectAreaLightUniformsLib`, então a luz da tela é uma `SpotLight` larga (~70°, 3,5 m de alcance) que sai do centro da tela e só ilumina o que está na frente (rosto, mãos, mesa). `monitor()` já a cria.

### 6.3 Monitor e tela (`kit/monitor.js`, `kit/tela.mjs`)

**`desenharTela(g, w, h, { seed, linhas, k, cursor, alerta, kAlerta, t })`** (`tela.mjs`) desenha em qualquer contexto `g`, de (0,0) a (w,h): fundo `painel`, código genérico de `codigo.mjs` digitado em verde conforme `k` (0..1), cursor piscando por `t` e, por cima, o alerta entrando com `kAlerta` (0..1). **Devolve a chave do conteúdo** (função só do que aparece: `n` letras digitadas, cursor aceso, alerta, `kAlerta` arredondado em 30 passos). Alertas: `'bloqueado'` (cadeado, vermelho: "SEUS ARQUIVOS FORAM BLOQUEADOS"), `'invasao'` (triângulo, vermelho: "ACESSO NÃO AUTORIZADO"), `'ok'` (visto, **verde**: "SISTEMA ATUALIZADO"); tipo desconhecido lança erro. Em tela cheia (canvas principal) o modelo faz:

```js
desenharTela(ctx, W, H, { seed: 7, linhas: 24, k: lerp(0.55, 1, seg(lt, 0, Math.max(0.5, tFalha - at2))), t });
```

**`monitor({ w, h, base, seed })`** (`monitor.js`) é o monitor 3D com a tela viva: moldura escura, tela `CanvasTexture` de **512×320** (`TELA_PX`) e a luz da tela virada para a frente. Devolve `{ group, tela: { canvas, textura, malha }, atualizar(t, opcoesDaTela), brilho, halo }`. O grupo olha para +z; com `base: true`, a origem é o ponto do tampo debaixo do pé.

```js
M.atualizar(t, { linhas: 10, k: 1, cursor: false, alerta: 'bloqueado', kAlerta: 1 });   // mesmas opções do desenharTela
```

- **A textura só sobe quando a chave muda** (`textura.needsUpdate` só se `desenharTela` devolveu chave nova): chamar `atualizar` todo quadro é barato. Nunca mexa na `textura` por fora.
- A luz da tela é verde (`destaque`, 2,4) e vira **vermelha** (`perigo`) e mais forte (5) conforme `kAlerta` com alerta que não é `ok`; o `halo` (`PointLight` fraca) devolve um pouco de luz para a parede de trás. Os lugares já criam e animam os monitores; você só passa as opções (`Q.atualizar(t, { tela: ... })`).

**Código genérico (`kit/codigo.mjs`):** `VOCABULARIO` (linhas prontas de verificação, carregamento, status, backup e fila, em português), `linhasDeCodigo(seed, n)` (n linhas determinísticas por semente), `alertaGenerico(tipo)` → `[título, subtítulo]`, `TERMOS_PROIBIDOS` (os testes varrem o vocabulário e os alertas). **Nunca escreva código real na tela**: se precisar de outra frase, ela entra no `VOCABULARIO` (e passa pelo teste).

**Círculo sobre uma linha da tela.** A posição da linha depende do layout do `desenharTela` (margem 7%, fonte pela largura de 44 colunas). **Reaproveite a conta do modelo**, com os mesmos `linhas` e `seed` da tela:

```js
const SEED_TELA = 7, LINHAS_TELA = 24, MARCADA = 17;     // índice 17 do seed 7 (aparece como "18" na numeração da tela): "if (tentativas > limite) {"
const m = Math.min(W, H) * 0.07, px = Math.min((H - 2 * m) / (LINHAS_TELA + 1) / 1.35, (W - 2 * m) / (44 * 0.6)), lh = px * 1.35;
const yMarcada = m + (MARCADA + 1) * lh - px * 0.35, xCod = m + 4 * 0.6 * px, txtMarcada = linhasDeCodigo(SEED_TELA, LINHAS_TELA)[MARCADA];
// no draw, depois do desenharTela:
ctx.font = fonteDoTema('mono', 700, px); const larg = ctx.measureText(txtMarcada).width;
circuloVermelho(xCod + larg / 2, yMarcada, larg / 2 + 50, lh * 0.95, eo(seg(t, tFalha, tFalha + 0.6)));
```

Mudou `linhas` ou `seed`? Refaça a conta com os novos valores. O empurrão de câmera (`empurrar`) tem de acontecer **em torno do mesmo ponto** (`yMarcada`) para o círculo continuar na linha.

### 6.4 Os 6 lugares (`kit/lugares/*.js`)

Cada lugar é uma função que devolve `{ scene, pontos, atualizar(t, opcoes) }` (mais os extras abaixo). **Crie cada lugar uma vez, fora do `draw`** (`montarCenas`), e chame `atualizar(t, ...)` todo quadro (puro: tudo sai de `t` e dos parâmetros). As cenas ficam em `scene` (uma por lugar); pessoas entram com `Q.scene.add(h.group)`.

| lugar | chamada | `atualizar(t, ...)` | pontos |
|---|---|---|---|
| quarto | `quarto()` | `{ tela, abajur }` (`tela` = opções do `desenharTela`; `abajur` 0 = apagado) | `mesa`, `porta`, `janela`; também `monitor`, `cadeira` |
| escritório | `escritorio({ fileiras, mesasPorFileira })` | `{ telas: (i) => opcoes, luz, piscar }` | `cadeiras[i]`, `lampada`, `corredor: [entrada, fundo]`; também `monitores[i]`, `luminaria` |
| servidores | `servidores({ racks })` | `{ alarme }` 0..1 | `corredor: [entrada, fundo]`, `lampada`, `leds` |
| rua | `rua()` | `{ chuva, carro }` 0..1 (`carro` fora de 0..1 = escondido) | `poste`, `calcada: [esq, dir]`, `janelas` |
| corredor | `corredor()` | `{ piscar }` 0..1 | `lampadas: [frente, fundo]`, `fundo`, `entrada`; também `luminarias` |
| parede do caso | `paredeDoCaso(fotos)` | `{ barbante }` 0..1 | `pinos[i]` (fica em `P.pinos`, não em `pontos`) |

- **Quarto** (pequeno, de madrugada): mesa com o computador na parede do fundo (z −1,8), cadeira, cama e janela de persiana com a luz fria fraca da rua (x +1,8), porta com a fresta de luz do corredor (x −1,8). **A luz é a tela do monitor** (verde; vermelha no alerta); o abajur é fraco e opcional (o modelo apaga: `abajur: 0`). Exporta também os móveis `mesa({ w, d, cor })`, `cadeira({ cor })`, `teclado()` e as alturas `ALTURA_MESA` (0,74) e `ALTURA_ASSENTO` (0,43). Câmera do modelo (por cima do ombro, aproximando da tela):

```js
const Q = quarto(), pesquisador = pessoa('alvo'); Q.scene.add(pesquisador.group);
const TELA_Q = Q.monitor.tela.malha.getWorldPosition(new THREE.Vector3());         // o foco do DOF
Q.atualizar(t, { tela: { linhas: 10, k: seg(lt, 0, Math.max(0.5, tReg - at3)), cursor: true, alerta: 'ok', kAlerta: seg(t, tReg, tReg + 0.4) }, abajur: 0 });
olhar(lerpV(V3(0.95, 1.85, 1.0), V3(0.7, 1.72, 0.45), k), lerpV(V3(-0.1, 0.98, -1.45), V3(-0.06, 1.02, -1.5), k));
render(Q.scene, TELA_Q, t, { fov: 40, aperture: 0.0016, bloomThreshold: 0.8 }); blit();
```

- **Escritório** (aberto, à noite): fileiras de mesas com monitores dos dois lados de um corredor central (x = 0, correndo em −z), divisórias baixas (1 m), janelões da cidade ao fundo e **UMA luminária de teto acesa** no meio, com cone (as outras estão apagadas). `monitores[i]` é fileira a fileira (a 0 é a mais perto da entrada), da esquerda para a direita; `cadeiras[i]` é onde senta a pessoa da mesa `i` (rotação y = π). `piscar` é a força do defeito da luminária (`piscaLampada`). Exemplo do modelo (as telas bloqueando uma a uma):

```js
const O = escritorio({ fileiras: 3, mesasPorFileira: 4 }), MESAS = [1, 5];
const bloqueio = (i, t) => seg(t, tHosp + i * 0.18, tHosp + 0.25 + i * 0.18);
O.atualizar(t, { telas: (i) => ({ linhas: 10, k: 1, cursor: false, alerta: 'bloqueado', kAlerta: bloqueio(i, t) }), luz: 1, piscar: 0 });
olhar(lerpV(V3(0.35, 1.62, 3.7), V3(0.3, 1.55, 2.6), k), lerpV(V3(-1.25, 1.0, -1.2), V3(-1.2, 1.0, -1.9), k));
render(O.scene, O.pontos.cadeiras[MESAS[1]].clone().add(V3(0, 1.0, 0)), t, { fov: 58 });
```

- **Servidores**: dois lados de racks altos com portas de grade, piso elevado molhado, bandejas de cabo. **A luz é a luminária do meio do corredor** (com cone); no fim, o visor da porta de saída deixa entrar uma luz fria fraca, e há preenchimento frio fraco. Os LEDs (verdes, ~70% acesos, mudando 8×/s) são detalhe, não luz; com `alarme > 0` uma parte deles vira vermelha e pisca (`estadoDoLed`). Travelling do modelo (gancho): `olhar(lerpV(V3(0.22, 1.5, 3.0), V3(0.14, 1.46, 2.1), k), lerpV(V3(-0.12, 1.15, FIM_S.z), V3(-0.06, 1.12, FIM_S.z), k))` com `FIM_S = S.pontos.corredor[1]` e `S.atualizar(t, { alarme: eo(seg(t, tVirus, tVirus + 0.3)) })`. Close nos LEDs (vitrine): câmera rente à porta do rack, foco curto (`aperture: 0.0025, maxblur: 0.01, exposure: 1.5`) e foco em `V3(-0.65, 1.2, -1.05)`.
- **Rua**: noite de chuva, chão molhado (reflete o poste), calçada de cá com o poste aceso e a de lá terminando em prédios com 3 janelas acesas. **A luz é o poste** (luminária com cone), mais um preenchimento frio fraco do céu. Feita para ser vista da calçada de cá, olhando para −x (câmera em x ≈ 6, z ≈ 2,5). A pessoa anda pela calçada (`pontos.calcada`), e `carro` 0..1 faz um carro passar ao fundo com os faróis acesos (detalhe, não luz). Câmera da vitrine: `olhar(lerpV(V3(6.4, 1.55, 2.5), V3(5.8, 1.52, 2.4), k), V3(-4, 1.9, -0.7))`.
- **Corredor**: corredor comprido de prédio (portas dos dois lados, porta do fim em z −18,9). **Tem 2 luminárias**: a da frente firme (a luz da cena) e a do fundo, com defeito, que pisca (`piscaLampada`: luz, cone e disco caem juntos). `piscar` 0..1 é a força do defeito. Cena da vitrine: o alvo parado ao fundo, de frente, **fora do cone de trás** (`Z_ALVO = C.pontos.lampadas[1].z + 1.9`), câmera aproximando devagar.
- **Parede do caso** (`paredeDoCaso(fotos)`): quadro de cortiça 4 × 5,2 m numa parede escura, 5 fotos presas com alfinetes vermelhos, 2 fichas de anotação com fita e o **barbante** vermelho ligando as fotos, fio a fio (`trechoDoFio`). **A luz é uma SpotLight quente da frente.** `fotos` são canvases (de 1 a 5, ciclando). O quadro fica em z = 0, olhando +z. **As fotos são geradas uma vez, em `montarCenas`, com `setCtx` em `try/finally`** (as funções de evidência desenham no `ctx` global; ver 9). Cópia do modelo:

```js
const fotoDaParede = (tipo) => {
  const c = document.createElement('canvas'); c.width = 360; c.height = 420;
  const g = c.getContext('2d'), antes = ctx; setCtx(g);
  try { g.fillStyle = corDoTema('papel'); g.fillRect(0, 0, 360, 420); g.save(); g.translate(180, 210); g.scale(1.5, 1.5); polaroid(0, 0, 1, 0, tipo); g.restore(); }
  finally { setCtx(antes); }                   // o ctx global volta para o canvas do vídeo mesmo se o desenho lançar
  return c;
};
const PW = paredeDoCaso(['tela', 'casa', 'tela', 'vazio', 'tela'].map(fotoDaParede));
PW.atualizar(t, { barbante: seg(lt, 0.1, 1.8) });
olhar(lerpV(V3(0.4, 0.3, 9.5), V3(0.2, 0.2, 7.6), k), V3(0, 0.2, 0));
render(PW.scene, V3(0, 0.2, 0), t, { bloom: 0.4 });
```

### 6.5 Evidências 2D (`kit/evidencias.mjs`)

Desenhadas no canvas 2D (1080×1920) **por cima do 3D e por baixo da legenda**. Cores e fontes do tema; tudo função de `p`/`k`/`t` (borda rasgada e grão vêm de `rnd` com semente fixa). Funções de apoio: `usarTemaEvidencias(tema)`, `corDoTema(nome)`, `fonteDoTema(tipo, peso, px)`, `mistura(a, b, k)`, `quebrarTexto(g, texto, maxW)`.

| função | o que desenha |
|---|---|
| `ficha(x, y, s, rotulo, carimbo, kCarimbo, rot)` | pasta do caso com etiqueta datilografada e carimbo **vermelho** que cai de 1,8× a 1× com `kCarimbo`; texto longo encolhe (`medidasDoCarimbo`) |
| `polaroid(x, y, s, rot, tipo)` | polaroide escura; `tipo`: `'escuro'`, `'alvo'` (a silhueta vermelha), `'casa'`, `'tela'` (monitor aceso), `'vazio'` (o lugar sem ninguém); outro lança `RangeError` |
| `papel(x, y, w, h, rot, linhas, k)` | folha com linhas `[[texto, tamanho, cor, dy]]`; `k` = escala de entrada |
| `circuloVermelho(x, y, rx, ry, p)` | círculo vermelho à mão que se desenha com `p` 0..1 |
| `dataDatilografada(linha1, linha2, p, x, y)` | data grande em `texto` + linha 2 menor em `perigo` (vermelha), digitadas com cursor |
| `tarjas(x, y, larguras, p)` | tarjas pretas sobre linhas de texto (documento censurado) |
| `marcador(x, y, s, n)` | plaquinha amarela de evidência numerada |
| `relogio(x, y, s, hh, mm)` | relógio de parede marcando `hh:mm` |
| `recorteDeJornal(x, y, s, rot, { titulo, subtitulo, jornal, data }, k)` | recorte amarelado de borda rasgada, entra girando e caindo com `k`; **o nome do jornal é genérico** (`'NOTÍCIAS'`; nunca imite um jornal real) |
| `filme(t, vinheta)` | vinheta + grão de filme (função de `t`); **sempre por último**, antes das legendas |

Exemplos reais (modelo e vitrine):

```js
dataDatilografada('12 MAI 2017', 'SEXTA-FEIRA · 1º DIA', seg(lt, 0.15, 1.6), 80, 300);                        // gancho
ficha(540, lerp(-300, 1000, kf) + 300 * sai, 1.15, 'CASO Nº 2017-05', 'ATUALIZE', eo(seg(t, tSis, tSis + 0.25)), lerp(-0.3, -0.05, kf));   // o carimbo bate em "sistema"
recorteDeJornal(540, 860, 1.3, -0.04, { titulo: 'HOSPITAIS CANCELAM CONSULTAS', subtitulo: 'Sistemas fora do ar em vários hospitais do país', jornal: 'NOTÍCIAS', data: '13 MAI 2017' }, kj);
polaroid(x, y, 1.3 * eob(k), rot, 'alvo');                                                                    // vitrine: as 5 polaroides caindo
papel(X, lerp(1080, Y, k), 820, 600, -0.03, [['RELATÓRIO INTERNO · Nº 0042', 32, '#6A6458', 70], ['SERVIDOR 03 · SALA 2', 42, null, 140]], k);   // vitrine
tarjas(-Wp / 2 + 34, -Hp / 2 + 257, [420], seg(lt, 0.7, 1.1));                                                // vitrine, dentro do translate/rotate do papel
marcador(330, 1320, 1.1 * m1, 1); relogio(830, 330, 0.75, 14, 20);                                             // vitrine
```

- **Círculo sobre o recorte:** o círculo vai **no mesmo referencial do recorte** (`translate` + `rotate` + `scale` iguais aos do jornal) e em coordenadas do jornal: `circuloVermelho(0, 4, 250, 58, p)` cai em volta de CONSULTAS (3ª linha da manchete) no modelo. Mudou a manchete? Refaça a posição.
- O fundo `vazio` + poça de luz e o empurrão lento dos planos 2D são helpers do modelo (`fundo(x, y, raio, forca)` e `empurrar(lt, d, cx, cy, a)`; copie para o `cenas.js`).
- **Pessoas dentro das polaroides** são silhuetas 2D (só aqui): `'alvo'` em vermelho aceso, `'escuro'` em borda de brasa.

### 6.6 Painéis (`kit/paineis.mjs`): mapa e linha do tempo

**`mapaMundi({ x, y, w, h, t, conexoes, p, foco })`**: o mapa-múndi em pontos (a terra por `ehTerra`, grade de 12 px), com as conexões do ataque em vermelho:

- `conexoes`: `[[cidadeA, cidadeB], …]`, **uma depois da outra** conforme `p` 0..1, com um ponto brilhante na ponta; as cidades ligadas ganham ponto vermelho e anel pulsando;
- **`t` é o relógio do pulso dos anéis: passe `t`** (o tempo do filme), não o progresso; `k` é o nome antigo, ainda aceito;
- `foco`: nome de uma cidade com rótulo mono e linha-guia (o mapa fica um pouco mais claro em volta);
- nome de cidade desconhecido lança erro (a lista é `CIDADES` de `mapa.mjs`: `São Paulo`, `Rio de Janeiro`, `Brasília`, `Nova York`, `Washington`, `São Francisco`, `Toronto`, `Cidade do México`, `Buenos Aires`, `Londres`, `Paris`, `Berlim`, `Madri`, `Moscou`, `Kiev`, `Tel Aviv`, `Lagos`, `Joanesburgo`, `Mumbai`, `Pequim`, `Seul`, `Tóquio`, `Sydney`, `Manila`).

```js
// gancho do modelo: 8 conexões saindo de Londres até o fim da linha
mapaMundi({ y: 640, conexoes: DESTINOS.map((c) => ['Londres', c]), p: seg(t, at0b + 0.2, fim0), foco: 'Londres', k: t });
// inserto no quarto, numa caixa menor, com as conexões recolhendo (p de 1 a 0)
mapaMundi({ x: 80, y: 170, w: 920, h: 383, conexoes: DESTINOS.map((c) => ['Londres', c]), p: 1 - seg(t, tReg + 0.5, fim3 - 0.1), foco: 'Londres', k: t });
```

Em `mapa.mjs` (lógica pura): `CONTINENTES`, `CIDADES`, `CAIXA_GRAUS`, `projetar([lon, lat], caixa)`, `ehTerra([lon, lat])` e **`pontoDoArco(a, b, p, curva = 0.25, caixa)`**, que devolve o ponto `p` do arco entre as cidades `a` e `b`. **Passe a caixa do mapa** (`{ x, y, w, h }`): sem ela o arco sai na caixa padrão de graus (360×150), não em pixels. `pontosDoMapa(caixa, passo)` (de `paineis.mjs`) é a grade de pontos de terra, memorizada por caixa.

**`linhaDoTempo({ eventos, p, atual, x0, x1, y, t })`**: a linha se desenha com `p` (0..1), os marcos alternam acima/abaixo (`posicoesNaLinha` de `linha-do-tempo.mjs`), com a **data datilografada** e o rótulo; o marco `atual` fica **vermelho pulsando** (por `t`):

```js
const EVENTOS = [{ data: '14 MAR 2017', rotulo: 'correção' }, { data: '12 MAI 2017', rotulo: 'ataque' }];
linhaDoTempo({ eventos: EVENTOS, p: seg(t, at2b + 0.1, Math.min(fimTL, at2b + 1.3)), atual: 1, y: 720, t });
```

### 6.7 Ritmo (`kit/ritmo.mjs`)

Tudo função pura de `t` e de índices (nada de contador global):

```js
digitacaoNoTempo(t)            // { elL, elR, punhoL, punhoR }: dedos batendo no teclado (±6°); o digitar() usa
ledAceso(i, t)                 // LED i aceso? muda 8×/s, ~70% acesos
estadoDoLed(i, t, alarme)      // 'verde' | 'apagado' | 'vermelho' (com alarme, até 45% dos LEDs piscam em vermelho 3×/s)
piscaLampada(t, forca)         // 1 (acesa) ou 1/9 (queda em rajadas curtas); força 0 nunca pisca
gotaDeChuva(i, t, caixa)       // [x, y] da gota i dentro da caixa, com vento
trechoDoFio(j, n, b)           // quanto do fio j (de n) já apareceu com o barbante em b: os fios entram em ordem
```

Os lugares já usam estes ritmos; você só precisa deles direto para uma luz ou animação própria.

### 6.8 HUD e câmeras (cópias)

`hud.mjs` é a base do deep-dive com mais ícones: **leia `estilos/deep-dive/STYLE.md` 5.9** (e o `voxel/STYLE.md` 5.6) para `pilula`, `manchete`, `etiquetaLenta`, `rotuloGuia`, `cartaoFinal`, `chamadaDaPlataforma`, `escalaQueCabe`, `fmt` e `comCameraLenta`. Diferenças do caso-real:

- **Ícones da `pilula`:** os do deep-dive (`spin stop wind wave globe sun moon pin drop bolinha warn clock`) mais **`cadeado`, `escudo`, `tela`, `servidor` e `bug`**. Usos do modelo: `pilula('tela', 'COMPUTADORES', '200 mil', k)` e `pilula('globe', 'PAÍSES', '150', k)`; para empilhar duas pílulas, a segunda fica 112 px abaixo (`ctx.save(); ctx.translate(0, 112); pilula(...); ctx.restore()`).
- **Cartão final:** igual ao deep-dive (y 620-1020), mas aqui sobre o **plano desfocado** (`ctx.filter = blur(...)` no `blit`) com a ficha saindo. O clique cai numa palavra do fim da chamada presente nas três variantes (`reais`): `tClique = tempo.palavra('reais', ULT) + 0.15` e `cartaoFinal({ marca: MARCA, textoDaUltimaLinha: TXT, k: kc, clique: seg(t, tClique, tClique + 0.35) })`, com `ULT = tempo.ultima`, `TXT = script.lines.at(-1).text` e `MARCA = script.marca_nome || 'Hacker'`.
- **Câmeras:** `cameras.mjs` é cópia byte a byte do deep-dive (`travelling`, `closeBaixo`, `drone`, `orbita`, `CAMERA_LENTA`, `tempoLento`). **O modelo e a vitrine não usam as câmeras nomeadas**: posicionam `cam` à mão com `lerpV(a, b, eio(lt / d))` em posição **e** alvo (`olhar(pos, alvo)`), que dá o travelling de 3-5 s.
- `legendas.mjs` tem `LEGENDA` próprio (6, acima), e o comentário de layout do `hud.mjs` ainda fala em "legendas em y 1480": vale o 1560.

### 6.9 Sons (cues do `tools/mix.py`)

`cue(t, 'tipo', { gain, dur, pan })` com `t` absoluto em segundos; `node tools/capture.mjs cues` grava `data/cues.json` e `python3 tools/mix.py .` mistura com voz e música (`script.json`: `"music": "tension"`). Tudo sintetizado (numpy), nada de amostras. **Cue desconhecido é ignorado com aviso** (`unknown cue type, skipped`). O banco é o do deep-dive **mais `teclado` e `bip`** (novos do caso-real):

| cue | quando usar |
|---|---|
| `teclado` | cliques de teclado em ritmo irregular (9 a 14 por segundo); passe `dur`: `cue(at1 + 0.05, 'teclado', { dur: Math.max(0.3, tHosp + 0.6 - at1), gain: 0.4 })` |
| `bip` | bip curto de 1.000 Hz, 0,12 s: alarme, alerta na tela, conexão chegando (`cue(tReg, 'bip', { gain: 0.6 })`) |
| `whoosh`, `slide` | corte de cena (um por corte, ~0,3-0,4), deslize longo com `dur` (o modelo usa no mapa) |
| `tock`, `tick` | tique seco: datilografia, marco da linha do tempo, polaroide caindo |
| `thud`, `slam` | pancada surda, impacto: jornal caindo, carimbo (`cue(tSis + 0.2, 'slam', { gain: 0.6 })`) |
| `zip` | dado entrando, barbante, círculo |
| `crinkle` | papel (`dur`): relatório, recorte |
| `buzz` | zumbido de lâmpada/servidor, com `dur` (corredor, rua, escritório) |
| `alarm` | alarme (`dur`) |
| `pop` | palavra-chave, clique do botão do cartão final |
| `ding`, `heartbeat`, `scan`, `shatter` | sininho, batida, varredura, estilhaço (pouco usados aqui) |

Os demais do banco (`slowmo`, `chew`, `splash`, `squish`, `stretch`, `chomp`, `spit`, `inhale`, `plop`, `gulp`, `boing`, `bubbles`, `sizzle`, `sparkle`) existem, mas são do corpo e da cozinha do deep-dive: não combinam com este estilo.

**Música `tension`:** `"music": "tension"` no `script.json` põe um drone grave com pulso lento menor e pings (84 BPM) por baixo da voz; o `mix.py` a abaixa sob a voz. Há também o cue especial `tension` (não é som: a janela `dur` troca a música `bed` pela `tension`); o modelo não precisa dele, porque a música já é `tension` do começo ao fim. Receita do ritmo do modelo: `whoosh` no corte, `teclado` enquanto alguém digita, `bip` no alerta, `slam` no impacto (jornal, carimbo), `pop` no clique.

## 7. Forma da história

Um vídeo-modelo = 5 linhas, 25 a 45 s (limites: ≤60 s TikTok, ≤45 s Reels/Shorts). A ordem:

1. **Data e lugar** (gancho, 2 primeiros segundos). A sala escura com a **data datilografada** (`12 MAI 2017`, linha 2 vermelha com o dia da semana ou a hora) e o primeiro número que assusta.
2. **A pessoa ou o ataque.** O mapa com as conexões, a pílula do número. Quem é, onde, quanto.
3. **O que aconteceu, passo a passo, com evidências.** Telas que bloqueiam, o recorte de jornal, o círculo vermelho no que importa. Passo a passo **do que aconteceu**, nunca de como fazer.
4. **O impacto.** Hospitais, empresas, pessoas (testemunhas), em número e em fato.
5. **Como foi parado ou descoberto.** A linha do tempo (da correção ao ataque), a pessoa do caso (o `alvo`) agindo, o alerta verde.
6. **Como se proteger e a chamada.** A parede do caso, o carimbo da ação (`ATUALIZE`) e o cartão final.

Mapa do modelo (WannaCry, ~26 s): **linha 0** gancho (servidores + mapa, `12 MAI 2017`, `200 mil` computadores, `150` países) → **linha 1** impacto (escritório bloqueando, recorte `HOSPITAIS CANCELAM CONSULTAS`, círculo em CONSULTAS) → **linha 2** a falha (tela de código com círculo, linha do tempo `14 MAR 2017 correção → 12 MAI 2017 ataque`) → **linha 3** como foi parado (o pesquisador no quarto, alerta verde `SISTEMA ATUALIZADO`, o mapa recolhendo) → **linha 4** proteção e chamada (parede do caso, carimbo `ATUALIZE`, cartão final com o clique em "reais"). Cortes em palavras: `duzentos` (mapa), `correção` (linha do tempo), `mais` (cartão).

## 8. Como fazer um vídeo novo

1. `node fabrica/bin/fabrica.mjs novo hacker caso-real <slug>`: cria `marcas/hacker/videos/AAAA-MM-DD-<slug>/` a partir do `modelo/` (com cópia do kit e do tema; `title`, `gancho`, `sources` e `postar` vêm vazios, `marca_nome` e `voice` da marca) e põe na fila. O slug tem só letras minúsculas, números e hífens. O id é `AAAA-MM-DD-<slug>`.
2. **Comece copiando `modelo/script.json` e `modelo/src/cenas.js`** (o `novo` já os copiou para a pasta do vídeo: abra os dois e reescreva por cima). O `novo` zera `title`, `gancho`, `sources` e `postar` e mantém as linhas do modelo como exemplo de formato. Exemplo mínimo de `script.json` (o do modelo, resumido a 3 linhas):

```json
{
  "title": "O vírus que trancou 200 mil computadores",
  "lang": "pt", "voice": "pm_alex", "speed": 0.95, "lead": 0.6, "outro": 1.4, "gap": 0.4, "music": "tension",
  "gancho": "Em maio de 2017, um vírus trancou mais de 200 mil computadores em 150 países.",
  "sources": ["Europol, declaração do diretor Rob Wainwright (14/05/2017): mais de 200 mil vítimas em pelo menos 150 países"],
  "postar": { "titulo": "O vírus que parou hospitais 🔒", "descricao": "A correção já existia 2 meses antes. Mantenha seu sistema atualizado.", "hashtags": ["casoreal", "ciberseguranca", "tecnologia"] },
  "capa_t": 1.2,
  "lines": [
    { "text": "Em maio de dois mil e dezessete, um vírus trancou mais de duzentos mil computadores em cento e cinquenta países.", "caps": "Em *maio | de *2017, | um *vírus | *trancou | *mais de | *200 mil | *computadores | em *150 | *países." },
    { "text": "Ele usava uma falha do Windows que já tinha correção havia dois meses.", "caps": "Ele *usava | uma *falha | do *Windows | que já *tinha | *correção | havia *2 meses." },
    { "text": "Atualize seu sistema e segue pra mais casos reais.", "caps": "*Atualize | seu *sistema | e *segue pra | mais casos *reais.", "variantes": {
      "tiktok": { "text": "Atualize seu sistema e segue pra mais casos reais.", "caps": "*Atualize | seu *sistema | e *segue pra | mais casos *reais." },
      "reels": { "text": "Atualize seu sistema e segue pra mais casos reais.", "caps": "*Atualize | seu *sistema | e *segue pra | mais casos *reais." },
      "shorts": { "text": "Atualize seu sistema e se inscreve pra mais casos reais.", "caps": "*Atualize | seu *sistema | e se *inscreve | pra *mais | casos *reais." } } }
  ]
}
```

   Um roteiro de verdade tem **pelo menos 3 linhas** (o `checar` exige), normalmente 5. `lang` é sempre `"pt"`; `voice` `pm_alex`; `speed` 0.95; `gap` 0.4; `music` `"tension"`; `lead` e `outro` são o silêncio antes e depois da fala (s). `sources` leva uma fonte primária por número da tela. `caps`: 1-3 palavras por bloco, um `*` cada, números em algarismos com o mesmo valor do falado. A **última linha** traz `variantes` para `tiktok`, `reels` ("segue") e `shorts` ("se inscreve"). `capa_t` é o instante da capa. Releia o conteúdo (3) antes de seguir.
3. Reescreva `src/cenas.js`: uma ou duas cenas por linha (`cena(corte(i), id, note, draw)`), tempos sempre por `tempo.linha(i)` / `tempo.palavra('x', i)`, cada `draw` refazendo pose, visibilidade, material e luz, e os cues. **Parta do `modelo/src/cenas.js` inteiro** (cabeçalho em 6.0; receitas de lugar, câmera, `render` e intensidade do alvo) e troque só o conteúdo. Esqueleto mínimo, com uma cena e um cue, sobre o cabeçalho de 6.0:

```js
export function montarCenas(E, { tempo, tema, script }) {      // `tema` chega, mas o modelo não o usa (as cores vêm de corDoTema)
  const cenas = [], cues = [];
  const cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
  const corte = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
  const cena = (at, id, note, draw) => { /* igual ao 6.0: chama draw e termina com filme(t) */ return at; };
  const cam = camera(34);
  const render = (scene, foco, t, extra = {}) => { /* igual ao 6.2 */ };
  const olhar = (pos, alvo) => { /* igual ao 6.2 */ };

  const S = servidores({ racks: 6 }), FIM_S = S.pontos.corredor[1];                 // o lugar, criado uma vez
  const tVirus = tempo.palavra('vírus', 0);
  cena(corte(0), 'servidores', 'sala de servidores escura, travelling; alarme em "vírus"', (lt, d, t, blit) => {
    S.atualizar(t, { alarme: eo(seg(t, tVirus, tVirus + 0.3)) });
    const k = eio(lt / d);
    olhar(lerpV(V3(0.22, 1.5, 3.0), V3(0.14, 1.46, 2.1), k), lerpV(V3(-0.12, 1.15, FIM_S.z), V3(-0.06, 1.12, FIM_S.z), k));
    render(S.scene, S.pontos.lampada.clone().add(V3(0, 1.2, 0)), t, { fov: 58 }); blit();
    dataDatilografada('12 MAI 2017', 'SEXTA-FEIRA · 1º DIA', seg(lt, 0.15, 1.6), 80, 300);
  });
  cue(tVirus, 'bip', { gain: 0.45 });                                                // um cue; os demais seguem o mesmo molde

  return { cenas, cues };                                                            // o main.js ordena as cenas por `at` e expõe os cues ao capture
}
```

   **`src/main.js` não muda** (é igual ao do modelo e ao da vitrine): carrega as fontes (Inter 900 e 800, FreeMono 700), o `script.json`, o tema (`usarTema` + `usarTemaEvidencias`), o tempo e as legendas, cria o motor e chama `montarCenas(E, { tempo, tema, script })`. Só mexa nele se mudar a **assinatura** do `montarCenas` ou o **boot** (fonte nova, outro helper de tema); cena nova não pede nada ali.
4. `node fabrica/bin/fabrica.mjs checar <id>`: roteiro, caps contra o texto falado, variantes, duração estimada, lista `proibido` da marca e isolamento. Tem de dar `ROTEIRO OK`.
5. Olhe antes do lote. Na pasta do vídeo: `node tools/capture.mjs check` (lista cenas e legendas, `CHECK OK`), `node tools/capture.mjs sheet review/all.jpg`, `node tools/capture.mjs frames review/q "1.2,8.4"` e `node tools/capture.mjs preview` (`?t=4.2` mostra um instante, `?res=0.6` alivia). **Olhe os quadros** (a folha, os quadros-chave), não só o `CHECK OK`: câmera dentro do cone, vermelho lavado e legenda sobre elemento só se vê no quadro.
6. `node fabrica/bin/fabrica.mjs etapa <id> render` e `node fabrica/bin/fabrica.mjs lote`: renderiza (voz, tempo, `check`, cues, mix, vídeo) e entrega `tiktok.mp4`, `reels.mp4` e `shorts.mp4`, com `capa.jpg` e `postar.md`. `render-variante <id> <plataforma>` re-renderiza só uma. Depois `etapa` para `entregue`, `aprovado`, `postado`.

**Teste rápido do kit:** `node fabrica/bin/fabrica.mjs kits caso-real` monta o modelo numa pasta temporária, checa e renderiza uma plataforma; `kits` sem argumentos testa todos os estilos com kit. Testes unitários: `cd estilos/caso-real && node --test "tests/*.test.mjs"` e `cd fabrica && node --test "tests/*.test.mjs"`.

**Vitrine** (`estilos/caso-real/vitrine/`):

```
node estilos/caso-real/vitrine/preparar.mjs
cd estilos/caso-real/vitrine && node tools/capture.mjs sheet review/vitrine.jpg
```

- **`preparar` copia** o kit, o tema e `vendor/`, `fonts/`, `tools/` e `index.html` do modelo para a vitrine, e roda `gerar-dados.mjs`, que **reescreve `data/lines.json` e `data/words.json`** a partir do `script.json` da vitrine (tempo sintético: linha de 3 s, sem voz). Não edite nada disso. `kit/`, `vendor/`, `fonts/`, `tools/`, `index.html`, `tema.json` e `review/` da vitrine são gitignored: rode `preparar` depois de clonar ou de mexer no kit, e **confira a folha da vitrine**, não só os testes.

## 9. Armadilhas conhecidas

- **Câmera dentro do cone de luz dá quadro chapado.** O cone de uma `luminaria` tem 1,35 m de raio no chão; a câmera dentro dele recebe o volume aditivo na lente e o quadro estoura em cinza-amarelo. Mantenha a câmera fora do raio de 1,35 m em volta de `pontos.lampada` (servidores, escritório, rua: `pontos.poste`) e de `pontos.lampadas` (corredor), no chão e na altura do cone.
- **Lente aberta (`fov` 58) em lugar escuro.** No `render` do modelo a lente padrão é 34° (o `fov` do `camera(34)`; o `render` troca o `fov` e chama `updateProjectionMatrix` quando `extra.fov` vem); em lugar escuro use a lente aberta, `fov: 58`, nos planos gerais (servidores, escritório, rua, quarto de frente), `fov: 40` nos closes (quarto por cima do ombro) e 34 só no plano aberto da parede (o corredor da vitrine usa 46).
- **Close do alvo estoura se o emissive for alto.** Com o `emissiveIntensity` padrão (2,2) o vermelho vira uma mancha salmão (o ACES lava): **close ~0.85, corpo inteiro ~1.4**, ajustado todo quadro (6.1).
- **Sob luz verde de tela o alvo precisa de piso de vermelho.** Com o `uCentro` baixo e `emissiveIntensity` baixo, o corpo escuro da pessoa vira verde-acinzentado pela luz da tela e deixa de ser "a pessoa vermelha". Mantenha um piso de vermelho em `emissiveIntensity` e em `userData.volume.uCentro.value` (a vitrine, na cena `quartoFrente`, usa `emissiveIntensity` 0.3 e `uCentro` 0.12 antes do alerta e sobe para 1.1 e 0.6 com ele).
- **Câmera entre a pessoa e o monitor esconde o alerta.** O alerta está na tela virada para a pessoa; pela frente ele fica de costas para a câmera. Use o **contraplano** (por cima do ombro, atrás da pessoa, olhando para a tela) para o momento do alerta; a vitrine corta em 1,1 s da câmera de frente para o ombro esquerdo (cena `quartoFrente`).
- **O círculo sobre uma linha da tela depende do layout do `desenharTela`** (margem, colunas, `linhas`, `seed`): reaproveite a conta do modelo (6.3) e refaça se mudar `linhas` ou `seed`.
- **Plano menor que 3 s só quando o corte é amarrado a uma palavra** (2, regra 6); nunca menos de 1 s.
- **Fotos e canvases da parede são gerados uma vez, em `montarCenas`, com `setCtx` em `try/finally`.** As funções de evidência desenham no `ctx` global; para desenhar numa foto, troque o `ctx` com `setCtx(g)` e **devolva no `finally`** (senão um erro deixa o vídeo inteiro desenhando na foto). Não gere a foto dentro do `draw` (custa a cada quadro).
- **Textura de tela só atualiza com chave nova.** `monitor().atualizar` só sobe a textura quando a chave do conteúdo muda: a chave tem de ser **função só dos parâmetros** (letras, cursor, alerta, `kAlerta`). Não redesenhe a tela por fora nem adicione ao desenho algo que dependa de outra coisa sem pôr na chave.
- **Nada de contador global; todo quadro é função pura de `t`.** O `draw` pode ser chamado em qualquer ordem (folha, captura, preview). Pose, visibilidade, posição, material, luz e `K.atualizar(t, ...)` são refeitos a cada quadro; grão, LEDs, chuva e piscar vêm de `t`. O que a cena anterior mexeu e o `draw` não devolveu vaza para o quadro seguinte (por exemplo `group.visible` e `emissiveIntensity` de pessoas compartilhadas entre cenas; a vitrine seta `visible` em cada cena).
- **`ctx` sujo entre cenas.** Depois de `ctx.filter = blur(...)`, `globalAlpha`, `setTransform`, `letterSpacing`: restaure (o `cena()` do modelo faz `setTransform`, `globalAlpha = 1` e `filter = 'none'` no fim, e o `main.js` zera `letterSpacing`).
- **Legenda de no máximo 3 palavras, exatamente um `*` por bloco.** 4 palavras é recusada; número por extenso nas caps, ou algarismo de valor diferente do falado, lança erro. Confira com `fabrica checar`.
- **Tempo por índice global de palavra:** proibido; use `tempo.palavra('x', linha)`; palavra ambígua, a ocorrência.
- **Cartão final:** o clique cai numa palavra do fim presente nas três variantes (`reais`), e ele entra sobre o plano desfocado (6.8).
- **Cópias vigiadas pela fábrica.** `fabrica/tests/copias-kits.test.mjs` compara os arquivos copiados: `numeros.mjs` (motion = caso-real, fora a 1ª linha de comentário), `gruposDaLinha` em `legendas.mjs` (motion = caso-real) e, byte a byte contra o deep-dive, `cameras.mjs`, `tempo.mjs`, `tema.mjs`, `motor/lib.js`, `motor/engine.js`, `motor/sdf.js`, `personagem/humano.js`, `personagem/poses.mjs` e `personagem/gestos.mjs`. Mexeu numa cópia, mexa em todas e rode `cd fabrica && node --test "tests/*.test.mjs"`. Não mexa na 1ª linha de comentário "Cópia de...".
- **Windows, Chrome preso (EPERM):** um `capture.mjs`/Chrome headless que sobra de uma captura interrompida trava a próxima (render ou `check` falha com EPERM). Encerre os processos órfãos (só os `chrome.exe` headless e o `node` da captura, pelo Gerenciador de Tarefas ou `Stop-Process`) e rode de novo. O **primeiro quadro de cada sessão do Chrome pode sair diferente** (aquecimento): descarte-o ao comparar quadros.
- **Armadilha do cwd no Windows:** o shell pode voltar para outra pasta entre comandos; comece cada comando com `cd` para a raiz do repo (ou para a pasta do vídeo) e use caminhos absolutos.
- **Fonte fixa:** trocar `fontes` no tema não basta; veja 4.
- **Imports:** o código do vídeo importa só de `../kit/`; um `import` para `estilos/` faz o `checar` reprovar o isolamento.
- **Música e voz:** o `mix.py` abaixa a música sob a voz; sem `data/narration.wav` o resultado sai "captions-only".
