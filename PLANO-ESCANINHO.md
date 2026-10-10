# Organização atual do Acervo

O Acervo é organizado por formato: Atividades e jogos e Materiais de apoio. Explorar o acervo reúne os recursos disponíveis. História e Filosofia são temas dos materiais. Os endereços antigos redirecionam para as novas coleções. Consulte docs/cadastrar-recurso.md para novos cadastros.

> O plano abaixo registra a estrutura anterior e serve como histórico.

# PLANO — Escaninho Digital (nova versão)

> Documento de arquitetura e planejamento. A estrutura inicial descrita aqui
> já foi implementada (ver [README.md](./README.md) para como rodar o
> projeto); este documento permanece como referência de arquitetura e guia
> para as próximas etapas.

## 0. Análise da pasta atual

A pasta do projeto não estava vazia. Foi encontrado:

- `simply-static-1-1791253699/` (+ `.zip`): **exportação estática do site WordPress
  atual** (tema Astra + Elementor), gerada pelo plugin *Simply Static*. Contém o
  HTML/CSS/JS já renderizados do site em produção, incluindo as páginas:
  `index`, `historia`, `filosofia`, `atividades-adaptadas`,
  `acervo-visual-de-humanidades`, `acervo-visual-de-humanidades-2`,
  `espaco-docente`, `projeto`, `montar-para-aprender`, `jornal-escolar`,
  `sobre`, `professor-joas-alves`, `contato`, `author`.
- Imagens soltas na raiz: `HERO-Escaninho.png`, `geralt-ai-generated-8309926_1920.jpg`,
  `geralt-classroom-10160192_1920.jpg`, `vilkasss-ai-generated-9813399_1920.jpg`.
- `desktop.ini` (arquivo de sistema do Windows, sem relevância para o projeto).

Essa exportação confirma e detalha o que já existe hoje em produção (WordPress):
o menu principal já segue exatamente a estrutura **Início / Acervo (História,
Filosofia, Atividades adaptadas) / Espaço Docente / Projetos (Montar para
Aprender, Acervo Visual de Humanidades, Jornal Escolar) / Sobre (Sobre o
Escaninho, Professor Joas Alves, Contato)** descrita nas orientações, e a Hero
atual usa exatamente o texto de referência ("ACERVO · EDUCAÇÃO · HUMANIDADES" /
"Um espaço para ensinar, aprender e compartilhar.").

**Conclusão da análise:** não partimos de uma pasta vazia nem de um "projeto
zero" — existe um site WordPress real em produção que será **reconstruído**
como projeto estático versionado no GitHub e publicado na Vercel. A exportação
estática serve como **referência de conteúdo e de arquitetura de informação**
(copy, textos, mapa de páginas), mas **não será usada como base de código**:
o HTML gerado pelo Elementor é extremamente verboso, acoplado ao WordPress e
não atende aos critérios de manutenção simples pedidos (nomes claros,
componentes reutilizáveis, poucas dependências). O conteúdo/copy existente
será reaproveitado manualmente onde fizer sentido; o markup será recriado do
zero com HTML semântico.

## 1. Conceito do projeto

Escaninho Digital é um **hub de curadoria educacional**: organiza, apresenta e
direciona para recursos e projetos ligados a educação, História, Filosofia,
Humanidades, tecnologia educacional e prática docente.

Regra central: **curadoria e organização, não repositório de código de
terceiros.** Projetos externos (ex.: Montar para Aprender) são apresentados via
cards com link para o site original — o código desses projetos não entra neste
repositório.

## 2. Função do Escaninho no ecossistema

| Propriedade | Função |
|---|---|
| `professorjoas.com.br` | Identidade profissional, autoria e trajetória do professor |
| `montarparaaprender.com.br` | Projeto pedagógico específico (recursos visuais, inclusão) |
| `https://www.escaninhodigital.com.br` | Hub de curadoria, organização, descoberta e acesso a conteúdos e projetos |

Os três ambientes são complementares; evitar duplicar páginas, textos ou
código entre eles.

## 3. Arquitetura de informação / mapa de páginas

```
/                              Início
/acervo/                       Acervo (landing da seção)
/acervo/historia/              História
/acervo/filosofia/             Filosofia
/acervo/atividades-adaptadas/  Atividades adaptadas
/espaco-docente/               Espaço Docente
/projetos/                     Projetos (listagem/curadoria)
/projetos/montar-para-aprender/        Página interna de apresentação (link externo)
/projetos/acervo-visual-de-humanidades/ Página interna de apresentação
/projetos/jornal-escolar/              Página interna de apresentação
/sobre/                         Sobre o Escaninho Digital
/sobre/professor-joas-alves/    Professor Joas Alves
/contato/                       Contato
```

Observações:

- Mantivemos a mesma árvore conceitual do site atual, mas com URLs levemente
  mais organizadas (`/acervo/...`, `/projetos/...`) para refletir hierarquia
  real e melhorar SEO/clareza. Isso pode ser ajustado antes da implementação,
  caso se prefira manter exatamente os slugs atuais (`/historia/`,
  `/filosofia/` etc.) por motivos de SEO/links já indexados — **ponto em
  aberto para sua decisão**, ver resumo final.
- Não criar páginas além dessas nesta primeira fase.

## 4. Estrutura da página inicial

1. **Hero** — mantida como referência conceitual (não recriar radicalmente):
   - Identificador: `ACERVO · EDUCAÇÃO · HUMANIDADES`
   - Título (H1): `Um espaço para ensinar, aprender e compartilhar.`
   - Texto: `O Escaninho Digital reúne recursos, experiências e materiais
     educacionais para apoiar professores e estudantes em diferentes caminhos
     de aprendizagem.`
   - Imagem de fundo/composição: reaproveitar `HERO-Escaninho.png` (já presente
     na raiz do projeto).
2. **Explore o Escaninho** — 3 cards de navegação: Acervo, Espaço Docente,
   Projetos. Cada card: título, descrição curta, ícone discreto, link,
   indicação visual de interação (hover/focus).
3. **Projetos em destaque** — cards de projetos usando o sistema de dados da
   seção 6, com `featured: true` (inicialmente: Montar para Aprender, Acervo
   Visual de Humanidades, Jornal Escolar). Deixar explícito visualmente/via
   copy que são iniciativas externas/próprias apresentadas, não conteúdo
   hospedado aqui.

## 5. Sistema de cards de projetos

Fonte única de dados, sem banco de dados nesta fase — arquivo de conteúdo
estruturado (JSON ou front-matter, conforme tecnologia escolhida) com o
formato:

```ts
type Project = {
  title: string;
  slug: string;
  description: string;
  image: string;
  category: string;
  tags: string[];
  url: string;        // destino final (pode ser interno ou externo)
  external: boolean;   // true = abre o site original em nova aba
  featured: boolean;   // true = aparece na Home
};
```

Um único componente de UI (`ProjectCard`) renderiza qualquer item dessa lista.
Adicionar um novo projeto = adicionar um objeto nesse arquivo de dados (+
imagem), sem tocar em HTML/componentes.

## 6. Conteúdo vs. Projeto (separação conceitual)

- **Conteúdo do Escaninho**: páginas e textos editoriais que pertencem ao
  próprio site (Acervo, Espaço Docente, Sobre, Contato). Vivem como páginas/
  conteúdo normal do site.
- **Projetos**: iniciativas externas com identidade própria (Montar para
  Aprender, Acervo Visual de Humanidades, Jornal Escolar). Vivem como itens de
  dados (`Project[]`), nunca como cópia de código-fonte de terceiros.

## 7. Organização dos dados (proposta de pastas)

```
/
├── public/
│   └── images/                 (imagens estáticas: hero, projetos, og-image)
├── src/
│   ├── components/             (Header, Footer, Hero, Card, ProjectCard, Seo...)
│   ├── layouts/                (BaseLayout.astro)
│   ├── content/
│   │   └── projects/           (um arquivo por projeto: montar-para-aprender.json/.md)
│   ├── pages/
│   │   ├── index.astro
│   │   ├── acervo/
│   │   ├── espaco-docente.astro
│   │   ├── projetos/
│   │   └── sobre/
│   └── styles/
│       └── global.css          (tokens de cor/tipografia)
├── PLANO-ESCANINHO.md
├── README.md
└── package.json
```

## 8. Tecnologia recomendada

**Recomendação: [Astro](https://astro.build/).**

Justificativa frente aos critérios pedidos:

- **Site predominantemente estático** → Astro gera HTML estático por padrão
  (zero JS no cliente, a menos que se peça explicitamente um "ilha" interativa).
- **Facilidade de manutenção** → componentes `.astro` são simples (HTML +
  pouco JS de build-time), curva de aprendizado baixa, sem necessidade de
  gerenciar estado complexo.
- **GitHub + Vercel** → suporte oficial de primeira classe na Vercel
  (zero-config deploy).
- **SEO** → controle total de `<head>` por página (title, meta description,
  canonical, Open Graph), URLs limpas, performance alta (Core Web Vitals)
  favorecem ranqueamento.
- **Desempenho** → sem runtime de framework pesado no cliente; ótimo em
  dispositivos móveis.
- **Componentes reutilizáveis** → suporta componentes `.astro` e, se
  necessário futuramente, componentes React/Vue isolados ("islands"), sem
  obrigar a adotar um SPA inteiro.
- **Crescimento futuro** → Content Collections do Astro permitem evoluir de
  arquivos de dados simples para uma coleção de conteúdo tipada (ex.: Markdown)
  sem precisar de banco de dados ou reescrever a arquitetura.

Alternativas consideradas e descartadas nesta fase:

- **Next.js/React puro**: mais pesado que o necessário para um site
  majoritariamente estático e de conteúdo; adiciona complexidade
  desnecessária (SSR, roteamento client-side) sem benefício claro aqui.
- **HTML/CSS puro sem build**: dificultaria reutilização de header/footer e o
  sistema de cards (teria que copiar/colar HTML manualmente), contrariando o
  pedido explícito de evitar isso.
- **Eleventy (11ty)**: também adequado e muito leve; Astro foi preferido por
  ter melhor DX com componentes e ecossistema de deploy na Vercel ainda mais
  direto, mas é uma alternativa válida caso haja preferência por algo ainda
  mais minimalista (menos dependências de build).

Sem frameworks de CSS pesados (ex. Bootstrap) — CSS próprio, com tokens
(variáveis) para tipografia e paleta, mantendo o visual elegante e não
comercial pedido.

## 9. Identidade visual

- Tipografia: **Montserrat**.
- Paleta:
  - Texto principal: `#333334`
  - Cinza/base: `#b9b9b8`
  - Destaque dourado: `#ab9061`
- Diretrizes: bastante espaço em branco, cantos discretos, sombras leves,
  poucas animações (respeitando `prefers-reduced-motion`), nada de aparência
  "portal comercial" ou "template genérico".
- Imagens já disponíveis na raiz (`HERO-Escaninho.png` e as 3 imagens
  `geralt-*` / `vilkasss-*`) serão organizadas em `public/images/` na
  implementação.

## 10. Estratégia de responsividade

- Mobile-first, breakpoints para tablet e desktop.
- HTML semântico (`header`, `nav`, `main`, `section`, `article`, `footer`).
- Foco visível, navegação por teclado, `alt` em todas as imagens, contraste
  AA, hierarquia única de `h1`→`h2`→`h3`, links externos identificados
  (ícone/`target="_blank" rel="noopener"` + texto para leitor de tela).

## 11. Estratégia de SEO

- Por página: `title`, `meta description`, `canonical`, Open Graph
  (`og:title`, `og:description`, `og:image`), um único `H1`.
- URLs amigáveis conforme mapa da seção 3.
- `sitemap.xml` e `robots.txt` gerados no build (integração oficial do Astro).
- Conteúdo real e útil — nada de texto artificial só para palavras-chave.

## 12. Estratégia para links externos (projetos)

- Todo item de `Project` com `external: true` abre em nova aba
  (`target="_blank" rel="noopener noreferrer"`) e exibe indicação visual
  (ícone de "abrir em nova aba") + texto acessível (`aria-label` ou texto
  oculto para leitor de tela) informando que é um site externo.
- Itens com página interna de apresentação (`/projetos/<slug>/`) exibem lá o
  botão "Conhecer o projeto →" apontando para `url` do projeto.

## 13. Etapas de desenvolvimento (após sua aprovação)

1. Inicializar projeto Astro + Git + configuração de deploy Vercel.
2. Criar tokens de estilo (cor/tipografia) e layout base (`BaseLayout`,
   `Header`, `Footer`).
3. Implementar Home (Hero + 3 cards "Explore o Escaninho" + "Projetos em
   destaque") usando conteúdo real já existente.
4. Implementar sistema de dados de projetos + componente `ProjectCard`.
5. Implementar páginas de Acervo (História, Filosofia, Atividades adaptadas),
   Espaço Docente, Sobre (+ Professor Joas Alves), Contato.
6. Implementar SEO por página (head, OG, sitemap, robots).
7. Revisão de responsividade e acessibilidade.
8. Publicar no GitHub e configurar deploy na Vercel.

Nenhuma dessas etapas foi iniciada ainda — aguardando aprovação do plano.
