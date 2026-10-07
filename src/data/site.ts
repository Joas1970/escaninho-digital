// Dados globais do site: usados pelo layout base, cabeçalho, rodapé e SEO.

export const site = {
  name: "Escaninho Digital",
  url: "https://www.escaninhodigital.com.br",
  description:
    "Acervo digital de curadoria educacional com recursos, projetos e materiais de História, Filosofia e Humanidades para professores e estudantes.",
  locale: "pt_BR",
};

export type NavChild = {
  label: string;
  href: string;
  external?: boolean;
};

export type NavItem = {
  label: string;
  href: string;
  children?: NavChild[];
};

// Estrutura de navegação principal, usada no cabeçalho do site.
export const mainNav: NavItem[] = [
  { label: "Início", href: "/" },
  {
    label: "Acervo",
    href: "/acervo/",
    children: [
      { label: "História", href: "/acervo/historia/" },
      { label: "Filosofia", href: "/acervo/filosofia/" },
      { label: "Atividades adaptadas", href: "/acervo/atividades-adaptadas/" },
    ],
  },
  { label: "Espaço Docente", href: "/espaco-docente/" },
  {
    label: "Projetos",
    href: "/projetos/",
    children: [
      {
        label: "Montar para Aprender",
        href: "https://www.montarparaaprender.com.br",
        external: true,
      },
      {
        label: "Acervo Visual de Humanidades",
        href: "/projetos/acervo-visual-de-humanidades/",
      },
      { label: "Jornal Escolar", href: "/projetos/jornal-escolar/" },
    ],
  },
  {
    label: "Sobre",
    href: "/sobre/",
    children: [
      { label: "Sobre o Escaninho Digital", href: "/sobre/" },
      { label: "Professor Joas Alves", href: "/sobre/professor-joas-alves/" },
      { label: "Contato", href: "/contato/" },
    ],
  },
];
