// Fonte única de dados dos projetos do ecossistema apresentados pelo Escaninho.
// Adicionar um novo projeto = adicionar um novo objeto aqui (+ imagem em
// public/images). Nenhum HTML precisa ser escrito manualmente.

export type Project = {
  /** Identificador opcional; não cria uma página automaticamente. */
  slug?: string;
  title: string;
  description: string;
  /** Caminho da imagem a partir de /public. */
  image?: string;
  imageAlt?: string;
  category: string;
  /** Tags opcionais exibidas como marcadores discretos no card. */
  tags?: string[];
  /** Endereço final do projeto (site original ou página interna). */
  url?: string;
  /** true = projeto independente, fora do domínio do Escaninho. */
  external?: boolean;
  /** true = aparece na seção "Projetos em destaque" da Home. */
  featured?: boolean;
  /** Texto do botão de ação do card. Padrão: "Conhecer o projeto". */
  buttonLabel?: string;
  /**
   * false = projeto ainda sem endereço confirmado. O card exibe um estado
   * "Em desenvolvimento" em vez de um link. Padrão: true.
   */
  available?: boolean;
};

export const projects: Project[] = [
  {
    slug: "montar-para-aprender",
    title: "Montar para Aprender",
    description:
      "Projeto pedagógico dedicado a recursos digitais e visuais, atividades adaptadas e possibilidades de aprendizagem inclusiva.",
    image: "/images/projects/montar-para-aprender.jpg",
    imageAlt:
      "Ilustração de estudantes em sala de aula acompanhando o professor diante de um quadro.",
    category: "Inclusão • Tecnologia Educacional",
    tags: ["inclusão", "recursos visuais", "tecnologia educacional"],
    url: "https://www.montarparaaprender.com.br",
    external: true,
    featured: true,
  },
  {
    slug: "acervo-visual-de-humanidades",
    title: "Acervo Visual de Humanidades",
    description:
      "Curadoria de imagens, mapas e materiais visuais para apoiar o ensino de História, Filosofia e Humanidades em sala de aula.",
    image: "/images/projects/acervo-visual-de-humanidades.jpg",
    imageAlt:
      "Ilustração de duas pessoas estudando com notebooks ao lado de pilhas de livros.",
    category: "Humanidades • Recursos Visuais",
    tags: ["história", "filosofia", "humanidades"],
    url: "https://acervo.professorjoas.com.br",
    external: true,
    featured: true,
  },
  {
    slug: "jornal-escolar",
    title: "Jornal Escolar",
    description:
      "Ferramenta para criação de capas de jornal escolar, com textos, imagens e créditos, destinada a propostas de produção textual e midiática.",
    image: "/images/projects/jornal-escolar.jpg",
    imageAlt: "Professora e estudantes reunidos em torno de uma mesa, colaborando em uma atividade.",
    category: "Produção Textual • Protagonismo Estudantil",
    tags: ["jornalismo escolar", "produção textual", "protagonismo"],
    url: "https://jornal.professorjoas.com.br",
    external: true,
    featured: true,
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((project) => project.featured);
}
