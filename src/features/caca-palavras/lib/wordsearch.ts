export type Difficulty = "facil" | "medio" | "dificil";

export type Cell = { row: number; col: number };

export type Placement = {
  id: string;
  label: string;
  normalized: string;
  row: number;
  col: number;
  dr: number;
  dc: number;
};

export type WordEntry = { label: string; normalized: string };

export type Puzzle = {
  rows: number;
  cols: number;
  letters: string[][];
  placements: Placement[];
  missed: string[];
  seed: number;
};

const DIRS: Record<Difficulty, Array<[number, number]>> = {
  facil: [
    [0, 1],
    [1, 0],
  ],
  medio: [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ],
  dificil: [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ],
};

const BAG =
  "AAAAAAAEEEEEEEEEEEEIIIIIIOOOOOOOUUUUSSSSRRRRNNNNNNDDDDMMMMMTTTCCCLLLPPPVVVGGGBHFJZXQKWY";

export function normalize(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function parseWordList(text: string): WordEntry[] {
  const seen = new Set<string>();
  const out: WordEntry[] = [];
  for (const line of text.split(/\n+/)) {
    const label = line.trim().replace(/\s+/g, " ");
    if (!label) continue;
    const normalized = normalize(label);
    if (normalized.length < 2 || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push({ label, normalized });
  }
  return out.slice(0, 24);
}

export function difficultyLabel(difficulty: Difficulty): string {
  if (difficulty === "facil") return "fácil";
  if (difficulty === "medio") return "médio";
  return "difícil";
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cellsOf(placement: Placement): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < placement.normalized.length; i++) {
    cells.push({
      row: placement.row + placement.dr * i,
      col: placement.col + placement.dc * i,
    });
  }
  return cells;
}

export function clampLine(anchor: Cell, target: Cell, rows: number, cols: number): Cell[] {
  const dr = target.row - anchor.row;
  const dc = target.col - anchor.col;
  if (dr === 0 && dc === 0) return [anchor];

  const snapped = Math.round(Math.atan2(dr, dc) / (Math.PI / 4)) * (Math.PI / 4);
  const sdr = Math.round(Math.sin(snapped));
  const sdc = Math.round(Math.cos(snapped));
  if (sdr === 0 && sdc === 0) return [anchor];

  let dist = Math.max(Math.abs(dr), Math.abs(dc));
  while (dist > 0) {
    const row = anchor.row + sdr * dist;
    const col = anchor.col + sdc * dist;
    if (row >= 0 && col >= 0 && row < rows && col < cols) break;
    dist -= 1;
  }

  const cells: Cell[] = [];
  for (let i = 0; i <= dist; i++) {
    cells.push({ row: anchor.row + sdr * i, col: anchor.col + sdc * i });
  }
  return cells;
}

export function readCells(letters: string[][], cells: Cell[]): string {
  return cells.map((cell) => letters[cell.row]?.[cell.col] ?? "").join("");
}

type Attempt = {
  letters: string[][];
  placements: Placement[];
  missed: string[];
};

function placeAll(
  words: WordEntry[],
  size: number,
  dirs: Array<[number, number]>,
  rand: () => number,
): Attempt {
  const letters = Array.from({ length: size }, () => Array<string>(size).fill(""));
  const placements: Placement[] = [];
  const missed: string[] = [];

  const ordered = [...words].sort((a, b) => b.normalized.length - a.normalized.length);
  for (const word of ordered) {
    const options: Array<{ row: number; col: number; dr: number; dc: number }> = [];
    for (const [dr, dc] of dirs) {
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const endRow = row + dr * (word.normalized.length - 1);
          const endCol = col + dc * (word.normalized.length - 1);
          if (endRow < 0 || endCol < 0 || endRow >= size || endCol >= size) continue;
          let ok = true;
          for (let i = 0; i < word.normalized.length; i++) {
            const existing = letters[row + dr * i][col + dc * i];
            if (existing && existing !== word.normalized[i]) {
              ok = false;
              break;
            }
          }
          if (ok) options.push({ row, col, dr, dc });
        }
      }
    }
    if (options.length === 0) {
      missed.push(word.label);
      continue;
    }
    const spot = options[Math.floor(rand() * options.length)];
    for (let i = 0; i < word.normalized.length; i++) {
      letters[spot.row + spot.dr * i][spot.col + spot.dc * i] = word.normalized[i];
    }
    placements.push({
      id: `${word.normalized}-${spot.row}-${spot.col}-${spot.dr}-${spot.dc}`,
      label: word.label,
      normalized: word.normalized,
      row: spot.row,
      col: spot.col,
      dr: spot.dr,
      dc: spot.dc,
    });
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!letters[row][col]) letters[row][col] = BAG[Math.floor(rand() * BAG.length)];
    }
  }

  return { letters, placements, missed };
}

export function generatePuzzle(input: {
  words: WordEntry[];
  difficulty: Difficulty;
  seed: number;
}): Puzzle {
  const tooLong = input.words.filter((word) => word.normalized.length > 16);
  const eligible = input.words.filter((word) => word.normalized.length <= 16);
  const longest = eligible.reduce((max, word) => Math.max(max, word.normalized.length), 8);
  const load = eligible.reduce((sum, word) => sum + word.normalized.length, 0);
  const size = Math.min(16, Math.max(longest, Math.ceil(Math.sqrt(Math.max(load, 1) * 2.15)), 8));
  const dirs = DIRS[input.difficulty];

  let best: Attempt | null = null;
  if (eligible.length === 0) {
    best = placeAll([], Math.max(8, size), dirs, mulberry32(input.seed));
  } else {
    for (let attempt = 0; attempt < 6; attempt++) {
      const nextSize = Math.min(16, size + attempt);
      const result = placeAll(eligible, nextSize, dirs, mulberry32((input.seed + attempt * 997) >>> 0));
      if (!best || result.missed.length < best.missed.length) best = result;
      if (result.missed.length === 0) break;
    }
  }

  const placed = best ?? { letters: [], placements: [], missed: [] };
  return {
    rows: placed.letters.length,
    cols: placed.letters[0]?.length ?? 0,
    letters: placed.letters,
    placements: placed.placements,
    missed: [...tooLong.map((word) => word.label), ...placed.missed],
    seed: input.seed,
  };
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function fileSlug(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `caca-palavras-${base || "atividade"}.html`;
}
