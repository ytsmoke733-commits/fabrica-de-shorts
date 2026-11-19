# Estilo motion (kit)

## 1. O que é o estilo

Vídeos verticais 1080x1920 em "motion de interface": cartões de UI (login, ranking, terminal, régua, medidor, painel de número, botão de seguir) animados com GSAP sobre um fundo de gradiente com grade em perspectiva e poeira, legendas palavra a palavra e transições com formas gigantes. O HyperFrames renderiza HTML/GSAP em vídeo.

O kit serve dois estilos, com o mesmo código e `tema.json` diferente:

| estilo | tema | marca | vídeo-modelo | amostra |
|---|---|---|---|---|
| `motion` | A (`temas/tema-a.json`: roxo escuro, acento âmbar) | Marca A (conhecimento) | `modelo/` | `amostra.jpg` |
| `motion-b` | B (`temas/tema-b.json`: grafite, verde terminal `#3CFF7A`) | Marca B (hacker) | `modelo-b/` | `amostra-b.jpg` |

- **Câmeras:** não se aplica ao motion (sem câmera 3D; o movimento vem das molas e do fundo).

Cada vídeo carrega uma cópia do kit (`<video>/kit/`) e do tema (`<video>/tema.json`) e importa só de `./kit/`, nunca de `estilos/`. O vídeo-modelo do `motion` é `modelo/gen.mjs` ("Quantas vezes seu coração bate num dia?"); o do `motion-b` é `modelo-b/gen.mjs` ("A senha mais usada do mundo": pílula de dado, manchete, login, terminal com câmera lenta, ranking, medidor, fita de dados e botão de seguir). São as melhores referências de uso real; copie do modelo do seu estilo.

## 2. Regras visuais

1. **Fundo sempre:** gradiente + grade em perspectiva + poeira (`fundo()`), na faixa 0, z 1.
2. **Um acento por vídeo.** `--acento` é a cor de destaque; não invente outras.
3. **Perigo só em `--perigo`:** vermelho é para o que é ruim, errado ou alarmante (palavras em `perigo`, achado do terminal, selo da régua). Nunca como decoração.
4. **Tipografia mista:** uma palavra por bloco de legenda em serif itálica (`--serif`, cor `--acento`); o resto em sans pesada.
5. **Nada parado por mais de 0,5 s:** sempre há algo se mexendo (grade, poeira, pulso de apoio, cursor, contador).
6. **Terço inferior ocupado:** a legenda fica em y=1240 (padrão) e abaixo dela vai um apoio visual (no modelo, o ECG em y 1450-1600). Deixe ~120 px livres à direita (botões do TikTok): o ECG tem largura 900 a partir de x=60.
7. **Legendas não cobrem cartões:** cartões ficam acima de ~1200 (os `y` padrão já respeitam isso). Se subir a legenda, mude `legendas(..., { y })`.
8. **Cores só por `var(--...)`.** Exceção: sombras e brilhos neutros translúcidos (`rgba(0,0,0,.6)`, `rgba(255,255,255,.05)`). Cor fixa (`#fff`, `red`) é proibida (regra de revisão; a checagem automática de isolamento só confere imports).
9. **Textos de pelo menos 28 px** (leitura no celular).
10. **Cenas = um corte por linha falada**, com o corte um pouco antes (`tempo.linha(i) - 0.1`); transições (`fx`) nos cortes de maior impacto, não em todos.

## 3. Tema

`temas/tema-a.json`:

```json
{ "nome": "tema-a",
  "cores": { "fundo": "#150B24", "fundo2": "#24123A", "texto": "#FFF6EC", "apagado": "#BBA9CF", "fraco": "#5E4A73",
             "acento": "#FFB020", "perigo": "#FF4D6D", "alerta": "#FF7A3C", "destaque": "#3CE8FF" },
  "fontes": { "sans": "Inter", "serif": "Georgia", "mono": "JetBrains Mono" } }
```

Cores obrigatórias (`CORES_OBRIGATORIAS`, viram `--fundo` etc. via `cssVars`):

| cor | uso |
|---|---|
| `fundo` | fundo base, campos e botões "apagados"; texto sobre acento |
| `fundo2` | topo do gradiente do fundo |
| `texto` | texto principal, poeira, cursor |
| `apagado` | rótulos (`.lbl`), números de ranking, dicas |
| `fraco` | bordas de campo, barras inativas, fluxo do terminal, traços da régua |
| `acento` | destaque único do vídeo (palavra-chave, barras, botões, brilho do chão) |
| `perigo` | tudo que é ruim/alarmante |
| `alerta` | meio-termo (laranja) do medidor e da bolinha da barra de janela |
| `destaque` | cor secundária fria, para uso pontual (reserva) |

Só são aceitos `#rgb` e `#rrggbb` (nada de `rgb()`, nomes ou `hsl`): o kit converte para `rgba()` em tempo de execução. Também são obrigatórias `fontes.sans` e `fontes.serif`; `fontes.mono` é opcional (cai em `monospace`).

### 3.1 Tema B (`temas/tema-b.json`)

```json
{ "nome": "tema-b",
  "cores": { "fundo": "#0B0F0E", "fundo2": "#141B19", "texto": "#E9F2EC", "apagado": "#93A39B", "fraco": "#3B4743",
             "acento": "#3CFF7A", "perigo": "#FF3B4E", "alerta": "#F2C14E", "destaque": "#3CE8FF",
             "cartao": "#161C1B", "cartao2": "#0C100F", "janela1": "#3B4743", "janela2": "#3B4743", "janela3": "#3CFF7A" },
  "fontes": { "sans": "Inter", "serif": "Georgia", "mono": "JetBrains Mono" } }
```

As 9 cores obrigatórias têm os mesmos papéis da tabela acima (grafite e verde terminal no lugar de roxo e âmbar). O tema B define também as **cores opcionais** (`CORES_OPCIONAIS` em `kit/tema.mjs`), que viram `--cartao`, `--cartao2`, `--janela1`, `--janela2` e `--janela3`:

| cor opcional | uso | padrão se faltar |
|---|---|---|
| `cartao` | fundo dos cartões (topo do degradê) | `#202329` |
| `cartao2` | fundo dos cartões (base do degradê) | `#111317` |
| `janela1` | 1ª bolinha da barra de janela | `perigo` |
| `janela2` | 2ª bolinha da barra de janela | `alerta` |
| `janela3` | 3ª bolinha da barra de janela | `acento` |

Os padrões reproduzem o visual original do kit, então o tema A (que não define nenhuma delas) não muda de aparência. O tema B as define para ter cartões esverdeados e bolinhas de janela cinza, cinza e verde (a `janela3` é o acento). Valem as mesmas regras `#rgb`/`#rrggbb`; `validarTema` recusa valor inválido.

**Tema B: vermelho só no perigo.** Nada de bolinha vermelha ou vermelho decorativo; `--perigo` aparece só no achado do terminal, em palavras de `perigo` da legenda e no selo de uma régua que realmente indica risco. Número que não é perigo usa `--acento` (ver `regua` com `cor`, em 5.3).

**Tema novo:** copie `temas/tema-a.json` para `temas/tema-x.json`, troque `nome` e os valores, mantenha as chaves. `validarTema(t)` devolve a lista de erros; `carregarTema(arquivo)` valida e lança `tema inválido: ...`. Mantenha contraste: `texto` e `acento` legíveis sobre `fundo`, e `perigo` bem distinto de `acento`.

## 4. Tempo (`kit/tempo.mjs`)

O tempo de tudo vem da voz gerada (`voz/data/lines.json` e `words.json`). **Nunca use índice global de palavra**: sempre linha + texto da palavra. Assim, reescrever uma linha não desloca o resto.

```js
import { carregarTempo } from './kit/tempo.mjs';
const tempo = carregarTempo(VOZ);          // lê <VOZ>/data/lines.json e words.json

tempo.duracao;                  // duração total (s)
tempo.nLinhas;  tempo.ultima;   // quantidade de linhas e índice da última
tempo.linha(1);                 // início da linha 1
tempo.fimLinha(1);              // fim da linha 1
tempo.palavra('mil', 1);        // início da palavra "mil" na linha 1
tempo.palavra('vezes', 1, 2);   // 2ª ocorrência (1-based) de "vezes" na linha 1
tempo.fimPalavra('mil', 1);     // fim da palavra
tempo.palavrasDaLinha(i);       // [{ w, s, e, line }, ...]
```

Regras da busca (`palavra`/`fimPalavra`):

- Comparação normalizada (`norm`: minúsculas, sem acento, sem pontuação): `'coracao'` acha "coração".
- **Palavra exata tem prioridade**; prefixo só vale se não houver nenhuma exata (`'ano'` acha "ano", não "anos"/"animal" se "ano" existir).
- Consulta vazia depois de normalizar (`''`, `'...'`) lança erro; linha inexistente ou palavra não encontrada também.
- A ocorrência é contada **por linha** e começa em 1.
- Números falados saem por extenso na voz: procure "mil", não "100.000".

`criarTempo(lines, words)` faz o mesmo com dados já carregados (usado nos testes): `lines` é o objeto `{ duration, lines: [...] }` do `lines.json` (não só o array) e `words` é o array do `words.json`.

## 5. Componentes

Todas as funções de cartão, `flashForma`, `tunel` devolvem uma **parte** `{ css, html, js }`; `cena(id, duracao, [partes])` junta partes numa cena. Tempos `t*` dos cartões são **locais à cena** (segundos desde o início da cena); converta com `tempo.x - inicioDaCena`, como o `loc()` do modelo. Todo `id` de cartão deve ser único no vídeo.

### 5.1 Base (`kit/base.mjs`)

```js
cena(id, duracao, partes)                       // -> { id, d, css, html, js }
escreverComposicao(dirVideo, c, tema)           // grava compositions/<id>.html
escreverIndex(dirVideo, { titulo, duracao, cenas, tema })   // cenas: [{ id, a, d, faixa, z, tipo? }]
escreverCues(dirVoz, duracao, cues)             // grava voz/data/cues.json; cues: [{ t, type, gain?, dur? }]
```

O modelo guarda cada cena com `a` (início absoluto), `faixa` (track) e `z`: fundo faixa 0 z 1; conteúdo faixa 1 z 2; fx faixa 2 z 3; legendas faixa 3 z 4 (`tipo: 'captions'`); apoio inferior faixa 4 z 5. Tipos de cue usados: `thud`, `pop`, `whoosh`, `riser` e `lento` (ver 5.8).

Helpers GSAP disponíveis dentro do `js` das cenas (`HELPERS`; `tl` é a timeline da cena). Numa cena escrita à mão existem só `$` (= `getElementById`), `ZW`, `grp`, `count`, `typeText`, `spring`, `pop` e `click`. `V`, `A` e `fmtN` existem apenas dentro dos cartões do kit (bloco interno de `cartoes.mjs`); para cores numa cena própria use `var(--...)` no CSS.

```js
spring(el, t, { y: 60, scale: 0.86, filter: 'blur(8px)' }, 0.6)   // entra com mola (back.out); opacidade 0 -> 1
pop(el, t, 1.18)                          // pulso elástico de escala
count(el, de, ate, t0, dur, (v) => ZW + grp(String(Math.round(v))), 'power2.in')   // f recebe o número CRU e devolve o texto; alternativa pt-BR: ZW + Math.round(v).toLocaleString('pt-BR')
typeText(el, 'texto', t0, dur)            // digita
click(ringEl, t)                          // anel de clique
```

### 5.2 Ampliar um cartão: `escalar`

Os cartões têm 780-920 px de largura. Para ocupar mais a tela, envolva a parte:

```js
escalar(parte, { escala, de, para = de })
// ex. do modelo: botão de seguir 25% maior, levado do centro (540,650) para (540,810)
escalar(seguir({ id: 's1', marca: 'Conhecimento', chamada: 'Seguir', tEntrada: 0.15, tClique: 3.2 }),
        { escala: 1.25, de: [540, 650], para: [540, 810] })
```

`de` é o ponto do cartão (coordenadas do canvas) em torno do qual se amplia; `para` é onde esse ponto termina. Ids e tempos não mudam. Lança erro se `escala <= 0` ou `de` não for `[x, y]`.

### 5.3 Cartões (`kit/cartoes.mjs`)

Todos aceitam `y` (topo, em px) com valor padrão indicado.

```js
login({ id, titulo, campo, valor, tEntrada, tDigitos, tMostrar, y = 270 })
// tDigitos: um tempo por dígito digitado; tMostrar: clique no olho (mostra o valor)
login({ id: 'l1', titulo: 'Entrar', campo: 'senha', valor: '123456', tEntrada: 0.2, tDigitos: [1, 1.2, 1.4, 1.6, 1.8, 2], tMostrar: 2.6 })

ranking({ id, titulo, itens: [{ rotulo, valor }], destaque = 0, tEntrada, tDestaque, y = 270 })
ranking({ id: 'k1', titulo: 'Mais usadas', itens: [{ rotulo: '123456', valor: 90 }, { rotulo: 'senha', valor: 40 }], destaque: 0, tEntrada: 0.1, tDestaque: 1.5 })

terminal({ id, comando, de, ate, rotulo, tInicio, tFim, tAchou, textoAchou, y = 226 })
// contador de `de` a `ate` entre tInicio e tFim; "achou" em tAchou
// o campo do comando começa VAZIO e o `comando` é digitado (typeText, ~0,42 s) logo após a entrada do cartão
terminal({ id: 't1', comando: '$ teste_de_forca --demo', de: 0, ate: 1234, rotulo: 'tentativas', tInicio: 0.8, tFim: 2.4, tAchou: 2.4, textoAchou: 'senha achada' })

regua({ id, rotulo, max, valor, tInicio, tFim, selo, cor = 'perigo', y = 520 })
// marcador vai de 0 até valor/max entre tInicio e tFim; o selo grande aparece em tFim
// cor: nome de uma cor do tema (padrão 'perigo' = var(--perigo)) para selo, marcador e brilho do cartão
regua({ id: 'r1', rotulo: 'dias de folga', max: 365, valor: 0, tInicio: 0.5, tFim: 2, selo: '0' })
// tema B: número que não é perigo usa o acento (vermelho só no perigo)
regua({ id: 'r2', rotulo: 'tentativas', max: 100, valor: 80, tInicio: 0.5, tFim: 2, selo: '80', cor: 'acento' })

medidor({ id, titulo, palavras, tPalavras, rotulos = ['FRACA','BOA','FORTE'], y = 226 })
// uma ficha por palavra, no tempo de cada uma (`tPalavras.length` deve ter o mesmo tamanho de `palavras`); medidor de força sobe e fecha em acento
medidor({ id: 'm1', titulo: 'Nova senha', palavras: ['gato', 'azul', 'chuva'], tPalavras: [0.8, 1.4, 2], y: 226 })

painel({ id, rotulo, de, ate, sufixo = '', tInicio, tFim, formato = 'pt-BR', y = 640 })
// número gigante contando; fonte se ajusta ao tamanho do número final
painel({ id: 'p1', rotulo: 'batidas por dia', de: 0, ate: 100000, tInicio: 0.2, tFim: 1.8, y: 800 })

seguir({ id, marca, chamada, tEntrada, tClique, y = 390 })
// chamada com "inscrev" vira "Inscrito ✓" depois do clique; qualquer outra vira "Seguindo ✓"
seguir({ id: 's1', marca: 'Conhecimento', chamada: 'Seguir', tEntrada: 0.15, tClique: 2.4 })
```

Exportação extra: `formatarNumero(n, formato = 'pt-BR')` (formatação pura usada pelos contadores).

### 5.4 Fundo (`kit/fundo.mjs`)

```js
fundo(duracao, { cortes = [] } = {})   // -> cena 'bg'; cortes: instantes absolutos (s) onde o chão dá um surto
const bg = { ...fundo(DUR, { cortes: CORTES.slice(1) }), a: 0, faixa: 0, z: 1 };
```

### 5.5 Transições (`kit/fx.mjs`)

```js
flashForma(t, forma, cor)    // forma: 'asterisco' | 'cadeado' | 'raio' | 'coracao'; t = instante do corte (s absolutos)
tunel(t, duracao, cor)       // túnel de 8 retângulos em zoom; duracao ~0.67 como no modelo
transicoes(duracao, [partes])   // junta as partes numa cena 'fx'
const fx = { ...transicoes(DUR, [flashForma(t2, 'coracao', 'var(--acento)'), tunel(t4, 0.67, 'var(--acento)')]), a: 0, faixa: 2, z: 3 };
```

`cor` é uma string CSS, normalmente `var(--acento)`. Forma desconhecida lança erro listando as válidas. Os flashes terminam com opacidade 0 (ver armadilhas).

### 5.6 Legendas (`kit/legendas.mjs`)

```js
legendas(tempo, linhas, { caixa = [], perigo = [], y = 1240, duracao = tempo.duracao })
const caps = { ...legendas(tempo, script.lines), a: 0, faixa: 3, z: 4, tipo: 'captions' };
const caps2 = legendas(tempo, script.lines, { perigo: ['nunca'], caixa: ['folga'] });
```

- `linhas` é o `script.lines` de `voz/script.json`. Com `caps`, cada bloco (separado por `|`) é um grupo na tela; sem `caps`, o kit agrupa de 3 em 3 palavras e põe em destaque o número do bloco (se houver) ou a palavra mais longa.
- **Cada bloco tem exatamente um `*`** (a palavra em serif itálica/acento). Zero ou dois lança erro.
- **As caps devem ter as mesmas palavras do texto falado**, na mesma ordem (comparação normalizada).
- **Números na tela sempre em algarismos (regra do canal).** O `text` continua por extenso (é o que a voz lê); nas caps escreva o algarismo: `"*7 anos"` ↔ "sete anos", `"Umas *100 mil"` ↔ "umas cem mil", `"de *36 milhões"` ↔ "de trinta e seis milhões". O algarismo (mais a escala logo depois: mil, milhões, bilhões) cobre todas as palavras do número falado e precisa ter **o mesmo valor**, senão lança erro. Número por extenso nas caps ("cem", "trinta") lança erro no kit e no `fabrica checar`. "um/uma" é artigo e pode ficar ("tirou *um dia"); para mostrar "1", escreva "1".
- **Palavra ou número:** escala no plural (milhões, bilhões, trilhões) **sozinha, sem número antes**, é palavra ("milhões de senhas" fica como está; "36 milhões" só com o número antes). "mil" **sozinho** é número (1000). O "e" só junta uma parte de **ordem menor**: "vinte e três" = 23, "cento e dois" = 102, "mil e quinhentos" = 1500; já "dois e três" são **dois** números (2 e 3).
- **Porcentagem:** nas caps, `*50%` cobre "cinquenta por cento" (as três palavras faladas); `%` só vale com "por cento" falado. Sem caps, "cinquenta por cento" vira "50%" sozinho.
- **O `fabrica checar` compara as caps com o texto falado** (`checarCapsTexto`), nas linhas e também nas caps das variantes da última linha, **só para estilos com kit** (`motion`, `motion-b`; o deep-dive permite caps diferentes da fala): mesmas palavras, mesma ordem, algarismo cobrindo o número falado com o mesmo valor. A fábrica lê o número com uma cópia fiel da `lerNumero` do kit (`fabrica/lib/numeros.mjs`), então aceita e recusa as mesmas caps que o kit.
- **Sem caps, a conversão é automática:** "cem mil" vira "100 mil", "trinta e seis milhões" vira "36 milhões", "dois mil e vinte e quatro" vira "2024" (até 9999 sem ponto; 12.345 com ponto). Um número nunca é partido entre dois blocos.
- `perigo`: palavras que ficam em `--perigo` dentro de uma caixa vermelha (consecutivas dividem a caixa); também saem em serif itálica e contam como a serif do bloco, então um bloco com `*` e uma palavra em `perigo` terá duas em serif. `caixa`: palavras com caixa de `--acento`. Nomes comparados normalizados.
- O tempo de cada palavra vem de `tempo.palavra(falada, linha, ocorrencia)`, com a ocorrência contada por linha.
- Por padrão a legenda fica em **y=1240**; abaixo dela entra o apoio visual do terço inferior.

### 5.7 Ícones (`kit/icones.mjs`)

Devolvem strings SVG; a cor é uma string CSS (`'var(--acento)'`).

```js
cursor(id)                    // ponteiro com class "cursor" (usado nos cartões)
cadeado(tam, cor, aberto = false)
olho(aberto, cor)             // aberto/riscado
coracao(tam, cor)
check(tam, cor)
raio(tam, cor)
// ex.: html: `<div id="g-heart" data-layout-ignore>${coracao(360, 'var(--perigo)')}</div>`
```

### 5.8 Camadas de texto (`kit/camadas.mjs`)

Camadas comuns aos dois temas; devolvem `{ css, html, js }` (use como parte de `conteudo`). Tempos **locais à cena**, cores por `var(--...)`.

```js
pilula({ id, texto, tEntrada, tSaida, y = 150 })
// pílula de dado no topo (ex.: fonte do número): ponto pulsante + texto mono em maiúsculas; sem tSaida ela fica até o fim da cena
pilula({ id: 'p0', texto: 'Dado · NordPass 2024', tEntrada: 0.05, tSaida: 3.2 })

manchete({ id, texto, tEntrada, y = 330, tamanho = 104 })
// frase grande, palavra a palavra; a palavra marcada com * vira serif itálica em --acento com marca-texto
manchete({ id: 'm0', texto: 'A *senha mais usada do mundo', tEntrada: 0.08, y: 300 })

etiqueta({ id, texto = 'CÂMERA LENTA', tEntrada, tSaida, x = 60, y = 150 })
// etiqueta "CÂMERA LENTA 0,25×"; entra com deslocamento em x (sem escala e sem animar letter-spacing)
etiqueta({ id: 'cl1', tEntrada: 2.4, tSaida: 4 })
```

- **A manchete tem exatamente um `*`**, colado no início da palavra destacada; zero ou mais de um lança `manchete "...": marque exatamente uma palavra com *`.
- **Etiqueta + som:** a etiqueta é a câmera lenta visual e o som é o cue `lento` (grave descendo + ar abafado, ~0,9 s). Use sempre o par, no mesmo instante: `etiqueta({ id: 'cl1', tEntrada: loc(1, tA), tSaida: ... })` na cena e `cue(tA, 'lento', { gain: 0.9 })` com o tempo **absoluto** `tA`, como no `modelo-b/gen.mjs`.
- `pilula` e `etiqueta` usam a mesma faixa do topo (y 150); não as mostre ao mesmo tempo.

## 6. Como fazer um vídeo novo

1. `node fabrica/bin/fabrica.mjs novo <marca> motion <slug>` (Marca A, tema A, `modelo/`) ou, para a Marca B, `node fabrica/bin/fabrica.mjs novo hacker motion-b <slug>` (tema B, `modelo-b/`): cria a pasta a partir do modelo do estilo (com cópia do kit e do tema) e põe na fila.
2. Reescreva `voz/script.json`: `title`, `gancho`, `sources`, `postar` (título, descrição, hashtags), `lines` com `text` e `caps` (1-3 palavras por bloco, um `*` cada), e na **última linha** as `variantes` por plataforma da marca (a chamada "Segue" para TikTok/Reels e "Se inscreve" para Shorts). Respeite os limites: <=60 s TikTok, <=45 s Reels/Shorts.
3. Reescreva as cenas em `gen.mjs`: um `conteudo(i, id, [partes])` por linha, tempos sempre por `tempo.linha(i)` / `tempo.palavra('x', i)`; cortes, `fundo`, `transicoes`, `legendas` e o apoio do terço inferior como no modelo. Rode `node gen.mjs` para gerar `video/` e `voz/data/cues.json`.
4. `node fabrica/bin/fabrica.mjs checar <id>`: valida roteiro (legendas, gancho, fontes, variantes, duração, proibidos), **compara as caps com o texto falado (linhas e variantes; estilos com kit)** e isolamento (nenhum import/src apontando para `estilos/`).
5. `node fabrica/bin/fabrica.mjs etapa <id> render` e depois `node fabrica/bin/fabrica.mjs lote`: renderiza todos os vídeos na etapa render. Para refazer só uma plataforma: `render-variante <id> <plataforma>`.

**Teste rápido do kit:** `node fabrica/bin/fabrica.mjs kits motion` (ou `kits motion-b`) monta o modelo numa pasta temporária, checa e renderiza uma plataforma. `kits` sem argumentos testa só os estilos com kit (`estilosComKit()` em `fabrica/lib/estilos.mjs`: hoje `motion` e `motion-b`; `deep-dive` e `voxel` ainda não têm kit). Rode depois de mexer no kit. Testes unitários do kit: `cd estilos/motion && node --test "tests/*.test.mjs"`.

## 6b. Regras de conteúdo da Marca B (`motion-b`)

Da spec das marcas (seção 2) e do campo `proibido` de `marcas/hacker/marca.json` (o `checar` recusa o roteiro que casar com algum padrão):

- **Pode:** casos reais (ataques, vazamentos, prisões), "como esse golpe funciona e como se proteger", anti-cheat em nível conceitual, notícias de segurança, carreira em segurança.
- **Não pode:** passo a passo de invasão, crack ou cheat; nome ou link de ferramenta de cheat, crack ou invasão; pirataria; qualquer coisa que ensine a fazer em vez de entender e se defender.
- **Tela de computador (terminal, login):** só com comando e dados **genéricos de demonstração** (`$ teste_de_forca --demo`, senha `123456`), nunca comando de ataque real nem alvo real.
- **Sempre fechar com a proteção:** a narração tem enquadramento educativo explícito ("veja como funciona para não cair") e termina dizendo como se proteger (no modelo B: frase longa e verificação em 2 etapas).
- **Visual:** tema B, vermelho só no perigo (seção 3.1).

## 7. Armadilhas conhecidas

- **Contadores em pt-BR:** o GSAP lê "100.000" como 100. Anime sempre o número cru e formate na escrita. Só `terminal` e `painel` formatam em pt-BR (o `medidor` usa número cru) e já fazem isso internamente (`count(el, de, ate, t0, dur, (v) => ZW + fmtN(v, 'pt-BR'))`); em cena própria use `count`, nunca `gsap.to` num texto formatado.
- **Espaço entre palavras na legenda:** as palavras são `inline-block` com margem (`.14em`), não texto corrido; se criar CSS de legenda próprio, não dependa de espaços em branco entre os elementos.
- **Blur negativo em mola:** `back.out` ultrapassa 1 e leva `blur()` a valor negativo (inválido, o filtro some). O `spring` já anima o blur numa tween separada com `power2.out`; passe o blur via `{ filter: 'blur(8px)' }` no `from` do `spring`, nunca na tween com `back`.
- **Opacidade final dos flashes:** flash e forma devem terminar com `opacity: 0`; se pararem em 1 cobrem o vídeo até o fim. `flashForma` fecha com `tl.set(..., { opacity: 0 })`; o `tunel` termina por keyframes que acabam em `opacity: 0`. Mantenha um desses padrões em formas novas.
- **Textos < 28 px:** ilegíveis no celular; o kit não usa nada abaixo disso.
- **Cor fixa proibida:** só `var(--...)`; para o GSAP (que não interpola `var`), resolva em tempo de execução com `V('acento')` / `A('acento', .3)` dentro de um `bloco` de cartão. Única exceção: sombras e brilhos neutros translúcidos.
- **Tema com cor fora de `#rgb`/`#rrggbb`:** é recusado na validação.
- **Índice global de palavra:** proibido; use `tempo.palavra('x', linha)`. Palavra ambígua? use a ocorrência (`tempo.palavra('vezes', 1, 2)`) ou prefira a exata.
- **Cartão pequeno em tela vertical:** cartões nascem com ~800-900 px de largura; use `escalar` em vez de editar o CSS interno.
- **Legenda sobre cartão:** legenda em y=1240; cartões e `painel` acima disso (no modelo, painel em y=800). Não cubra os ~120 px à direita no terço inferior.
- **`ids` repetidos:** dois cartões com o mesmo `id` quebram os seletores; use um `id` curto e único por cartão.
- **Som `lento` em vídeo antigo:** o som só existe no `voz/tools/mix.py` copiado dos modelos depois desta versão; vídeo criado antes não o tem, e o `mix.py` antigo ignora o cue (`unknown cue type, skipped`), então a etiqueta fica muda. Copie o `mix.py` atual do modelo para o vídeo antigo.
- **Windows: `hyperframes check` de dentro da pasta da variante** deixa um processo `warmCheck` vivo que trava o próximo render com EPERM. Rode da raiz do repositório passando o caminho da variante, não com `cd` para dentro dela.
