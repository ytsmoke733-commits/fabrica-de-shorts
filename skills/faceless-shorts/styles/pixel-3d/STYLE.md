# Pixel 3D (estilo `pixel-3d`)

> Guia em português (o exemplo é narrado em pt-BR com a voz `pm_alex`). Para inglês: `"lang": "en"`, uma voz `am_*`/`af_*` e reescreva as falas; a fonte pixel cobre A-Z, dígitos e acentos.

## 1. O que é o estilo

Vídeos verticais 1080x1920 em **pixel 3D**: um mundo 3D de formas simples (caixas, cilindros, esferas) renderizado numa grade pequena (270x480) e ampliado 4x **sem suavizar**, com luz em 3 degraus (toon), contorno escuro automático, cores quantizadas e um pontilhado leve. Por cima, HUD e legenda numa **fonte pixel 5x7 desenhada em código** (creme e laranja, contorno escuro). O formato é "Você usa todo dia, mas sabe como funciona?": objeto do dia a dia → raio-x → mecanismo (ondas, moléculas, peças) → final.

Referência de linguagem: reels em "pixel art 3D" de curiosidades. Nada copiado de nenhum perfil: roteiro, modelos e cenas são próprios.

| item | valor |
|---|---|
| estilo | `pixel-3d` (`bash SKILL/scripts/new_video.sh pixel-3d <nome>`) |
| tema | `example/tema.json` (cores da legenda e do HUD) |
| exemplo | `example/` ("Como o micro-ondas esquenta a comida?", ~17 s, 5 linhas), renderiza como está |
| receitas | `receitas/videogames-*.js` (vídeo completo de 34 s: sala anos 70 com TV de tubo, placa com chip RAM e 128 células, personagem em sprite que vira cubos). Para usar: copie `videogames-mundo.js` e `videogames-cenas.js` como `src/mundo.js` e `src/cenas.js`, e `videogames-script.json` como `script.json`, num vídeo novo; depois gere voz e palavras |
| style sheet | `style-sheet.png` |

- **Motor `fs3d`** (`index.html` + `src/main.js` + `src/cenas.js`, `window.OP`, `tools/capture.mjs`, `tools/mix.py`, `voice.py`/`words.py`). O renderizador é `kit/motor/pixel.js` (sem bloom, sem bokeh).
- **Sem arquivo de fonte:** a fonte é `kit/pixelfonte.mjs`. O `index.html` não tem `@font-face` e o modelo não tem `fonts/`.
- **Cada vídeo carrega cópia do kit** (`<video>/kit/`) e do tema. O código do vídeo só importa de `../kit/`. three.js só o vendorizado (`vendor/three.module.js`, sem addons).

## 2. Regras visuais

1. **Pixel de verdade.** Todo 3D passa por `E.render(scene, cam)` do `makePixelEngine` e é copiado com `blit()` (o `main.js` desliga `imageSmoothingEnabled`). Nunca desenhe 3D direto em 1080x1920 nem amplie com suavização.
2. **Formas simples, material toon.** Objetos saem de `box/cyl/sph` (`mundo/pecas.js`) com `toon(cor)` (3 degraus de luz). Brilho sem luz (ondas, telas, faíscas) é `glow(cor, opacidade)`. Nada de textura fotográfica; textura, quando precisa, é `texturaCanvas` pequena (ex.: 64x52) com `NearestFilter`.
3. **Contorno automático.** Silhueta escura onde a profundidade salta; linha interna mais fraca onde a normal dobra. Transparentes (`opacity < 1`, `depthWrite: false`), linhas e pontos **não** ganham contorno: é assim que ondas e vidro ficam "leves".
4. **Paleta quente e terrosa** no mundo (bege, madeira, laranja, vermelho de molho, cinza metálico), **laranja `#FFB43A`** como cor de destaque (ondas, cantoneiras, seta do campo), **azul-ciano só no modo "planta técnica"** (`planta()`) e, como exceção, nas partículas elétricas por dentro dos aparelhos (íons de lítio, elétrons do fio da resistência e elétrons do chip LED, `#9BEFFF` em `glow`, contra o fundo quente), **azul frio vs laranja quente** quando o assunto é temperatura.
5. **Legenda:** fonte pixel, CAIXA ALTA, creme (`texto`) com **uma palavra** laranja (`destaque`), contorno escuro de 1 pixel da fonte + sombra. 1 a 3 palavras, y 1430 (topo das letras), pixel da fonte 7 (encolhe até caber em 940 px).
6. **HUD:** valor grande no topo entre cantoneiras (`valorTopo`), etiquetas com linha-guia em L até o objeto (`etiqueta`), cartão final pixel. Sempre na fonte pixel, sempre `hud` (laranja) + `painel` escuro.
7. **Todo quadro é função pura de `t`.** Cada `draw` começa com reset (ver 7).
8. **Nada parado:** câmera sempre andando (`L3(de, para, eio(lt / d))`), prato girando, ondas correndo, moléculas flutuando.
9. **Um corte por linha falada** (às vezes dois numa linha longa), um pouco antes da fala: `inicio(i) = tempo.linha(i) - 0.08`, com `whoosh` em cada corte.
10. **Sem misturar estilos:** nada de Inter, bloom, bokeh ou blocos chanfrados do voxel; nada de cartões de UI do motion.

## 3. Tema

`temas/tema.json` (única, copiada para `<video>/tema.json`):

```json
{
  "nome": "tema",
  "cores": { "texto": "#FFF1C1", "destaque": "#FFB43A", "contorno": "#1A0F0A", "hud": "#FFB43A", "painel": "#140C08", "perigo": "#FF4646" },
  "fontes": { "sans": "pixel-5x7" }
}
```

| cor | uso |
|---|---|
| `texto` | letras da legenda e do HUD |
| `destaque` | a palavra em destaque da legenda |
| `contorno` | contorno da legenda e do valor do topo; letra do avatar |
| `hud` | cantoneiras, linha-guia, ponto da etiqueta, avatar e botão do cartão final |
| `painel` | tarjas e fundos do HUD (com alfa, via `rgba`) |
| `perigo` | reservado (alarme); hoje sem uso no modelo |

`fontes.sans` só documenta (a validação do `kit/tema.mjs` exige o campo). O mundo 3D tem paleta própria nas peças (`mundo/*`).

## 4. Tempo (`kit/tempo.mjs`)

Cópia do voxel (mesma API, assíncrono no navegador). Resumo:

```js
const tempo = await carregarTempo('data');
tempo.duracao; tempo.nLinhas; tempo.ultima;
tempo.linha(1); tempo.fimLinha(1);
tempo.palavra('magnetron', 1); tempo.palavra('de', 0, 2); tempo.fimPalavra('calor', 3);
```

- Sempre linha + palavra; nunca índice global. Busca normalizada (`'agua'` acha "água"; `'micro'` acha "micro-ondas" por prefixo).
- Número falado sai por extenso: procure "bilhões", "dois", não "2".

## 5. Componentes

Convenção das cenas (`modelo/src/cenas.js`): `montarCenas(E, { tempo, tema, script })` → `{ cenas, cues }`; cena = `{ id, at, note, draw(lt, d, t, blit) }`; `lt` = tempo local, `d` = duração, `t` = tempo do filme. HUD **depois** do `blit()`; a legenda o `main.js` desenha por cima de tudo.

```js
const inicio = (i) => (i === 0 ? 0 : tempo.linha(i) - 0.08);
const cenaEm = (at, id, note, draw, gain = 0.45) => { cenas.push({ id, at, note, draw }); if (at > 0) cue(at, 'whoosh', { gain }); };
const cam = camera(35);                                   // kit/motor/pixel.js
const ver = (pos, alvo, fov = 35) => olhar(cam, pos, alvo, fov);
const tela = (obj, local) => projetar(noMundo(obj, local), cam);   // ponto 3D -> pixels, para o HUD
```

### 5.1 Motor (`kit/motor/pixel.js`)

```js
const E = makePixelEngine(GL);              // GL = <canvas id="gl"> (vira 270x480)
E.render(scene, cam, { outline = 1, inner = 0.6, levels = 14, dither = 0.18, exposure = 1 });
toon(cor, { emissive, emissiveIntensity, opacity, side, map })   // MeshToonMaterial com rampa de 3 degraus
glow(cor, opacidade = 1)                                          // MeshBasicMaterial (sem luz), DoubleSide
luzes(scene, { sol, solI, pos, ceu, chao, hemiI, caixa, alvo })  // sol com sombra dura (512) + hemisfério; -> { sol, hemi }
camera(fov = 35)                                                  // PerspectiveCamera 9:16, near 0,1, far 80
PIX, PW, PH                                                       // 4, 270, 480
```

- `levels` = tons por canal (menos = mais "8 bits"); `dither` = força do pontilhado Bayer 4x4 (acima de ~0,3 vira xadrez visível); `outline`/`inner` = força das linhas.
- Passe de normais: objetos transparentes, `Points`, `Line` e os marcados com `obj.userData.noEdge = true` ficam fora (sem linha interna).
- Renderização é barata (270x480): uma folha de 33 quadros sai em ~5 s com GPU.

### 5.2 Fonte pixel (`kit/pixelfonte.mjs`)

```js
rasterizar(txt)                    // -> { px: [[x, y], ...], w }  (pura, testada; y 0 = topo da maiúscula)
larguraTexto(txt, s)               // largura em px com pixel da fonte s
textoPixel(txt, x, y, { s = 6, cor, contorno, alinhar = 'center', sombra = true, alpha = 1 })
linhaPixel([{ txt, cor }, ...], x, y, { s, contorno })   // pedaços coloridos numa linha, centrada em x
faltando                           // Set dos caracteres pedidos que a fonte não tem (saíram como "?")
G, ACENTO                          // glifos 5x7 e mapa de acentos (para estender)
```

- Tem: A-Z, 0-9, `. , ! ? : ; - – — ° º ª % × … [ ] / + = ~ ✓ → ⚡ < > ( ) ' " @ * # $ & _`, e `Á À Â Ã É Ê Í Ó Ô Õ Ú Ü Ç` (acento em 2 linhas acima, cedilha 2 abaixo). A vírgula e o `;` têm rabo de 2 pixels abaixo da linha de base (y 7 e 8, tabela `DESCE`), como a cedilha; `(` e `)` têm 3 colunas e abertos. Texto com vírgula/cedilha precisa de 2 linhas da fonte livres embaixo (a `etiqueta` já reserva). Minúscula vira maiúscula.
- **Caractere sem glifo vira "?"** e entra em `faltando` e **a 1ª vez que cada um aparece dispara `console.error('fonte pixel: sem glifo para "X" (U+XXXX)')`**, o que faz o `capture.mjs check` dar `CHECK FAILED`. Glifo novo = 7 strings de mesma largura com `#` e `.` em `G` (o teste confere o formato). "–" e "—" são traços mais largos que o "-".

### 5.3 Legendas (`kit/legendas.mjs`)

```js
planejarLegendas(tempo, script.lines)      // igual ao voxel/motion (gruposDaLinha é cópia vigiada)
desenharLegenda(blocos, t, tema, { y = 1430, s = 7, maxW = 940 })   // o main.js chama a cada quadro
```

Regras das caps iguais ao voxel: blocos `|` com 1-3 palavras e exatamente um `*`; mesmas palavras do texto falado; números em algarismos (`"só uns *2 | *centímetros"` ↔ "dois centímetros"). Palavra com hífen conta como uma ("micro-ondas").

### 5.4 HUD (`kit/hud.mjs`)

```js
usarTema(tema)                                              // uma vez, no boot (o main.js já faz)
valorTopo(valor, sub = null, k = 1, out = 0, { y = 150, s = 12 })   // "[ 2,45 GHZ ]" + tarja com subtítulo; letras datilografadas
etiqueta(txt, x, y, tx, ty, k = 1, { s = 5, cor })          // caixinha em (x, y) + linha-guia em L até (tx, ty)
cartaoFinal({ marca, textoDaUltimaLinha, k = 1, clique = 0 })        // avatar, nome, @, botão Seguir/Inscrever-se -> feito
cantos(x, y, w, h, e, len, cor)                             // cantoneiras soltas
chamadaDaPlataforma(txt) · tamanhoQueCabe(txt, larg) · arroba(marca) · letrasVisiveis(txt, k)
```

```js
const [x, y] = tela(mw.mag, V(0, 0.2, 0));
etiqueta('MAGNETRON', 540, 520, x, y, seg(t, tMag - 0.05, tMag + 0.5));
valorTopo('2,45 GHZ', '2,45 BILHÕES DE CICLOS POR SEGUNDO', seg(t, tBilhoes - 0.1, tBilhoes + 0.7), seg(t, tempo.linha(3) - 0.3, tempo.linha(3) - 0.1));
valorTopo('ATRITO = CALOR', null, k, 0, { s: 9 });          // texto longo: s menor (encolhe sozinho até caber em 900 px)
```

- Valor e subtítulo **presos a palavras** (`k` de `tempo.palavra`), saindo (`out`) antes do corte seguinte.
- Etiquetas: caixa longe do objeto (y ~520-560 em cima ou ~1170-1230 embaixo), nunca na faixa da legenda (y 1400-1500). Confira que o ponto projetado está à frente da câmera.
- Cartão final: clique numa palavra do fim da chamada presente nas três variantes (`'curiosidades'`), `+ 0.15`.

### 5.5 Peças e câmera (`kit/mundo/pecas.js`, `kit/cameras.mjs`)

```js
V(x, y, z) · box(w, h, d, mat) · cyl(rTopo, rBase, h, mat, seg) · sph(r, mat, seg) · at(obj, x, y, z)
L3(a, b, k)                                  // lerp de [x, y, z]
texturaCanvas(w, h, pintar)                  // -> { tex, g, pintar(fn) }  (NearestFilter, sRGB)
escrever(g, txt, x, y, s, cor)               // fonte pixel dentro de uma textura (visor do micro-ondas)
olhar(cam, pos, alvo, fov) · projetar(vMundo, cam) · noMundo(obj, vLocal)
```

`kit/cameras.mjs` (cópia do voxel: `travelling`, `closeBaixo`, `drone`, `orbita` + `aplicarCamera` em `mundo/camera3d.js`) também funciona; o modelo usa `olhar` + `L3` direto.

### 5.6 Props (`kit/mundo/props.js`)

```js
microondas()   // 5 x 3 x 3,8, frente em z = +1,9; -> { group, porta, mesa, lasanha, mag, guia, cav, centro, ... }
  .casca(op)          // 1 normal; ~0,16 raio-x (corpo, porta, painel, botões somem; magnetron e guia aparecem)
  .ligado(k)          // luz da cavidade (0..1)
  .visor('0:30')      // texto do visor (só repinta quando muda)
  .abrir(k)           // porta (0 fechada, 1 aberta)
  .reset()            // casca 1, desligado, fechado, prato parado, lasanha fria (chame todo quadro)
lasanha()      // camadas 4 x ~1,6 x 2,4 (base y 0); -> { group, altura, calor(k) }
corteLasanha() // lasanha + face com mapa de calor; -> { group, las, calor(banda, miolo, mapa) }
molecula(escala) // H2O (O vermelho, 2 H a 104,5°); -> { group, o, h1, h2, calor(k) }
ima()          // ímã de barra N (vermelho) / S (azul)
celular({ tomada, via })   // celular deitado em metros, tela com a fonte pixel, raio-x, cabo e carregador (ver "Celular" abaixo)
geladeira({ escala })      // geladeira duplex em metros, raio-x e gás (ver "Geladeira" abaixo)
chuveiro({ altura })       // chuveiro elétrico em metros, chave de 3 posições, raio-x com a resistência e água (ver "Chuveiro" abaixo)
corResistencia(k)          // cinza -> laranja -> vermelho (k 0..1), a cor do fio quente (chuveiro e resistenciaPorDentro)
roteador()                 // roteador Wi-Fi em metros, 3 antenas, LEDs verdes piscando (ver "Roteador" abaixo)
lampada()                  // lâmpada LED (bulbo A60, rosca E27) em metros, raio-x com os chips, acesa(k) com luz pontual (ver "Lâmpada" abaixo)
```

Mesa e lasanha ficam dentro de `mw.mesa` (gire `mw.mesa.rotation.y`). Pontos úteis: `noMundo(mw.cav, V(1.5, 0.95, -0.35))` = saída da guia de onda; `noMundo(mw.mag)` = magnetron.

**Celular.** Medidas em **metros** (como a casa), **deitado de tela para cima**: é assim que ele aparece no criado-mudo.

```js
celular({ tomada, via })   // corpo 0,075 x 0,008 x 0,155 (largura x espessura x comprimento), base em y = 0, topo para -z,
                           //   conector em +z (a "frente": virada para quem olha a mesa)
//   -> { group, corpo, tela(txt, pct, luz), casca(op), carga(k), bateria, placa, cabo, carregador, pontosCabo, pontos, medidas, reset() }
  .tela('⚡ 45%', 45, luz)  // tela de bloqueio na fonte pixel: hora, bateria grande em pé que enche de baixo (pct 0..100) e o texto;
                           //   txt = null apaga (vidro preto); luz 0..1 = brilho (rampa para "acender"). Só repinta quando txt/pct/sinal mudam.
  .tela('WI-FI', 0, 1, { sinal })   // sinal 0..4: troca a bateria pelo leque do Wi-Fi (ponto + 3 arcos; os `sinal` primeiros em laranja,
                           //   o resto apagado). Use barrasDeSinal(forcaDoSinal(d, { paredes }).dbm) (wifi.mjs).
  .casca(op)               // 1 normal; ~0,15 raio-x: aro, traseira, vidro e tela somem (opacidade op²; abaixo de 0,25 ficam escondidos),
                           //   aparecem a bateria em camadas, a placa e um anel opaco do aro (contorno firme)
  .carga(k)                // medidor laranja em cima da bateria (0..1, enche de baixo para cima; só aparece no raio-x)
  .reset()                 // casca 1, tela apagada, carga 0 (chame todo quadro)
```

- Por fora: aro champanhe com cantos arredondados (`lajeRedonda`: 2 caixas em cruz + 4 cilindros), traseira coral, vidro preto, liga/desliga à direita, 2 botões de volume à esquerda, conector e furos do alto-falante embaixo; atrás, calombo com 3 lentes e flash no canto de cima (vista de trás: à esquerda). **Em pé, de frente:** `group.rotation.x = Math.PI / 2` (tela para +z, topo +y); para girar em pé use `rotation.order = 'YXZ'` e `rotation.y`.
- Por dentro: bateria de 0,064 x 0,098 (a maior parte do corpo; 7 lâminas cinza / laranja / creme e capa escura com o medidor) e placa verde em cima (blindagem do processador, chips, contatos dourados, módulo das câmeras), plaquinha do conector embaixo e cabo flexível laranja pela esquerda.
- `tomada = [x, y, z]` (coordenadas do grupo) = face da tomada: o carregador preto (com luzinha laranja e porta USB na frente, embaixo) encosta nela de frente para +z; `via` = pontos por onde o cabo branco passa até o plugue no conector. Sem `tomada` não há cabo nem carregador. `pontosCabo` (do carregador ao celular, coordenadas do grupo) serve para um `fluxo` de corrente no cabo (`cel.group.add(f.group)`).
- **No quarto:** `quarto({ celular: true })` põe o celular em `Q.criado` (x local -0,12, z 0,04; mundo ≈ (-1.25, 0.56, -1.78)) com o carregador na tomada e o cabo descendo pela fresta entre a parede e o móvel, pousando no tampo atrás e contornando o celular pela esquerda até o conector (nada atravessa o móvel). Devolve `Q.cel`.
- `pontos` (coordenadas do grupo; no mundo: `noMundo(cel.group, cel.pontos.tela)`):

| ponto | grupo (x, y, z) | o que é |
|---|---|---|
| `tela` | (0, 0.01, 0) | meio da tela (alvo dos closes) |
| `bateria` | (0, 0.0073, 0.019) | capa da bateria (raio-x) |
| `placa` | (-0.012, 0.0053, -0.044) | blindagem do processador (raio-x) |
| `camera` | (0.0175, 0, -0.0535) | calombo da câmera traseira (embaixo) |
| `conector` | (0, 0.0055, 0.0775) | conector USB-C |
| `carregador` | tomada + (0, 0, 0.03) | frente do carregador (no quarto: use `noMundo(cel.carregador, V(0, 0.023, 0.015))` para o topo) |

Câmeras (vitrine; `c = noMundo(cel.group, cel.pontos.tela)`):

| plano | pos1 → pos2 | alvo | fov | enquadra |
|---|---|---|---|---|
| em pé no estúdio | (0.03, 0.03, 0.46) fixa, `rotation.y` de PI + 0,55 a 0,35 | (0, -0.024, 0) | 35 | celular inteiro (~54% da altura), da traseira à tela, acima da legenda |
| quarto, médio | (-0.86, 1.2, -0.92) → (-0.98, 1.1, -1.06) | (-1.25, 0.56, -1.98) | 40 | tomada com carregador em cima, cabo descendo, celular no tampo, cúpula do abajur à direita |
| close da tela | c + (0.012, 0.44, 0.18) → c + (-0.004, 0.38, 0.14) | c + (0, 0, 0.04) | 35 | celular de cima, ~55% da altura, tela legível; o plugue e o cabo embaixo |
| raio-x | c + (0.05, 0.4, 0.17) → c + (0.025, 0.41, 0.15) | c + (0, -0.004, 0.035) | 35 | de cima, um pouco de lado: bateria, placa e anel do aro |

- Num close o celular é pequeno no mundo (0,155): a câmera fica a ~0,4 m dele (o near do `camera()` é 0,1). Etiquetas da vitrine: CARREGADOR (300, 330), CELULAR (780, 1230), PLACA (300, 330), BATERIA (780, 1230).
- Tela: fundo liso. Faixas de marrom muito escuro (#24170F) viram verde no quantizador do motor; não faça degradê escuro na textura.

**Geladeira.** Medidas em **metros** (como a casa); `escala` multiplica tudo.

```js
geladeira({ escala = 1 })   // duplex, freezer em cima: corpo 0,70 x 1,80 x 0,60 + portas de 0,06 (frente em z = +0,36), base em y = 0
//   -> { group, porta, freezer, casca(op), aberta(k, kFreezer), luz(k), gas(t, { k }), compressor, serpentina,
//        tubos, tubosDentro, fluxoGas, corGas, pontos, reset() }
  .casca(op)            // 1 normal; ~0,15 raio-x: corpo, portas, forros e prateleiras somem, a comida fica fraca (op x 2),
                        //   os tubos das paredes (tubosDentro) aparecem; serpentina, compressor e tubos de trás sempre estão lá
  .aberta(k, kFreezer)  // portas (0 fechada, 1 = ~100°, dobradiça à esquerda, abre para +z); acende a luz junto (luz = min(1, 4k))
  .luz(k)               // luz de dentro (lâmpada, forro claro, luz pontual); chame depois de aberta() para outro valor
  .gas(t, { k })        // bolinhas do gás pelo circuito: laranja do compressor, âmbar no fim da serpentina, azul depois do
                        //   capilar (a "válvula"), azul-claro na sucção; k = 0 esconde. Use junto com casca baixa.
  .reset()              // casca 1, portas fechadas, luz apagada, gás escondido (chame todo quadro)
```

- Por dentro: 3 prateleiras de vidro fosco, gaveta de legumes com frutas, garrafas, suco, geleia, queijo, bolo, ovos, panela; freezer com forma de gelo, pacotes e sorvete; portas com prateleirinhas e garrafas. Atrás: serpentina preta (condensador, y 0,34 a 1,2) e compressor num nicho embaixo, atrás.
- Circuito: compressor → descarga (sobe pela esquerda, atrás) → condensador (de cima para baixo) → capilar (sobe pela direita e entra na parede do fundo do freezer) → evaporador (serpentina na parede do fundo do freezer) → sucção (desce por dentro da parede da direita) → compressor.
- `pontos` (coordenadas do grupo, sem escala; no mundo: `noMundo(gel.group, gel.pontos.compressor)`):

| ponto | grupo (x, y, z) | o que é |
|---|---|---|
| `compressor` | (0.10, 0.13, -0.21) | compressor no nicho de trás |
| `condensador` | (0, 0.77, -0.33) | meio da serpentina preta de trás |
| `valvula` | (0.30, 1.69, -0.28) | ponta do capilar, onde o gás entra no evaporador (a expansão) |
| `evaporador` | (0, 1.51, -0.28) | meio da serpentina na parede do fundo do freezer |
| `luz` | (0, 1.15, -0.05) | lâmpada no teto do compartimento de baixo |
| `dentro` / `freezer` | (0, 0.75, 0) / (0, 1.5, 0) | meio de cada compartimento |
| `puxador` | (0.29, 0.95, 0.415) | puxador da porta de baixo |

**Chuveiro elétrico.** Medidas em **metros**; o chuveiro brasileiro típico: corpo branco em sino, crivo redondo, chave de 3 posições, braço saindo da parede.

```js
chuveiro({ altura = 2.05 })   // grupo começa no ponto da parede, braço em +z; altura = queda do crivo até o chão
//   -> { group, corpo, crivo, chaveG, alavanca, dentro, aguaFx, fluxoAgua, pontos, altura, casca(op), resistencia(k), agua(k, t), chave(pos), reset() }
  .casca(op)          // 1 normal; ~0,15 raio-x: sino e domo somem (op²; abaixo de 0,25 escondidos); ficam braço, crivo, chave,
                      //   2 aros brancos (silhueta do sino), a câmara de água, a tampa com 3 bornes e a resistência em espiral
  .resistencia(k)     // calor 0..1: o trecho usado vai de cinza a laranja e vermelho (com brilho); a água de dentro esquenta
  .chave(pos)         // 0 desligado, 1 verão (fio inteiro), 2 inverno (só o trecho até o borne do meio); valores no meio animam
  .agua(k, t)         // vazão 0..1: gotas e filetes caindo do crivo (efeitos.agua) e, no raio-x, a água descendo encostada no fio
                      //   (azul na entrada, creme e laranja no crivo, conforme resistencia). Passe t: é função pura de t.
  .reset()            // casca 1, chave 0, resistencia 0, água fechada (chame todo quadro)
```

- Canopla e braço branco de 30 cm (eixo do corpo em z = 0,30), descida até a tampa da câmara; domo + sino (raio 0,05 em cima, 0,082 embaixo, 8,5 cm de altura); crivo de raio 0,088 com 44 furos (girassol) a 0,144 abaixo do braço; 3 fios (preto, vermelho, terra verde) de trás do domo para a parede, por cima do braço.
- **Chave** na frente-direita do sino (azimute 0,9 rad, para não tapar a resistência no raio-x de frente), numa caixinha redonda inclinada com a parede do sino (o sino abre para baixo: a parede olha para cima). Marcas: cinza (desligado, à esquerda), âmbar (verão, em cima), vermelha (inverno, à direita); a alavanca escura aponta para a marca.
- **Resistência:** hélice de 5 voltas (raio 0,03, fio de raio 3,2 mm) cortada em 30 pedaços com material próprio. O trecho usado (`trechoDaChave(pos)`: 1 no verão, `TRECHO_INVERNO` = 0,58 no inverno, a partir do borne de entrada no topo) recebe a cor `corResistencia(k)`; o resto fica cinza-escuro `#4A5058` (fora do circuito). Os 3 bornes na tampa: entrada (sempre acesa com a chave ligada), meio (acende no inverno), ponta (acende no verão).
- Não projeta sombra (o mapa de sombra do cômodo, 1,2 cm por texel, vira escada no azulejo nos closes).
- **No banheiro:** `banheiro({ chuveiro: true })` prende o chuveiro em `B.parede` (mundo (-0.62, 2.2, -1.5)) e devolve `B.ch`; crivo em mundo ≈ (-0.62, 2.056, -1.2), a água cai até o piso. Para o vapor: `vapor(18)` com `scale 0.28` em (-0.62, 1.15, -0.95), `atualizar(t, 0.8)`.
- `pontos` (coordenadas do grupo; no mundo: `noMundo(ch.group, ch.pontos.crivo)`):

| ponto | grupo (x, y, z) | o que é |
|---|---|---|
| `crivo` | (0, -0.144, 0.30) | centro da face do crivo |
| `chave` | (0.059, -0.085, 0.347) | botão da chave (frente-direita) |
| `camara` | (0, -0.084, 0.30) | meio da câmara de água (alvo dos closes) |
| `resistencia` | (0, -0.084, 0.333) | frente da espiral (raio-x) |
| `aguaDentro` | (-0.039, -0.1, 0.30) | água descendo na câmara (raio-x) |
| `agua` | (0, -0.36, 0.30) | água caindo, 22 cm abaixo do crivo |
| `bornes` | (0, -0.041, 0.30) | tampa com os 3 bornes (raio-x) |
| `braco` / `fios` | (0, 0, 0.15) / (0, 0.045, 0.08) | meio do braço / fios em cima dele |

Câmeras (vitrine, no `banheiro({ chuveiro: true })`; `m = noMundo(ch.group, ch.pontos.camara)`):

| plano | pos1 → pos2 | alvo | fov | enquadra |
|---|---|---|---|---|
| médio | (0.1, 2.3, 1.0) → (-0.2, 2.25, 0.6) | (-0.62, 1.7, -1.2) | 40 | chuveiro com braço, canopla e fios a ~20% do topo, água caindo até o piso (o perfil de cima do box cruza a água, embaixo do chuveiro) |
| chave (close) | m + (0.36, 0.01, 0.42) → m + (0.3, 0.02, 0.38) | m + (0.02, -0.07, 0) | 35 | sino grande com a chave no meio, água embaixo |
| raio-x | m + (-0.08, 0.06, 0.54) → m + (-0.03, 0.07, 0.5) | m + (0, -0.04, 0) | 35 | um pouco de cima: câmara, espiral, bornes, a chave à direita, crivo e a água caindo |

- Etiquetas da vitrine: CHUVEIRO (780, 330) e ÁGUA (300, 1230) no médio; CHAVE (780, 1230) no close; RESISTÊNCIA (780, 330) e ÁGUA (300, 1230) no raio-x. O nome da posição (DESLIGADO, VERÃO, INVERNO) vai no `valorTopo(..., { s: 10 })`.

**Roteador.** Medidas em **metros**; caixa preta pequena para a estante.

```js
roteador()   // caixa 0,24 x 0,045 x 0,16 sobre 4 pés, base em y = 0, frente em +z; 3 antenas pretas de 0,17 atrás (as dos lados
             //   abertas ±0,2 rad), frisos de ventilação em cima, 4 LEDs numa faixa na frente, cabos de força e de rede descendo atrás
//   -> { group, corpo, antenas, pontos, leds(t, k), reset() }
  .leds(t, k)   // LED 0 energia (fixo), 1 internet (apaga numa fatia em ~6%), 2 e 3 Wi-Fi 2,4 e 5 GHz (piscam em rajadas, até 12
                //   vezes por segundo); verde #8BE36A aceso, #1F3324 apagado; k = brilho geral. Puro em t (ledDoRoteador, wifi.mjs).
  .reset()      // LEDs apagados
```

- **Na sala:** `sala({ roteador: true })` põe em `S.estante` (x local 0,1; mundo ≈ (-1.30, 1.30, -2.62)) e devolve `S.rot`. Os cabos descem atrás do móvel.
- `pontos` (coordenadas do grupo; no mundo: `noMundo(rot.group, rot.pontos.antena)`):

| ponto | grupo (x, y, z) | o que é |
|---|---|---|
| `antena` | (0, 0.235, -0.068) | ponta da antena do meio |
| `antenas` | 3 pontas | as 3 antenas (a da esquerda e a da direita abertas) |
| `led` | (0.005, 0.028, 0.084) | LED do Wi-Fi 2,4 GHz |
| `centro` | (0, 0.03, 0) | meio da caixa (alvo dos closes) |
| `emissor` | (0, 0.143, -0.068) | entre as antenas: origem das `ondasEsfericas` |

Câmeras (vitrine; `r = noMundo(rot.group, rot.pontos.centro)`):

| plano | pos1 → pos2 | alvo | fov | enquadra |
|---|---|---|---|---|
| close | r + (0.4, 0.36, 1.15) → r + (0.16, 0.3, 1.02) | r + (0, 0.07, 0) | 40 | roteador no meio (~55% da largura), antenas inteiras, quadro em cima, livros embaixo |
| Wi-Fi de cima (forro escondido, `vizinho: true`) | (-0.95, 7.0, -0.55) → (-1.2, 6.9, -0.7) | (-1.3, 0.6, -3.4) | 40 | roteador a ~60% da altura, a parede do fundo no meio, a escrivaninha com o celular no escritório em cima (~24%) |

- Etiquetas da vitrine: ANTENA (300, 420) e LED (780, 1230) no close; ROTEADOR (300, 1580), PAREDE (780, 1050, ponto (-0.7, 2.7, -2.875)) e CELULAR (780, 300) de cima.

**Lâmpada LED.** Medidas em **metros**; bulbo A60 pendurado para -y.

```js
lampada()   // o grupo começa no fundo do bocal; rosca E27 metálica com 4 anéis (1,2 cm entra no bocal), pescoço branco, bulbo
            //   leitoso de raio 3 cm (fundo a ~9 cm do bocal); por dentro, placa de alumínio virada para baixo com 8 chips amarelos
            //   em anel + 1 no meio (o amarelo é o fósforo)
//   -> { group, bulbo, placa, chip, chips, luz, pontos, casca(op), acesa(k), reset() }
  .casca(op)   // 1 leitoso opaco; ~0,35 raio-x: o bulbo vira um véu (op², transparente só quando op < 1), o halo some, aparecem
               //   a placa e os chips (amarelos mesmo na sombra: brilho próprio 0,35)
  .acesa(k)    // 0..1: bulbo emissivo, chips de amarelo a creme, halo leve (2 cascas glow) e PointLight #FFE6BE (3,5, decaimento
               //   1,5) que ilumina o cômodo de verdade. No raio-x a luz cai para 3% (colada nela o close estoura, ver §7).
  .reset()     // casca 1, apagada
```

- `chip` = o chip do meio (mesh), para um zoom que entra no `chipLED()`. Não projeta sombra.
- **Na sala:** `sala({ lampada: true })` rosqueia em `S.teto` e devolve `S.lamp` (bulbo no mundo ≈ (0.25, 2.12, 0.2)). Para a lâmpada "acender a sala", escureça junto: `S.anoitecer(1)` + `S.lamp.acesa(k)`.
- `pontos` (coordenadas do grupo): `bulbo` (0, -0.059, 0) centro do bulbo · `chip` (0, -0.0386, 0) chip do meio · `placa` (0, -0.037, 0) · `rosca` (0, -0.006, 0) · `fundo` (0, -0.0908, 0) ponta de baixo.

Câmeras (vitrine; `b = noMundo(lamp.group, lamp.pontos.bulbo)`):

| plano | pos1 → pos2 | alvo | fov | enquadra |
|---|---|---|---|---|
| sala à noite | (0.6, 1.5, 2.5) → (0.4, 1.45, 2.2) | (0.15, 1.55, -1.5) | 42 | luminária no alto (~15%), painel com a TV e o rack: parede e forro clareiam quando acende |
| raio-x (de baixo) | b + (0.16, -0.13, 0.28) → b + (0.1, -0.12, 0.25) | b + (0, 0.005, 0) | 40 | cúpula em cima, rosca, pescoço e a placa com os 9 chips vistos de baixo, o véu do bulbo |

- Etiquetas da vitrine: BULBO (780, 560) na sala; CHIP LED (780, 420) e BULBO (300, 1230, ponto 1,5 cm abaixo do centro) no raio-x.

### 5.7 Cenários (`kit/mundo/cenarios.js`)

```js
cozinha()        // bancada, azulejos, armários, chaleira, fruteira, vaso + micro-ondas; -> { scene, mw, L, gel: null, piso: null }
cozinha({ geladeira: true })   // + geladeira em pé à esquerda da bancada, piso e parede até o chão; -> { scene, mw, L, gel, piso }
cicloFrio()      // "planta técnica" do circuito da geladeira (ver abaixo); -> { scene, pontos, gas, corGas, ..., atualizar(t, { k, quente, frio }) }
bateriaPorDentro()   // célula de íons de lítio viva (ver abaixo); -> { scene, pontos, ions, eletrons, aparelho, atualizar(t, { carga, sentido, eletrons }) }
resistenciaPorDentro()   // close do fio da resistência (ver abaixo); -> { scene, pontos, atomos, eletrons, aguas, corte, atualizar(t, { corrente, calor, trecho }) }
planta({ aparelho = 'microondas' })   // "planta técnica": fundo azul-noite, grade polar ciano, aparelho em arestas, senoide (2 pixels)
                 //   -> { scene, seta, holo, onda, onda2, pontos, atualizar }  (seta vira com o sinal da senoide; ver abaixo)
chipLED()        // close da junção P-N de um LED (ver abaixo); -> { scene, pontos, atualizar(t, { k }) }
microMundo()     // dentro da comida: 34 moléculas + herói + ímã + faíscas de calor
                 //   -> { scene, mols, heroi, ima, atualizar(t, { alinhar, campo, agito, calor }) }
telaPerfurada()  // close da porta: chapa furada, lasanha iluminada atrás, frentes de onda que batem e voltam, raios de luz
                 //   -> { scene, chapa, atualizar(t, { ondasK, luz }) }
estudio({ fundo, prato })   // fundo liso + luz, para um objeto de perto (ex.: corteLasanha)
```

- **`planta()` e a frequência.** `atualizar(t, freq = 4, amp = 0.9)` (só número) é a forma antiga, igual a antes. `atualizar(t, { ghz = 2.45, amp = 0.9, vel = 1, ghz2 = null })` usa a frequência de verdade (`ondaDaPlanta`, wifi.mjs): em 2,45 GHz é a mesma senoide de antes; 5 GHz tem a onda 2,45/5 mais curta e a crista anda na mesma velocidade. `ghz2` desenha uma 2ª onda em ciano-claro `#9BEFFF` para comparar (as duas com 60% da amplitude). `aparelho: 'roteador'` troca o micro-ondas por um roteador em arestas (caixa baixa, 3 antenas, 4 LEDs verdes; a seta some) e sobe a onda para y = 3,8 (duas: 4,6 e 3,4). `pontos.onda` / `onda2` = pontos das linhas em x = -1,2 (etiquetas); `pontos.aparelho` = meio do holograma. Câmera do roteador com 2 ondas: (2.4, 2.9, 15.5) → (1.0, 2.8, 14.8) olhando para (0, 2.0, 0), fov 35; etiquetas 2,4 GHZ (300, 250) e 5 GHZ (800, 556, ponto em x = +1,2).
- `microMundo.atualizar`: `alinhar` 0..1 (quanto as moléculas seguem o campo), `campo` = ângulo em rad (use `Math.tanh(4 * Math.sin(...)) * PI/2` para viradas rápidas e suaves), `agito` 0..1 (tremor de colisão), `calor` 0..1 (fundo e moléculas puxam para laranja, faíscas sobem). A herói (`heroi.group`) e o `ima` você posiciona na cena.
- A herói fica em z ≈ 1,2; as moléculas perto do centro são empurradas para trás para não cobri-la.

**Chip LED por dentro: `chipLED()`.** Diagrama vivo da junção P-N, de frente para a câmera (plano xy), fundo marrom-escuro:

```js
const CL = chipLED(); CL.atualizar(t, { k = 1 });   // todo quadro (puro); k 0..1 = corrente (quantos pares conduzem; 0 = parados, sem luz)
```

- De baixo para cima: contato de metal, **camada N** (cinza-grafite, letra N) com elétrons (esferas `glow` ciano-claro `#9BEFFF`, a exceção do §2), a **junção** (linha creme em y = 0), **camada P** (terracota, letra P) com **lacunas** (anéis laranja `#FFB43A` vazios), um pad dourado, um vão transparente e a **camada de fósforo** amarelo `#F2C94C` (brilha um pouco com k).
- 28 partículas paradas tremendo (2 fileiras de elétrons, 2 de lacunas) + 8 pares que andam (lógica pura em `led.mjs`): o elétron sobe de y = -1 e a lacuna desce de 0,72, cada vez mais rápido, e se encontram na junção; os dois somem, sai um clarão creme e um **fóton** (faísca `glow`: bolinha + cruz, 2 rastros) que sobe azul `#4F8BFF` e vira branco `#FFF6DD` ao passar pelo fósforo (`corDoFoton`). Período 2,4 s, um encontro a cada 0,3 s.
- Ocupa x de -2,5 a 2,5 e y de -2,5 a 3,3 (os fótons saem até 4,6). **Câmera:** (0, -0.35, 16) olhando para (0, -0.35, 0), fov 35 (a vitrine anda de (0.35, -0.2, 16.3) a (-0.2, -0.4, 15.8)): o chip fica acima da faixa da legenda e o fósforo abaixo do `valorTopo`.
- `pontos` (mundo):

| ponto | (x, y, z) | etiqueta da vitrine |
|---|---|---|
| `lacuna` | móvel: a lacuna do par herói chegando na junção (troca a cada 0,9 s; sem par ativo, uma parada) | LACUNA (300, 300) |
| `juncao` | (2.2, 0, 0.2) | JUNÇÃO (780, 300) |
| `eletron` | móvel: o elétron do mesmo par herói | ELÉTRON (300, 1580) |
| `foton` | móvel: o fóton herói subindo (troca a cada 0,9 s) | FÓTON (300, 1580) |
| `fosforo` | (1.2, 2.725, 0.2) | FÓSFORO (780, 1580) |
| `chip` / `nCamada` / `pCamada` / `centro` | (0, 0.2, 0.2) / (0, -1.2, 0.2) / (0, 1.2, 0.2) / (0, -0.35, 0) | |

- Na vitrine o fóton sai junto com `valorTopo('AZUL + AMARELO = BRANCO', null, k, 0, { s: 8 })`.

**Geladeira na cozinha (escala).** A cozinha está em ~10 cm por unidade (micro-ondas de 5, tampo da bancada em y = 0); a casa e a `geladeira()` estão em metros. Decisão: a geladeira é feita em metros e a `cozinha({ geladeira: true })` a põe com `escala: 10`, em pé no chão. Com a opção, a cozinha ganha o chão em y = -9 (bancada de 90 cm), piso de lajotas, parede até o chão, gabinete da bancada descendo até o chão, e bancada, azulejos e armário de cima começando em x = -7,4 (o resto igual; sem a opção nada muda). A geladeira fica com centro em x = -11,1, z = 1,0: ocupa x de -14,6 a -7,6, y de -9 a 9 (o topo alinha com o do armário de cima), porta da frente em z = 4,6 (20 cm além da bancada, como numa cozinha de verdade) e serpentina de trás a 1 cm da parede. A porta abre para a esquerda (lado livre), sem atravessar a bancada. Na casa (metros), use `geladeira()` sem escala.

Câmeras (vitrine, `ver(pos, alvo, fov 35)`):

| plano | pos1 → pos2 | alvo | enquadra |
|---|---|---|---|
| geladeira inteira + bancada | (-4.5, 2.5, 44) → (-7.5, 1.5, 42) | (-9.0, 0.3, 0) | geladeira inteira à esquerda, chaleira e a ponta do micro-ondas à direita, piso embaixo |
| porta aberta | (-1.5, 2, 37) → (-3.5, 2.5, 35) | (-11.2, -0.4, 2.5) | de frente pela direita: interior iluminado, porta aberta com as prateleirinhas à esquerda |
| raio-x | (-21, 5, 31) → (-24, 4, 29) | (-11.1, -0.3, -0.5) | **pela esquerda** (pela direita a bancada esconde o compressor): evaporador em cima, serpentina e compressor atrás |

- Geladeira inteira em 9:16 pede ~38 a 40 de distância (a altura de 18 é que manda: 18 / 2 / tan(17,5°) ≈ 29, mais folga).
- No raio-x, gire a câmera para ver os tubos de lado: de frente, condensador e evaporador ficam em planos quase iguais. Etiquetas da vitrine: EVAPORADOR em (760, 200), CONDENSADOR em (760, 1230), COMPRESSOR em (300, 1300).

**Ciclo do frio: `cicloFrio()`.** Planta técnica (fundo azul-noite, grade, caixa em arestas ciano) num plano de frente para a câmera:

```js
const CF = cicloFrio(); CF.atualizar(t, { k = 1, quente = 1, frio = 1 });   // todo quadro (puro)
//   k: bolinhas do gás (encolhem com k) e compressor pulsando; o cano fica sempre
//   quente: setas de calor subindo do condensador e brilho vermelho das aletas
//   frio: setas de calor subindo da comida e entrando no evaporador, brilho azul das aletas, fundo da caixa esfriando
```

- Condensador em cima (serpentina com aletas vermelhas), válvula à esquerda (dois cones: o estreitamento), caixa embaixo (o lado de dentro da geladeira) com o evaporador no alto (aletas azuis) e a comida no fundo, compressor à direita, fora da caixa.
- Gás: laranja `#FF6A1E` saindo do compressor → âmbar `#FFB43A` no fim do condensador → creme `#FFD08A` até a garganta da válvula → **virada seca** para azul `#4F8BFF` na garganta (paradas a ±0,002 de u, calculadas com `fracoesDoCaminho`; nada de roxo) → azul-claro na sucção → laranja de novo dentro do compressor. O cano é `BackSide` (só a metade de trás), para não tingir as bolinhas.
- Ocupa x de -3,1 a 4,1 e y de -3,6 a ~6,5. **Câmera:** (0.4, -0.2, 23.8) olhando para (0.4, -0.2, 0) (a vitrine anda de (1.7, 0.4, 24.2) a (-0.9, -0.2, 23.6)): tudo acima da faixa da legenda, sobra um pouco de grade embaixo para as etiquetas.
- `pontos` (mundo):

| ponto | (x, y, z) | etiqueta da vitrine |
|---|---|---|
| `condensador` | (0.1, 3.9, 0) | (700, 650), no vão entre condensador e caixa |
| `valvula` | (-2.8, 1.75, 0.36) | (380, 760), à direita da válvula |
| `evaporador` | (-0.1, -0.5, 0) | (300, 1580), embaixo da legenda |
| `compressor` | (3.3, -2.35, 0.64) | (800, 1580), embaixo da legenda |
| `caixa` | (-0.05, -3.0, 0.4) | comida no fundo da caixa |
| `calorSai` / `calorEntra` | (0.1, 5.4, 0.3) / (0, -1.9, 0.4) | setas de calor (para uma etiqueta "CALOR") |
| `centro` | (0.4, -0.2, 0) | alvo da câmera |

**Bateria por dentro: `bateriaPorDentro()`.** Diagrama vivo de uma célula de íons de lítio, de frente para a câmera (plano xy), fundo marrom-escuro:

```js
const BP = bateriaPorDentro(); BP.atualizar(t, { carga = 0, sentido = 1, eletrons = 1 });   // todo quadro (puro)
//   carga 0..1: onde estão os íons (0 = todos no cátodo, descarregada; 1 = todos no ânodo, cheia)
//   sentido +1 carregando / -1 descarregando: rastro dos íons e sentido dos elétrons no fio; 0 = parado, sem elétrons
//   eletrons 0..1: tamanho das bolinhas do fio
//   -> { scene, pontos, ions, eletrons, aparelho, de, para, atualizar }
```

- De baixo para cima: coletor de **alumínio** (cinza-claro), **cátodo** (4 fileiras de 7 blocos de óxido metálico em laranja/terracota, com 3 fileiras de vagas nas frestas), **separador** (placa creme translúcida com poros), **ânodo** (4 camadas de grafite cinza com pontinhos de anéis de carbono, 3 fileiras de vagas entre elas), coletor de **cobre**. À direita, o **fio** sai da aba do alumínio, sobe por um **aparelho** (caixa escura com ⚡ laranja: o carregador quando carrega, o celular quando descarrega) e entra na aba do cobre.
- **Íons de lítio:** 18 esferas `glow` ciano-claro `#9BEFFF` (6 colunas x 3 níveis). Cada um tem uma vaga no cátodo e outra no ânodo na mesma coluna e anda em linha reta pela fresta; os de perto do separador saem primeiro e vão para o fundo do ânodo, então ninguém atravessa vaga ocupada; descarregando, o último a chegar é o 1º a sair. Parados, tremem de leve; andando, deixam 2 rastros transparentes atrás (pelo `sentido`). A média do progresso acompanha a carga (exata em 0, 0,5 e 1).
- **Elétrons:** `fluxo` amarelo `#FFD23F` aberto no fio (tubo marrom translúcido). Carregando, do alumínio (cátodo) para o cobre (ânodo): o carregador tira elétrons do cátodo e empurra para o ânodo, junto com os íons; descarregando, do cobre para o alumínio, passando pelo aparelho (é a corrente que alimenta o celular). O ⚡ pulsa quando há corrente.
- Lógica pura em `kit/mundo/ions.mjs` (testada em `tests/ions.test.mjs`): `vagaDoIon(i, colunas, niveis)` → `{ coluna, nivelCatodo, nivelAnodo }`; `progressoDoIon(i, n, carga, janela = 0.3)` → p em [0, 1] (íon i parte em carga i/(n-1)·(1 - janela) e chega uma janela depois, smoothstep); `pontoDoIon(a, b, p)` → [x, y, z] (Bézier com alças na vertical; mesma coluna = linha reta).
- Ocupa x de -2,1 a 3,0 e y de -2,4 a 2,9. **Câmera:** (0.45, -0.4, 16.6) olhando para (0.45, -0.4, 0) (a vitrine anda de (0.75, -0.3, 16.9) a (0.15, -0.45, 16.4)): o diagrama fica entre ~19% e ~69% da altura, livre acima para o `valorTopo` e livre embaixo da legenda para etiquetas.
- `pontos` (mundo):

| ponto | (x, y, z) | etiqueta da vitrine |
|---|---|---|
| `anodo` | (0, 1.74, 0.2) | ÂNODO (300, 300) |
| `catodo` | (0, -0.97, 0.2) | CÁTODO (780, 1580) |
| `separador` | (0, 0.5, 0.2) | SEPARADOR (300, 1580) |
| `ion` | móvel: o íon herói (o 10º a sair; atravessa o separador por volta de carga 0,5). Atualizado por `atualizar`. | ÍON DE LÍTIO (780, 300) |
| `fio` | (2.66, 1.9, 0) | ELÉTRONS (780, 300) |
| `aparelho` | (2.66, 0.4, 0.22) | CELULAR / CARREGADOR (780, 1580) |
| `cobre` / `aluminio` | (-1.2, 2.69, 0.22) / (-1.2, -2.19, 0.22) | coletores |
| `centro` | (0.45, -0.4, 0) | alvo da câmera |

**Resistência por dentro: `resistenciaPorDentro()`.** Close de um pedaço do fio de níquel-cromo, em pé no meio do quadro (eixo y), fundo marrom-escuro:

```js
const RP = resistenciaPorDentro(); RP.atualizar(t, { corrente = 1, calor = 0, trecho = 1 });   // todo quadro (puro)
//   corrente 0..1: quantos elétrons aparecem (0 = nenhum)
//   calor 0..1: cor do fio (corResistencia), tremor dos átomos (vibracaoDoAtomo) e quanto a água esquenta no total do trecho
//   trecho 0..1: pedaço usado, de cima (u = 0, y = 5,2) para baixo (u = 1, y = -5,2); 1 = o fio inteiro
```

- **Fio:** metade de trás de um cilindro de raio 1,35 (vista por dentro) com 2 bordas metálicas: lê como fio cortado ao meio. Acima do corte, cor e brilho do calor; abaixo, cinza-escuro `#4A5058` (fora do circuito), átomos parados, sem elétrons. Um meio anel âmbar marca o corte (o borne do meio, no inverno).
- **Rede de átomos:** camada da frente com 3 colunas (esferas cinza-claro de raio 0,235, passo 0,85, z 0,3) e camada de trás desencontrada com 2 colunas (menores e mais escuras, z -0,6): a grade lê em 2 planos. Tremor = `vibracaoDoAtomo(i, t, calor·dentro)` × 0,7 passo (no máximo ~0,18); no trecho usado esquentam um pouco de cor.
- **Elétrons:** 2 trilhas de 15 bolinhas `glow` ciano-claro `#9BEFFF` (exceção do §2) descendo em zigue-zague entre as colunas da frente, raspando nos átomos. Átomo encostado por um elétron acende em laranja (emissivo `#FFB43A`): o choque que vira calor (efeito Joule). Os elétrons andam num sentido só (é um diagrama; na tomada a corrente é alternada).
- **Água:** 4 trilhas de bolinhas (2 de cada lado, por fora do fio) descendo; azul `#4F8BFF` em cima, esquentando ao longo do trecho usado (creme `#FFE9C4` no meio, laranja `#FF7A2E` no fim) e quente dali para baixo. Com o mesmo calor, trecho menor esquenta a água mais cedo; o inverno usa calor maior (`calorDaChave(2)` = 1 contra 0,58 no verão).
- Ocupa x de -2,6 a 2,6 e o quadro todo na altura. **Câmera:** (0, 0.3, 16) olhando para (0, 0.3, 0), fov 35 (a vitrine anda de (0.35, 0.45, 16.4) a (-0.2, 0.2, 15.8)). Com `trecho` = `TRECHO_INVERNO` o corte fica em y ≈ -0,83 (~61% da altura), acima da legenda.
- `pontos` (mundo):

| ponto | (x, y, z) | etiqueta da vitrine |
|---|---|---|
| `eletron` | móvel: um elétron de verdade da trilha da esquerda (o visível mais perto de y = 2,6 no começo de cada janela de 3 s; troca só na virada da janela) | ELÉTRON (300, 300) |
| `atomo` | móvel: átomo da frente em (0.85, 2.55, 0.3) + tremor | ÁTOMO (780, 300) |
| `agua` / `aguaQuente` | (1.85, 3.0, 0.25) / (1.85, -3.6, 0.25) | ÁGUA (780, 1580) / ÁGUA QUENTE (300, 1580) |
| `trecho` | móvel: (1.35, y do corte, 0) | FIM DO TRECHO (780, 1230) |
| `trilha` | (-0.295, 1.7, 0.32): ponto fixo na trilha dos elétrons (reserva do `eletron`) | |
| `fio` / `centro` | (-1.35, 3.2, 0) / (0, 0.3, 0) | borda do fio / alvo da câmera |

**Casa: `sala()`, `banheiro()`, `quarto()`.** Escala em **metros** (1 unidade = 1 m; a cozinha do micro-ondas é outra escala). Cada cômodo é uma caixa aberta na frente (+z): piso em y = 0, parede do fundo em z = -prof/2, laterais em x = ±larg/2, forro no pé-direito, rodapé. Sol quente entrando pela boca aberta (paredes e forro não projetam sombra; forro com um pouco de emissão para não escurecer). Fundo `#2A1A12` (só aparece se a câmera sair da caixa).

```js
const S = sala();      // 5,2 x 5,6, pé-direito 2,7
//   -> { scene, L, estante, mesa, sofa, tv, telaTV, teto, forro, comodo }
//   painel ripado com TV, rack, estante baixa com livros, sofá de costas para a câmera (almofadas e manta),
//   mesinha de centro no tapete, janela com cortina na parede da esquerda, planta, quadro, luminária pendente
const B = banheiro();  // 2,6 x 3,0, pé-direito 2,6
//   -> { scene, L, parede, box, ralo, pia, espelho, forro, comodo, ch: null }
const B = banheiro({ chuveiro: true });   // + chuveiro() preso em B.parede (ver "Chuveiro" em §5.6); B.ch
//   azulejo creme com faixa de pastilhas, box de vidro à esquerda (registro a 1,1), pia com gabinete e espelho,
//   vaso sanitário, toalha, basculante e plafon
const S = sala({ roteador: true, lampada: true, vizinho: true });   // opções (sem elas nada muda):
//   roteador -> S.rot (roteador() na estante) · lampada -> S.lamp (lampada() no bocal)
//   vizinho -> escritório de 5,2 x 2,2 ATRÁS da parede do fundo (sem forro, só para a vista de cima do Wi-Fi): carpete cinza-quente,
//     escrivaninha escura encostada no fundo atrás do roteador (x -1,3) com o celular() deitado (S.cel, tela para cima, girado 0,25 rad),
//     notebook, caneca, livro, cadeira, tapete, planta e armário baixo. A parede do fundo da sala É a parede entre os dois cômodos.
//     S.vizinho (grupo), S.mesaVizinho (tampo, y 0,75), S.parede = { ponto: (0, 0, -2.8), normal: (0, 0, -1) } (face do lado da sala
//     e normal apontando para o escritório: é o `parede` do ondasEsfericas)
//   S.anoitecer(k): 0 dia (padrão), 1 noite (sol 5%, céu 22% e âmbar, janela escura, forro sem brilho). Chame todo quadro.
const Q = quarto();    // 4,2 x 4,4, pé-direito 2,7
//   -> { scene, L, criado, cama, tomada, abajur, forro, comodo, cel: null }
const Q = quarto({ celular: true });   // + celular() deitado no criado, carregador na tomada e cabo (ver "Celular" em §5.6); Q.cel
//   cama de casal com cabeceira, parede da cabeceira verde-sálvia, 2 criados-mudos (abajur no da esquerda),
//   tomada brasileira de 3 furos, guarda-roupa, janela com cortina, tapete, quadro
```

Pontos de encaixe: grupos vazios; ponha a peça como filha (`S.estante.add(roteador.group)`). Coordenadas de mundo:

| ponto | mundo (x, y, z) | o que é |
|---|---|---|
| `S.estante` | (-1.40, 1.30, -2.62) | tampo da estante (y local 0 = tampo, frente +z, fundo ±0,18). Livre: x local de -0,15 a 0,35 (a plantinha fica à esquerda). Lugar do roteador. |
| `S.teto` | (0.25, 2.18, 0.20) | fundo do bocal da luminária pendente; a lâmpada rosqueada pende para -y (cúpula de 2,25 a 2,39, não cobre o bulbo) |
| `S.mesa` | (0.25, 0.40, 0.30) | tampo da mesinha de centro |
| `S.tv` | (0.55, 1.30, -2.68) | centro da TV na parede; `S.telaTV` é o material da tela (`glow`; troque a cor para ligar) |
| `B.parede` | (-0.62, 2.20, -1.50) | parede do fundo dentro do box, a 2,2 de altura, frente +z (já tem a saída do cano). O chuveiro é preso aqui e o braço sai em +z. |
| `B.ralo` | (-0.62, 0.00, -0.85) | ralo no piso do box (a água cai entre `B.parede` e ele) |
| `Q.criado` | (-1.13, 0.56, -1.82) | tampo do criado-mudo da esquerda (y local 0 = tampo, frente +z, 0,52 x 0,44). Livre: x local de -0,24 a 0 (o abajur ocupa o canto de trás à direita). O celular fica deitado aqui. |
| `Q.tomada` | (-1.29, 0.78, -2.20) | face da tomada na parede (frente +z), 0,22 acima do tampo e 0,16 atrás dele: o carregador entra aqui e o cabo desce até o celular |

Câmeras da vitrine (`ver(pos, alvo, fov)`; a câmera anda de pos1 a pos2, fora da boca do cômodo):

| cenário | pos1 → pos2 | alvo | fov | enquadra |
|---|---|---|---|---|
| `sala()` | (1.5, 2.3, 5.2) → (0.1, 2.25, 5.0) | (-0.35, 0.85, -2.2) | 40 | estante, painel com TV, luminária em cima, mesinha e encosto do sofá embaixo |
| `banheiro()` | (0.45, 1.6, 4.6) → (-0.2, 1.55, 4.4) | (-0.1, 1.1, -1.5) | 42 | box com o ponto do chuveiro, pia, espelho, basculante e plafon |
| `quarto()` | (0.5, 1.75, 4.3) → (-0.2, 1.65, 4.1) | (-0.7, 0.8, -1.8) | 40 | guarda-roupa, criado-mudo com abajur e tomada, cama, quadro |

- **Câmera nos cômodos:** em 9:16 só cabe ~3 m de parede do fundo (fov 40 a ~8 m dela). Fique em z ≈ prof/2 + 1,5 a 2,5 (fora da boca) com fov 40 a 42. As bordas de piso, paredes e forro na boca ficam fora do quadro **desde que** o raio do topo do quadro passe abaixo do forro na boca e o de baixo acima do piso (câmera em y 1,6 a 2,3 com o alvo um pouco abaixo). Não vá além de ±1,5 para os lados nem acima do pé-direito: aparece o corte da parede/forro. Para close num ponto de encaixe, chegue perto à vontade (a câmera entra no cômodo).
- **Vista de cima** (planta da casa, Wi-Fi atravessando paredes): esconda o forro (`S.forro.visible = false`). Com `vizinho: true` e a câmera "Wi-Fi de cima" (ver "Roteador" em §5.6) o roteador, a parede e o celular empilham na vertical do 9:16.
- **Wi-Fi atravessando a parede:** `ondasEsfericas(4, { opacidade: 0.08, aro: 1, espessura: 0.1 })` com `origem: noMundo(S.rot.group, S.rot.pontos.emissor)`, `alcance: 3.4` e `parede: { ...S.parede, fator: fatorDaParede(perdaNaParede(2.4)) }` (~0,5): os aros ficam pela metade do outro lado. No close do celular, `ondasEsfericas(8, { opacidade: 0, aro: 1, espessura: 0.025, corte: 0.009 })` com `corteY` = altura do tampo (`noMundo(S.mesaVizinho).y + 0.002`), `alcance: 5`, `vel: 0.32`: as frentes passam pela mesa como faixas laranja. Câmera: c + (0.04, 0.56, 0.27) → c + (0.015, 0.52, 0.23) olhando para c + (0, 0, 0.03), fov 35 (`c` = tela do celular); `valorTopo('WI-FI', 'N DE 4 BARRAS', ..., { s: 10 })`.

### 5.8 Efeitos (`kit/mundo/efeitos.js`)

```js
const a = arcos(7); scene.add(a.group);  a.atualizar(t, { origem: Vector3, rotY = PI, alcance = 2.6, k = 1, vel = 1.3 })
const v = vapor(22); obj.add(v.group);   v.atualizar(t, k = 1)
const a = agua(60, { cor = '#8FD0FF', tamanho = 0.009 }); scene.add(a.group);
  a.atualizar(t, { origem: [x, y, z] ou Vector3, k = 1, largura = 0.08, altura = 2, vel = 1.3 })
// fluxo, gradiente e ondasEsfericas: ver abaixo
```

`agua`: n gotas e filetes `glow` azul-claro (um terço são filetes, que esticam com a velocidade) caindo de um crivo em `origem` (plano y, água para -y). Furos espalhados num disco de raio `largura`; a água abre um pouco e acelera; `k` = vazão (quantas aparecem: as de fora somem primeiro; 0 esconde). Medidas em metros. Opacas e `noEdge`: ganham silhueta escura, então leem contra o azulejo claro. Nada acumula (cada quadro recalcula de t).

`arcos`: anéis laranja horizontais que crescem e somem saindo de `origem`, abertos na direção `rotY` (PI = para -x). Dois emissores defasados (`t + 0.35`) dão a sensação de onda estacionária. Começam visíveis: esconda no reset (`a.group.visible = false`).

```js
const f = fluxo(pontos, n = 16, { cor = '#FFB43A', raio = 0.08, vel = 0.2, fechado = true, repetir = true, tubo = null });
scene.add(f.group);  f.atualizar(t, { k = 1, cores = null })             // -> { group, curva, bolinhas, cano, atualizar }
const quente = gradiente([[0, '#FF5A2E'], [0.45, '#FFE9C4'], [0.55, '#7FB2FF'], [0.85, '#4F8BFF'], [0.92, '#FF5A2E'], [1, '#FF5A2E']]);
f.atualizar(t, { cores: quente });                                        // cor = função de u (0 = começo, 1 = fim)
const o = ondasEsfericas(n = 4, { cor = '#FFB43A', opacidade = 0.22, aro = 0.85 });
scene.add(o.group);  o.atualizar(t, { origem: [x, y, z] ou Vector3, alcance = 6, vel = 0.45, k = 1 })
```

- **`fluxo`:** n bolinhas `glow` opacas (ganham contorno: viram "bolinhas pixel") correndo por uma `CatmullRomCurve3` centrípeta pelos `pontos` (`[x, y, z]` ou `Vector3`). `vel` = voltas por segundo. Fechado: dão a volta. Aberto: com `repetir` (padrão) cada uma some no fim e reentra no começo, encolhendo perto das pontas (corrente contínua num fio que entra e sai de cena); com `repetir: false` passam uma vez e saem de cena. `tubo: { cor, raio, opacidade = 0,3 }` desenha um cano transparente (sem contorno) com as bolinhas visíveis dentro (serpentina, fio). `k` encolhe e esconde.
- **`gradiente(cores)`:** cores igualmente espaçadas (`['#a', '#b', '#c']`) ou paradas em u (`[[0, '#a'], [0.8, '#b'], ...]`). Mistura em RGB: laranja → azul passa por um roxo apagado; para uma virada seca (compressor) ponha duas paradas bem perto; passe por um creme claro no meio para "esfriar".
- **`ondasEsfericas`:** cascas `glow` transparentes (sem contorno) que crescem de `origem` até `alcance` e somem (alfa cai com o raio). Cada casca tem um **aro na silhueta** (o círculo onde a esfera tangencia a visão da câmera, recalculado a cada render por `onBeforeRender`); sem ele a onda some contra parede clara. Atravessam paredes: o que está atrás de algo opaco é escondido pela profundidade. Com a câmera dentro de uma casca o aro some e fica só o tom leve.
- **`ondasEsfericas`, opções novas:** `espessura` do aro (fração do raio; 0,05 padrão; ~0,1 numa vista de cima longe, onde o aro fino some contra o piso); `corte` (espessura do círculo onde cada casca corta um plano horizontal) + `atualizar(..., { corteY })`: num close perto da casca o aro (silhueta) fica em volta da própria câmera e some, e o corte na mesa ou no chão é o que mostra a onda passando; `atualizar(..., { parede: { ponto, normal, fator } })`: do lado para onde `normal` aponta a onda (miolo, aro e corte) fica com a opacidade x fator, por pixel no shader (`onBeforeCompile`); sem parede nada muda. O aro tem `frustumCulled = false` e visibilidade própria (não some junto com um miolo fraco; com `opacidade: 0` só o aro e o corte aparecem).
- `fluxo` e `ondasEsfericas` começam visíveis: esconda no reset (`.group.visible = false`) ou chame `atualizar` com `k = 0`.
- **Lógica pura (`kit/mundo/caminhos.mjs`, testada em `tests/caminhos.test.mjs`):** `posicaoNoFluxo(i, n, t, vel, fechado)` → u em [0, 1) (em t = 0, u = i/n; aberto: `null` fora de [0, 1)); `raioDaOnda(j, n, t, vel, alcance)` → `{ r, alfa }` (período 1/vel, cascas espaçadas, alfa = (1 - r/alcance)^1,4); `fracoesDoCaminho(pontos, fechado)` → u de cada ponto pelo comprimento acumulado (para pôr as paradas do `gradiente` exatamente num ponto do caminho, ex.: a válvula); `pontosSerpentina(x0, x1, y0, y1, n, z)` → pontos de uma serpentina de n trechos com um ponto no meio de cada volta (condensador, evaporador). Os íons da bateria têm módulo próprio, `kit/mundo/ions.mjs` (ver `bateriaPorDentro()` em §5.7).
- **Lógica pura do chuveiro (`kit/mundo/chuveiro.mjs`, testada em `tests/chuveiro.test.mjs`):** `TRECHO_INVERNO` = 0,58 (fração da resistência usada no inverno; ex.: 3.200 W / 5.500 W); `trechoDaChave(pos)` → 0 (desligado), 1 (verão, de 0 a 1), encolhe até 0,58 de 1 a 2 (inverno); `calorDaChave(pos)` → potência e corrente relativas, 0..1 (P = V²/R, R proporcional ao trecho: TRECHO_INVERNO / trecho; 0,58 no verão, 1 no inverno; de 0 a 1 sobe em linha reta, sem saltos); `dentroDoTrecho(u, trecho, borda = 0.03)` → 0..1 (u = 0 no borne de entrada; 1 até trecho - borda, 0 de trecho em diante); `amplitudeDaVibracao(calor)` (0,04 a 0,30 espaçamentos) e `vibracaoDoAtomo(i, t, calor)` → [dx, dy, dz] (senos de frequência fixa por átomo: rampa de calor não faz pular); `pontoDaGota(i, n, t, { raio, altura, vel, abre })` → { x, y, z, fase } (furo em girassol, queda acelerando, periódica em 1/vel); `pontosEspiral(voltas, raio, y0, y1, porVolta)` → hélice.

- **Lógica pura do Wi-Fi (`kit/mundo/wifi.mjs`, testada em `tests/wifi.test.mjs`):** `ledDoRoteador(i, t)` → 0/1 (fatias de 1/12 s; `N_LEDS` = 4); `GHZ_MICROONDAS` = 2,45; `comprimentoDeOnda(ghz)` → metros (c / f: 2,4 GHz ≈ 12,5 cm, 5 GHz ≈ 6 cm); `ondaDaPlanta(x, t, { ghz, amp, vel })` e `periodoNaPlanta(ghz)` (a senoide da `planta()`); `perdaNaParede(ghz)` → dB (**didático**: 6 em 2,4 GHz, 10 em 5 GHz, reta entre eles; parede interna de alvenaria; na vida real varia muito com o material); `fatorDaParede(dB)` → fator de amplitude (10^(-dB/20); 6 dB ≈ 0,5); `forcaDoSinal(d, { ghz = 2.4, paredes = 0, potencia = 20 })` → `{ dbm, forca }` (perda no espaço livre FSPL = 20·log10(d) + 20·log10(f em MHz) - 27,55, mais as paredes; forca = (dbm + 90) / 60 em 0..1); `barrasDeSinal(dbm)` → 0..4 (≥ -55, -65, -75, -85).
- **Lógica pura do LED (`kit/mundo/led.mjs`, testada em `tests/led.test.mjs`):** `FASE_ENCONTRO` = 0,5; `parDoEncontro(i, n, t, { periodo = 2.4, yN, yP, yTopo, k })` → `{ fase, x, eletron, lacuna, foton, flash }` (1ª metade: elétron e lacuna andam até y = 0 acelerando, nascem sem salto; 2ª metade: somem e o fóton sobe em velocidade constante até yTopo, com clarão nos primeiros 15%); `parAtivo(i, n, k)` (quais pares conduzem com a corrente k, em ordem embaralhada; quem entra fica); `heroiDaFase(t, n, periodo, janela, f0, f1, k)` (par que fica na fase [f0, f1) a janela inteira, para etiquetas; troca só na virada); `corDoFoton(y, y0, y1)` → 0 azul .. 1 branco pela travessia do fósforo.

### 5.9 Sons

Mesmos cues do voxel (`tools/mix.py` é cópia): `whoosh pop zip slide slam thud wind slowmo rumble bubbles tock sizzle sparkle plop gulp boing inhale heartbeat alarm`. Padrões do estilo: `rumble` baixo (gain 0,25) enquanto o aparelho está ligado; `zip` quando entra `valorTopo`; `pop` em etiqueta; `sizzle` no calor; `sparkle` no raio-x e na luz; dois `tock` no fim (bipe do micro-ondas).

## 6. Como fazer um vídeo novo

Diferente dos outros estilos da skill, aqui as cenas ficam em `src/cenas.js` (não `src/shots.js`) e o código do vídeo importa só de `../kit/`. O resto do fluxo é o mesmo do SKILL.md.

1. `bash SKILL/scripts/new_video.sh pixel-3d <nome>` → `~/faceless-shorts/<nome>/`.
2. Reescreva `script.json`: `title`, `gancho` (= `text` da 1ª linha), `sources`, `lines` com `caps`, `marca_nome` e `marca_arroba` (vão no cartão final), `capa_t` (segundo do quadro de capa), `postar` (título, descrição, hashtags). Até 45 s. Arco: objeto do dia a dia → por dentro (raio-x) → mecanismo → final; para fenômeno natural: cena real → mergulho de escala → mecanismo → volta à cena.
3. `SKILL/scripts/py SKILL/scripts/voice.py .` e `SKILL/scripts/py SKILL/scripts/words.py .` (o `py` já liga `PYTHONUTF8`; sem ele os acentos estragam a voz). Leia `data/words.txt` para planejar os cortes.
4. Peças novas em `src/mundo.js` (só `box/cyl/sph` + `toon`/`glow`, importando de `../kit/`); cenas em `src/cenas.js`, tempos sempre por `tempo.palavra('x', linha)`.
5. `node tools/capture.mjs check` (CHECK OK) → `sheet review/all.jpg 1 6` → quadros cheios (`frames review/f "2.5,8.1"`). Olhe o pixel em tamanho cheio, não só a folha. Corrija enquadramento (§7) e refaça.
6. `node tools/capture.mjs cues` → `SKILL/scripts/py tools/mix.py .` → `node tools/capture.mjs video renders/<nome>.mp4`.

O cartão final mostra "Seguir"; se a última fala tiver "inscrev", vira "Inscrever-se" (Shorts).

## 7. Armadilhas conhecidas

- **`pontos` que mudam com o `atualizar`** (`planta`, `resistenciaPorDentro`, `chipLED`, `bateriaPorDentro`: `onda`, `trecho`, `eletron`, `ion`): leia o ponto **depois** de chamar `atualizar` no mesmo quadro, senão a etiqueta usa a posição do quadro anterior.

- **Quadro = função pura de `t`.** Cada `draw` começa com reset: `mw.reset()`, efeitos escondidos, herói/ímã posicionados, `MM.atualizar(t, ...)` com todos os parâmetros. O que uma cena liga e a outra não desliga vaza.
- **Câmera perto demais em 9:16.** O fov horizontal é só ~20° (fov vertical 35). Para enquadrar um objeto de largura L inteiro, a distância é ≈ `L / 2 / tan(10,3°)` ≈ 2,8 × L. O micro-ondas (5 de largura) pede ~14; a lasanha em corte (4) pede ~11.
- **Pontilhado:** `dither` acima de ~0,3 vira xadrez em todo degradê. O padrão (0,18) só quebra faixas.
- **Raio-x:** `casca(op)` some com o que está na lista da carcaça (corpo, porta, vidro, tela da porta, painel, visor, botões, puxador, pés). Peça nova na carcaça entra nessa lista, senão fica flutuando no raio-x.
- **Carcaça sempre `transparent` = fantasma de contorno.** Material transparente fica fora do passe de normais, então as linhas internas do que está **atrás** dele (comida dentro da geladeira) aparecem através da porta fechada. A `geladeira().casca` só liga `transparent` quando op < 1 (e marca `needsUpdate` na troca). Faça igual em peça nova com interior.
- **Forro `BackSide` encostado na parede = z-fighting** (listras): recue o forro uns milímetros para dentro das paredes.
- **Transparente não tem contorno nem escreve profundidade.** Bom para ondas e vidro; ruim se você quer um objeto sólido "meio apagado": use `toon` opaco com cor mais escura.
- **Textura de canvas** precisa de `t.needsUpdate` (o `texturaCanvas().pintar` já faz); repintar todo quadro custa: guarde o último estado (o `visor` e o `corteLasanha.calor` fazem isso).
- **Caractere fora da fonte** vira "?" **e o `capture.mjs check` falha** (a fonte chama `console.error` na 1ª vez). Troque por um caractere da lista de §5.2 ou acrescente o glifo em `G`; confira também a folha.
- **Fio fino com contorno vira tracejado.** Tubo de poucos pixels de largura ganha linha interna em cada faceta: marque `mesh.userData.noEdge = true` (o cabo do celular faz isso) e engrosse um pouco além do real (o cabo tem raio 3 mm).
- **Raio-x de peça pequena: carcaça transparente quase invisível ainda mancha.** Com alfa de 2 a 5%, a sobreposição de várias peças transparentes (cantos arredondados) passa um degrau do quantizador e vira círculo escuro. O `celular().casca` usa op² e esconde a carcaça abaixo de 0,25, mostrando um anel opaco no lugar.
- **Etiqueta com ponto atrás da câmera** aponta para lugar errado (projeção espelhada). Projete só o que está à frente.
- **Peça presa no alto da parede com close: sem sombra.** O mapa de sombra do cômodo (512 numa caixa de 6 m: ~1,2 cm por texel) desenha uma escada no azulejo atrás do chuveiro. O `chuveiro()` desliga `castShadow` de tudo.
- **Disco plano numa parede curva entra nela.** A caixinha da chave fica 5 mm para fora do sino e inclinada pela geratriz do cone (sino que abre para baixo: a parede olha para cima, ângulo negativo em x).
- **Etiqueta num ponto fixo de trilha aponta para o vazio** quando as partículas passam espaçadas. Aponte para uma partícula de verdade escolhida de forma pura (a `resistenciaPorDentro` troca o elétron herói só a cada 3 s).
- **Efeito reposicionado no `onBeforeRender` some fora do quadro.** O teste de frustum roda antes do `onBeforeRender`: um mesh que só vai para o lugar certo ali (o aro do `ondasEsfericas`) é descartado parado na posição antiga quando ela sai do quadro (na vista de cima, a origem do mundo). Marque `frustumCulled = false`.
- **Luz pontual colada em superfície estoura.** O alvo de render do motor é HalfFloat (guarda brilho acima de 1): perto da `PointLight` (pescoço da lâmpada, cúpula, casca transparente do bulbo) a cor passa de 1 e nem alfa de 4% segura. A `lampada().acesa` derruba a luz para 3% no raio-x; num close da lâmpada acesa, a cúpula estourada é aceitável (é luz).
- **Noite vira verde no quantizador.** Bege muito escuro com céu neutro vira verde-oliva (como o `#24170F` da tela). O `S.anoitecer(k)` puxa o céu do hemisfério para âmbar `#FFB878` e o chão para `#8A5A3C`. O miolo de uma onda laranja fraca por cima da tela preta do celular também esverdeia: use `opacidade: 0` no close.
- **Windows, Chrome preso (EPERM):** encerre `chrome.exe`/`node` órfãos de uma captura interrompida e rode de novo.
- **Imports:** só de `../kit/`. Vendor só `three.module.js` (sem addons: o motor pixel não usa EffectComposer).

## 8. Sobre "vitrine"

As medidas de câmera e etiqueta citadas como "da vitrine" nas seções 5.x vêm da página de revisão do kit no projeto original (uma cena por peça). A vitrine não vem com a skill, mas os valores continuam certos para enquadrar cada peça.
