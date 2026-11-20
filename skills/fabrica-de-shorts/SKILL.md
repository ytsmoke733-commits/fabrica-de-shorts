---
name: fabrica-de-shorts
description: Use when the user wants a new short, reel or TikTok for the user's own channels (the brands in the factory's marcas/ folder, e.g. "conhecimento" and "hacker"), says "nosso kit", "a fábrica", "os modelos de vídeo", or names a factory style (voxel/low poly, deep-dive/Zack D., motion, motion-b, caso-real, pixel 3D / pixel art 3D / estilo pixel / "igual ao vídeo do micro-ondas ou dos videogames", mapa de satélite / mapa-satelite / zoom de satélite / "igual ao vídeo do metrô de BH"), or wants to check, re-render, list, narrate (ElevenLabs mp3) or deliver videos of the faceless-shorts factory.
---

# Fábrica de shorts

## Visão geral

A fábrica produz os vídeos dos canais do usuário com **kits de estilo**: um kit por estilo, cada um com modelo, peças, tema e guia. Ela fica na pasta onde o repositório `fabrica-de-shorts` foi clonado (o README sugere `~/fabrica-de-shorts`; chamada aqui de `$FABRICA`). Se não souber onde está, procure a pasta que tem `fabrica/bin/fabrica.mjs` e `estilos/`.

**Não procure o kit em outro lugar e não o recrie.** Cada vídeo é feito com `novo` e só com as peças do kit.

A fonte da verdade de cada estilo é `estilos/<estilo>/STYLE.md` (o `motion-b` usa `estilos/motion/STYLE.md`, seção 6b). Antes de escrever cenas, leia:
- a seção "Como fazer um vídeo novo";
- "Armadilhas";
- a API das peças que o tema usa.

Onde o STYLE.md e esta skill divergirem sobre o render, vale a skill.

Os 7 estilos (`voxel`, `deep-dive`, `pixel`, `mapa-satelite`, `caso-real`, `motion`, `motion-b`) são modelos da fábrica e seguem o mesmo pipeline. O que é específico do `pixel` e do `mapa-satelite` está nas seções "Estilo pixel" e "Estilo mapa-satelite", mais abaixo.

## Quando NÃO usar

- Para os estilos genéricos da skill `faceless-shorts` (Night File, Inside Out, Stick Story, Paper Atlas, Tall Tale) fora dos canais do usuário, use a skill `faceless-shorts`.
- A `faceless-shorts` também tem um "Pixel 3D" e um "Mapa de Satélite", que são cópias portáteis dos kits para quem não tem a fábrica. Para os canais do usuário, ou quando ele disser só "pixel 3D" ou "mapa de satélite", use o `pixel` ou o `mapa-satelite` da fábrica, por esta skill.
- Para editar um vídeo gravado, use `ai-video-editor`.

## Marcas e estilos

| marca (`marcas/<id>/marca.json`) | nome no cartão final | estilos | perfis |
|---|---|---|---|
| `conhecimento` (Marca A) | o `nome` e o `arroba` do `marca.json` (troque "Meu Canal" pelo seu) | `voxel`, `deep-dive`, `motion`, `pixel`, `mapa-satelite` | os seus |
| `hacker` (Marca B, educativa) | Hacker e tecnologia | `motion-b`, `caso-real` | os seus |

| estilo | o que é | motor | roteiro / cenas |
|---|---|---|---|
| `voxel` | mundo de blocos chanfrados (low poly) | fs3d | `script.json` + `src/cenas.js` |
| `deep-dive` | personagem 3D, raio-x e órgãos (tipo Zack D.) | fs3d | `script.json` + `src/cenas.js` |
| `pixel` | pixel art 3D, render 270×480 ×4 | fs3d | `script.json` + `src/cenas.js` (+ `src/mundo.js`) |
| `mapa-satelite` | imagem de satélite real com zoom país → estado → cidade, rotas desenhadas por cima, ano no canto | fs3d | `script.json` + `src/cenas.js` (+ `src/objetos.js`, `src/linhas.js`, `mapa.json`) |
| `caso-real` | casos reais escuros, uma luz | fs3d | `script.json` + `src/cenas.js` |
| `motion` / `motion-b` | cartões de interface e tipografia (tema A / B) | hyperframes | `voz/script.json` + `gen.mjs` |

O nome e o @ vêm do `marca.json`. Leia esse arquivo em vez de confiar nesta tabela. Uma marca sem `arroba` (hoje a `hacker`) tem cartão final só com o nome, e isso está certo.

## Padrões (não pergunte, use)

| decisão | padrão |
|---|---|
| marca | `conhecimento`, salvo tema de segurança/golpe/hacker → `hacker` |
| estilo | o que o usuário disse; se não disse, escolha pela tabela ("como funciona um objeto" → pixel, "e se…?" → voxel, corpo → deep-dive, números/listas → motion, história de um lugar no tempo / obra atrasada / rota → mapa-satelite) |
| plataformas | as 3 (tiktok, reels, shorts) |
| voz | Kokoro da marca (`marca.json` → `voz`); ElevenLabs só se o usuário mandar os mp3 |
| duração | 25–40 s, que dá umas 7–9 linhas (a voz fala ~2,9 palavras/s); limites 60 s TikTok, 45 s Reels/Shorts. `"limite_s": 60` no roteiro libera até 60 s nas 3 (o `mapa-satelite` já vem assim: 40–60 s, 9–12 linhas) |
| música (`music` no roteiro) | mantenha a do modelo do estilo (`tension` em voxel, pixel, mapa-satelite, caso-real e motion-b; `bed` no deep-dive; `pulse` no motion) |
| capa (`capa_t`) | um instante do gancho em que a imagem e a manchete já estão na tela (~1–2 s) |
| aprovação | siga direto até a entrega; o usuário aprova vendo o vídeo |
| tema já feito? | `node fabrica/bin/fabrica.mjs fila \| grep -i <palavra>`: se existir, mude o ângulo |

Pergunte só o que bloqueia de verdade (tema ambíguo demais). Não pergunte mais de uma coisa.

## Pipeline

Rode no Git Bash: `cd ~ && cd "$FABRICA" && …`, porque um cwd longo quebra executáveis. `<id>` = `AAAA-MM-DD-<slug>`, impresso pelo `novo`. `V` = `marcas/<marca>/videos/<id>`.

1. `node fabrica/bin/fabrica.mjs novo <marca> <estilo> <slug>` (slug: minúsculas, números e hífens).
2. **Fatos:** confira cada número e afirmação com WebSearch/WebFetch, em fonte primária ou de referência. Na dúvida, use o número conservador e diga "cerca de".
3. **Roteiro** (Write, UTF-8 sem BOM), sobre o do modelo copiado:
   - `title`, `gancho` (= `text` da linha 0), `sources`, `postar` (`titulo`, `descricao`, `hashtags`), `capa_t`;
   - em `lines`, `text` e `caps`;
   - na última linha, `variantes`: tiktok/reels "Segue pra mais curiosidades." e shorts "Se inscreve pra mais curiosidades.".
4. **Voz e tempos (fs3d), antes das cenas:**
   ```
   cd "$V" && export PYTHONUTF8=1
   ~/.faceless-shorts/venv/Scripts/python.exe ~/.claude/skills/faceless-shorts/scripts/voice.py .
   ~/.faceless-shorts/venv/Scripts/python.exe ~/.claude/skills/faceless-shorts/scripts/words.py .
   ```
   Depois leia `data/words.txt` para planejar os cortes. No motion, isso acontece dentro de `voz/`.
5. **Cenas sob medida**, só com a cópia do kit que o `novo` pôs na pasta do vídeo (`V/kit/`). Peça que falta, como um cartão de ligação ou um objeto novo, é montada no próprio vídeo com as primitivas do kit.
   - Use `tempo.linha(i)` e `tempo.palavra('x', i)`.
   - Todo quadro é função pura de `t` (reset em cada `draw`).
   - Um corte por linha.
   - **No motion:** um `conteudo(i, …)` por linha em `gen.mjs`. O `gen.mjs` do modelo confere o número de linhas (`tempo.nLinhas !== 5`); ajuste essa conta para o seu roteiro. Rode `node gen.mjs` depois de cada mudança, porque é ele que regenera `video/`.
6. `node fabrica/bin/fabrica.mjs checar <id>` tem de dar `ROTEIRO OK`.
7. **Olhe antes de renderizar:**
   - fs3d, em `V`: `node tools/capture.mjs check`, `sheet review/all.jpg` e `frames review/f "t1,t2"` (vírgulas, sem espaço).
   - motion: depois de `node gen.mjs`, `hyperframes snapshot <V>/video --at 0.5,3,8,15 -o <V>/review`, rodado da raiz.
   - Abra as imagens com Read.
8. **Render, só deste vídeo, em segundo plano** (~2 min por variante):
   ```
   node fabrica/bin/fabrica.mjs etapa <id> render && for p in tiktok reels shorts; do node fabrica/bin/fabrica.mjs render-variante <id> $p || break; done
   ```
   Não use `lote`: ele renderiza tudo que está na etapa `render`, inclusive vídeos de outras sessões.
9. **Confira o MP4.** Extraia quadros com `ffmpeg -sseof -0.6 -i V/entrega/shorts.mp4 -frames:v 1 x.jpg`. Veja:
   - o gancho;
   - o cartão final com o nome e o @ do `marca.json`;
   - a chamada certa por plataforma.

   Depois rode `etapa <id> entregue`, que o `render-variante` não marca sozinho, e mande o `tiktok.mp4` com SendUserFile (ou dê o caminho de `V/entrega/`).

## Estilo pixel

Mundo 3D de caixas, cilindros e esferas em toon, renderizado em 270×480 e ampliado 4× sem suavizar. HUD e legenda usam uma fonte pixel 5×7 desenhada em código. A API está em `estilos/pixel/STYLE.md`:
- leia por inteiro as seções 1 a 4, 5.1 a 5.5 e 7;
- nas seções 5.6 a 5.8 (props, cenários e efeitos), leia só as peças que servem ao tema.

**Antes das cenas:**

| decisão | padrão |
|---|---|
| ângulo | pergunta "como funciona / por que é assim"; pedido vago ("jogos") vira uma dessas |
| arco | objeto do dia a dia: **objeto → por dentro (raio-x) → mecanismo → final**. Fenômeno natural: **cena real → mergulho de escala (partículas, ondas) → mecanismo → volta à cena mudada** |
| exterior | o kit só tem interiores: monte em `V/src/mundo.js` com chão, `scene.background` de céu e sol em `glow` |
| paleta | mundo quente, destaque laranja `#FFB43A`; azul só quando é o assunto (céu, água, frio), dito no `note` da cena |
| música | `tension`; `bed` (arpejo leve) para tema calmo |

**Roteiro:** só caracteres da fonte pixel (sem λ, ⁴, travessão nem emoji; lista na seção 5.2). Caractere fora dela vira `?` e o `check` reprova.

**Cenas:**
1. Kit primeiro: `grep -n "^export" estilos/pixel/kit/mundo/*.js` e a `vitrine/` (seção 8 do STYLE.md).
2. Peça nova fica em `V/src/mundo.js`, importando só de `../kit/`.
3. Corte em `tempo.linha(i) - 0.08` com `whoosh`; num corte duplo, o segundo entra na palavra-chave. HUD só depois do `blit()`.
4. Varie os planos: o diagrama "por dentro" tende a se repetir. `valorTopo` com número inteiro fica pelo menos 0,8 s na tela.

**Receitas prontas** em `marcas/conhecimento/videos/2026-11-17-jogos-quadradinhos/src/mundo.js`:
- sprite em strings (`'..kkkk..'` + mapa de cores), usado como textura de tela (`texturaCanvas` + `NearestFilter`) ou como personagem de cubos (um `box` por pixel, `fr` 0,9);
- tela de TV animada, que só repinta quando muda a chave `floor(t*12)|linha`;
- montagem cubo a cubo, com `eo(seg(...))` escalonado por índice e arco em y;
- contraste de escala, com um objeto `scale 5` subindo atrás enquanto a câmera recua;
- grade de memória, com N células `box` trocando de material.

Vídeo inteiro para copiar a estrutura: `estilos/pixel/modelo/` (micro-ondas) e o dos videogames acima.

**QA do pixel:**

| sintoma | correção |
|---|---|
| objeto enche ou estoura o quadro | o FOV horizontal é ~20°: distância ≈ 2,8 × a largura a enquadrar |
| peça cortada na borda | recue a câmera ou aproxime a peça; confira as duas pontas |
| etiqueta ilegível | caixa sobre fundo escuro, em y 520–560 ou 1170–1230, nunca em 1400–1500 |
| começo da cena vazio | o movimento começa já dentro do quadro |
| `?` no lugar de uma letra | caractere fora da fonte pixel: troque o texto |
| voz fala "Wi-Fi" errado | a legenda tem de ser igual à fala: troque a palavra no roteiro ("internet sem fio", "roteador") |

## Estilo mapa-satelite

Uma imagem de satélite real é o palco do vídeo inteiro. A câmera faz zoom contínuo (país → estado aceso → cidade), linhas e rotas se desenham sobre a foto, o ano troca no canto e cartões cartoon planos entram por cima. A API está em `estilos/mapa-satelite/STYLE.md`. Leia:
- 2 "Regras visuais";
- 4 "Imagens", com as licenças;
- 5 "Fluxo do mapa";
- 8 "Armadilhas".

| decisão | padrão |
|---|---|
| ângulo | história de um lugar contada em linha do tempo: obra que atrasou décadas, dinheiro anunciado que não chegou, rota, viagem |
| roteiro | gancho com o absurdo em número → uma linha por marco, começando pelo ano ("Em dois mil e quatro, …") → fecho com ironia leve ("Se não atrasar.") |
| duração | 40–60 s com `"limite_s": 60` (já vem no modelo) |
| cores | verde `#3DFF7A` para o que existe, dourado `#FFC93C` para a obra ou o problema, tracejado para plano, branco para trajeto longo |
| fatos | caso real com fonte em `sources`; escândalo com pessoas: só o que foi noticiado, sem afirmar crime não julgado; fato sem fonte segura sai do roteiro |

**Mapa novo** (o modelo vem com BH; outro lugar precisa de imagens novas):
1. Edite `V/mapa.json`: camadas do grosso ao fino (`nasa-relevo` → `nasa-modis` → `sentinel2`), cada uma com no máximo 6 a 10 vezes o m/px da seguinte, mais o `contornos` do estado (`ibge-uf`).
   - **Rota longa, por vários estados:** pare a escada na camada regional (`nasa-modis` cobrindo a rota inteira) e use `sentinel2` só nas cidades em destaque.
   - **Mais de um estado aceso:** um `ibge-uf` por estado em `contornos`, e um `mapa.realce` para cada.
2. Dentro da pasta do vídeo, rode `PYTHONUTF8=1 ~/.faceless-shorts/venv/Scripts/python.exe kit/mapa/baixar.py .` (1 a 2 min, precisa de internet). Para refazer só algumas camadas, use `--so id1,id2`.
3. Pegue os traçados de linhas e estações do OpenStreetMap (receita na seção 4 do STYLE.md) e grave em `V/src/linhas.js`.

**Créditos (obrigatório):**
- O `baixar.py` grava o texto em `mapa/indice.json`, no campo `creditos`, já com o ano das imagens Sentinel.
- O rodapé do vídeo mostra esse texto sozinho.
- Copie o mesmo texto para o `postar.descricao`. Se usou traçados do OSM, acrescente "; traçados: © colaboradores do OpenStreetMap". **Nunca** use Google Maps/Earth, Esri, Mapbox ou print de app de mapa.

Vídeo inteiro para copiar a estrutura: `estilos/mapa-satelite/modelo/` ("45 anos esperando 10 km de metrô").

**QA do mapa:**

| sintoma | correção |
|---|---|
| quadros sem mapa | `carregarMapa` tem de rodar antes do `OP.ready` no `main.js` |
| borrado ou em blocos no fim do mergulho | pulo grande na escada de resolução: crie uma camada intermediária |
| nuvem de relance no mergulho | troque a data ou o satélite do MODIS, ou corte o `bbox` |
| linha fora do trilho | confira os [lon, lat] sobre a imagem em quadros cheios |
| cartão por cima de rótulo ou linha | cartões no terço de cima; mude o `lado` do rótulo |
| borda preta | a camada mais grossa precisa cobrir tudo o que a câmera mostra |

## Regras de conteúdo

- **Gancho nos 2 primeiros segundos:** narração, imagem e manchete juntos, sem intro nem "olá pessoal". Um laço aberto e uma virada a cada 10–15 s. Mudança visual a cada 1,5–3 s. Todo gancho é cumprido no vídeo.
- **Legendas (`caps`):** blocos `|` de 1–3 palavras, **exatamente um `*`** por bloco, com as mesmas palavras da fala.
- **Números:** na tela, **sempre em algarismos** (`*200 mil`, `*8 minutos`). No `text`, por extenso, para a voz.
- **Estilo:** um por vídeo, nunca misture. O código do vídeo só importa `../kit/`. **Não altere `estilos/`** para fazer um vídeo: peça nova fica na pasta do vídeo.
- **Marca B:** educativa. Nunca passo a passo de invasão, nome ou link de cheat ou crack, nem comando de ataque real. Feche dizendo como se proteger. O `checar` recusa os padrões de `proibido`.
- **Postagem:** a 1ª linha do `titulo` é o que as pessoas buscam. Use de 3 a 5 hashtags sem espaço (`#vocesabia`, `#curiosidades` + tema). Nada de `#fyp`.

## Outros comandos

| pedido | comando |
|---|---|
| ver a fila / etapas | `fabrica fila`; `fabrica etapa <id> <pauta\|roteiro\|cenas\|revisao\|render\|entregue\|aprovado\|postado>` |
| refazer uma plataforma | `fabrica render-variante <id> <tiktok\|reels\|shorts>` |
| narração própria (ElevenLabs) | ver "Narração própria" abaixo |
| o que já foi postado | a fila só sabe o que foi marcado com `etapa <id> postado`. Pergunte ao usuário o que ele subiu, marque, e então liste o que está `entregue`/`aprovado` |
| testar os kits | `fabrica kits [estilo]`; testes: `node --test fabrica/tests/*.test.mjs` (glob, não pasta) |

(`fabrica` = `node fabrica/bin/fabrica.mjs`.)

## Narração própria (ElevenLabs)

Grave um mp3 por vídeo (o texto é o `text` das linhas do `script.json`) e as 2 chamadas finais.

1. **Nomes:** o importador só reconhece `<slug>.mp3`, com o slug sem a data (`geladeira-gela.mp3`), mais `cta-segue.mp3` e `cta-inscreve.mp3`. Arquivo com outro nome (`video3.mp3`) é ignorado. Antes de renomear, confirme qual é qual:
   - ouça o começo com o Whisper (`words.py` numa pasta de teste);
   - compare com a 1ª linha do `script.json`.
2. **Pasta de preparo:** crie uma pasta só com os mp3 dos vídeos que vão mudar, mais as 2 chamadas. O comando põe em `render` todo vídeo cujo slug estiver na pasta.
3. `fabrica narracoes <pasta>` (no Windows, passe `D:/...` e não `/d/...`): copia para `V/narracao/` e já põe esses vídeos em `render` (não precisa de `etapa … render`).
4. `render-variante` das **3 plataformas** de cada vídeo, nunca `lote`. Depois rode `etapa <id> entregue`.
5. **Confira:**
   - `words.txt` bate com o roteiro;
   - nenhuma palavra começa antes do `lead`;
   - o fim do MP4 tem a chamada certa.
6. A legenda segue o texto do `script.json`. Se o usuário improvisou na gravação, ajuste o `text` e as `caps` para o que ele falou.

## Erros comuns

| sintoma | correção |
|---|---|
| "não achei o kit" | ele está onde o repositório foi clonado (pasta com `fabrica/bin/fabrica.mjs`); não recrie o kit |
| voz com acento quebrado, palavras de 2 s em `words.txt` | rode de novo `voice.py` e `words.py` com `PYTHONUTF8=1` |
| Chrome headless EPERM / render travado | encerre os `chrome.exe` e `node` órfãos e repita; no motion, rode `hyperframes` da raiz, nunca de dentro da variante |
| backticks num heredoc ou `node -e` executam comandos | escreva o script num arquivo e rode o arquivo |
| caminho `/d/...` falha no Node | passe `D:/...` para o Node |
| `checar` reclama de caps ≠ fala | mesmas palavras nos dois; decimal falado não é aceito, reescreva a frase |
| `git status` mostra mudanças que não são suas | outras sessões trabalham no mesmo repositório; não commite, não reverta e não rode `git checkout fila.json` |
| `narracoes` diz "sem áudio" para quase tudo | normal: só os slugs presentes na pasta são importados |
