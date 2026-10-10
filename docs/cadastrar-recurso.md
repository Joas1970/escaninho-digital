# Como cadastrar um recurso no Acervo

Os recursos são cadastrados uma única vez em `src/data/resources.ts`.
`NavCard` representa navegação, `ProjectCard` representa projetos e
`ResourceCard` representa os materiais do Acervo.

1. Se houver imagem, coloque-a em `public/images/resources/` e descreva
   seu conteúdo em `imageAlt`. Sem imagem, o card usa um placeholder discreto.
2. Abra `src/data/resources.ts` e adicione um objeto ao array `resources`.
3. Preencha `title`, `description` e `collections`. As coleções aceitas são
   `atividades-e-jogos` e `materiais-de-apoio`.
4. Informe uma URL confirmada. Para uma página interna existente, use um
   caminho como `/caminho/` com `external: false`. Para outro site, use a URL
   completa com `external: true`.
5. Opcionalmente informe `slug`, `area`, `type`, `educationLevel`, `tags`,
   `source` (nome da fonte/projeto), `image` e `imageAlt`.
6. Use `featured: true` para destacar o recurso na entrada do Acervo.
7. Salve, confira as coleções e o destino no navegador e execute `npm run build`.

## Modelo de preenchimento — não é um material publicado

```ts
{
  title: "Título do material real",
  description: "Descrição curta que explica a finalidade do recurso.",
  collections: ["atividades-e-jogos"],
  area: "História",
  type: "Atividade",
  educationLevel: "Ensino Médio",
  image: "/images/resources/nome-do-recurso.webp",
  imageAlt: "Descrição da imagem fornecida.",
  // url: informe aqui o endereço confirmado do material,
  external: true,
  featured: false,
  tags: ["Tema do material"],
  source: "Nome da fonte ou projeto",
},
```

Um recurso pode pertencer a várias coleções, sem duplicação do cadastro.
A ordem do array determina a ordem editorial das listas. A entrada do Acervo
mostra os primeiros três recursos individuais disponíveis marcados como destaque.
Sem destaques disponíveis, essa seção fica oculta.

Sem `url`, o recurso aparece na coleção como “Em desenvolvimento”, sem ação, e não
entra nos destaques. Nunca use `#` como endereço. Se `external` for omitido,
URLs HTTP/HTTPS são tratadas como externas; para URLs absolutas do próprio
Escaninho, informe `external: false` ou prefira um caminho relativo à raiz.

O `slug` não gera uma rota automaticamente. Cadastrar um recurso externo
exige apenas os dados e, opcionalmente, a imagem. Um recurso interno precisa
de uma página existente ou de conteúdo editorial produzido separadamente.
Não copie código ou conteúdo integral de outras fontes para cadastrar cards.

## Natureza do cadastro e situação pedagógica

Os dois campos abaixo são opcionais:

- `kind: "resource"` representa um recurso individual. Se omitido, esse é
  o valor considerado. `kind: "source"` representa uma coleção/fonte que
  oferece diferentes materiais. Projetos continuam em `projects.ts`.
- `pedagogicalStatus` pode ser `"experiencia-aplicada"` (uso efetivo na
  prática docente), `"proposta-pedagogica"` (material preparado/idealizado)
  ou `"recurso-de-referencia"` (consulta, estudo ou curadoria). O card exibe
  uma identificação discreta somente para recursos individuais classificados.

Não classifique como experiência aplicada sem informação concreta sobre o
recurso individual. Uma ferramenta genérica não recebe essa classificação
apenas porque atividades desse tipo já foram utilizadas. Sem informação,
omita o campo. A situação pedagógica não representa avaliação metodológica
formal e é independente da existência de uma URL pública.

Humanidades em Foco é uma coleção/fonte, apresentada em “Coleções e fontes”
e em Materiais de apoio. Não entra nos destaques
individuais, mesmo com `featured: true`. Mantém sua imagem e URL canônica.
Imagem Interativa e Quebra-cabeça Montar para Aprender permanecem sem URL
e sem situação pedagógica atribuída. Recursos sem URL aparecem em “Em preparação”; seções vazias ficam ocultas.

## Organização por formato

História e Filosofia são temas: use `area` ou `tags`, não coleções por disciplina.
Use `adapted: true` apenas quando o recurso oferecer adaptações verificadas; o card exibirá “Atividade adaptada”.
O campo opcional `buttonLabel` permite uma ação específica, como “Criar caça-palavras”.
O caça-palavras está publicado em `/atividades/caca-palavras/`. Seu código de navegador fica isolado em `src/features/caca-palavras/`; veja `docs/caca-palavras.md`.
Os antigos endereços de História, Filosofia e Atividades adaptadas redirecionam para as novas coleções.
