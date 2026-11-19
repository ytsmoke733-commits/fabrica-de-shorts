# Estilo voxel (kit)

## 1. O que é o estilo

Vídeos verticais 1080x1920 em "mundo de blocos": um mundo 3D low poly de blocos chanfrados (orla, espaço, sala de aula, rua), pessoas de blocos com rosto em pixels, câmeras de cinema, HUD ciano por cima e legendas grandes em CAIXA ALTA. Tudo é código: o three.js (vendorizado em `vendor/`) renderiza num canvas WebGL escondido, o canvas 2D recebe o 3D e desenha HUD e legenda, e o Chrome headless captura quadro a quadro.

| item | valor |
|---|---|
| estilo na fábrica | `voxel` (`fabrica/lib/estilos.mjs`: motor `fs3d`, modelo `estilos/voxel/modelo`, kit `estilos/voxel/kit`, tema `tema`) |
| marca | Marca A (conhecimento) |
| tema | `temas/tema.json` (única) |
| vídeo-modelo | `modelo/` ("E se a Terra parasse de girar?", ~15 s, 5 linhas) |
| vitrine | `vitrine/` (uma cena de 2,5 s por peça do kit; não é vídeo para publicar) |
| amostra | `amostra.jpg` |
| testes do kit | `cd estilos/voxel && node --test "tests/*.test.mjs"` (hoje 46) |

- **Motor `fs3d`:** o vídeo é uma página (`index.html` + `src/main.js` + `src/cenas.js`) que expõe `window.OP`; `tools/capture.mjs` a dirige (`check`, `cues`, `sheet`, `frames`, `video`, `preview`). Voz e tempo vêm de `voice.py` e `words.py` (`data/lines.json`, `data/words.json`).
- **Cada vídeo carrega cópia do kit** (`<video>/kit/`) e do tema (`<video>/tema.json`). O código do vídeo só importa de `../kit/` (de `src/`), nunca de `estilos/`; o `fabrica checar` confere. Sem dependências npm: three.js só o vendorizado.
- **O modelo é a melhor referência de uso real** (`modelo/src/main.js` e `modelo/src/cenas.js`); a **vitrine** (`vitrine/src/cenas.js`) mostra cada peça isolada, inclusive as que o modelo não usa (sala, rua, rótulo-guia, partículas, drone).

## 2. Regras visuais

1. **Blocos chanfrados.** Todo objeto do mundo sai do `vox()` de `mundo/blocos.js` (caixas com borda chanfrada). Não misture com malhas lisas nem com texturas fotográficas.
2. **Rosto 8×8.** O rosto é um mapa de 8×8 pixels (`FACES` em `mundo/rostos.mjs`). Expressão nova = novo mapa de 8 linhas de 8 caracteres, não uma textura.
3. **Legenda:** Inter Black 900, CAIXA ALTA, branca com contorno escuro grosso e **uma palavra** em `destaque` (amarelo). 1 a 3 palavras por bloco, y 1495.
4. **HUD ciano:** pílula, manchete (palavra marcada), etiqueta, rótulo-guia e cartão final usam `hud` (ciano) com fundo `painel` translúcido. Vermelho (`perigo`) só no que é alarmante (hoje, o ponto da etiqueta "CÂMERA LENTA").
5. **Todo quadro é função pura de `t`.** Nada de estado que dependa do quadro anterior (ver 7).
6. **Nada parado:** o mundo vive (`TW.life(t)`, piscar do rosto, câmera sempre andando por `eio(lt / d)`).
7. **Layout vertical** (1080×1920): pílula y 128-220, manchete y 250-560, rostos y 640-1280, cartão final y 620-1020, legendas ~1495. Deixe a direita livre no terço inferior (botões do TikTok).
8. **Um corte por linha falada**, um pouco antes da fala: `inicio(i) = tempo.linha(i) - 0.08` (o modelo usa essa função e põe um `whoosh` em cada corte).
9. **Sem misturar com outros estilos:** nada de cartões de UI do motion, nada de 2D flat do Tall Tale; HUD só pelo `hud.mjs`.

## 3. Tema

`temas/tema.json` (única, copiada para `<video>/tema.json`):

```json
{
  "nome": "tema",
  "cores": { "texto": "#FFFFFF", "destaque": "#FFD43B", "contorno": "#0B1220", "hud": "#4FD1E8", "painel": "#09101E", "perigo": "#FF4646" },
  "fontes": { "sans": "Inter" }
}
```

| cor | uso |
|---|---|
| `texto` | texto da legenda, rótulos e valores do HUD |
| `destaque` | a palavra em destaque da legenda; botão "Seguir" do cartão final |
| `contorno` | contorno da legenda e da manchete; letra do avatar |
| `hud` | borda, ícones, linha-guia e palavra marcada do HUD |
| `painel` | fundo translúcido dos cartões do HUD |
| `perigo` | só o ponto pulsante da etiqueta de câmera lenta |

`kit/tema.mjs`: `CORES` (as 6 obrigatórias), `validarTema(t)` (lista de erros: cor faltando ou fora de `#rgb`/`#rrggbb`, sem `fontes.sans`), `carregarTema(url = 'tema.json')` (no navegador; lança `tema inválido: ...`) e `rgba(hex, a)`. O mundo 3D tem paleta própria em `mundo/*` (o tema só vale para legenda e HUD).

## 4. Tempo (`kit/tempo.mjs`)

Mesma API do kit motion; só o carregamento muda (no voxel roda no navegador, por `fetch`, então é **assíncrono**):

```js
import { carregarTempo } from '../kit/tempo.mjs';
const tempo = await carregarTempo('data');   // lê data/lines.json e data/words.json

tempo.duracao;  tempo.nLinhas;  tempo.ultima;
tempo.linha(1);                 // início da linha 1
tempo.fimLinha(1);              // fim da linha 1
tempo.palavra('mil', 1);        // início da palavra "mil" na linha 1
tempo.palavra('de', 0, 2);      // 2ª ocorrência (1-based, contada por linha)
tempo.fimPalavra('mil', 1);
tempo.palavrasDaLinha(i);       // [{ w, s, e, line }, ...]
```

- **Nunca use índice global de palavra**: sempre linha + texto da palavra (`tempo.palavra('freasse', 2)`). Reescrever uma linha não desloca o resto.
- Busca normalizada (minúsculas, sem acento, sem pontuação): `'chao'` acha "chão". Palavra exata tem prioridade; prefixo só se não houver exata. Consulta vazia, linha inexistente ou palavra ausente lançam erro.
- Número falado sai por extenso: procure "mil", não "1.670".
- `criarTempo(lines, words)` faz o mesmo com dados já carregados (usado nos testes); `norm(w)` é a normalização.

## 5. Componentes

Convenção das cenas do modelo (`modelo/src/cenas.js`): `montarCenas(E, { tempo, script })` devolve `{ cenas, cues }`. Cada cena é `{ id, at, note, draw }`, com `draw(lt, d, t, blit)`: `lt` = tempo local da cena, `d` = duração da cena, `t` = tempo do filme, `blit()` copia o 3D para o canvas 2D (o HUD é desenhado **depois** do `blit`). O `main.js` escolhe a cena ativa pelo `at` e desenha a legenda por cima de tudo.

```js
const inicio = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
const cenaEm = (at, id, note, draw, gain = 0.5) => { cenas.push({ id, at, note, draw }); cue(at, 'whoosh', { gain }); };
```

### 5.1 Legendas (`kit/legendas.mjs`)

```js
planejarLegendas(tempo, script.lines)        // -> blocos [{ linha, s, e, palavras: [{ txt, hi }] }]
desenharLegenda(blocos, t, tema, { y = 1495, size = 104, maxW = 960 })   // o main.js chama a cada quadro
```

- Com `caps` na linha (`"E *se | a *Terra | parasse de *girar | de *repente?"`), cada bloco (separado por `|`) tem **1 a 3 palavras e exatamente um `*`** (a palavra em destaque). Bloco com 4 palavras é recusado pelo `fabrica checar` (máximo 3 por bloco); zero ou dois `*` lança erro no kit.
- **As caps têm as mesmas palavras do texto falado, na mesma ordem** (comparação normalizada); senão: `caps não batem com o texto falado`.
- **Números na tela sempre em algarismos** (a regra do motion). O `text` fica por extenso (é o que a voz lê); nas caps vai o algarismo: no modelo, `"a *1.670 | *quilômetros"` ↔ "mil seiscentos e setenta quilômetros". O algarismo (mais a escala logo depois: mil, milhões, bilhões) cobre todas as palavras do número falado e precisa ter **o mesmo valor**. Número por extenso nas caps lança erro.
  - "um/uma" é artigo e pode ficar ("tirou *um dia"); para mostrar "1", escreva "1".
  - O "e" só junta uma parte de **ordem menor**: "vinte e três" = 23, "cento e dois" = 102, "mil e quinhentos" = 1500; "dois e três" são **dois** números.
  - Escala no plural (milhões, bilhões, trilhões) **sozinha** é palavra ("milhões de senhas"); "mil" sozinho é número.
  - Pontuação encerra o número ("Três, dois, um").
  - **Porcentagem:** `*50%` ↔ "cinquenta por cento" (as três palavras faladas); `%` só vale com "por cento" falado.
  - Sem caps, a conversão é automática ("cem mil" → "100 mil", "dois mil e vinte e quatro" → "2024") e o número vira o destaque do bloco.
- O código dos números (`kit/numeros.mjs`: `lerNumero`, `formatarNumeroLegenda`) é **cópia de `estilos/motion/kit/numeros.mjs`**; a fábrica tem outra cópia (`fabrica/lib/numeros.mjs`). A `fabrica/tests/numeros-cruzado.test.mjs` vigia que as cópias aceitem e recusem as mesmas caps: se mexer numa, mexa em todas.
- O tempo de cada bloco vem de `tempo.palavra(falada, linha, ocorrencia)`; o bloco termina onde o próximo começa (ou 0,35 s depois do fim da linha se houver pausa longa).

### 5.2 Câmeras (`kit/cameras.mjs` + `kit/mundo/camera3d.js`)

Cada câmera nomeada é pura: recebe parâmetros e o progresso `k` (0..1) e devolve `{ pos, look, roll }`; `aplicarCamera(cam, câmera)` a aplica a uma `PerspectiveCamera` (`camera(30)` de `motor/engine.js`). Use `k = eio(lt / d)`.

```js
travelling({ de, para, olharDe, olharPara = olharDe, roll = 0 }, k)        // anda de `de` a `para`, olhando de `olharDe` a `olharPara`
closeBaixo({ alvo, angulo = 1.33, dist = 4.2, altura = -0.35, empurrao = 0.12, roll = 0 }, k)   // contra-plongée no rosto, empurrando
drone({ centro, altura = 34, dist = 110, angulo = -0.15, deriva = 8 }, k)  // alto e distante, deriva lenta
orbita({ alvo, raio = 3.8, de = -0.55, ate = 0.25, altura = 0.2 }, k)      // gira em volta do alvo (ângulos em rad)
```

```js
aplicarCamera(cam, closeBaixo({ alvo: arr(headW(heroi)) }, eio(lt / d)));                       // modelo, linha 0
aplicarCamera(cam, orbita({ alvo: [0, 0, 0], raio: lerp(10.2, 8.8, eio(lt / d)), de: -0.32, ate: -0.1, altura: 0.9 }, eio(lt / d)));
aplicarCamera(cam, drone({ centro: [-2, 0, 14] }, eio(lt / d)));
```

**Câmera lenta:** `CAMERA_LENTA = 0.32` e `tempoLento(lt, fator = CAMERA_LENTA)`. O jeito de uso é `comCameraLenta` (`kit/hud.mjs`):

```js
comCameraLenta(draw, { fator = CAMERA_LENTA, etiqueta = etiquetaLenta })
cenaEm(i2, 'L2', '...', comCameraLenta((tl, d, t, blit) => { /* ... */ }));
```

- O `draw` embrulhado recebe **`tl` e `d` já escalados** por `fator`: `tl / d` continua sendo o progresso real da cena, então `eio(tl / d)` na câmera funciona igual. Só ações medidas em **segundos absolutos** (relógio do mundo, `TW.life`, voadores, partículas) ficam lentas.
- `t` chega **em tempo real**, e a etiqueta "CÂMERA LENTA" é desenhada sozinha (também em tempo real). Use `t` para o que não deve desacelerar (instante da palavra falada) e o relógio lento para o mundo: no modelo, `const tt = i2 + tl;` e `TW.life(tt)`; `windPalms(TW.palms, kw, t, CAMERA_LENTA)` desacelera só o balanço.
- Combine com o som: `cue(i2 + 0.05, 'slowmo', { gain: 0.8 })`.

### 5.3 Pessoas (`kit/mundo/pessoa.js`, `elenco.js`, `poses.mjs`, `rostos.mjs`)

```js
VoxelPerson({ skin, hair, hairStyle, beard, shirtStyle, shirt, shirt2, pants, shorts, shoes, accessory, capColor, hatColor, bagColor })
// hairStyle: short|buzz|long|bun|curly|bald|pony · shirtStyle: collar|tee|tank|floral · accessory: 'cap'|'sunhat'|'glasses'|'backpack'|'camera' (ou lista)
protagonista()        // o herói do v2: camisa floral, bermuda, boné e óculos
figurante(seed)       // pessoa sorteada por semente (mesma semente = mesma pessoa)
sorvete()             // sorvete para a mão (a ponta de baixo do cone fica na origem)
```

A pessoa devolvida tem `group` (adicione à cena), `head`, `handL`, `handR` (grupos para segurar objetos), `acc` (acessórios por nome) e os métodos (todos encadeáveis):

```js
p.reset()                        // volta ao neutro; reexibe acessórios e esconde o dedo (chame todo quadro)
p.pose({ lean, bend, head, armL, armR, legL, legR, lift })   // graus; braço = [frente, lado]
p.walk(fase, amt = 1, extra = {})                            // ciclo de caminhada
p.face('smile')                                              // expressão fixa
p.rosto('smile', t, { periodo = 3.4, dur = 0.13, semente = 1 })   // expressão com piscar automático
p.posar('apontar', k = 1, extra = {})                        // pose nomeada, misturada A PARTIR DO NEUTRO por k; extra sobrescreve campos
p.dedo('R', true)                                            // mostra/esconde o dedo indicador (posar já cuida disso)
```

- **Expressões** (`FACES`): `neutral smile happy surprised scared hot sleepy wink cool blink`. `rosto` pisca sozinho só em `PISCAVEIS` (`neutral smile happy cool`); o instante da piscada é sorteado de forma determinística (`semente` diferente por pessoa para não piscarem juntos). Dá para ajustar `periodo`/`dur` (a vitrine usa `{ periodo: 0.9, dur: 0.15, semente: 4 }` para a piscada cair num quadro da folha).
- **Poses** (`POSES`): `neutro apontar apontarChao acenar maoNaCabeca segurar bracosAbertos susto`. `apontar` e `apontarChao` ligam o dedo (`dedo: 'R'`). `acenarNoTempo(t, k)` é o aceno animado (o antebraço balança com `t`).
- **`posar` mistura a partir do neutro.** Para sair de uma pose para **outra**, não use `posar` duas vezes: calcule a mistura com `misturarPoses(a, b, k)` e passe o objeto. Exemplo real do modelo (linha 2, o braço sai de "segurar" para "mão na cabeça" desde "freasse"):

```js
const kMao = (t) => eo(seg(t, tFreasse, tFreasse + 0.5));
const poseVento = (t) => misturarPoses(POSES.segurar, POSES.maoNaCabeca, kMao(t));
heroi.posar(poseVento(t)).rosto(t >= tFreasse ? 'scared' : 'smile', t, { semente: 6 });
```

- Poses entram com `eo(seg(lt, 0.05, 0.45))` como `k` (entrada suave): `heroi.posar('apontarChao', eo(seg(lt, 0.05, 0.45)), { armL: [40, 4] })`.
- **Sorvete na mão:** `heroi.handR.add(cone)` e `cone.rotation.x = POSES.segurar.armR[0] * DEG` para acompanhar o braço. O `reset` do quadro devolve o cone à mão direita.

### 5.4 Cenários (`kit/mundo/*`)

Cada cenário tem a sua `scene` e é renderizado com `E.render(scene, cam, look)`. `E = makeEngine(GL, ...)` (`motor/engine.js`) vem do `main.js`.

```js
beachTown(E)                        // orla (mundo/orla.js)
space(E)                            // espaço com o planeta (mundo/espaco.js; `planet()` é o planeta sozinho)
salaDeAula(E, { alunos = 12, noite = false })              // mundo/sala.js
ruaDaCidade(E, { carros = 10, pedestres = 18, noite = false })   // mundo/rua.js
```

- **`beachTown`** devolve `scene, sea, palms, umbrellas, chairs, beachStuff, cars, crowd, sunbathers, gulls, clouds` e os métodos `life(t)` (carros, multidão e gaivotas no instante t), `night(k)` (0 dia, 1 noite: estrelas, lua, janelas e postes acesos), `setSun(elevação, azimute)` e `shadowAt(x, z, tamanho)` (centra a sombra do sol perto da ação; chame antes de renderizar). `TW.crowd[i]` é uma pessoa (`.pose`, `.face`, `.userData.v`).
- **`space`** devolve `scene`, `P` (o planeta), `setSun(x, y, z)`, `sun`, `flare`, `key`. O planeta: `P.spin` (rotação do dia), `P.clouds`, `P.tilt`, `P.ring` (anel do equador, opacidade 0 por padrão), `P.pin` (marcador da cidade) e `P.update(k)` (nível dos mares, 0..1; **recalcula a malha inteira**, então use o cache `planetSeas`, ver 7).
- **`salaDeAula`** devolve `scene, quadro, alunos, carteiras, janela, luzes` e `setTexto(fn)`: desenha no quadro (`fn(ctx2d, 512, 180)`, sem fn limpa). Chame a cada quadro em que o texto mudar. `alunos` são figurantes sentados (use `a.rosto('neutral', t, { semente })`). O fov da sala pede câmera mais aberta (`cam.fov = 55` na vitrine).
- **`ruaDaCidade`** devolve `scene, carros, pedestres, semaforos, lamps, arvores` e `life(t)` (carros e pedestres), `night(k)` e `shadowAt`. O tráfego está em **`mundo/trafego.mjs`** (puro, sem three, com `tests/trafego.test.mjs`): ciclo do semáforo de 12 s (verde 0-7, amarelo 7-8,5, vermelho 8,5-12; `estadoSemaforo(t)`), carros que andam no verde, param na retenção e formam fila no vermelho, tudo função de `t`. **No máximo 8 carros por mão** (`maxCarros`; `ruaDaCidade` divide `carros` entre as duas mãos e lança `no máximo 8 carros por mão`). A vitrine usa `ruaDaCidade(E, { carros: 14, pedestres: 24 })`. Some da frente da lente o que ficaria colado na câmera (ver `clearLens`, em 7).
- **Render e "look":** `E.render(scene, cam, look)` com `look` (`aperture, maxblur, bloom, bloomThreshold, vignette, grain, warm, exposure, focus`). O modelo define `TLOOK` (orla) e `SLOOK` (espaço) e os sobrescreve por cena: `townRender(focusP, { aperture: 0.0016 })`.

### 5.5 Efeitos (`kit/mundo/efeitos.js`)

```js
windPalms(TW.palms, k, t, slow = 1)     // palmeiras dobram para -z; k 0..1; slow desacelera só o balanço
calmPalms(TW.palms)                     // devolve as palmeiras ao repouso (use no reset)
const streaks = windStreaks(n = 260, cor)   // riscos de areia; scene.add(streaks); streaks.update(t, k, centro, tamanho, velocidade)
const wave = giantWave()                // onda gigante; scene.add(wave); wave.visible = true; wave.update(zCrista, altura, t)
const voa = voadores({ n = 14, seed = 1 })   // objetos soltando do chão e voando; scene.add(voa.group); voa.update(t, k, { centro, vento, alcance, chao })
const espuma = particulas({ n = 260, cor, tamanho = 0.05, seed = 2 })   // scene.add(espuma.mesh); espuma.update(t, { centro, raio, subida, vento })
```

Exemplos do modelo: `streaks.update(tt, kw, V3(-6, 0.25, 2.5), V3(30, 4.5, 16), 30)`; `voa.update(tt, kv, { centro: [-3.5, 1, 3.8], vento: [0, 0.4, -1], alcance: 12 })`; `wave.update(zc, H, t)` com `TW.sea.visible = false; wave.visible = true`; `espuma.update(t, { centro: [-3, 1.2, 20], raio: 8, subida: 0.6, vento: [0.4, 0.8, -6] })`.

- `voadores`: `k` (0..1) é a força do vento; cada objeto solta num limiar próprio. O objeto `sorvete` entra na rotação (o sorvete da mão é outro: o modelo esconde o da mão e voa o `coneSolto`).
- `windStreaks`, `giantWave`, `voadores` e `particulas` começam invisíveis/escondidos: ligue a visibilidade na cena que usa e **desligue no `reset`** (`streaks.visible = false`, `wave.visible = false`, `voa.group.visible = false`, `espuma.mesh.visible = false`).

### 5.6 HUD (`kit/hud.mjs`)

Desenha no canvas 2D, depois do `blit()` e antes das legendas. Todas as funções de entrada recebem `k` (0..1).

```js
usarTema(tema)                               // uma vez, no boot (o main.js já faz)
pilula(icone, rotulo, valor, k = 1, flip = 0)   // canto superior esquerdo; ícones: spin stop wind wave globe sun moon clock; flip = amassadinho quando o valor muda
manchete(linhas, k = 1, out = 0, size = 92)     // linhas em caixa alta; *palavra* em cor `hud`; out = saída 0..1
etiquetaLenta(k, t)                             // "CÂMERA LENTA" (comCameraLenta já a desenha)
rotuloGuia(texto, x, y, tx, ty, k = 1)          // rótulo em (x, y) com linha-guia até o ponto (tx, ty) em pixels
cartaoFinal({ marca, textoDaUltimaLinha, k = 1, clique = 0 })
chamadaDaPlataforma(textoDaUltimaLinha)         // -> { botao, feito }
escalaQueCabe(largura, max)                     // escala (<= 1) para o texto caber em max px
fmt(n)                                          // milhar em pt-BR: 1670 -> "1.670"
```

```js
pilula('spin', 'EQUADOR', `${fmt(1670 * eo(seg(t, tMil, tHora)))} KM/H`, eob(seg(t, tMil, tMil + 0.35)), seg(t, tHora, tHora + 0.28));
manchete(['E SE A *TERRA*', 'PARASSE DE', '*GIRAR*?'], seg(t, L0 - 0.15, L0 + 0.75), seg(t, tempo.linha(1) - 0.3, tempo.linha(1) - 0.1));
// vitrine: aponta o protagonista (ponto 3D projetado em pixels)
const cabeca = headW(heroi).project(cam);
rotuloGuia('VOCÊ', 250, 330, (cabeca.x * 0.5 + 0.5) * 1080, (0.5 - cabeca.y * 0.5) * 1920, eo(seg(lt, 0.2, 0.7)));
```

- **Pílula e manchete presas à linha:** os `k` saem de `tempo.linha(i)` e `tempo.palavra(...)`, nunca de segundos soltos; a manchete sai (`out`) um pouco antes do corte da linha seguinte. Chame `cam.updateMatrixWorld()` antes de projetar um ponto para o `rotuloGuia`.
- **Cartão final** (y 620-1020): `chamadaDaPlataforma` decide o botão pelo texto da **última linha da variante da plataforma** ("inscrev" → `Inscrever-se` / `Inscrito ✓` no Shorts; senão `Seguir` / `Seguindo ✓`). `clique > 0.5` troca o botão pelo estado "feito". Nome de marca longo **encolhe sozinho** por `escalaQueCabe` (não precisa abreviar). A marca vem de `script.marca_nome` (a fábrica preenche a partir da marca; o modelo usa `script.marca_nome || 'Conhecimento'`).
- **Onde cai o clique:** o cartão entra no começo da última linha, e o clique deve cair **numa palavra do fim da chamada** ("curiosidades"), não no início da linha: assim o botão "Seguir"/"Inscrever-se" fica legível uns 0,9 s antes de virar "feito". Exemplo do modelo: `tClique = tempo.palavra('curiosidades', 4) + 0.15`, `clique: seg(t, tClique - 0.3, tClique + 0.3)`, com `cue(tClique, 'pop', { gain: 0.7 })`. Use uma palavra que exista nas três variantes (TikTok, Reels e Shorts).

### 5.7 Sons (cues do `tools/mix.py`)

Os cues são coletados em `cues` (`cue(t, 'tipo', { gain, dur, pan })`, `t` absoluto em segundos); `node tools/capture.mjs cues` grava `data/cues.json` e `python3 tools/mix.py .` mistura com a voz e a música (`script.json`: `"music"`). Tudo é sintetizado com numpy (nada de amostras), suave e abaixo de ~5 kHz.

| cue | quando usar |
|---|---|
| `whoosh` | corte de cena (o `cenaEm` já põe um, com `gain` por cena) |
| `pop` | palavra-chave aparecendo, clique do botão, mudança de expressão |
| `zip` | dado entrando (pílula) |
| `slide` | deslize longo (mudança de plano calma) |
| `slam` | impacto forte (a onda chegando ao máximo) |
| `thud` | pancada surda |
| `wind` | vento (`dur` = quanto dura; use a duração do trecho) |
| `slowmo` | câmera lenta (par com a etiqueta, no mesmo instante) |
| `rumble` | estrondo grave contínuo (onda, terremoto; `dur`) |
| `bubbles` | borbulhar (líquido, `dur`) |
| `tock` | tique seco, contagem |
| `sizzle` | chiado (calor, `dur`) |
| `sparkle` | brilho (descoberta, `dur`) |

Existem também `plop gulp boing inhale heartbeat alarm`. Cue desconhecido é **ignorado com aviso** (`unknown cue type, skipped`), então confira o nome. Exemplos do modelo: `cue(tRepente, 'pop', { gain: 0.6 })`, `cue(tFreasse, 'wind', { dur: inicio(3) - tFreasse + 0.3, gain: 0.9 })`, `cue(i3, 'rumble', { dur: inicio(4) - i3 + 0.2, gain: 0.95 })`.

## 6. Como fazer um vídeo novo

1. `node fabrica/bin/fabrica.mjs novo conhecimento voxel <slug>`: cria `marcas/conhecimento/videos/AAAA-MM-DD-<slug>/` a partir do `modelo/` (com cópia do kit e do tema; `title`, `gancho`, `sources` e `postar` vêm vazios) e põe na fila.
2. Reescreva `script.json`: `title`, `gancho`, `sources`, `postar` (título, descrição, hashtags), `lines` com `text` e `caps` (1-3 palavras por bloco, um `*` cada, números em algarismos) e, na **última linha**, as `variantes` por plataforma (a chamada "Segue" para TikTok/Reels e "Se inscreve" para Shorts). Limites: <=60 s TikTok, <=45 s Reels/Shorts. O modelo ainda traz `capa_t` (instante da capa).
3. Reescreva `src/cenas.js`: uma ou duas cenas por linha (`cenaEm(inicio(i), id, note, draw)`), tempos sempre por `tempo.linha(i)` / `tempo.palavra('x', i)`, o `reset()` por quadro, os cues. `src/main.js` quase não muda.
4. `node fabrica/bin/fabrica.mjs checar <id>`: roteiro (legendas, gancho, fontes, variantes, duração, proibidos), **caps contra o texto falado** (o voxel é estilo com kit) e isolamento. Tem de dar `ROTEIRO OK`.
5. Olhe o vídeo antes do lote. Na pasta do vídeo: `node tools/capture.mjs check` (lista cenas e legendas, `CHECK OK`), `node tools/capture.mjs sheet review/all.jpg` (folha de contato), `node tools/capture.mjs frames review/q "1.2,8.4"` (quadros cheios) e `node tools/capture.mjs preview` (abre num navegador; `?t=4.2` mostra um instante, `?res=0.6` alivia).
6. `node fabrica/bin/fabrica.mjs lote`: renderiza (voz, tempo, check, cues, mix, vídeo) e entrega `tiktok.mp4`, `shorts.mp4` (e `reels.mp4` quando houver), com `capa.jpg` e `postar.md`.

**Teste rápido do kit:** `node fabrica/bin/fabrica.mjs kits voxel` monta o modelo numa pasta temporária, checa e renderiza uma plataforma; `kits` sem argumentos testa `motion`, `motion-b` e `voxel`. Testes unitários: `cd estilos/voxel && node --test "tests/*.test.mjs"`.

**Vitrine** (`estilos/voxel/vitrine/`): monta o kit como se fosse um vídeo, para ver todas as peças.

```
node estilos/voxel/vitrine/preparar.mjs                                  # copia kit, tema, vendor, fonts, tools e index.html para a vitrine
cd estilos/voxel/vitrine && node tools/capture.mjs sheet review/vitrine.jpg
```

`preparar` também roda `gerar-dados.mjs`, que **regenera `data/lines.json` e `data/words.json`** a partir do `script.json` da vitrine, com tempo sintético (linha de 2,5 s, sem voz). `data/`, `kit/`, `vendor/`, `fonts/`, `tools/` e `index.html` da vitrine são gitignored: rode `preparar` depois de clonar ou de mexer no kit. Mexeu no kit? Rode `preparar` e confira a folha da vitrine, não só os testes.

## 7. Armadilhas conhecidas

- **Todo quadro é função pura de `t`.** O `draw` pode ser chamado em qualquer ordem (folha, captura, preview). Por isso cada `draw` começa com `reset()`, que devolve tudo ao estado base: pessoas (`p.reset()`, posição, rotação, visibilidade), palmeiras (`calmPalms`), mar, onda, sol, noite, câmera (`cam.up`, `cam.fov`), planeta e acessórios (os óculos voltam à posição). Esqueceu de resetar algo que a cena anterior mexeu e o quadro passa a depender do anterior.
- **`clearLens`:** a multidão e os objetos de praia que ficam na frente da lente somem. Ele **precisa restaurar o que esconde**: antes de testar cada objeto, o `clearLens` o torna visível de novo (`p.group.visible = true; test(...)`), senão o que sumiu num quadro continua sumido no seguinte e o resultado depende do quadro anterior. Qualquer helper parecido (como o `frente()` da rua na vitrine) segue a mesma regra: reexibir, depois testar. A multidão é reexibida pelo `TW.life(t)`, então chame `life` antes do `clearLens`.
- **Cache do planeta (`planetSeas`):** `P.update(k)` recalcula a malha inteira; o modelo e a vitrine guardam o último `k` (`let planetK = 0; const planetSeas = (k) => { if (Math.abs(k - planetK) > 1e-4) { P.update(k); planetK = k; } }`) e o `reset` chama `planetSeas(0)`. Chamar `P.update` direto a cada quadro deixa a captura lenta.
- **Render lento por cena pesada:** sombra 2048, antialias e onda gigante pesam. No preview use `?res=0.6` (e `?aa=` / `?shadow=`); a captura final usa resolução cheia. Sobrecarga de partículas e de pessoas também pesa: reduza `n` antes de cortar a cena.
- **Câmera lenta:** o `draw` do `comCameraLenta` recebe `tl` e `d` escalados; use `tl / d` para o progresso da câmera, `t` para o que é em tempo real. Dentro do `draw` embrulhado os parâmetros já são os escalados (no modelo se chamam `tl` e `d`): não misture com o `lt` de fora.
- **Posar de uma pose para outra:** `posar` mistura a partir do neutro; para ir de A para B use `misturarPoses(POSES.a, POSES.b, k)` (5.3).
- **Legenda com 4 palavras é recusada** (máximo 3 por bloco). Divida com `|`, mantendo um `*` em cada bloco.
- **Número por extenso nas caps** e algarismo de valor diferente do falado lançam erro. Confira com `fabrica checar`.
- **Cartão final:** clique numa palavra do fim da chamada, presente nas três variantes; não deixe o clique no início da linha (o botão não chega a ser lido).
- **Tempo por índice global de palavra:** proibido; use `tempo.palavra('x', linha)`. Palavra ambígua? use a ocorrência (`tempo.palavra('de', 0, 2)`).
- **Rua:** no máximo 8 carros por mão (`ruaDaCidade` lança erro acima disso). Carro ou pedestre colado na lente: reexiba e filtre por posição, como a cena `C12` da vitrine.
- **Windows, Chrome preso (EPERM):** um `capture.mjs`/Chrome headless que sobra de uma captura interrompida trava a próxima (render ou `check` falha com EPERM). Encerre os processos órfãos (`chrome.exe` e o `node` da captura, pelo Gerenciador de Tarefas ou `Stop-Process`) e rode de novo.
- **Fonte fixa:** o `main.js` carrega a fonte `'Inter'` (pesos 900 e 800) por nome fixo. Trocar `fontes.sans` no tema não basta: é preciso mexer também no `@font-face` do `index.html` e nos `document.fonts.load` do `main.js`.
- **`rotuloGuia` não protege contra ponto atrás da câmera:** projetar um ponto atrás da lente devolve coordenadas espelhadas e a linha-guia aponta para o lugar errado. Confira que o alvo está à frente da câmera naquele instante.
- **Materiais da rua:** `ruaDaCidade` usa cópias de `MAT.glass` e `MAT.lamp` (como a sala), então `night(k)` da rua não acende as janelas da orla, que usa o `MAT` compartilhado.
- **Imports:** o código do vídeo importa só de `../kit/`; um `import` para `estilos/` faz o `checar` reprovar o isolamento.
- **Música e voz:** o `mix.py` abaixa a música sob a voz; sem `data/narration.wav` o resultado sai "captions-only" (só efeitos). A voz é `pm_alex` em PT (a fábrica põe `lang: pt`).
