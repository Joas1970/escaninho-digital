// Fonte única de dados dos projetos do ecossistema apresentados pelo Escaninho.
// Adicionar um novo projeto = adicionar um novo objeto aqui (+ imagem em
// public/images). Nenhum HTML precisa ser escrito manualmente.

export type Project = {
  /** Identificador usado na URL (/projetos/<slug>/). */
  slug: string;
  title: string;
  description: string;
  /** Caminho da imagem a partir de /public. */
  image: string;
  imageAlt: string;
  category: string;
  tags: string[];
  /** Endereço final do projeto (site original). */
  url: string;
  /** true = projeto independente, fora do domínio do Escaninho. */
  external: boolean;
  /** true = aparece na seção "Projetos em destaque" da Home. */
  featured: boolean;
};

export const projects: Project[] = [
  {
    slug: "montar-para-aprender",
    title: "Montar para Aprender",
    description:
      "Projeto pedagógico dedicado a recursos digitais e visuais, atividades adaptadas e possibilidades de aprendizagem inclusiva.",
    image: "/images/projeto-montar-para-aprender.jpg",
    imageAlt:
      "Sala de aula com estudantes utilizando tablets durante uma atividade guiada pelo professor.",
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
    image: "/images/projeto-acervo-visual-humanidades.jpg",
    imageAlt:
      "Ilustração de duas pessoas estudando com notebooks ao lado de pilhas de livros.",
    category: "Humanidades • Recursos Visuais",
    tags: ["história", "filosofia", "humanidades"],
    url: "/projetos/acervo-visual-de-humanidades/",
    external: false,
    featured: true,
  },
  {
    slug: "jornal-escolar",
    title: "Jornal Escolar",
    description:
      "Iniciativa de produção textual e midiática conduzida por estudantes, com apoio docente, para registrar a vida escolar.",
    image: "/images/projeto-jornal-escolar.jpg",
    imageAlt: "Professora e estudantes reunidos em torno de uma mesa, colaborando em uma atividade.",
    category: "Produção Textual • Protagonismo Estudantil",
    tags: ["jornalismo escolar", "produção textual", "protagonismo"],
    url: "/projetos/jornal-escolar/",
    external: false,
    featured: true,
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((project) => project.featured);
}
