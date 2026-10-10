import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  Check,
  Download,
  Eye,
  Heart,
  Maximize2,
  Minimize2,
  Pause,
  Pencil,
  Play,
  Printer,
  RefreshCw,
  Share2,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  SAMPLE,
  emptyActivity,
  loadLibrary,
  saveLibrary,
  type Activity,
  type Library,
} from "../lib/activities";
import { buildStandaloneHtml } from "../lib/export-html";
import { readActivityLink } from "../lib/share-activity";
import { ActivityImageEditor, ActivityPrintSheets, PrintActivityDialog, ShareActivityDialog, type PrintOptions } from "./classroom-tools";
import {
  cellsOf,
  clampLine,
  difficultyLabel,
  fileSlug,
  formatTime,
  generatePuzzle,
  parseWordList,
  readCells,
  type Cell,
  type Difficulty,
  type Placement,
} from "../lib/wordsearch";

const LIVES = [0, 3, 4, 5] as const;
const DIFFICULTIES: Difficulty[] = ["facil", "medio", "dificil"];

export function WordSearchApp() {
  const [ready, setReady] = useState(false);
  const [library, setLibrary] = useState<Library>({ currentId: SAMPLE.id, items: [SAMPLE] });
  const [activity, setActivity] = useState<Activity>(SAMPLE);
  const [found, setFound] = useState<string[]>([]);
  const [paths, setPaths] = useState<Record<string, string[]>>({});
  const [selection, setSelection] = useState<string[]>([]);
  const [badCells, setBadCells] = useState<string[]>([]);
  const [shake, setShake] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lost, setLost] = useState(false);
  const [livesLeft, setLivesLeft] = useState(SAMPLE.lives);
  const [elapsed, setElapsed] = useState(0);
  const [showKey, setShowKey] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [full, setFull] = useState(false);
  const [justFound, setJustFound] = useState("");
  const [draft, setDraft] = useState<Activity | null>(null);
  const [formError, setFormError] = useState("");
  const [exportPack, setExportPack] = useState<{ html: string; name: string } | null>(null);
  const [exportNote, setExportNote] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [sharedView, setSharedView] = useState(false);
  const [notice, setNotice] = useState("");
  const [printOptions, setPrintOptions] = useState<PrintOptions>({ name: "", group: "", mode: "worksheet", answerKey: false });

  const boardRef = useRef<HTMLElement>(null);
  const dragRef = useRef<Cell | null>(null);
  const selectionRef = useRef<string[]>([]);
  const foundRef = useRef<string[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLTextAreaElement>(null);
  const pausedBeforeEdit = useRef(false);
  const closeEditorRef = useRef(closeEditor);
  closeEditorRef.current = closeEditor;
  const editorOpen = draft !== null;

  const words = useMemo(() => parseWordList(activity.wordsText), [activity.wordsText]);
  const puzzle = useMemo(
    () => generatePuzzle({ words, difficulty: activity.difficulty, seed: activity.seed }),
    [words, activity.difficulty, activity.seed],
  );

  foundRef.current = found;
  const bank = useMemo<Placement[]>(() => {
    return words.flatMap((word) => {
      const placement = puzzle.placements.find((item) => item.normalized === word.normalized);
      return placement ? [placement] : [];
    });
  }, [words, puzzle.placements]);
  const foundSet = useMemo(() => new Set(found), [found]);
  const won = puzzle.placements.length > 0 && puzzle.placements.every((item) => foundSet.has(item.normalized));
  const locked = !ready || paused || lost || won || draft !== null || shareOpen || printOpen;

  const foundCellSet = useMemo(() => {
    const keys = new Set<string>();
    for (const list of Object.values(paths)) for (const key of list) keys.add(key);
    return keys;
  }, [paths]);

  const answerCellSet = useMemo(() => {
    const keys = new Set<string>();
    for (const placement of puzzle.placements) {
      for (const cell of cellsOf(placement)) keys.add(cellKey(cell));
    }
    return keys;
  }, [puzzle]);

  useEffect(() => {
    const stored = loadLibrary();
    if (stored) setLibrary(stored);
    let cancelled = false;
    async function openInitialActivity() {
      try {
        const shared = await readActivityLink(window.location.href);
        if (cancelled) return;
        const current = shared ?? stored?.items.find((item) => item.id === stored.currentId) ?? stored?.items[0] ?? SAMPLE;
        setActivity(current);
        resetPlay(current);
        setSharedView(Boolean(shared));
      } catch {
        if (!cancelled) {
          setNotice("Não foi possível abrir a atividade compartilhada. Confira se o link foi copiado inteiro. Seu modelo local continua disponível.");
          const current = stored?.items.find((item) => item.id === stored.currentId) ?? stored?.items[0] ?? SAMPLE;
          setActivity(current);
          resetPlay(current);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void openInitialActivity();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !activity.timer || paused || won || lost || draft || shareOpen || printOpen) return;
    let frame = 0;
    let last = performance.now();
    let carry = 0;
    const loop = (now: number) => {
      const delta = Math.min(250, now - last);
      last = now;
      carry += delta;
      if (carry >= 200) {
        const step = carry;
        carry = 0;
        setElapsed((value) => value + step);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [ready, activity.timer, activity.seed, paused, won, lost, draft, shareOpen, printOpen]);

  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!editorOpen) return;
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    titleRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeEditorRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [editorOpen]);

  useEffect(() => {
    if (!badCells.length) return;
    const timer = window.setTimeout(() => setBadCells([]), 420);
    return () => window.clearTimeout(timer);
  }, [badCells]);

  function resetPlay(next: Activity) {
    setFound([]);
    setPaths({});
    setSelection([]);
    selectionRef.current = [];
    dragRef.current = null;
    setBadCells([]);
    setPaused(false);
    setLost(false);
    setLivesLeft(next.lives);
    setElapsed(0);
    setShowKey(false);
    setJustFound("");
  }

  function remember(next: Activity, reset = true) {
    const items = library.items.some((item) => item.id === next.id)
      ? library.items.map((item) => (item.id === next.id ? next : item))
      : [next, ...library.items].slice(0, 30);
    const stored = { currentId: next.id, items };
    setActivity(next);
    if (reset) resetPlay(next);
    setLibrary(stored);
    const saved = saveLibrary(stored);
    setNotice(saved ? "Atividade salva neste navegador." : "A atividade está pronta, mas o navegador não conseguiu salvá-la. Copie o link para guardar seu conteúdo.");
    setSharedView(false);
    if (window.location.hash.startsWith("#atividade=")) window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  function openEditor() {
    setFormError("");
    pausedBeforeEdit.current = paused;
    setDraft(activity);
    setPaused(true);
  }

  function closeEditor() {
    setDraft(null);
    setFormError("");
    if (!pausedBeforeEdit.current) setPaused(false);
  }

  function applyDraft() {
    if (!draft) return;
    const parsed = parseWordList(draft.wordsText);
    if (parsed.length === 0) {
      setFormError("Escreva ao menos uma palavra, uma por linha.");
      return;
    }
    if (draft.title.length > 80 || draft.prompt.length > 180 || draft.wordsText.length > 2000 || parsed.some((word) => word.label.length > 32)) {
      setFormError("Para compartilhar e imprimir em A4, use título de até 80 caracteres, instrução de até 180 e termos de até 32 caracteres, incluindo espaços.");
      return;
    }
    const wordsChanged = draft.wordsText !== activity.wordsText || draft.difficulty !== activity.difficulty;
    const structural = wordsChanged || draft.lives !== activity.lives || draft.id !== activity.id || draft.seed !== activity.seed;
    remember(
      {
        ...draft,
        title: draft.title.trim() || "Caça-palavras",
        prompt: draft.prompt.trim() || "Toque em uma palavra oculta",
        seed: wordsChanged ? (draft.seed + 1) >>> 0 : draft.seed,
      },
      structural,
    );
    setDraft(null);
    if (!structural && !pausedBeforeEdit.current) setPaused(false);
  }

  function triggerDownload(html: string, name: string) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function downloadHtml() {
    const html = buildStandaloneHtml({
      title: activity.title,
      prompt: activity.prompt,
      image: activity.image,
      puzzle,
      lives: activity.lives,
      timer: activity.timer,
    });
    const name = fileSlug(activity.title);
    triggerDownload(html, name);
    setExportPack({ html, name });
    setExportNote(
      window.self !== window.top
        ? "Esta prévia bloqueia o download. Copie o HTML ou abra numa aba e use Salvar como."
        : "Se o arquivo não aparecer em Downloads, copie o HTML ou abra numa aba e use Salvar como.",
    );
  }

  async function copyExport() {
    if (!exportPack) return;
    const fallback = `Selecione o texto abaixo e copie. Salve como ${exportPack.name}. No Bloco de Notas, escolha Todos os arquivos para não ficar .txt.`;
    try {
      await navigator.clipboard.writeText(exportPack.html);
      setExportNote(`Copiado. Cole no Bloco de Notas e salve como ${exportPack.name}.`);
    } catch {
      exportRef.current?.focus();
      exportRef.current?.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      }
      setExportNote(copied ? `Copiado. Cole no Bloco de Notas e salve como ${exportPack.name}.` : fallback);
    }
  }

  function openExportTab() {
    if (!exportPack) return;
    const url = URL.createObjectURL(new Blob([exportPack.html], { type: "text/html;charset=utf-8" }));
    const opened = window.open(url, "_blank", "noopener");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    if (!opened) {
      setExportNote(`A nova aba foi bloqueada. Copie o HTML e salve como ${exportPack.name}.`);
    }
  }

  function cellFromPoint(x: number, y: number): Cell | null {
    const element = document.elementFromPoint(x, y);
    const cell = element?.closest<HTMLElement>("[data-cell]");
    if (!cell) return null;
    return { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || locked || puzzle.rows === 0) return;
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* alguns navegadores recusam a captura do ponteiro */
    }
    dragRef.current = cell;
    const keys = clampLine(cell, cell, puzzle.rows, puzzle.cols).map(cellKey);
    selectionRef.current = keys;
    setSelection(keys);
    setBadCells([]);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;
    const keys = clampLine(dragRef.current, cell, puzzle.rows, puzzle.cols).map(cellKey);
    selectionRef.current = keys;
    setSelection(keys);
  }

  function onPointerUp() {
    const anchor = dragRef.current;
    const keys = selectionRef.current;
    dragRef.current = null;
    selectionRef.current = [];
    setSelection([]);
    if (!anchor || keys.length < 2) return;

    const cells = keys.map(keyToCell);
    const forward = readCells(puzzle.letters, cells);
    const reverse = forward.split("").reverse().join("");
    const hit = puzzle.placements.find(
      (placement) =>
        !foundRef.current.includes(placement.normalized) &&
        (placement.normalized === forward || placement.normalized === reverse),
    );

    if (hit) {
      const nextFound = [...foundRef.current, hit.normalized];
      setFound(nextFound);
      setPaths((current) => ({ ...current, [hit.normalized]: keys }));
      setJustFound(hit.normalized);
      if (nextFound.length === puzzle.placements.length) playWin(soundOn);
      else playFound(soundOn);
      return;
    }

    if (keys.length >= 3 && activity.lives > 0) {
      setBadCells(keys);
      setShake((value) => value + 1);
      playMiss(soundOn);
      const nextLives = livesLeft - 1;
      setLivesLeft(Math.max(0, nextLives));
      if (nextLives <= 0) setLost(true);
    }
  }

  async function toggleFull() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await boardRef.current?.requestFullscreen();
    } catch {
      /* a pré-visualização embutida pode recusar tela cheia */
    }
  }

  const selectionSet = useMemo(() => new Set(selection), [selection]);
  const badSet = useMemo(() => new Set(badCells), [badCells]);
  const prompt = won ? "Todas as palavras encontradas" : lost ? "As vidas acabaram" : activity.prompt;

  return (
    <main ref={boardRef} data-ready={ready} aria-busy={!ready} className="min-h-screen bg-paper text-ink">
      <div className="h-1.5 bg-brass" />
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-5 sm:px-8 sm:py-7">
        <p className="no-print font-serif text-xl">Caça-palavras</p>
        {sharedView && <p className="no-print mt-3 text-sm text-muted">Atividade compartilhada · Jogue nesta página ou imprima uma folha para responder.</p>}
        {notice && <p className="no-print mt-3 text-sm text-muted" role="status">{notice}</p>}
        {activity.image && <img src={activity.image} alt="Imagem de apoio da atividade" className="no-print mt-4 max-h-40 w-full rounded-lg object-contain" />}

        <header className="no-print mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap">
          <p className="min-w-12 text-lg font-semibold tabular-nums">{activity.timer ? formatTime(elapsed) : ""}</p>
          <p className="order-last w-full text-center text-base font-medium sm:order-none sm:w-auto sm:flex-1 sm:text-lg">
            {prompt}
          </p>
          <p className="ml-auto flex items-center justify-end gap-2 font-semibold tabular-nums sm:ml-0">
            {activity.lives > 0 && (
              <span className="inline-flex items-center gap-0.5" aria-label={`${livesLeft} vidas`}>
                {Array.from({ length: activity.lives }, (_, index) => (
                  <Heart
                    key={index}
                    className={clsx("size-5", index < livesLeft ? "fill-heart text-heart" : "text-line")}
                    aria-hidden
                  />
                ))}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Check className="size-4" aria-hidden />
              {found.length}/{puzzle.placements.length}
            </span>
          </p>
        </header>

        <p className="sr-only" aria-live="polite">
          {justFound ? `${labelOf(puzzle, justFound)} encontrada.` : ""}
          {won ? " Grade completa." : ""}
          {lost ? " As vidas acabaram." : ""}
        </p>

        {won && (
          <div className="no-print mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cobalt px-4 py-3 text-sheet">
            <p>Grade completa{activity.timer ? ` em ${formatTime(elapsed)}` : ""}.</p>
            <span className="flex flex-wrap gap-2">
              <BannerButton onClick={() => resetPlay(activity)}>Jogar de novo</BannerButton>
              <BannerButton onClick={() => remember({ ...activity, seed: (activity.seed + 1) >>> 0 })}>
                Nova disposição
              </BannerButton>
            </span>
          </div>
        )}

        {lost && (
          <div className="no-print mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 text-sheet">
            <p>As vidas acabaram. A grade continua a mesma.</p>
            <BannerButton onClick={() => resetPlay(activity)}>Tentar de novo</BannerButton>
          </div>
        )}

        <div className="no-print mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
          <ul className="order-1 flex flex-wrap content-start gap-2 lg:order-2 lg:flex-1">
            {bank.map((placement) => {
              const on = foundSet.has(placement.normalized);
              return (
                <li
                  key={placement.id}
                  className={clsx(
                    "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-center text-base font-medium text-sheet",
                    on ? "bg-cobalt" : "bg-chip",
                    justFound === placement.normalized && "animate-pop",
                  )}
                >
                  {placement.label}
                  {on && <Check className="size-4 shrink-0" aria-hidden />}
                </li>
              );
            })}
          </ul>

          <div className="relative order-2 w-full max-w-md lg:order-1 lg:shrink-0">
            <div
              key={shake}
              className={clsx("grid touch-none gap-px overflow-hidden rounded-md bg-line p-px select-none", shake > 0 && "animate-shake")}
              style={{ gridTemplateColumns: `repeat(${Math.max(puzzle.cols, 1)}, minmax(0, 1fr))` }}
              role="grid"
              aria-label="Grade de letras"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {puzzle.letters.map((row, rowIndex) =>
                row.map((letter, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  const isFound = foundCellSet.has(key);
                  const isSelected = selectionSet.has(key);
                  const isBad = badSet.has(key);
                  const isAnswer = showKey && answerCellSet.has(key) && !isFound;
                  return (
                    <div
                      key={key}
                      data-cell
                      data-row={rowIndex}
                      data-col={colIndex}
                      role="gridcell"
                      className={clsx(
                        "flex aspect-square items-center justify-center text-xs font-semibold sm:text-sm",
                        isFound && "bg-cobalt text-sheet",
                        isSelected && !isFound && "bg-cobalt-soft text-ink",
                        isBad && !isFound && "bg-heart-soft text-heart",
                        !isFound && !isSelected && !isBad && "bg-sheet text-ink",
                        isAnswer && "ring-2 ring-brass ring-inset",
                      )}
                    >
                      {letter}
                    </div>
                  );
                }),
              )}
            </div>

            {paused && !draft && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-paper/85">
                <button
                  type="button"
                  className="min-h-11 rounded-xl bg-ink px-4 text-sheet"
                  onClick={() => setPaused(false)}
                >
                  Continuar
                </button>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <IconButton label={paused ? "Continuar" : "Pausar"} onClick={() => setPaused((value) => !value)} disabled={won || lost}>
                {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
              </IconButton>
              <span className="flex gap-2">
                <IconButton label={soundOn ? "Desligar som" : "Ligar som"} onClick={() => setSoundOn((value) => !value)}>
                  {soundOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                </IconButton>
                <IconButton label={full ? "Sair da tela cheia" : "Tela cheia"} onClick={toggleFull}>
                  {full ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
                </IconButton>
              </span>
            </div>
          </div>
        </div>

        {puzzle.missed.length > 0 && (
          <p className="no-print mt-3 text-sm text-heart">
            Não couberam na grade: {puzzle.missed.join(", ")}. Encurte essas palavras ou mude a dificuldade.
          </p>
        )}

        <h1 className="no-print mt-6 font-serif text-3xl">{activity.title}</h1>
        <p className="no-print mt-1 text-sm text-muted">
          {puzzle.placements.length} palavras · {difficultyLabel(activity.difficulty)}
          {activity.lives > 0 ? ` · ${activity.lives} vidas` : " · sem vidas"}
          {activity.timer ? " · com cronômetro" : ""}
        </p>

        <div className="no-print mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={!ready} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sheet" onClick={openEditor}>
            <Pencil className="size-4" aria-hidden />
            {sharedView ? "Personalizar uma cópia" : "Personalizar atividade"}
          </button>
          <GhostButton onClick={() => setShareOpen(true)}>
            <Share2 className="size-4" aria-hidden />Compartilhar
          </GhostButton>
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brass px-4 font-semibold text-ink"
            onClick={downloadHtml}
          >
            <Download className="size-4" aria-hidden />
            Baixar HTML
          </button>
          <GhostButton onClick={() => setPrintOpen(true)}>
            <Printer className="size-4" aria-hidden />
            Imprimir / PDF
          </GhostButton>
          {!sharedView && <GhostButton onClick={() => remember({ ...activity, seed: (activity.seed + 1) >>> 0 })}>
            <RefreshCw className="size-4" aria-hidden />
            Nova disposição
          </GhostButton>}
          {!sharedView && <GhostButton pressed={showKey} onClick={() => setShowKey((value) => !value)}>
            <Eye className="size-4" aria-hidden />
            {showKey ? "Ocultar gabarito" : "Gabarito"}
          </GhostButton>}
        </div>

        <p className="no-print mt-4 max-w-2xl text-sm text-pretty text-muted">
          Personalize aqui e compartilhe com a turma por link ou QR code. Suas atividades ficam neste navegador. Para guardar uma evidência, imprima o registro da partida ou salve como PDF.
        </p>

        <ActivityPrintSheets activity={activity} puzzle={puzzle} found={found} paths={paths} elapsed={elapsed} options={printOptions} teacher={!sharedView} />
      </div>

      {draft && (
        <div className="no-print fixed inset-0 z-30 flex items-end justify-center bg-ink/45 sm:items-center sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
            className="max-h-screen w-full overflow-y-auto bg-paper p-5 shadow-xl sm:max-w-xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="editor-title" className="font-serif text-2xl">
                Preparar a atividade
              </h2>
              <button type="button" className="grid size-11 place-items-center rounded-full" aria-label="Fechar" onClick={closeEditor}>
                <X className="size-5" />
              </button>
            </div>

            <label className="mt-4 block text-sm font-semibold" htmlFor="activity-title">
              Título
            </label>
            <input
              ref={titleRef}
              id="activity-title"
              maxLength={80}
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              className="mt-1 w-full rounded-lg border border-line bg-sheet px-3 py-2"
            />

            <label className="mt-4 block text-sm font-semibold" htmlFor="activity-prompt">
              Instrução para o aluno
            </label>
            <input
              id="activity-prompt"
              maxLength={180}
              value={draft.prompt}
              onChange={(event) => setDraft({ ...draft, prompt: event.target.value })}
              className="mt-1 w-full rounded-lg border border-line bg-sheet px-3 py-2"
            />

            <label className="mt-4 block text-sm font-semibold" htmlFor="activity-words">
              Palavras, uma por linha
            </label>
            <textarea
              id="activity-words"
              maxLength={2000}
              value={draft.wordsText}
              onChange={(event) => setDraft({ ...draft, wordsText: event.target.value })}
              rows={8}
              spellCheck
              className="mt-1 w-full resize-y rounded-lg border border-line bg-sheet px-3 py-2"
              placeholder={"ágora\ndemocracia\nostracismo"}
            />
            <p className="mt-1 text-sm text-muted">{parseWordList(draft.wordsText).length} palavras válidas. Acentos saem na grade: ágora vira AGORA.</p>
            {draft.wordsText.split("\n").some((line) => line.trim().includes(" ")) && (
              <p className="mt-1 text-sm text-heart">Uma frase vira uma palavra só, sem espaço. Prefira um termo por linha.</p>
            )}
            {formError && <p className="mt-1 text-sm text-heart">{formError}</p>}
            <ActivityImageEditor key={draft.id} image={draft.image} onChange={(image) => setDraft((current) => current ? { ...current, image } : current)} />

            <p className="mt-4 text-sm font-semibold">Dificuldade</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={draft.difficulty === level}
                  onClick={() => setDraft({ ...draft, difficulty: level })}
                  className={clsx(
                    "min-h-11 rounded-lg border px-2 text-sm",
                    draft.difficulty === level ? "border-ink bg-ink text-sheet" : "border-line bg-sheet",
                  )}
                >
                  {difficultyLabel(level)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-sm text-muted">Fácil é horizontal e vertical. Médio inclui diagonais. Difícil também escreve ao contrário.</p>

            <p className="mt-4 text-sm font-semibold">Vidas</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {LIVES.map((count) => (
                <button
                  key={count}
                  type="button"
                  aria-pressed={draft.lives === count}
                  onClick={() => setDraft({ ...draft, lives: count })}
                  className={clsx(
                    "min-h-11 rounded-lg border text-sm",
                    draft.lives === count ? "border-ink bg-ink text-sheet" : "border-line bg-sheet",
                  )}
                >
                  {count === 0 ? "Sem" : count}
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-pressed={draft.timer}
              onClick={() => setDraft({ ...draft, timer: !draft.timer })}
              className={clsx(
                "mt-4 min-h-11 rounded-lg border px-3 text-sm",
                draft.timer ? "border-ink bg-ink text-sheet" : "border-line bg-sheet",
              )}
            >
              {draft.timer ? "Cronômetro ligado" : "Sem cronômetro"}
            </button>

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="min-h-11 rounded-xl bg-cobalt px-4 text-sheet" onClick={applyDraft}>
                Montar grade
              </button>
              <button type="button" className="min-h-11 rounded-xl border border-line px-4" onClick={closeEditor}>
                Fechar
              </button>
              <button
                type="button"
                className="min-h-11 rounded-xl border border-line px-4"
                onClick={() => {
                  setFormError("");
                  setDraft(emptyActivity());
                }}
              >
                Nova atividade
              </button>
            </div>

            <h3 className="mt-6 text-sm font-semibold">Neste navegador</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {library.items.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    className={clsx(
                      "min-h-11 flex-1 rounded-lg border px-3 text-left text-sm",
                      item.id === activity.id ? "border-cobalt bg-cobalt-soft" : "border-line bg-sheet",
                    )}
                    onClick={() => {
                      remember(item);
                      setDraft(null);
                    }}
                  >
                    {item.title}
                  </button>
                  <button
                    type="button"
                    className="grid size-11 place-items-center rounded-lg border border-line"
                    aria-label={`Apagar ${item.title}`}
                    onClick={() => {
                      const items = library.items.filter((entry) => entry.id !== item.id);
                      const nextItems = items.length > 0 ? items : [SAMPLE];
                      const next = activity.id === item.id ? nextItems[0] : activity;
                      const stored = { currentId: next.id, items: nextItems };
                      setLibrary(stored);
                      if (!saveLibrary(stored)) setNotice("O navegador não conseguiu salvar a alteração na biblioteca.");
                      if (activity.id === item.id) {
                        setActivity(next);
                        resetPlay(next);
                        setDraft(next);
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {exportPack && (
        <div className="no-print fixed inset-0 z-40 flex items-end justify-center bg-ink/45 sm:items-center sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
            className="max-h-screen w-full overflow-y-auto bg-paper p-5 shadow-xl sm:max-w-xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="export-title" className="font-serif text-2xl">
                Guardar o HTML
              </h2>
              <button type="button" className="grid size-11 place-items-center rounded-full" aria-label="Fechar" onClick={() => setExportPack(null)}>
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-3 text-sm text-pretty text-muted">{exportNote}</p>
            <p className="mt-2 text-sm font-semibold">{exportPack.name}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="min-h-11 rounded-xl bg-ink px-4 text-sheet" onClick={() => void copyExport()}>
                Copiar HTML
              </button>
              <button type="button" className="min-h-11 rounded-xl bg-brass px-4 font-semibold text-ink" onClick={openExportTab}>
                Abrir numa aba
              </button>
              <button
                type="button"
                className="min-h-11 rounded-xl border border-line px-4"
                onClick={() => triggerDownload(exportPack.html, exportPack.name)}
              >
                Tentar download
              </button>
            </div>
            <textarea
              ref={exportRef}
              readOnly
              value={exportPack.html}
              rows={8}
              className="mt-4 w-full resize-y rounded-lg border border-line bg-sheet px-3 py-2 font-mono text-xs"
              aria-label="Código HTML da atividade"
              onFocus={(event) => event.currentTarget.select()}
            />
          </div>
        </div>
      )}
      {shareOpen && <ShareActivityDialog activity={activity} onClose={() => setShareOpen(false)} />}
      {printOpen && <PrintActivityDialog options={printOptions} onChange={setPrintOptions} onClose={() => setPrintOpen(false)} teacher={!sharedView} />}
    </main>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full border border-line bg-sheet disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  pressed,
}: {
  children: React.ReactNode;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={clsx(
        "inline-flex min-h-11 items-center gap-2 rounded-xl border px-4",
        pressed ? "border-brass bg-brass-soft" : "border-line bg-sheet",
      )}
    >
      {children}
    </button>
  );
}

function BannerButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="min-h-11 rounded-lg bg-sheet px-3 text-ink">
      {children}
    </button>
  );
}

function PrintGrid({
  puzzle,
  marked,
}: {
  puzzle: ReturnType<typeof generatePuzzle>;
  marked: boolean;
}) {
  const keys = new Set<string>();
  if (marked) {
    for (const placement of puzzle.placements) {
      for (const cell of cellsOf(placement)) keys.add(cellKey(cell));
    }
  }
  return (
    <div
      className="mt-4 grid gap-px bg-ink p-px"
      style={{
        gridTemplateColumns: `repeat(${Math.max(puzzle.cols, 1)}, minmax(0, 1fr))`,
        width: "100%",
        maxWidth: "28rem",
      }}
    >
      {puzzle.letters.map((row, rowIndex) =>
        row.map((letter, colIndex) => {
          const on = keys.has(`${rowIndex}-${colIndex}`);
          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={clsx(
                "flex aspect-square items-center justify-center text-xs font-semibold",
                on ? "bg-cobalt text-sheet" : "bg-sheet text-ink",
              )}
            >
              {letter}
            </div>
          );
        }),
      )}
    </div>
  );
}

function cellKey(cell: Cell): string {
  return `${cell.row}-${cell.col}`;
}

function keyToCell(key: string): Cell {
  const [row, col] = key.split("-").map(Number);
  return { row, col };
}

function labelOf(puzzle: ReturnType<typeof generatePuzzle>, normalized: string): string {
  return puzzle.placements.find((item) => item.normalized === normalized)?.label ?? normalized;
}

let audioContext: AudioContext | null = null;

function tone(frequency: number, duration: number, delay = 0) {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === "suspended") void audioContext.resume();
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.045, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function playFound(on: boolean) {
  if (on) tone(620, 0.12);
}

function playMiss(on: boolean) {
  if (on) tone(180, 0.16);
}

function playWin(on: boolean) {
  if (!on) return;
  tone(523, 0.12);
  tone(659, 0.12, 0.1);
  tone(784, 0.18, 0.2);
}
