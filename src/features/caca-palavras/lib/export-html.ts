import { cellsOf, type Puzzle } from "./wordsearch.ts";

export type ExportInput = {
  title: string;
  prompt: string;
  puzzle: Puzzle;
  lives: number;
  timer: boolean;
  image?: string;
};

function jsonScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildStandaloneHtml(input: ExportInput): string {
  const data = {
    title: input.title.trim() || "Caça-palavras",
    prompt: input.prompt.trim() || "Toque em uma palavra oculta",
    rows: input.puzzle.rows,
    cols: input.puzzle.cols,
    letters: input.puzzle.letters,
    lives: input.lives,
    timer: input.timer,
    image: input.image && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(input.image) ? input.image : "",
    words: input.puzzle.placements.map((placement) => ({
      label: placement.label,
      normalized: placement.normalized,
      cells: cellsOf(placement).map((cell) => [cell.row, cell.col] as [number, number]),
    })),
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(data.title)} — Caça-palavras</title>
<style>
  :root {
    --paper: #e7ebdf;
    --sheet: #f4f6ef;
    --ink: #1b2330;
    --muted: #5c6570;
    --line: #c5ccb8;
    --cobalt: #3a49c4;
    --brass: #a89060;
    --heart: #b42318;
    --heart-soft: #f3d6d2;
    --sans: "Outfit", ui-sans-serif, system-ui, sans-serif;
    --serif: "Fraunces", ui-serif, Georgia, serif;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: var(--paper); color: var(--ink); }
  body { font-family: var(--sans); min-height: 100vh; -webkit-font-smoothing: antialiased; }
  button { font: inherit; color: inherit; cursor: pointer; }
  button:disabled { cursor: default; }
  [hidden] { display: none !important; }
  .wrap { max-width: 64rem; margin: 0 auto; padding: 1.25rem 1rem 2.5rem; }
  .brand { font-family: var(--serif); font-size: 1.25rem; margin: 0 0 0.75rem; }
  .hud { display: grid; grid-template-columns: auto 1fr auto; gap: 0.75rem; align-items: center; }
  .time, .score { font-variant-numeric: tabular-nums; font-weight: 600; }
  .prompt { margin: 0; text-align: center; text-wrap: balance; font-size: 1rem; }
  .hearts { display: inline-flex; gap: 0.15rem; margin-right: 0.45rem; vertical-align: -2px; }
  .heart { width: 1.05rem; height: 1.05rem; }
  .stage { display: flex; flex-direction: column; gap: 0.9rem; margin-top: 1rem; }
  .board-wrap { width: 100%; max-width: 28rem; position: relative; }
  .grid { display: grid; gap: 1px; background: var(--line); padding: 1px; border-radius: 0.4rem; overflow: hidden; touch-action: none; user-select: none; }
  .cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: var(--sheet); font-weight: 650; font-size: 0.82rem; line-height: 1; }
  .cell.sel { background: #d9def8; }
  .cell.found { background: var(--cobalt); color: var(--sheet); }
  .cell.bad { background: var(--heart-soft); color: var(--heart); }
  .cell.key:not(.found) { box-shadow: inset 0 0 0 2px var(--brass); }
  .bank { display: flex; flex-wrap: wrap; gap: 0.5rem; align-content: flex-start; list-style: none; margin: 0; padding: 0; }
  .chip { min-height: 2.75rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.4rem 0.9rem; border-radius: 0.85rem; background: var(--ink); color: var(--sheet); font-weight: 550; font-size: 0.95rem; }
  .chip.found { background: var(--cobalt); }
  .tools { display: flex; justify-content: space-between; margin-top: 0.7rem; }
  .icon { width: 2.75rem; height: 2.75rem; border-radius: 999px; border: 1px solid var(--line); background: transparent; display: inline-flex; align-items: center; justify-content: center; }
  .icon svg { width: 1.15rem; height: 1.15rem; }
  .lesson { font-family: var(--serif); font-size: 1.8rem; margin: 1.4rem 0 0.3rem; text-wrap: balance; }
  .meta { color: var(--muted); margin: 0; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.9rem; }
  .btn { min-height: 2.75rem; border-radius: 0.75rem; border: 1px solid var(--line); background: transparent; padding: 0.45rem 0.9rem; }
  .btn.on { background: #efe4cf; border-color: var(--brass); }
  .banner { margin-top: 0.8rem; display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center; justify-content: space-between; border-radius: 0.75rem; padding: 0.75rem 0.9rem; }
  .banner.win { background: var(--cobalt); color: var(--sheet); }
  .banner.lose { background: var(--ink); color: var(--sheet); }
  .banner .btn { background: var(--sheet); color: var(--ink); border-color: transparent; }
  .overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--paper) 82%, transparent); border-radius: 0.4rem; }
  .note { color: var(--muted); font-size: 0.85rem; margin-top: 1rem; }
  .print-sheet { display: none; }
  .activity-image { display: block; width: 100%; max-height: 10rem; object-fit: contain; margin: 1rem auto; }
  @media (min-width: 64rem) {
    .stage { flex-direction: row; align-items: flex-start; }
    .bank { flex: 1; }
    .cell { font-size: 0.95rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cell, .chip { transition: none; }
  }
  @media print {
    @page { size: A4 portrait; margin: 12mm; }
    .no-print { display: none !important; }
    .print-sheet { display: block; }
    body { background: white; color: black; font-family: Arial, sans-serif; font-size: 10pt; }
    .wrap { padding: 0; max-width: none; }
    .print-sheet h1 { font-size: 18pt; margin: 0 0 4mm; overflow-wrap: anywhere; }
    .print-grid { display: grid; gap: 1px; background: #111; padding: 1px; width: 100mm; max-width: 100%; margin: 4mm auto; break-inside: avoid; }
    .print-cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: white; font-weight: 700; font-size: 0.75rem; }
    .print-cell.on { background: #ddd; color: black; text-decoration: underline; print-color-adjust: exact; }
    .blank { margin: 0.2rem 0 0.8rem; }
    .print-image { display: block; width: 100%; height: 24mm; object-fit: contain; margin: 3mm auto; }
    .print-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.5mm 3mm; list-style: none; padding: 0; font-size: 9pt; overflow-wrap: anywhere; }
    .print-key { display: none; }
    .include-key .print-key { display: block; break-before: page; }
    .print-sheet.compact h1 { font-size: 16pt; }
    .print-sheet.compact .print-grid { width: 84mm; }
    .print-sheet.compact .print-image { height: 20mm; }
    .print-sheet.compact .print-list { grid-template-columns: repeat(4, minmax(0, 1fr)); font-size: 8pt; gap: 1mm 3mm; }
  }
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,640&family=Outfit:wght@450;550;650&display=swap">
</head>
<body>
<main class="wrap">
  <p class="brand no-print">Caça-palavras</p>
  ${data.image ? `<img class="activity-image no-print" src="${escapeHtml(data.image)}" alt="Imagem de apoio da atividade">` : ""}
  <div class="hud no-print">
    <div class="time" id="time"></div>
    <p class="prompt" id="prompt"></p>
    <div class="score"><span class="hearts" id="hearts"></span><span id="score"></span></div>
  </div>
  <div class="banner win no-print" id="win" hidden></div>
  <div class="banner lose no-print" id="lose" hidden></div>
  <div class="stage no-print">
    <div class="board-wrap">
      <div class="grid" id="grid" role="grid" aria-label="Grade de letras"></div>
      <div class="overlay" id="overlay" hidden>
        <button class="btn" id="resume" type="button">Continuar</button>
      </div>
      <div class="tools">
        <button class="icon" id="pause" type="button" aria-label="Pausar"></button>
        <span>
          <button class="icon" id="sound" type="button" aria-label="Som"></button>
          <button class="icon" id="full" type="button" aria-label="Tela cheia"></button>
        </span>
      </div>
    </div>
    <ul class="bank" id="bank"></ul>
  </div>
  <h1 class="lesson no-print" id="title"></h1>
  <p class="meta no-print" id="meta"></p>
  <div class="actions no-print">
    <button class="btn" id="again" type="button">Jogar de novo</button>
    <button class="btn" id="key" type="button">Gabarito</button>
    <button class="btn" id="print" type="button">Imprimir</button>
  </div>
  <p class="note no-print">Arquivo único para site estático. Abra no navegador ou publique como está. Acentos não entram na grade: ágora aparece como AGORA.</p>
  <section class="print-sheet" id="print-sheet"></section>
</main>
<script id="puzzle-data" type="application/json">${jsonScript(data)}</script>
<script>
const data = JSON.parse(document.getElementById("puzzle-data").textContent);
const found = new Set();
const foundCells = new Set();
let livesLeft = data.lives;
let elapsed = 0;
let paused = false;
let lost = false;
let showKey = false;
let soundOn = true;
let lastTick = 0;
let timerHandle = 0;
let anchor = null;
let selection = [];
let badCells = new Set();
const answer = new Set();
data.words.forEach((word) => word.cells.forEach(([r, c]) => answer.add(r + "-" + c)));

const grid = document.getElementById("grid");
const bank = document.getElementById("bank");
grid.style.gridTemplateColumns = "repeat(" + data.cols + ", minmax(0, 1fr))";
document.getElementById("title").textContent = data.title;
document.getElementById("meta").textContent = data.words.length + " palavras" + (data.lives ? " · " + data.lives + " vidas" : "");

data.letters.forEach((row, r) => {
  row.forEach((letter, c) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = letter;
    cell.dataset.k = r + "-" + c;
    cell.setAttribute("role", "gridcell");
    grid.appendChild(cell);
  });
});
data.words.forEach((word) => {
  const chip = document.createElement("li");
  chip.className = "chip";
  chip.dataset.word = word.normalized;
  chip.innerHTML = "<span></span>";
  chip.querySelector("span").textContent = word.label;
  bank.appendChild(chip);
});

const icon = {
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  vol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M16 9a5 5 0 0 1 0 6"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5zM22 9l-6 6M16 9l6 6"/></svg>',
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
  heart: '<svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20z"/></svg>'
};
document.getElementById("pause").innerHTML = icon.pause;
document.getElementById("sound").innerHTML = icon.vol;
document.getElementById("full").innerHTML = icon.full;

function paint() {
  const sel = new Set(selection);
  document.querySelectorAll(".cell").forEach((cell) => {
    const key = cell.dataset.k;
    cell.className = "cell" + (foundCells.has(key) ? " found" : sel.has(key) ? " sel" : badCells.has(key) ? " bad" : showKey && answer.has(key) ? " key" : "");
  });
  document.querySelectorAll(".chip").forEach((chip) => {
    const on = found.has(chip.dataset.word);
    chip.classList.toggle("found", on);
    const mark = chip.querySelector("i");
    if (on && !mark) {
      const tick = document.createElement("i");
      tick.textContent = "✓";
      tick.style.fontStyle = "normal";
      chip.appendChild(tick);
    }
    if (!on && mark) mark.remove();
  });
  const prompt = document.getElementById("prompt");
  const done = data.words.length > 0 && found.size === data.words.length;
  prompt.textContent = done ? "Todas as palavras encontradas" : lost ? "As vidas acabaram" : data.prompt;
  document.getElementById("score").textContent = "✓ " + found.size + "/" + data.words.length;
  document.getElementById("time").textContent = data.timer ? format(elapsed) : "";
  const hearts = document.getElementById("hearts");
  hearts.innerHTML = "";
  if (data.lives > 0) {
    for (let i = 0; i < data.lives; i++) {
      const wrap = document.createElement("span");
      wrap.innerHTML = icon.heart;
      const path = wrap.querySelector("path");
      path.setAttribute("fill", i < livesLeft ? "var(--heart)" : "none");
      path.setAttribute("stroke", i < livesLeft ? "var(--heart)" : "var(--line)");
      path.setAttribute("stroke-width", "1.6");
      hearts.appendChild(wrap.firstChild);
    }
  }
  document.getElementById("win").hidden = !done;
  document.getElementById("lose").hidden = !lost;
  document.getElementById("overlay").hidden = !paused;
  document.getElementById("key").classList.toggle("on", showKey);
  document.getElementById("pause").disabled = done || lost;
}

function format(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0");
}

function tick(now) {
  if (!lastTick) lastTick = now;
  if (!paused && !lost && found.size !== data.words.length && data.timer) elapsed += now - lastTick;
  lastTick = now;
  if (data.timer) document.getElementById("time").textContent = format(elapsed);
  timerHandle = requestAnimationFrame(tick);
}
if (data.timer) timerHandle = requestAnimationFrame(tick);

function cellFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  const cell = el && el.closest ? el.closest(".cell") : null;
  if (!cell || !grid.contains(cell)) return null;
  const [r, c] = cell.dataset.k.split("-").map(Number);
  return { row: r, col: c };
}
function line(from, to) {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  if (!dr && !dc) return [from.row + "-" + from.col];
  const snapped = Math.round(Math.atan2(dr, dc) / (Math.PI / 4)) * (Math.PI / 4);
  const sdr = Math.round(Math.sin(snapped));
  const sdc = Math.round(Math.cos(snapped));
  let dist = Math.max(Math.abs(dr), Math.abs(dc));
  while (dist > 0) {
    const row = from.row + sdr * dist;
    const col = from.col + sdc * dist;
    if (row >= 0 && col >= 0 && row < data.rows && col < data.cols) break;
    dist -= 1;
  }
  const keys = [];
  for (let i = 0; i <= dist; i++) keys.push((from.row + sdr * i) + "-" + (from.col + sdc * i));
  return keys;
}
let audioCtx = null;
function tone(freq, dur, gap) {
  if (!soundOn) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  const start = audioCtx.currentTime + (gap || 0);
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.05, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(start); osc.stop(start + dur);
}
function locked() { return paused || lost || (data.words.length > 0 && found.size === data.words.length); }
grid.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || locked()) return;
  const cell = cellFromPoint(event.clientX, event.clientY);
  if (!cell) return;
  event.preventDefault();
  grid.setPointerCapture(event.pointerId);
  anchor = cell;
  selection = line(anchor, cell);
  badCells = new Set();
  paint();
});
grid.addEventListener("pointermove", (event) => {
  if (!anchor) return;
  const cell = cellFromPoint(event.clientX, event.clientY);
  if (!cell) return;
  selection = line(anchor, cell);
  paint();
});
function release() {
  if (!anchor) return;
  const keys = selection.slice();
  anchor = null;
  selection = [];
  if (keys.length >= 2) {
    const forward = keys.map((key) => {
      const [r, c] = key.split("-").map(Number);
      return data.letters[r][c];
    }).join("");
    const reverse = forward.split("").reverse().join("");
    const hit = data.words.find((word) => !found.has(word.normalized) && (word.normalized === forward || word.normalized === reverse));
    if (hit) {
      found.add(hit.normalized);
      keys.forEach((key) => foundCells.add(key));
      if (found.size === data.words.length) { tone(523, 0.12, 0); tone(659, 0.12, 0.1); tone(784, 0.18, 0.2); }
      else tone(620, 0.12, 0);
    } else if (keys.length >= 3 && data.lives > 0) {
      badCells = new Set(keys);
      livesLeft -= 1;
      tone(180, 0.16, 0);
      if (livesLeft <= 0) lost = true;
      setTimeout(() => { badCells = new Set(); paint(); }, 420);
    }
  }
  paint();
}
grid.addEventListener("pointerup", release);
grid.addEventListener("pointercancel", release);
document.getElementById("pause").addEventListener("click", () => { if (!locked()) { paused = true; paint(); } });
document.getElementById("resume").addEventListener("click", () => { paused = false; paint(); });
document.getElementById("sound").addEventListener("click", () => {
  soundOn = !soundOn;
  document.getElementById("sound").innerHTML = soundOn ? icon.vol : icon.mute;
  document.getElementById("sound").setAttribute("aria-label", soundOn ? "Desligar som" : "Ligar som");
});
document.getElementById("full").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.querySelector(".wrap").requestFullscreen();
  } catch (error) { /* tela cheia pode falhar dentro de um quadro */ }
});
document.getElementById("key").addEventListener("click", () => { showKey = !showKey; document.body.classList.toggle("include-key", showKey); paint(); });
document.getElementById("print").addEventListener("click", () => window.print());
function reset() {
  found.clear();
  foundCells.clear();
  livesLeft = data.lives;
  elapsed = 0;
  lost = false;
  paused = false;
  selection = [];
  badCells = new Set();
  paint();
}
document.getElementById("again").addEventListener("click", reset);
document.getElementById("win").innerHTML = "<p>Grade completa.</p><button class=\\"btn\\" type=\\"button\\" id=\\"win-again\\">Jogar de novo</button>";
document.getElementById("lose").innerHTML = "<p>As vidas acabaram.</p><button class=\\"btn\\" type=\\"button\\" id=\\"lose-again\\">Tentar de novo</button>";
document.getElementById("win-again").addEventListener("click", reset);
document.getElementById("lose-again").addEventListener("click", reset);

const printSheet = document.getElementById("print-sheet");
if (data.words.length > 16) printSheet.classList.add("compact");
const clean = document.createElement("h1");
clean.textContent = data.title;
printSheet.appendChild(clean);
const nameLine = document.createElement("p");
nameLine.className = "blank";
nameLine.textContent = "Nome: __________________________    Turma: __________    Data: ____/____/______";
printSheet.appendChild(nameLine);
const help = document.createElement("p");
help.textContent = data.prompt;
printSheet.appendChild(help);
if (data.image) {
  const picture = document.createElement("img");
  picture.src = data.image;
  picture.alt = "Imagem de apoio da atividade";
  picture.className = "print-image";
  printSheet.appendChild(picture);
}
printSheet.appendChild(makePrintGrid(false));
const list = document.createElement("ul");
list.className = "print-list";
data.words.forEach((word) => { const item = document.createElement("li"); item.textContent = word.label; list.appendChild(item); });
printSheet.appendChild(list);
const notes = document.createElement("p");
notes.textContent = "Observações: ________________________________________________________";
printSheet.appendChild(notes);
const keySheet = document.createElement("section");
keySheet.className = "print-key";
const keyTitle = document.createElement("h2");
keyTitle.textContent = "Gabarito";
keySheet.appendChild(keyTitle);
keySheet.appendChild(makePrintGrid(true));
printSheet.appendChild(keySheet);
function makePrintGrid(marked) {
  const wrap = document.createElement("div");
  wrap.className = "print-grid";
  wrap.style.gridTemplateColumns = "repeat(" + data.cols + ", minmax(0, 1fr))";
  data.letters.forEach((row, r) => row.forEach((letter, c) => {
    const cell = document.createElement("div");
    cell.className = "print-cell" + (marked && answer.has(r + "-" + c) ? " on" : "");
    cell.textContent = letter;
    wrap.appendChild(cell);
  }));
  return wrap;
}
paint();
</script>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&" + "amp;";
      case "<":
        return "&" + "lt;";
      case ">":
        return "&" + "gt;";
      case '"':
        return "&" + "quot;";
      default:
        return "&" + "#39;";
    }
  });
}
