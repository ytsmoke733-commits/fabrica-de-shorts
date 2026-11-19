# Estilo deep-dive (kit)

## 1. O que é o estilo

Vídeos verticais 1080x1920 de "o que acontece se..." sobre o corpo e a ciência: um herói 3D esculpido em SDF (argila lisa, rosto vivo, mãos de verdade), uma casa com ciclo dia/noite, o corpo em raio-x de vidro e mundos internos em macro (estômago, intestino, vaso sanguíneo), com legenda grande em CAIXA ALTA e HUD ciano por cima. Tudo é código: o three.js (vendorizado em `vendor/`) renderiza num canvas WebGL escondido, o canvas 2D recebe o 3D e desenha HUD e legenda, e o Chrome headless captura quadro a quadro. É o estilo do `engolir-chiclete-v2`, transformado em kit.

| item | valor |
|---|---|
| estilo na fábrica | `deep-dive` (`fabrica/lib/estilos.mjs`: motor `fs3d`, modelo `estilos/deep-dive/modelo`, kit `estilos/deep-dive/kit`, tema `tema`) |
| marca | Marca A (conhecimento) |
| tema | `temas/tema.json` (única) |
| vídeo-modelo | `modelo/` ("O que acontece se você engolir um chiclete?", ~15 s, 5 linhas, em português) |
| vitrine | `vitrine/` (uma cena de 2,5 s por peça do kit; não é vídeo para publicar) |
| amostra | `amostra.jpg` |
| testes do kit | `cd estilos/deep-dive && node --test "tests/*.test.mjs"` (hoje 87) |

- **Motor `fs3d`:** igual ao do voxel. O vídeo é uma página (`index.html` + `src/main.js` + `src/cenas.js`) que expõe `window.OP`; `tools/capture.mjs` a dirige (`check`, `cues`, `sheet`, `frames`, `video`, `preview`). Voz, tempo e envelope vêm de `voice.py`, `words.py` e `env.py`.
- **Cada vídeo carrega cópia do kit** (`<video>/kit/`) e do tema (`<video>/tema.json`). O código do vídeo só importa de `../kit/` (de `src/`), nunca de `estilos/`; o `fabrica checar` confere. Sem dependências npm: three.js só o vendorizado.
- **O modelo é a melhor referência de uso real** (`modelo/src/main.js` e `modelo/src/cenas.js`); a **vitrine** (`vitrine/src/cenas.js`) mostra cada peça isolada, inclusive as que o modelo não usa (`vasoSanguineo`, `intestino`, balão, `barriga`, `cocarCabeca`, `apontar`, `segurar`, `sentado`/`dormindo` fora da rotina).
- **Câmeras e HUD são cópias do voxel.** Este guia só documenta o que muda; para o detalhe leia `estilos/voxel/STYLE.md` (5.2 câmeras, 5.6 HUD). Idem a regra de números em algarismos (5.1 do voxel).

## 2. Regras visuais

1. **Personagem esculpido, não blocos.** Pessoa, órgãos e objetos saem do SDF (`kit/motor/sdf.js`: `sphere`, `capsule`, `rbox`, `smin`, `mesh`...). Nada de caixas chanfradas (isso é o voxel) nem de 2D flat.
2. **Luz de cinema.** `E.render(scene, cam, look)` com `look` (`aperture`, `maxblur`, `bloom`, `bloomThreshold`, `vignette`, `focus`). O modelo define `KLOOK` (casa), `XLOOK` (raio-x), `SLOOK` (estômago) e `GLOOK` (intestino/vaso) e sobrescreve por cena.
3. **Legenda:** Inter Black 900, CAIXA ALTA, branca com **contorno `#111` grosso** e **uma palavra** em `destaque` (amarelo). 1 a 3 palavras por bloco, y 1480.
4. **HUD ciano:** pílula, manchete, rótulo-guia e cartão final usam `hud` com fundo `painel` translúcido. Vermelho (`perigo`) só no que é alarmante (o X vermelho do balão).
5. **Raio-x é o mesmo corpo.** Mesma pose e mesma câmera do herói normal, em vidro ciano; a troca é `crossfadeRaioX` com flash ciano.
6. **Todo quadro é função pura de `t`.** Cada `draw` começa com `reset(t)` (ver 7).
7. **Nada parado:** respiração (`breathe`), piscar automático do `face`, câmera sempre andando por `eio(lt / d)` e uma pequena mão-na-câmera (`wob(t)` no modelo).
8. **Layout vertical** (1080x1920): pílula y 128-220, manchete y 250-560, rosto y 640-1280, cartão final y 620-1020, legenda y 1480. Deixe a direita livre no terço inferior (botões do TikTok).
9. **Um corte por linha falada**, um pouco antes da fala: `corte(i) = tempo.linha(i) - 0.08` (a vitrine põe um `whoosh` em cada corte; o modelo, só nos cortes das linhas 1, 2 e 4). A linha 0 corta em 0.
10. **Cor aprovada do chiclete: `#FF6FA8`** (o `GUM_PINK` do v2). O padrão do kit (`bolinha` e `barraEmbalada`) é `#FF7AAE`, então **passe a cor explicitamente** (o modelo usa `const ROSA = '#FF6FA8'`).

## 3. Tema

`temas/tema.json` (única, copiada para `<video>/tema.json`):

```json
{
  "nome": "tema",
  "cores": { "texto": "#FFFFFF", "destaque": "#FFD43B", "contorno": "#111", "hud": "#4FD1E8", "painel": "#09101E", "perigo": "#FF4646" },
  "fontes": { "sans": "Inter" }
}
```

Diferença para o voxel: `contorno` é `#111` (não `#0B1220`). Usos das cores: `texto` (legenda, valores do HUD), `destaque` (palavra em destaque, botão do cartão final), `contorno` (contorno da legenda e letra do avatar), `hud` (bordas, ícones, linha-guia, palavra marcada), `painel` (fundo dos cartões), `perigo` (X vermelho). `kit/tema.mjs` tem `CORES`, `validarTema`, `carregarTema` e `rgba`, como no voxel. O mundo 3D tem paleta própria (o tema só vale para legenda e HUD). No boot chame `usarTema(tema)` (do `hud.mjs`) **e** `usarTemaBalao(tema)` (do `balao.mjs`); o `main.js` do modelo já faz.

## 4. Tempo e envelope de fala

**Tempo (`kit/tempo.mjs`):** igual ao voxel (seção 4 do `voxel/STYLE.md`): `const tempo = await carregarTempo('data')`, `tempo.linha(i)`, `tempo.fimLinha(i)`, `tempo.palavra('texto', i, ocorrencia)`, `tempo.ultima`, `tempo.duracao`. Nunca índice global de palavra. No modelo: `tempo.palavra('chiclete', 0)`, `tempo.palavra('empurrado', 1)`, `tempo.palavra('curiosidades', ULT)`.

**Envelope de fala (`kit/envelope.mjs`)**, lip sync opcional:

```js
import { carregarEnvelope } from '../kit/envelope.mjs';
const fala = await carregarEnvelope('data/env.json');   // t -> 0..1
heroi.face(t, { talk: fala(t) * 0.9 });
```

- `criarEnvelope({ hz, v })` devolve `(t) => 0..1` com interpolação linear; sem dados válidos devolve `() => 0`. `carregarEnvelope(url = 'data/env.json')` nunca lança: arquivo ausente ou inválido vira `() => 0`.
- **`env.json` é opcional.** Sem ele a boca não fala (`talk: 0`), mas o vídeo renderiza. `tools/env.py` o gera de `data/narration.wav` (100 Hz, 0..1, normalizado no percentil 97).
- **O parâmetro do envelope no modelo se chama `fala`:** `montarCenas(E, { tempo, tema, script, fala })` (o `main.js` o monta e passa). Use esse nome nas cenas novas.

## 5. Componentes

Convenção das cenas (igual ao voxel): `montarCenas(E, { tempo, tema, script, fala })` devolve `{ cenas, cues }`; cada cena é `{ id, at, note, draw }` com `draw(lt, d, t, blit)` (`lt` tempo local, `d` duração, `t` tempo do filme, `blit()` copia o 3D para o canvas 2D; o HUD vai **depois** do `blit`). Helpers do modelo:

```js
const cue = (t, type, o = {}) => cues.push({ t: +Math.max(0, t).toFixed(3), type, ...o });
const corte = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
const cena = (at, id, note, draw) => { cenas.push({ id, at, note, draw }); return at; };
```

### 5.1 Legendas (`kit/legendas.mjs`)

Mesma API e mesmas regras do voxel (`planejarLegendas(tempo, script.lines)`, `desenharLegenda(blocos, t, tema)`; caps com 1-3 palavras e exatamente um `*`; números em algarismos). Diferenças: `LEGENDA = { y: 1480, size: 118, maxW: 940, contorno: 22 }` (exportada) e `desenharLegenda` aceita `contorno` (espessura do traço em volta do texto). O código dos números (`kit/numeros.mjs`) e `gruposDaLinha` são cópias do motion (ver 7).

### 5.2 Câmeras (`kit/cameras.mjs`)

**Cópia do voxel** (`travelling`, `closeBaixo`, `drone`, `orbita`, `CAMERA_LENTA`, `tempoLento`; detalhe em `voxel/STYLE.md` 5.2). O modelo quase não usa as câmeras nomeadas: posiciona `cam.position`/`cam.lookAt` à mão com `lerpV(a, b, eio(lt / d))` mais `wob(t)`. Duas lentes: `cam = camera(30)` e `camW = camera(40)` (a 40° cabem as 4 enzimas, a sala e o herói inteiro no cartão final). `comCameraLenta(draw)` vem do `hud.mjs` (ver 5.10).

### 5.3 Personagem (`kit/personagem/humano.js`, `poses.mjs`, `gestos.mjs`)

```js
const heroi = new Human({});                 // opções: skin, shirt, pants, shoes, hair, iris, face (false = sem rosto)
K.scene.add(heroi.group);
```

O `Human` é o do v2 sem mudança, mais os acréscimos do kit. Chame **nesta ordem**: `posar`/`pose`, `breathe`, `face`, `gesto`/`place`/`hand`.

```js
heroi.posar('emPe', 1, { head: [10, -4, 0], spine: [3, 0, 0] }).breathe(t);   // pose nomeada ou solta, k mistura a partir da base; extra sobrescreve
heroi.face(t, { chew: 1, smile: 0.3, brow: 0.5, look: [0, -10] });
heroi.gesto('garganta', 1, t);                                                  // gesto(nome, k, t, { lado })
heroi.segurar('R', objeto);                                                     // = hold(): o objeto vai para o ponto de pegada
heroi.engolir(g);                                                               // g 0..1; invisível fora de 0 < g < 1
```

- **Poses** (`POSES_CORPO` em `poses.mjs`): `emPe`, `reagir`, `barriga`, `sentado`, `dormindo`. `posar(nomeOuPose, k = 1, extra = {})` mistura a partir de `POSE_CORPO_BASE`; para ir de uma pose a **outra** use `misturarPosesCorpo(a, b, k)` e passe o objeto a `posar`. `walk(fase, amt, extra)` anda (o modelo usa `heroi.walk(ph * 18, 1)` na rotina "anda").
- **`face(t, q)`**: `open`, `wide`, `smile` (-1..1), `round`, `chew` (ciclo de mastigar automático), `talk` (0..1, amplitude da boca; ligue ao envelope `fala(t)`), `brow`/`browL`/`browR`, `furrow`, `lid` (-0.4 arregalado ... 1 fechado), `blink` (padrão `true`, piscar automático, função pura de `t`), `look: [yaw, pitch]`. Peça `blink: false` nas cenas de susto e de olho fechado.
- **A pálpebra passa por `face()`.** O `face()` reescreve `lid` a cada chamada, então o `lid` de uma pose (`dormindo` tem `lid: 1`) não vale sozinho: o olho fechado vai no próprio `face`: `heroi.face(t, { lid: 1, blink: false, open: 0.15 })` (cena `dias` do modelo, rotina "dorme").
- **`engolir(k)`** leva o volume de pele do queixo à clavícula. O volume é **estado do `Human`**: o `reset()` por quadro precisa chamar `heroi.engolir(0)`, senão um gole de um quadro aparece nos seguintes. Exemplo do modelo (câmera lenta, `lt` já escalado): `heroi.engolir(seg(lt, G0, G1))`.
- **Gestos** (`GESTOS` em `gestos.mjs`): `repouso`, `garganta`, `barriga`, `cocarCabeca`, `apontar`, `acenar`. `gesto(nome, k, t, { lado })` mistura a partir do repouso por `k` (`t` anima o aceno e a coçada). Cada gesto tem um lado nativo (`lado`); a outra mão **espelha**:

```js
heroi.gesto('barriga', k, t); heroi.gesto('barriga', k, t, { lado: 'R' });     // as duas mãos na barriga
const repouso = (h, lados = ['L', 'R']) => lados.forEach((lado) => h.gesto('repouso', 1, 0, { lado }));   // a mão livre volta ao repouso
```

  - `gestoNoLado(g, 'L' | 'R')` (exportada por `gestos.mjs`) devolve o gesto para a mão pedida: igual se for o lado nativo, senão espelhado em x (`alvo`, `dedos`, `palma` e `pole`). Não altera `g`; lado diferente de `'L'`/`'R'` lança erro.
  - **`pole` é opcional** no gesto: é para onde o cotovelo aponta (no osso). Sem `pole` (`apontar`, `acenar`) vale o padrão do `reach()`.
  - Coordenadas em **osso** (`osso: 'spine' | 'head'`), não do mundo; o gesto acompanha o corpo girado. **Chame depois de `posar` e `breathe`** e lembre de pôr a outra mão no `repouso`, senão ela fica onde a cena anterior deixou.
- **Mãos e braços diretos** (v2): `hand(lado, preset | { curl, thumb, spread }, presetB, k)` com presets `relax flat grip hold pinch fist point scratch`; `place(lado, pontoDoMundo, dedos, palma, { pole })` põe a pegada num ponto (IK); `reach(lado, ponto, opcoes)` põe o pulso; `hold`/`segurar` prende um objeto. Exemplo do modelo (desembrulhando a barra): `heroi.place('L', GL1, [0.7, 0.25, 0.6], [0.2, -0.4, -0.9], { pole: [-1, -1, -0.3] }); heroi.hand('L', 'pinch');`.
- **Raio-x do personagem:** `humanoRaioX()` (5.4) devolve outro `Human` em vidro. Pose o normal e o de vidro com a **mesma função por quadro** (no modelo, `poseSusto(h, t)`).

### 5.4 Corpo (`kit/corpo/raiox.js`, `tubos.js`, `caminho.js`)

```js
const X = xrayStage(E), xh = humanoRaioX(); X.scene.add(xh.group);   // palco escuro com grade + corpo de vidro (cabeça também)
const OR = orgaos(xh);                    // ossos, estômago, coração, pulmões presos a xh.spine
const ES = esofago(); xh.spine.add(ES.mesh);
const bola = bolinha({ cor: ROSA }); xh.spine.add(bola.mesh);
```

- **`xrayStage(E)`** -> `{ scene, update() }`. **`xrayMaterial(cor = '#4FD1E8', forca = 1)`** é o vidro (shader aditivo com fresnel).
- **`humanoRaioX({ cor, forca, ...opcoesDoHuman })`** -> `Human` com `.xmat` e `.cabecaVidro(on)` (o reset do modelo chama `xh.cabecaVidro(true)`).
- **`orgaos(humano)`** -> `{ group, stomach, heart, lungs, ribs, focar(on), update(t, { bpm = 72, respira = 14 }) }`. `focar(true)` esconde costelas, coração e pulmões (para ver esôfago/estômago); o `reset` volta com `focar(false)`. `update(t, ...)` escreve o estado todo (coração `1 + 0.08 * pulso`, pulmões `1 + 0.05 * seno`), então é puro.
- **`esofago({ pontos })`** -> `{ curve, mesh, mat, update(u, amt, t), U1 }`. `u` é a posição do objeto na curva (`u < 0` = sem objeto, tubo liso), `amt` a força da onda peristáltica, `U1 = 0.94` onde o tubo termina (use `Math.min(u, 0.94)`). Reescreve o tubo inteiro a cada `update`.
- **`intestino({ pontos, opacidade = 1 })`** -> `{ curve, mat, mesh }` (intestino delgado enrolado na barriga). **Use `opacidade: 0.6`** quando a bolinha andar dentro dele: com o tubo opaco a bolinha **some** (o tubo, 11,8 mm, é mais largo que a bolinha, 9,5 mm). A vitrine faz `intestino({ opacidade: 0.6 })`.
- **`noCaminho(obj, curva, u)`** põe `obj` no ponto `curva.getPointAt(u)` (`u` preso em 0..1). O objeto precisa ser filho do mesmo pai da curva (`xh.spine`). Exemplo: `noCaminho(bola.mesh, ES.curve, u)`; para o intestino, `noCaminho(bola.mesh, IN.curve, u)`.
- **`crossfadeRaioX(ctx, desenharNormal, desenharRaioX, mix, flash = 0.35)`** dissolve da cena normal para o raio-x. Cada callback renderiza a sua cena e faz o `blit`. Exemplo do modelo:

```js
crossfadeRaioX(ctx, () => { poseSusto(heroi, t); cam.lookAt(alvo); kitchenRender(cam.position.distanceTo(FACE)); blit(); },
  () => { poseSusto(xh, t); /* bolinha, ES.update */ xrayRender(alvo); blit(); }, mix);
```

- **Rótulo no raio-x:** `noSpine(p)` e `naTela(p, cam)` (e o `wob(t)`, a câmera na mão que o modelo soma à posição da câmera) **não são do kit: são helpers locais do `cenas.js` do modelo**. Copie para o seu `cenas.js` (depois de criar `xh`, `V3` e `THREE`):

```js
const noSpine = (p) => { xh.group.updateMatrixWorld(true); return xh.spine.localToWorld(p.clone()); };   // ponto do spine -> mundo (chame depois de posar)
const naTela = (p, c) => { const v = p.clone().project(c); return [(v.x + 1) / 2 * 1080, (1 - v.y) / 2 * 1920]; };   // mundo -> pixel do quadro
const wob = (t, a = 1, f = 1) => V3(Math.sin(t * 0.9 * f) * 0.006 * a, Math.sin(t * 1.3 * f + 1) * 0.005 * a, Math.sin(t * 0.7 * f + 2) * 0.004 * a);   // câmera na mão
```

Use o resultado no `rotuloGuia` (HUD, ver voxel 5.6). Reponha o brilho da bolinha no `reset` (`bola.mesh.material.emissiveIntensity = 1.3`).

### 5.5 Mundos internos (`kit/corpo/estomago.js`, `intestino.js`, `vaso.js`)

Três mundos em macro, cada um com a sua `scene`, renderizados com `E.render(X.scene, cam, look)`. O parâmetro `E` não é usado (mantém a assinatura dos mundos). **Cada `update` reescreve o estado todo** (puro). Passe a posição da câmera em `cam` para a luz acompanhar e o que fica colado na lente sumir.

**`estomagoPorDentro(E, { objeto, enzimas = true, acucar = true, corDesbotada = '#EBC6D2' })`** -> `{ scene, objeto, enzimas, pouso, update(t, c) }`

```js
const fosca = (raio) => { const m = bolinha({ cor: ROSA, raio }).mesh; m.material.emissiveIntensity = 0; return m; };
const SI = estomagoPorDentro(E, { objeto: fosca(0.22), acucar: false });
SI.update(t * 0.4, { bolhas: 0.6, queda, respingo, amassar, boiar: 0.3, cam: camW.position });
E.render(SI.scene, camW, { ...SLOOK, focus: camW.position.distanceTo(SI.pouso) });
```

- Controles do `update`: `bolhas` (0..1), `desbotar` (0..1), `amassar` (-1..1), `boiar`, `queda` (0..1, 1 = pousado), `respingo` (s desde o impacto; **-1 = nada**), `apertar`, `calendario` (`[texto, legenda]` ou `null`), `acucar` (0..1), `cam`. Passe `t * 0.4` para câmera lenta, como no v2.
- **O olhar só muda quando o `face()` (ou `pose()`) recebe `look`.** Cena que não passa `look` herda o olhar do último quadro renderizado, e num render fora de ordem (`frames`, `?t=`) isso aparece. Zere o olhar no `reset` (`heroi.face(t, { look: [0, 0] })`); a lista do `reset` acima deve cobrir todo estado do herói que só muda quando recebe parâmetro.
- **`desbotar` regrava a cor do objeto a cada quadro:** `cor = corInicial.lerp(corDesbotada, desbotar)`, com `corInicial` lida **na criação**. Trocar a cor depois (`setCor`) é sobrescrito no quadro seguinte. **Para mudar a cor, crie o objeto já na cor certa** (como o `fosca` acima).
- As **enzimas** (`SI.enzimas`, 4 grupos) são da cena: posicione e mostre por quadro e **esconda no `reset`** (`m.visible = false; m.scale.setScalar(0.7); m.userData.up.rotation.x = 0`); a mandíbula de cima é `userData.up` (gire em x para morder). A receita de "nadar até a bolinha e morder" está na cena `estomago` do modelo.

**`intestinoPorDentro(E, { objeto, bolo = false })`** -> `{ scene, curve, LEN, objeto, bolo, ponto(s, off), update(t, c) }`

```js
const GI = intestinoPorDentro(E, { objeto: fosca(0.3) });
const s = 4 + lt * 2.2, anel = s - 1.2 + 0.25 * Math.sin(lt * 3);
cam.position.copy(GI.ponto(s - 3.2, 0.2)); cam.lookAt(GI.ponto(s + 0.4, -0.2));
GI.update(t, { s, anel, cam: cam.position });
```

- Controles: `s` (m ao longo do túnel; `null` esconde o objeto), `anel` (posição do anel de contração), `bloqueio` (posição do bolo que entope; com `bolo: true`), `vermelho` (0..1, alarme), `cam`. `ponto(s, off)` dá um ponto do eixo (preso em `[0, LEN]`, ~42 m).

**`vasoSanguineo(E, { hemacias = 420, leucocito = true })`** -> `{ scene, curve, LEN, hemacias, leucocito, ponto(s, off), update(t, { fluxo = 1, bpm = 72, cam }) }`

```js
const VS = vasoSanguineo(E);
const sc = VS.LEN * 0.3 - 6 + 1.6 * lt;
cam.position.copy(VS.ponto(sc, -0.55)); cam.lookAt(VS.ponto(sc + 3, -0.75));
VS.update(lt, { fluxo: 1, bpm: 72, cam: cam.position });
```

- Parede translúcida que pulsa no ritmo do coração, hemácias bicôncavas (instanciadas, mais rápidas no centro) e um leucócito rolando junto da parede (`VS.leucocito`, para o `rotuloGuia`).
- **`fluxo` e `bpm` multiplicam o tempo** (o deslocamento das hemácias é `fluxo * (t + ...)` e a fase do pulso é `t * bpm / 60`). Logo, **um valor que muda no meio da cena faz as hemácias (e o pulso) saltarem**: a posição de cada uma passa a depender do valor atual vezes todo o `t`, não de uma velocidade acumulada. **Mantenha `fluxo` e `bpm` constantes dentro de uma cena.** Não recomende "mudar devagar": não resolve. Para outro ritmo, troque de cena (e de corte).
- Uma batida por pico do pulso: a vitrine põe `cue(at + (n + 0.1) * 60 / BPM, 'heartbeat')` (o pico fica na fase 0,1 do ciclo, no tempo da cena).

### 5.6 Casa (`kit/casa.js`) e passagem de dias (`kit/dias.mjs`)

```js
const K = casa(E);            // -> { scene, lights, props: { pack, phone, bin, sofa, clock, island }, setDay(h, t), setPhone(on, t) }
K.setDay(7.6, t); K.setPhone(false, t);        // no reset (hora e celular são estado da cena)
```

- Cozinha com ilha + sala no mesmo apartamento. `SPOT` traz posições nomeadas (`hero`, `phone`, `pack`, `bin`, `sofa`, `lamp`, `tv`; o herói fica na ilha olhando +z). `casa(E)` precisa do `E` (usa `E.envMap`).
- **`K.setDay(h, t)`**: hora do dia (0-24) e tempo do filme (cintilar da TV). Ajusta sol, céu, abajur, relógio e luzes. **Chame no `reset` com a hora de partida** (o modelo usa 7.6).
- **`K.setPhone(on, t)`** liga/desliga a tela do celular (`K.props.phone`).
- Utilitários exportados pelo `casa.js`: `canvasTex(w, h, desenho, rep)` e `sdfMesh(f, limites, passo, material, cor)`.

**`passagemDeDias(u, { dias = 2, horaInicio = 8 })`** -> `{ hora, dia, rotina }` (puro); `rotinaDaHora(h)` -> `'anda'` (6,5-17), `'senta'` (17-23) ou `'dorme'`. Exemplo do modelo (time-lapse na sala):

```js
const { hora, dia, rotina } = passagemDeDias(Math.min(1, lt / d), { dias: 1.5 }), h = hora % 24;
K.setDay(hora, t);
const ph = (h - 6.5) / 10.5;
if (rotina === 'anda') { heroi.group.position.set(lerp(3.0, 4.1, ph), 0, 0.35); heroi.group.rotation.y = Math.PI / 2; heroi.walk(ph * 18, 1); }
else { heroi.group.position.set(sofa.x - 0.25, 0, sofa.z + 0.2); heroi.posar(rotina === 'senta' ? 'sentado' : 'dormindo'); }
pilula('clock', 'DIA', String(dia), eob(seg(lt, 0.05, 0.3)), virou);   // virou = amassadinho quando o dia vira
```

- **`dias: 1.5` termina no DIA 2** (hora `8 + 36 = 44` = 20 h do dia 2). Com `dias: 2` o fim da cena (`u = 1`) cai na hora 56, e a pílula mostra **"DIA 3"**: para um vídeo que diz "dois dias", use `1.5` (a vitrine usa o padrão e `Math.min(0.999, lt / d)`).
- O `reset` do modelo volta `K.setDay(7.6, t)`, `heroi.group.position/rotation` e o olhar (`heroi.face(t, { look: [0, 0] })`); a cena de dias muda hora e posição por quadro. A rotina `anda` não passa `look` ao `face()`, e o `Human` só gira os olhos quando recebe `look`: sem o olhar no reset, ele vaza do quadro anterior.

### 5.7 Objetos (`kit/objetos.js`)

- **`bolinha({ cor = '#FF7AAE', raio = 0.0095 })`** -> `{ mesh, setCor(cor) }`: massinha irregular (chiclete mastigado, bala...). A malha é única e compartilhada (cache); o material é próprio de cada bolinha. `raio` em metros: `0.0095` no corpo, `0.22`/`0.3` (macro) nos mundos internos. `setCor` troca cor, brilho e sheen **no momento da chamada** (ver a armadilha do `desbotar` em 5.5).
- **`barraEmbalada({ corEmbalagem = '#7FD8C4', corDentro = '#FF7AAE' })`** -> `{ group, unwrap(k) }`: a origem do `group` é a ponta que os dedos seguram, a barra corre em +x; `unwrap(k)` (0..1) desliza a embalagem para fora e a esconde em `k = 1`. `group.userData = { dentro, embalagem }`. Esconda e feche no reset (`barra.group.visible = false; barra.unwrap(0)`). Passe `corDentro: ROSA` para ficar com o rosa aprovado.
- **`normaisLimpas(geo)`** conserta normais nulas de malhas SDF (use em malha SDF nova).

### 5.8 Balão de pensamento (`kit/balao.mjs`)

```js
balaoPensamento(img, cx, cy, rx, ry, k, de, t, estouro = 0)   // nuvem com `img` dentro e rastro de 3 bolinhas saindo da cabeça `de` = [x, y]
xVermelho(x, y, tam, k)         // X branco com miolo vermelho (cor `perigo` do tema)
setaBaixo(x, y, k)              // seta ciano para baixo
pedacosDoEstouro(n, seed)       // puro: [{ ang, vel, giro }]
usarTemaBalao(tema)             // uma vez, no boot
```

- `img` é um canvas 1080x1920 que **você preenche no mesmo quadro**: renderize o outro mundo, copie para um canvas de fora e use já. Exemplo da vitrine:

```js
const off = document.createElement('canvas'); off.width = 1080; off.height = 1920; const octx = off.getContext('2d');   // fora do draw, uma vez
// dentro do draw:
SI.update(t * 0.4, { queda: 1, respingo: lt * 0.5, cam: cam.position }); E.render(SI.scene, cam, { ...SLOOK, focus });
octx.clearRect(0, 0, 1080, 1920); octx.drawImage(E.renderer.domElement, 0, 0, 1080, 1920);   // preenche NESTE quadro
/* ... renderiza a cena do herói e blit() ... */
balaoPensamento(off, 700, 560, 330, 270, kb, cabeca, t, estouro);
```

- `k` cresce o balão (0..1); `estouro` (0..1) solta os pedaços (e `estouro >= 1` não desenha nada). A cabeça `de` vem de `naTela(heroi.head.getWorldPosition(...), cam)` (com `cam.updateMatrixWorld(true)` antes).

### 5.9 Câmeras e HUD (cópias do voxel)

`kit/hud.mjs` é a base do voxel (`usarTema`, `pilula`, `manchete`, `etiquetaLenta`, `rotuloGuia`, `cartaoFinal`, `chamadaDaPlataforma`, `escalaQueCabe`, `fmt`, `comCameraLenta`): **leia `voxel/STYLE.md` 5.6** para assinaturas e exemplos. Diferenças:

- **Ícones da `pilula`:** os do voxel (`spin stop wind wave globe sun moon clock`) mais **`pin`, `drop`, `warn`, `bolinha`**. Usos do modelo: `pilula('drop', 'ÁCIDO', 'pH 2', k)` e `pilula('clock', 'DIA', String(dia), k, virou)`.
- **`LEGENDA` com `contorno`** (5.1).

**Cartão final** (igual ao voxel, ver 5.6 de lá), com o que o deep-dive faz:

- **O herói fica de frente e sem corte acima do cartão** (cartão y 620-1020): lente 40° (`camW`), `camW.position = (0.02, 1.05, 5.75)` indo a `5.6`, `camW.lookAt(0.02, 0.3, 0.1)`: cabeça, ombros e a mão do aceno cabem no terço de cima. Ele fala pelo envelope (`talk: fala(t) * 0.9`) e acena (`heroi.gesto('acenar', k, t)`, com a esquerda em `repouso`).
- **O clique cai numa palavra do fim da chamada que existe nas três variantes**, aqui **`curiosidades`**: `tClique = tempo.palavra('curiosidades', ULT) + 0.15`, `clique: seg(t, tClique, tClique + 0.35)` e `cue(tClique, 'pop', { gain: 0.8 })`. `ULT = tempo.ultima` e `TXT = script.lines[ULT].text` (o botão sai do texto: "inscrev" vira "Inscrever-se"). `marca: script.marca_nome || 'Conhecimento'`.

### 5.10 Câmera lenta

Igual ao voxel (`comCameraLenta`, `CAMERA_LENTA = 0.32`): o `draw` embrulhado recebe `lt` e `d` **já escalados**; `t` chega em tempo real. No modelo, a cena `engolir` usa o relógio lento do rosto (`const tl = at0b + lt;` em `heroi.breathe(tl)` e `heroi.face(tl, ...)`) e calcula o instante do gole em tempo lento: `G0 = (tCh - at0b) * CAMERA_LENTA`. Cue: `cue(at0b, 'slowmo', { gain: 0.8 })`.

### 5.11 Sons (cues do `tools/mix.py`)

`cue(t, 'tipo', { gain, dur, pan })` com `t` absoluto em segundos; `node tools/capture.mjs cues` grava `data/cues.json` e `python3 tools/mix.py .` mistura com voz e música (`script.json`: `"music": "bed"`). Tudo sintetizado (numpy), nada de amostras. **O banco do deep-dive é diferente do voxel** (não tem `wind` nem `rumble`; cue desconhecido é **ignorado com aviso** `unknown cue type, skipped`):

| cue | quando usar |
|---|---|
| `whoosh` | corte de cena (o modelo põe um por corte) |
| `slide` | deslize longo (`dur`) |
| `pop` | palavra-chave, clique do botão |
| `plop`, `gulp`, `boing` | queda mole, engolir (`gulp` no instante do gole), quique (susto, enzima) |
| `bubbles`, `sizzle`, `sparkle` | líquido, chiado, brilho (`dur`) |
| `thud`, `slam`, `tock`, `tick` | pancada surda, impacto, tique seco, relógio do time-lapse |
| `zip`, `alarm`, `inhale`, `heartbeat` | dado entrando, alarme (`dur`), inspiração, batida do coração |
| `slowmo` | câmera lenta (no mesmo instante da etiqueta) |
| `crinkle`, `chew` | embalagem (`dur`), mastigada |
| `buzz`, `splash`, `squish`, `stretch`, `chomp` | zumbido, respingo, esmagar (onda do esôfago), esticar, mordida (enzimas) |
| `scan`, `shatter`, `ding`, `spit` | varredura do raio-x, estilhaço (estouro do balão), sininho, cuspida |

Há também o cue especial `tension` (não é som: sua janela `dur` troca a música `bed` pela `tension`). Exemplos do modelo: `cue(0.25, 'crinkle', { dur: 1.0, gain: 0.5 })`, `cue(tCh + 0.05, 'gulp', { gain: 1.1 })`, `cue(at1 + 0.2, 'scan', { gain: 0.8 })`, `cue(POUSO, 'splash', { gain: 0.9 })`, `cue(POUSO - 0.1, 'bubbles', { dur: corte(3) - POUSO, gain: 0.6 })`.

## 6. Como fazer um vídeo novo

1. `node fabrica/bin/fabrica.mjs novo conhecimento deep-dive <slug>`: cria `marcas/conhecimento/videos/AAAA-MM-DD-<slug>/` a partir do `modelo/` (com cópia do kit e do tema; `title`, `gancho`, `sources` e `postar` vêm vazios) e põe na fila.
2. Reescreva `script.json`: `title`, `gancho`, `sources`, `postar`, `lines` com `text` e `caps` (1-3 palavras por bloco, um `*` cada, números em algarismos, tela com "1", "2", "100 mil"; a voz fala por extenso) e, na **última linha**, as `variantes` por plataforma ("Segue" para TikTok/Reels, "Se inscreve" para Shorts). Limites: <=60 s TikTok, <=45 s Reels/Shorts. `capa_t` é o instante da capa. Voz `pm_alex`, `"lang": "pt"`.
3. Reescreva `src/cenas.js`: uma ou duas cenas por linha (`cena(corte(i), id, note, draw)`), tempos sempre por `tempo.linha(i)` / `tempo.palavra('x', i)`, o `reset(t)` por quadro e os cues. `src/main.js` quase não muda (carrega fontes, tema, tempo, `fala`, legendas e chama `montarCenas`).
4. `node fabrica/bin/fabrica.mjs checar <id>`: roteiro, caps contra o texto falado e isolamento. Tem de dar `ROTEIRO OK`.
5. Olhe antes do lote. Na pasta do vídeo: `node tools/capture.mjs check` (lista cenas e legendas, `CHECK OK`), `node tools/capture.mjs sheet review/all.jpg`, `node tools/capture.mjs frames review/q "1.2,8.4"` e `node tools/capture.mjs preview` (`?t=4.2` mostra um instante, `?res=0.6` alivia).
6. `node fabrica/bin/fabrica.mjs lote`: renderiza (voz, tempo, `env.py`, check, cues, mix, vídeo) e entrega `tiktok.mp4`, `shorts.mp4` (e `reels.mp4`), com `capa.jpg` e `postar.md`.

**Teste rápido do kit:** `node fabrica/bin/fabrica.mjs kits deep-dive` monta o modelo numa pasta temporária, checa e renderiza uma plataforma; `kits` sem argumentos testa todos os estilos com kit. Testes unitários: `cd estilos/deep-dive && node --test "tests/*.test.mjs"`.

**Vitrine** (`estilos/deep-dive/vitrine/`):

```
node estilos/deep-dive/vitrine/preparar.mjs
cd estilos/deep-dive/vitrine && node tools/capture.mjs sheet review/vitrine.jpg
```

- **`preparar` regera `data/`:** ele roda `gerar-dados.mjs`, que **reescreve `data/lines.json`, `data/words.json` e `data/env.json`** a partir do `script.json` da vitrine (tempo sintético: linha de 2,5 s, sem voz; o envelope é um seno de sílabas para a boca falar). Não edite nada em `data/`. `data/`, `kit/`, `vendor/`, `fonts/`, `tools/` e `index.html` da vitrine são gitignored: rode `preparar` depois de clonar ou de mexer no kit, e confira a folha da vitrine, não só os testes.

## 7. Armadilhas conhecidas

- **Contador global quebra a pureza.** O `gumCount` do v2 (um contador que subia a cada chiclete) fazia o quadro depender dos anteriores. Não guarde estado de contagem entre quadros; derive tudo de `t` (e do índice do objeto, como `rnd(i)`).
- **Todo quadro é função pura de `t`.** O `draw` pode ser chamado em qualquer ordem (folha, captura, preview). Cada `draw` começa com `reset(t)`: posição e rotação do herói, `K.setDay`/`K.setPhone`, barra, **`heroi.engolir(0)`**, mãos (`hand('L'|'R', 'relax')`), **o olhar (`heroi.face(t, { look: [0, 0] })`)**, raio-x (`cabecaVidro(true)`, `OR.focar(false)`, `OR.update(t)`, `ES.update(-1, 1, t)`), a bolinha (visibilidade, brilho, escala, rotação) e as enzimas (visibilidade, escala, `userData.up.rotation.x`). O que a cena anterior mexeu e o reset não devolveu vaza para o quadro seguinte.
- **`desbotar` regrava a cor** do objeto a cada quadro (5.5): para mudar a cor, crie o objeto já na cor certa.
- **`fluxo`/`bpm` do vaso multiplicam o tempo** (5.5): valor que muda no meio da cena faz as hemácias saltarem; mantenha constante dentro da cena.
- **`intestino` opaco esconde a bolinha:** use `opacidade: 0.6` (5.4).
- **`face()` reescreve `lid`:** olho fechado vai no `face`, não só na pose (5.3).
- **`gesto` e a outra mão:** a mão que a cena não usa precisa ir ao `repouso` todo quadro.
- **`passagemDeDias` com `dias: 2` termina em "DIA 3":** use `1.5` para terminar no DIA 2 (5.6).
- **O canvas do balão é preenchido e usado no mesmo quadro** (5.8): nunca guarde o canvas de um quadro para outro nem o preencha só uma vez.
- **O cache do `sculpt` usa a chave das opções.** O `Human` esculpe cada peça com cache por `JSON.stringify` das opções (`new Human({ shirt: ... })`): trocar a cor (ou qualquer opção) gera **uma malha nova, cara** (segundos). Crie os humanos **uma vez, fora do `draw`**, e nunca troque as opções por quadro. Outro humano com as mesmas opções reaproveita a malha.
- **Render lento:** a captura final usa resolução cheia; no preview use `?res=0.6` (e `?aa=`/`?shadow=`) se ficar lento. Mundos internos com milhares de instâncias (vilosidades, hemácias) pesam: reduza `hemacias` antes de cortar a cena.
- **Legenda com 4 palavras é recusada** (no máximo 3 por bloco, um `*` em cada). **Número por extenso nas caps** ou algarismo de valor diferente do falado lançam erro. Confira com `fabrica checar`.
- **Tempo por índice global de palavra:** proibido; use `tempo.palavra('x', linha)`; palavra ambígua? use a ocorrência.
- **Cartão final:** o clique cai numa palavra do fim da chamada presente nas três variantes (`curiosidades`), e o herói fica acima do cartão (5.9).
- **Cópias vigiadas pela fábrica.** `fabrica/tests/copias-kits.test.mjs` compara trechos entre os kits: `numeros.mjs` (motion = voxel = deep-dive, fora a 1ª linha de comentário), `gruposDaLinha` em `legendas.mjs` (motion = voxel = deep-dive) e `cameras.mjs` (voxel = deep-dive, fora a 1ª linha). Mexeu numa cópia, mexa em todas e rode `cd fabrica && node --test "tests/*.test.mjs"`. Não mexa na 1ª linha de comentário "Cópia de...".
- **Windows, Chrome preso (EPERM):** um `capture.mjs`/Chrome headless que sobra de uma captura interrompida trava a próxima (render ou `check` falha com EPERM). Encerre os processos órfãos (`chrome.exe` e o `node` da captura, pelo Gerenciador de Tarefas ou `Stop-Process`) e rode de novo.
- **O primeiro quadro de cada sessão do Chrome pode diferir:** há um aquecimento do Chrome headless, e o primeiro quadro renderizado numa sessão pode sair ligeiramente diferente do mesmo instante nos quadros seguintes. Ao comparar quadros, descarte o primeiro (ou renderize duas vezes) antes de concluir que a cena depende do quadro anterior.
- **Fonte fixa:** o `main.js` carrega `'Inter'` (pesos 900 e 800) por nome fixo; trocar `fontes.sans` no tema não basta, é preciso mexer no `@font-face` do `index.html` e nos `document.fonts.load` do `main.js`. O calendário do estômago também desenha com `Inter`.
- **Imports:** o código do vídeo importa só de `../kit/`; um `import` para `estilos/` faz o `checar` reprovar o isolamento.
- **Música e voz:** o `mix.py` abaixa a música sob a voz; sem `data/narration.wav` o resultado sai "captions-only". Sem `data/env.json` a boca não fala.
