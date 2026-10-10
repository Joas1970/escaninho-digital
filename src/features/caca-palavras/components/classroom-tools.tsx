import { useEffect, useId, useRef, useState } from "react";
import { Copy, ImagePlus, Printer, Share2, X } from "lucide-react";
import type { Activity } from "../lib/activities";
import { readLocalImage } from "../lib/local-image";
import { activityLink } from "../lib/share-activity";
import { cellsOf, formatTime, type Puzzle } from "../lib/wordsearch";

const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-sheet px-4 text-ink";

export function ClassroomDialog({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    container.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab") return;
      const controls = [...(container.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), textarea, select, a[href], [tabindex="0"]',
      ) ?? [])].filter((el) => el.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, []);
  return (
    <div className="no-print fixed inset-0 z-40 flex items-end justify-center bg-ink/45 sm:items-center sm:p-6">
      <div ref={container} role="dialog" aria-modal="true" aria-labelledby={id}
        className="max-h-screen w-full overflow-y-auto bg-paper p-5 shadow-xl sm:max-w-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id={id} className="font-serif text-2xl">{title}</h2>
          <button type="button" className="grid size-11 shrink-0 place-items-center rounded-full" aria-label="Fechar" onClick={onClose}><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ActivityImageEditor({ image, onChange }: { image?: string; onChange: (image?: string) => void }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  async function selectImage(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const result = await readLocalImage(file);
      if (alive.current) onChange(result);
    } catch (error) {
      if (alive.current) setError(error instanceof Error ? error.message : "Não foi possível abrir a imagem.");
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <section className="mt-4 rounded-xl border border-line bg-sheet p-3">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold"><ImagePlus className="size-4" />Imagem da atividade (opcional)</label>
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy}
        className="mt-2 block min-h-11 w-full text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sheet"
        onChange={(event) => { void selectImage(event.target.files?.[0]); event.target.value = ""; }} />
      <p className="mt-1 text-sm text-muted">Escolha do aparelho: JPG, PNG ou WebP, até 12 MB. A imagem será reduzida e ficará salva neste navegador.</p>
      <p className="mt-1 text-sm text-heart" role="status">{busy ? "Preparando imagem…" : error}</p>
      {image && <div className="mt-2 flex items-center gap-3">
        <img src={image} alt="Prévia da imagem da atividade" className="h-24 w-32 rounded-lg object-contain" />
        <button type="button" className={buttonClass} disabled={busy} onClick={() => onChange(undefined)}>Remover imagem</button>
      </div>}
    </section>
  );
}

export function ShareActivityDialog({ activity, onClose }: { activity: Activity; onClose: () => void }) {
  const [includeImage, setIncludeImage] = useState(Boolean(activity.image));
  const [link, setLink] = useState("");
  const [qr, setQr] = useState("");
  const [qrNote, setQrNote] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    let cancelled = false;
    setLink(""); setQr(""); setError(""); setNote(""); setQrNote("");
    void (async () => {
      try {
        const url = await activityLink(activity, window.location.href, includeImage);
        if (cancelled) return;
        setLink(url);
        if (url.length > 2200) {
          setQrNote(includeImage ? "Com esta imagem, o link é longo demais para QR code. Desmarque a imagem para gerar o QR; ela continua na sua atividade e na impressão." : "Este conteúdo é longo demais para QR code. Use o link ou reduza o texto.");
          return;
        }
        const { toDataURL } = await import("qrcode");
        const data = await toDataURL(url, { width: 320, margin: 4, errorCorrectionLevel: "L" });
        if (!cancelled) setQr(data);
      } catch (error) {
        if (!cancelled) setError(error instanceof Error ? error.message : "Não foi possível criar o compartilhamento.");
      }
    })();
    return () => { cancelled = true; };
  }, [activity, includeImage]);
  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setNote("Link copiado. Envie à turma pelo canal que preferir."); }
    catch { input.current?.focus(); input.current?.select(); setNote("Selecione e copie o link abaixo."); }
  }
  async function shareLink() {
    try { await navigator.share({ title: activity.title, url: link }); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) await copyLink(); }
  }
  return (
    <ClassroomDialog title="Compartilhar com a turma" onClose={onClose}>
      <p className="mt-3 text-sm text-muted">O link abre esta versão da atividade, com a mesma grade, sem exigir download ou cadastro. Cada aluno joga no próprio aparelho.</p>
      {activity.image && <label className="mt-3 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={includeImage} onChange={(event) => setIncludeImage(event.target.checked)} />Incluir a imagem no link</label>}
      {qr && <img src={qr} alt="QR code para abrir a atividade personalizada" className="mx-auto mt-4 w-64 max-w-full rounded-lg" />}
      {qrNote && <p className="mt-3 text-sm text-muted">{qrNote}</p>}
      <label htmlFor="activity-share-link" className="mt-3 block text-sm font-semibold">Link da atividade</label>
      <textarea id="activity-share-link" ref={input} readOnly value={link} rows={3} className="mt-1 w-full resize-none rounded-lg border border-line bg-sheet p-3 text-xs" onFocus={(event) => event.target.select()} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={buttonClass} disabled={!link} onClick={() => void copyLink()}><Copy className="size-4" />Copiar link</button>
        {typeof navigator !== "undefined" && typeof navigator.share === "function" && <button type="button" className={buttonClass} disabled={!link} onClick={() => void shareLink()}><Share2 className="size-4" />Enviar</button>}
      </div>
      <p className="mt-3 text-sm text-heart" role="status">{error || note || (!link ? "Preparando link…" : "")}</p>
      <p className="mt-3 text-sm text-muted">Quem receber o link terá acesso ao conteúdo{includeImage ? " e à imagem" : ""}. O link é uma cópia: mudanças posteriores precisam de um novo link. Nome e turma não são compartilhados; os resultados ficam em cada aparelho.</p>
    </ClassroomDialog>
  );
}

export type PrintOptions = { name: string; group: string; mode: "worksheet" | "record"; answerKey: boolean };

export function PrintActivityDialog({ options, onChange, onClose, teacher }: {
  options: PrintOptions; onChange: (options: PrintOptions) => void; onClose: () => void; teacher: boolean;
}) {
  const [busy, setBusy] = useState(false);
  async function print() {
    setBusy(true);
    try {
      await Promise.all([...document.querySelectorAll<HTMLImageElement>(".a4-sheet img")].map((image) => image.decode().catch(() => {})));
      window.print();
    } finally { setBusy(false); }
  }
  return (
    <ClassroomDialog title="Imprimir ou salvar PDF" onClose={onClose}>
      <p className="mt-3 text-sm text-muted">Folha A4 com imagem, grade, lista de palavras e espaço para identificação. Escolha papel A4 e escala 100% na impressão; desative cabeçalhos e rodapés do navegador.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Nome (opcional)<input maxLength={60} value={options.name} onChange={(event) => onChange({ ...options, name: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-line bg-sheet px-3" placeholder="Preencher à mão ou digitar" /></label>
        <label className="text-sm font-semibold">Turma (opcional)<input maxLength={30} value={options.group} onChange={(event) => onChange({ ...options, group: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-line bg-sheet px-3" placeholder="Ex.: 5º ano A" /></label>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">Tipo de folha</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="print-mode" checked={options.mode === "worksheet"} onChange={() => onChange({ ...options, mode: "worksheet" })} />Atividade em branco para a turma</label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="print-mode" checked={options.mode === "record"} onChange={() => onChange({ ...options, mode: "record" })} />Registro desta partida, com palavras encontradas e tempo</label>
      </fieldset>
      {teacher && <label className="mt-2 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={options.answerKey} onChange={(event) => onChange({ ...options, answerKey: event.target.checked })} />Incluir gabarito em uma segunda página</label>}
      <button type="button" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-4 text-sheet" disabled={busy} onClick={() => void print()}><Printer className="size-4" />{busy ? "Preparando…" : "Imprimir / Salvar como PDF"}</button>
      <p className="mt-3 text-sm text-muted">Para guardar a evidência digital, escolha “Salvar como PDF” no destino da impressão. O registro corresponde apenas à partida deste aparelho.</p>
    </ClassroomDialog>
  );
}

export function ActivityPrintSheets({ activity, puzzle, found, paths, elapsed, options, teacher }: {
  activity: Activity; puzzle: Puzzle; found: string[]; paths: Record<string, string[]>;
  elapsed: number; options: PrintOptions; teacher: boolean;
}) {
  const recording = options.mode === "record";
  const marked = new Set(recording ? Object.values(paths).flat() : []);
  const answers = new Set(puzzle.placements.flatMap((p) => cellsOf(p).map((c) => `${c.row}-${c.col}`)));
  function sheet(key: boolean) {
    return <section className={`a4-sheet${puzzle.placements.length > 16 ? " a4-compact" : ""}`} aria-label={key ? "Gabarito para impressão" : "Atividade para impressão"}>
      <p className="a4-brand">Escaninho Digital · Caça-palavras{key ? " · Gabarito do professor" : ""}</p>
      <h1>{activity.title}</h1>
      <div className="a4-identification"><span>Nome: {options.name || "____________________________________"}</span><span>Turma: {options.group || "____________"}</span></div>
      <p className="a4-date">Data: ____ / ____ / ______</p>
      <p className="a4-prompt">{activity.prompt}</p>
      {activity.image && <img className="a4-image" src={activity.image} alt="Imagem de apoio da atividade" />}
      <div className="a4-grid" style={{ gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))` }}>
        {puzzle.letters.flatMap((row, r) => row.map((letter, c) => <span key={`${r}-${c}`} className={(key ? answers : marked).has(`${r}-${c}`) ? "a4-marked" : ""}>{letter}</span>))}
      </div>
      <p className="a4-bank-title">Palavras para encontrar</p>
      <ul className="a4-words">{puzzle.placements.map((word) => <li key={word.id}>{recording && !key && found.includes(word.normalized) ? "✓ " : ""}{word.label}</li>)}</ul>
      {!key && recording && <p className="a4-record">Registro da partida: {found.length} de {puzzle.placements.length} palavras encontradas{activity.timer ? ` · Tempo de jogo: ${formatTime(elapsed)}` : ""}.</p>}
      <div className="a4-notes">Observações: __________________________________________________________</div>
    </section>;
  }
  return <div className="print-only hidden">{sheet(false)}{teacher && options.answerKey && sheet(true)}</div>;
}
