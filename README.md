# Escaninho Digital

Para cadastrar materiais no Acervo, veja [Como cadastrar um recurso](./docs/cadastrar-recurso.md).

Hub educacional de curadoria e organização de recursos ligados a educação,
História, Filosofia, Humanidades, tecnologia educacional e prática docente.

O Escaninho Digital **não** é um repositório central dos códigos de outros
projetos do ecossistema (ex.: Montar para Aprender). Ele apresenta esses
projetos de forma organizada — com cards, descrições e categorias — e
direciona o visitante ao site original de cada um.

## Status

Estrutura inicial implementada em [Astro](https://astro.build/). Veja
[PLANO-ESCANINHO.md](./PLANO-ESCANINHO.md) para a arquitetura de informação,
o mapa de páginas, o sistema de cards de projetos e as etapas de
desenvolvimento.

## Ecossistema

- Professor Joas — https://www.professorjoas.com.br
- Acervo Visual / Humanidades em Foco — https://acervo.professorjoas.com.br
- Saber em Jogo — https://saber.professorjoas.com.br
- Montar para Aprender — https://www.montarparaaprender.com.br
- Escaninho Digital — https://www.escaninhodigital.com.br

Estes são os endereços públicos canônicos. Prefira-os às URLs técnicas de
hospedagem. Saber em Jogo pertence à seção Projetos e não deve ser cadastrado
em `resources.ts` nesta etapa.

Imagem Interativa e Quebra-cabeça Montar para Aprender pertencem ao ecossistema
Montar para Aprender. Permanecem em desenvolvimento, sem URL, até que sejam
fornecidos os endereços públicos específicos de cada ferramenta. Não use a
Home do projeto como destino desses recursos.

## Stack

[Astro](https://astro.build/) — geração estática, componentes reutilizáveis,
SEO de primeira classe e deploy direto na [Vercel](https://vercel.com/).

## Desenvolvimento

```bash
npm install     # instala as dependências
npm run dev -- --background # inicia o servidor local em http://localhost:4321
npm run build   # gera a versão estática de produção em ./dist
npm run preview # pré-visualiza o build de produção localmente
```

## Adicionando um novo projeto ao ecossistema

Os cards de projetos (Home e `/projetos/`) são gerados automaticamente a
partir de uma única fonte de dados — nenhum HTML precisa ser escrito ou
duplicado. Para cadastrar um novo projeto:

1. Coloque a imagem em `public/images/projects/` (ex.: `nome-do-projeto.jpg`).
2. Abra [src/data/projects.ts](./src/data/projects.ts).
3. Adicione um novo objeto ao array `projects` com:
   - `title`, `category`, `description`;
   - `image` e `imageAlt`;
   - `url` (endereço de destino — nunca use `"#"`; se o endereço ainda não
     estiver definido, defina `available: false` em vez de inventar uma URL);
   - `tags` (opcional).
4. Defina `external: true` se o projeto vive em outro domínio, ou
   `external: false` se tiver uma página própria dentro do Escaninho
   (`/projetos/<slug>/`).
5. Defina `featured: true` se o projeto deve aparecer também na seção
   "Projetos em destaque" da Home.
6. Salve o arquivo.
7. Rode `npm run dev -- --background` e confira o card em `/` e em `/projetos/`.

O componente `ProjectCard.astro` (e o `ProjectGrid.astro`, que organiza o
grid responsivo) monta toda a apresentação visual automaticamente — o
código-fonte dos projetos externos nunca entra neste repositório.

### Exemplo de cadastro

```ts
{
  title: "Nome do projeto",
  category: "Humanidades",
  description: "Descrição curta da iniciativa educacional.",
  image: "/images/projects/nome-do-projeto.webp",
  imageAlt: "Descrição do conteúdo da imagem.",
  url: "https://endereco-confirmado.example",
  external: true,
  featured: true,
  tags: ["história"], // opcional
  buttonLabel: "Conhecer o projeto", // opcional
},
```

Substitua o endereço de exemplo por um endereço confirmado. Sem endereço,
omita `url`: o card mostra “Em desenvolvimento” automaticamente. Sem imagem,
omita `image` e `imageAlt`: aparece um placeholder discreto. As imagens atuais
já estão em `public/images/projects/` e foram preservadas.

`slug`, `tags`, `buttonLabel`, `external` e `featured` são opcionais.
O slug não cria uma página. Para um destino interno existente, informe
`url: "/caminho/"` e `external: false`. Não é preciso criar página interna
para cadastrar um projeto externo ou em desenvolvimento.

`featured: false` retira o projeto somente da Home; ele permanece em
`/projetos/`. `available: false` pode suspender uma ação mesmo com URL.
O Acervo Visual de Humanidades, também denominado Humanidades em Foco — Acervo Visual Educacional, está disponível publicamente em [https://acervo.professorjoas.com.br](https://acervo.professorjoas.com.br).
O Jornal Escolar está disponível publicamente em https://jornal.professorjoas.com.br.
As páginas editoriais que já existiam foram preservadas, sem vinculá-las
como destinos confirmados dos cards.

Teste `/` e `/projetos/` no desktop, tablet e celular, confira o destino e
execute `npm run build`. Gerencie o servidor com `npm exec astro dev status`,
`npm exec astro dev logs` e `npm exec astro dev stop`.
