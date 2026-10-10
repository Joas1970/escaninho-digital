import type { Activity } from "./activities";
import { parseWordList } from "./wordsearch.ts";

const MAX_BYTES = 110_000;
const MAX_TOKEN = 150_000;

function validate(value: unknown): Omit<Activity, "id"> {
  if (!value || typeof value !== "object") throw new Error("Link de atividade inválido.");
  const a = value as Record<string, unknown>;
  if (
    typeof a.title !== "string" || a.title.length > 80 ||
    typeof a.prompt !== "string" || a.prompt.length > 180 ||
    typeof a.wordsText !== "string" || a.wordsText.length > 2000 ||
    typeof a.difficulty !== "string" || !["facil", "medio", "dificil"].includes(a.difficulty) ||
    ![0, 3, 4, 5].includes(Number(a.lives)) || typeof a.lives !== "number" ||
    typeof a.timer !== "boolean" || typeof a.seed !== "number" ||
    !Number.isInteger(a.seed) || a.seed < 0 || a.seed > 0xffffffff ||
    (a.image !== undefined && (typeof a.image !== "string" || a.image.length > 100_000 ||
      !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(a.image)))
  ) throw new Error("Este link contém uma atividade inválida ou grande demais.");
  const words = parseWordList(a.wordsText);
  if (!words.length || words.some((word) => word.label.length > 32)) throw new Error("Use termos de até 32 caracteres, incluindo espaços.");
  return {
    title: a.title, prompt: a.prompt, wordsText: a.wordsText,
    difficulty: a.difficulty as Activity["difficulty"], lives: a.lives,
    timer: a.timer, seed: a.seed,
    ...(a.image ? { image: a.image as string } : {}),
  };
}

export async function encodeActivity(activity: Activity): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(validate(activity)));
  if (data.length > MAX_BYTES) throw new Error("A atividade está grande demais para compartilhar.");
  let bytes: Uint8Array = data;
  let version = "0";
  if (typeof CompressionStream !== "undefined") {
    bytes = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new CompressionStream("deflate"))).arrayBuffer());
    version = "1";
  }
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return version + "." + btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function decodeActivity(token: string): Promise<Activity> {
  if (token.length > MAX_TOKEN || !/^[01]\.[A-Za-z0-9_-]+$/.test(token)) throw new Error("Link de atividade inválido.");
  const binary = atob(token.slice(2).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  let stream = new Blob([bytes]).stream();
  if (token.startsWith("1.")) {
    if (typeof DecompressionStream === "undefined") throw new Error("Atualize o navegador para abrir esta atividade.");
    stream = stream.pipeThrough(new DecompressionStream("deflate"));
  }
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BYTES) throw new Error("Atividade grande demais.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
  const activity = validate(JSON.parse(new TextDecoder().decode(all)));
  return { ...activity, id: crypto.randomUUID() };
}

export async function activityLink(activity: Activity, pageUrl: string, includeImage = true): Promise<string> {
  const url = new URL(pageUrl);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Publique a atividade no site para compartilhar.");
  url.search = "";
  url.hash = "atividade=" + await encodeActivity(includeImage ? activity : { ...activity, image: undefined });
  return url.href;
}

export async function readActivityLink(pageUrl: string): Promise<Activity | null> {
  const hash = new URL(pageUrl).hash;
  if (!hash.startsWith("#atividade=")) return null;
  return decodeActivity(hash.slice("#atividade=".length));
}
