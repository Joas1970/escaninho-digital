export type ResourceCollection = "atividades-e-jogos" | "materiais-de-apoio";

export type Resource = {
  kind?: "resource" | "source";
  pedagogicalStatus?: "experiencia-aplicada" | "proposta-pedagogica" | "recurso-de-referencia";
  /** Marque apenas quando houver adaptações verificadas no material. */
  adapted?: boolean;
  buttonLabel?: string;
  secondaryAction?: { label: string; url: string; external?: boolean };
  title: string;
  description: string;
  collections: ResourceCollection[];
  /** Identificador editorial; não cria uma página. */
  slug?: string;
  area?: string;
  type?: string;
  educationLevel?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  external?: boolean;
  featured?: boolean;
  tags?: string[];
  /** Nome da fonte ou do projeto responsável pelo recurso. */
  source?: string;
};

// Cadastre aqui apenas materiais reais. A ordem do array é a ordem editorial.
// Um recurso pode pertencer a várias coleções sem duplicar seu cadastro.
export const resources: Resource[] = [
  {
    title: "Palavras cruzadas — Escaninho Digital",
    collections: ["atividades-e-jogos"],
    type: "Palavras cruzadas",
    description: "Professores podem criar e compartilhar cruzadinhas por link, WhatsApp ou QR code. Alunos resolvem os temas no navegador.",
    buttonLabel: "Resolver cruzadinha",
    url: "/atividades/cruzadinha/",
    secondaryAction: {
      label: "Criar e compartilhar atividade",
      url: "https://cruzadinha-escaninho.vercel.app/?modo=professor",
      external: true,
    },
    image: "/images/resources/cruzadinha.webp",
    imageAlt: "Cruzadinha em papel com as palavras História, Conhecimento, Filosofia e Aprendizagem e um lápis.",
    external: false,
    featured: true,
    tags: ["História", "Filosofia", "Atividade interativa"],
    source: "Escaninho Digital",
  },
  {
    title: "Caça-palavras — Escaninho Digital",
    collections: ["atividades-e-jogos"],
    type: "Caça-palavras",
    description: "Personalize palavras e instruções, jogue no navegador e prepare atividades para compartilhar ou imprimir.",
    buttonLabel: "Criar caça-palavras",
    url: "/atividades/caca-palavras/",
    image: "/images/resources/caca-palavras.webp",
    imageAlt: "Peças azuis com letras amarelas espalhadas sobre uma mesa de madeira.",
    external: false,
    featured: true,
    tags: ["Atividade interativa", "Para imprimir"],
    source: "Escaninho Digital",
  },
  {
    title: "Humanidades em Foco — Acervo Visual Educacional",
    kind: "source",
    collections: ["materiais-de-apoio"],
    tags: ["História", "Filosofia", "Humanidades"],
    type: "Acervo visual",
    image: "/images/projects/d6LeZ.jpg",
    imageAlt: "Composição em tons de cinza com templos clássicos, um busto, mapas e páginas de textos conectados por linhas.",
    description: "Acervo educacional para pesquisa e exploração de obras visuais de História, Filosofia e Humanidades.",
    url: "https://acervo.professorjoas.com.br",
    external: true,
    featured: true,
  },
  {
    title: "Imagem Interativa",
    image: "/images/resources/imagem-interativa.webp",
    imageAlt: "Dados com letras formando a palavra Explore.",
    collections: ["atividades-e-jogos"],
    type: "Ferramenta interativa",
    description: "Ferramenta para criação de atividades com imagens, hotspots, exploração visual e avaliação.",
    external: true,
    featured: false,
  },
  {
    title: "Quebra-cabeça Montar para Aprender",
    image: "/images/resources/quebra-cabeca.webp",
    imageAlt: "Peças quadradas de madeira dispostas sobre um fundo azul.",
    collections: ["atividades-e-jogos"],
    type: "Ferramenta interativa",
    description: "Modelo reutilizável para criação de quebra-cabeças educacionais a partir de imagens, com diferentes níveis de dificuldade e recursos de acessibilidade.",
    external: true,
    featured: false,
    source: "Montar para Aprender",
  },
];

export function hasResourceDestination(resource: Resource): boolean {
  const url = resource.url?.trim();
  return Boolean(url && (url.startsWith("/") && !url.startsWith("//") || /^https?:\/\//i.test(url)));
}

export function getResourcesByCollection(collection: ResourceCollection): Resource[] {
  return resources.filter((resource) => (resource.kind ?? "resource") === "resource" && resource.collections.includes(collection));
}

export function getFeaturedResources(): Resource[] {
  return resources.filter((resource) => (resource.kind ?? "resource") === "resource" && resource.featured && hasResourceDestination(resource));
}

export function getSources(): Resource[] {
  return resources.filter((resource) => resource.kind === "source");
}

export function getSourcesByCollection(collection: ResourceCollection): Resource[] {
  return getSources().filter((resource) => resource.collections.includes(collection));
}
