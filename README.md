# Fábrica de shorts

Fábrica de vídeos curtos verticais (TikTok, Reels e Shorts) feita 100% em código, para usar com o **Claude Code**. Você pede um tema e o Claude faz o resto:
- escreve o roteiro;
- gera a voz em português com o Kokoro, de graça e no seu PC;
- sincroniza as legendas palavra por palavra com o Whisper, também local;
- anima as cenas em 3D ou em motion graphics;
- entrega 3 MP4 (tiktok, reels e shorts), com capa e texto para postar.

Não usa vídeo nem imagem de IA, chave de API ou créditos.

## Modelos de vídeo

| estilo | o que é |
|---|---|
| `voxel` | mundo de blocos chanfrados (low poly), "e se…?" |
| `deep-dive` | personagem 3D com raio-x e órgãos, corpo e ciência |
| `pixel` | pixel art 3D, "como funciona um objeto do dia a dia" |
| `mapa-satelite` | imagem de satélite real com zoom do país até a cidade, rotas desenhadas por cima e o ano no canto; história de um lugar, como uma obra atrasada (40–60 s) |
| `motion` | cartões de interface e tipografia, números e listas |
| `motion-b` | motion com tema escuro, para tecnologia e segurança |
| `caso-real` | casos reais em cenário escuro com uma luz |

Cada estilo tem um kit em `estilos/<estilo>/`: `STYLE.md` com as regras e a API, `kit/` com as peças e `modelo/` com um vídeo completo.

## O que tem aqui

- `fabrica/`: a linha de comando (`node fabrica/bin/fabrica.mjs`) com `novo`, `checar`, `fila`, `etapa`, `render-variante`, `kits` e `narracoes`.
- `estilos/`: os 7 kits.
- `marcas/`: os canais. Vêm 2 de exemplo: `conhecimento` ("Meu Canal") e `hacker` (educativo). O nome e o @ que aparecem no cartão final saem do `marca.json`.
- `skills/fabrica-de-shorts/`: a skill que ensina o Claude a usar a fábrica.
- `skills/faceless-shorts/`: a skill base, com voz, legendas e instalação.
  - Traz mais 8 estilos próprios: 7 em inglês e uma cópia portátil do Mapa de Satélite.
  - Para os seus canais, use os modelos da fábrica.

## Instalação (Windows, macOS ou Linux)

Você precisa do Claude Code, Git, Node.js 22 ou mais novo, Python 3.10 ou mais novo, ffmpeg e Google Chrome. No Windows, rode os comandos no **Git Bash**.

```bash
git clone https://github.com/ytsmoke733-commits/fabrica-de-shorts.git ~/fabrica-de-shorts
mkdir -p ~/.claude/skills
cp -R ~/fabrica-de-shorts/skills/faceless-shorts ~/.claude/skills/
cp -R ~/fabrica-de-shorts/skills/fabrica-de-shorts ~/.claude/skills/
bash ~/.claude/skills/faceless-shorts/scripts/setup.sh      # até aparecer "All set"
npm install -g hyperframes                                  # só para os estilos motion e motion-b
```

O `setup.sh` cria um Python isolado em `~/.faceless-shorts/venv` e baixa a voz Kokoro (~340 MB) e o Whisper em inglês. O Whisper multilíngue, usado no português (~0,5 GB), baixa sozinho no primeiro vídeo.

Para conferir se ficou tudo certo:

```bash
cd ~/fabrica-de-shorts
node --test fabrica/tests/*.test.mjs     # 171 testes
node fabrica/bin/fabrica.mjs kits        # renderiza 1 vídeo de teste por estilo (leva alguns minutos)
```

O caminho `~/fabrica-de-shorts` é só uma sugestão. A fábrica funciona em qualquer pasta, mas as skills precisam ficar em `~/.claude/skills/`.

## Uso

1. Troque `"nome"` em `marcas/conhecimento/marca.json` pelo nome do seu canal. Se quiser o @ no cartão final, acrescente `"arroba": "@seucanal"`.
2. Abra o Claude Code (pode ser num chat novo) e peça, por exemplo:
   > faz um vídeo voxel sobre o que aconteceria se a Lua sumisse

   ou

   > faz um pixel 3D explicando como funciona o controle remoto da TV

   ou

   > faz um vídeo de mapa de satélite sobre uma obra que atrasou décadas na sua cidade

   (para um lugar novo, o Claude baixa as imagens de satélite na hora: precisa de internet)
3. O Claude confere os fatos, escreve o roteiro e monta as cenas. Ele revisa os quadros antes de renderizar e entrega os vídeos em `marcas/<marca>/videos/<data>-<tema>/entrega/`.

**Narração própria:** grave um mp3 por vídeo e peça "aplica minha narração". A skill explica como os arquivos devem se chamar.

## Avisos

- Renderizar pesa no PC (Chrome e ffmpeg). No Windows, se travar o resto do sistema, peça ao Claude para baixar a prioridade do render.
- Confira os fatos de cada vídeo antes de postar: o Claude pesquisa, mas a responsabilidade é de quem posta.
- A marca `hacker` é educativa. A fábrica recusa roteiros com passo a passo de invasão ou link de cheat.

## Licenças de terceiros

- three.js: MIT, na pasta `vendor/` de cada estilo.
- Fonte Inter: SIL Open Font License 1.1.
- Kokoro-82M: Apache-2.0.
- kokoro-onnx, faster-whisper e Whisper: MIT.
- HyperFrames: veja a licença do pacote no npm.
- Imagens do estilo Mapa de Satélite:
  - NASA GIBS (Blue Marble e MODIS): domínio público;
  - Copernicus Sentinel-2: uso livre, inclusive comercial, com crédito;
  - malhas do IBGE;
  - traçados do © OpenStreetMap (ODbL).

  O crédito tem de aparecer no vídeo e na descrição do post, e o estilo já faz as duas coisas. Para baixar mapas novos, o `setup.sh` tenta instalar `rasterio`, `pystac-client` e `pillow`; o exemplo funciona sem eles.
