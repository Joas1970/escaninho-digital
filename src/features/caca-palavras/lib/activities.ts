import type { Difficulty } from "../lib/wordsearch";

export type Activity = {
  id: string;
  title: string;
  prompt: string;
  wordsText: string;
  difficulty: Difficulty;
  lives: number;
  timer: boolean;
  seed: number;
  image?: string;
};

export type Library = {
  currentId: string;
  items: Activity[];
};

const STORAGE_KEY = "caca-palavras:v1";

export const SAMPLE_WORDS = `incluir
velocidade
excluir
regras
queimada
boliche
cooperar
competir
agilidade
jogo`;

export const SAMPLE: Activity = {
  id: "jogos-e-brincadeiras",
  title: "Jogos e brincadeiras",
  prompt: "Toque em uma palavra oculta",
  wordsText: SAMPLE_WORDS,
  difficulty: "medio",
  lives: 4,
  timer: true,
  seed: 7,
};

export function emptyActivity(): Activity {
  return {
    id: crypto.randomUUID(),
    title: "Nova atividade",
    prompt: "Toque em uma palavra oculta",
    wordsText: "",
    difficulty: "facil",
    lives: 0,
    timer: true,
    seed: 1,
  };
}

export function loadLibrary(): Library | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Library;
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    const items = parsed.items.filter(isActivity).slice(0, 30);
    if (items.length === 0) return null;
    const currentId = items.some((item) => item.id === parsed.currentId) ? parsed.currentId : items[0].id;
    return { currentId, items };
  } catch {
    return null;
  }
}

export function saveLibrary(library: Library): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    return true;
  } catch {
    return false;
  }
}

function isActivity(value: unknown): value is Activity {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Activity>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.prompt === "string" &&
    typeof item.wordsText === "string" &&
    (item.difficulty === "facil" || item.difficulty === "medio" || item.difficulty === "dificil") &&
    typeof item.lives === "number" &&
    typeof item.timer === "boolean" &&
    typeof item.seed === "number" &&
    (item.image === undefined || (typeof item.image === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(item.image) && item.image.length <= 100_000))
  );
}
