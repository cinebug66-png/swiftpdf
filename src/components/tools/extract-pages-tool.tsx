import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Layers,
  Loader2,
  RotateCcw,
  Shield,
  Upload,
  Zap,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { consumePendingFiles } from "@/lib/pending-file";
import {
  createPdfDownloadUrl,
  extractPdfPages,
  getPdfPageCount,
  revokeObjectUrl,
} from "@/lib/pdf-extract";
import { parsePageRangePreview } from "@/lib/pdf-page-ranges";
import { cn } from "@/lib/utils";

type ToolStatus = "idle" | "processing" | "done" | "error";

type PdfRenderTask = {
  cancel: () => void;
  promise: Promise<unknown>;
};

type PdfPageProxy = {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => PdfRenderTask;
  cleanup?: () => void;
};

type PdfDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
  destroy: () => Promise<void>;
};

type PdfLoadingTask = {
  promise: Promise<PdfDocumentProxy>;
  destroy: () => Promise<void>;
};

const ACCEPTED_PDF_TYPES = ".pdf,application/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatPagesForInput(pages: number[]) {
  return pages.join(",");
}

function formatPageSummary(pages: number[]) {
  if (pages.length === 0) return "";
  const visiblePages = pages.slice(0, 24).join(", ");
  return pages.length > 24 ? `${visiblePages}, +${pages.length - 24} more` : visiblePages;
}

function getDownloadName(file: File | null) {
  if (!file) return "extracted-pages.pdf";
  return `${file.name.replace(/\.pdf$/i, "")}-extracted-pages.pdf`;
}

function isPdfFile(file: File | null | undefined): file is File {
  return Boolean(
    file &&
    typeof file.name === "string" &&
    typeof file.arrayBuffer === "function" &&
    (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")),
  );
}

const ExtractPageThumbnail = memo(function ExtractPageThumbnail({
  pdfDocument,
  pageNumber,
}: {
  pdfDocument: PdfDocumentProxy | null;
  pageNumber: number;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    let cancelled = false;
    let renderTask: PdfRenderTask | null = null;

    const renderThumbnail = async () => {
      if (!canvas || !pdfDocument || !visible) return;

      let page: PdfPageProxy | null = null;
      try {
        setLoading(true);
        page = await pdfDocument.getPage(pageNumber);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(150 / baseViewport.width, 190 / baseViewport.height);
        const viewport = page.getViewport({ scale });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) throw new Error("Thumbnail failed.");

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, viewport.width, viewport.height);

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (!cancelled) {
          setFailed(false);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      } finally {
        page?.cleanup?.();
      }
    };

    if (visible) {
      void renderThumbnail();
    }

    return () => {
      cancelled = true;
      try {
        renderTask?.cancel();
      } catch {
        // Thumbnails are optional; ignore cleanup failures.
      }
      if (canvas) {
        const context = canvas.getContext("2d");
        context?.resetTransform();
        context?.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
      }
    };
  }, [pdfDocument, pageNumber, visible]);

  return (
    <div
      ref={frameRef}
      className="relative grid h-full w-full place-items-center overflow-hidden bg-muted/40"
    >
      {(loading || !visible || !pdfDocument) && !failed && (
        <div className="absolute inset-0 grid place-items-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary/70" />
        </div>
      )}
      {failed && (
        <div className="grid h-20 w-16 place-items-center rounded-lg border border-border bg-background/70 text-xs text-muted-foreground">
          PDF
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={cn(
          "block max-h-full max-w-full rounded-md bg-white shadow-soft transition-opacity duration-300",
          loading || failed ? "opacity-0" : "opacity-100",
        )}
      />
    </div>
  );
});

function ExtractPageGrid({
  file,
  pageCount,
  selectedPages,
  disabled,
  onTogglePage,
}: {
  file: File;
  pageCount: number;
  selectedPages: Set<number>;
  disabled: boolean;
  onTogglePage: (page: number) => void;
}) {
  const [pdfDocument, setPdfDocument] = useState<PdfDocumentProxy | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: PdfLoadingTask | null = null;
    let document: PdfDocumentProxy | null = null;

    const loadPdf = async () => {
      setPdfDocument(null);
      setPreviewError(null);

      try {
        const data = await file.arrayBuffer();
        if (cancelled) return;

        loadingTask = pdfjsLib.getDocument({ data }) as unknown as PdfLoadingTask;
        document = await loadingTask.promise;
        if (cancelled) {
          await document.destroy().catch(() => undefined);
          return;
        }
        setPdfDocument(document);
      } catch {
        if (!cancelled) {
          setPreviewError("Page previews could not be rendered. Page selection still works.");
        }
      }
    };

    void loadPdf();

    return () => {
      cancelled = true;
      void loadingTask?.destroy().catch(() => undefined);
      if (document) void document.destroy().catch(() => undefined);
    };
  }, [file]);

  return (
    <>
      {previewError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {previewError}
        </div>
      )}
      <div className="rounded-2xl border border-border/70 bg-muted/25 p-3 shadow-inner">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => {
            const selected = selectedPages.has(page);
            return (
              <button
                key={page}
                type="button"
                aria-pressed={selected}
                aria-label={`${selected ? "Deselect" : "Select"} page ${page}`}
                onClick={() => onTogglePage(page)}
                disabled={disabled}
                className={cn(
                  "group relative isolate min-w-0 overflow-hidden rounded-2xl border bg-card text-left shadow-soft outline-none transition-all duration-300",
                  "hover:-translate-y-0.5 hover:shadow-card focus-visible:border-primary focus-visible:shadow-glow",
                  "disabled:pointer-events-none disabled:opacity-70",
                  selected
                    ? "border-primary shadow-glow"
                    : "border-border/80 hover:border-primary/50",
                )}
              >
                <div className="relative h-40 overflow-hidden bg-muted/30 p-2 sm:h-44">
                  <ExtractPageThumbnail pdfDocument={pdfDocument} pageNumber={page} />
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-primary/72 px-2 text-center text-primary-foreground backdrop-blur-[1px] transition-opacity duration-300",
                      selected ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-primary shadow-lg">
                      <Check className="h-4 w-4" />
                    </span>
                    <span className="rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold sm:text-xs">
                      Selected
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-center justify-between gap-2 border-t border-border/70 px-3 py-2.5 transition-colors",
                    selected ? "bg-primary/10" : "bg-card",
                  )}
                >
                  <span className="text-sm font-semibold">Page {page}</span>
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full border transition-all",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground group-hover:border-primary/60 group-hover:text-primary",
                    )}
                  >
                    {selected ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-current" />
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function ExtractPagesTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("Waiting for file");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("extracted-pages.pdf");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [rangeInput, setRangeInput] = useState("");

  useEffect(() => {
    const pending = consumePendingFiles(ACCEPTED_PDF_TYPES, false);
    if (pending?.[0]) {
      void selectFile(pending[0]);
    }
    // Pending-file bootstrapping should only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    downloadUrlRef.current = downloadUrl;
  }, [downloadUrl]);

  useEffect(() => {
    return () => revokeObjectUrl(downloadUrlRef.current);
  }, []);

  const fileSize = useMemo(() => (file ? formatFileSize(file.size) : null), [file]);
  const pageRangePreview = useMemo(
    () =>
      pageCount == null
        ? { pages: [] as number[], error: null as string | null }
        : parsePageRangePreview(rangeInput, pageCount),
    [pageCount, rangeInput],
  );
  const selectedPages = useMemo(
    () => (pageRangePreview.error ? [] : pageRangePreview.pages),
    [pageRangePreview.error, pageRangePreview.pages],
  );
  const selectedPageSet = useMemo(() => new Set(selectedPages), [selectedPages]);
  const canExtract = Boolean(file && selectedPages.length > 0 && !pageRangePreview.error);

  const resetResultState = (nextFile: File | null) => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setDownloadName(getDownloadName(nextFile));
    setStatus("idle");
    setError(null);
    setProgressNote("Waiting for file");
  };

  const selectFile = async (nextFile: File | null) => {
    resetResultState(nextFile);
    setRangeInput("");
    setPageCount(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!isPdfFile(nextFile)) {
      setFile(null);
      setStatus("error");
      setError("Please choose a valid PDF file.");
      setProgressNote("Invalid file type");
      return;
    }

    setFile(nextFile);

    try {
      const totalPages = await getPdfPageCount(nextFile);
      setPageCount(totalPages);
      setProgressNote("Select pages to extract");
    } catch (err) {
      setFile(null);
      setStatus("error");
      setError(err instanceof Error ? err.message : "This PDF could not be read.");
      setProgressNote("Failed to read PDF");
    }
  };

  const togglePage = (page: number) => {
    if (status === "processing") return;

    const currentPages = pageRangePreview.error ? [] : selectedPages;
    const nextPages = selectedPageSet.has(page)
      ? currentPages.filter((selectedPage) => selectedPage !== page)
      : [...currentPages, page];

    setRangeInput(formatPagesForInput(nextPages.sort((left, right) => left - right)));
    setStatus((current) => (current === "done" ? "idle" : current));
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
  };

  const updateRangeInput = (value: string) => {
    setRangeInput(value);
    setStatus((current) => (current === "done" ? "idle" : current));
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
  };

  const resetAll = () => {
    void selectFile(null);
  };

  const handleExtract = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }

    if (pageRangePreview.error) {
      setStatus("error");
      setError(pageRangePreview.error);
      setProgressNote("Choose valid pages to extract");
      return;
    }

    if (selectedPages.length === 0) {
      setStatus("error");
      setError("Select at least one page to extract.");
      setProgressNote("Choose pages to extract");
      return;
    }

    try {
      trackAnalyticsEvent("extract_pages_started", { tool_name: "extract_pages" });
      setStatus("processing");
      setError(null);
      setProgressNote("Extracting selected pages...");

      const bytes = await extractPdfPages(file, selectedPages);
      const nextDownloadUrl = createPdfDownloadUrl(bytes);

      revokeObjectUrl(downloadUrl);
      setDownloadUrl(nextDownloadUrl);
      setDownloadName(getDownloadName(file));
      setStatus("done");
      setProgressNote("Your extracted PDF is ready.");
      trackAnalyticsEvent("extract_pages_completed", {
        tool_name: "extract_pages",
        page_count: String(selectedPages.length),
      });

      const anchor = window.document.createElement("a");
      anchor.href = nextDownloadUrl;
      anchor.download = getDownloadName(file);
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      trackAnalyticsEvent("extract_pages_download", {
        tool_name: "extract_pages",
        page_count: String(selectedPages.length),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extract pages failed. Please try again.");
      setStatus("error");
      setProgressNote("Extract pages failed.");
    }
  };

  return (
    <>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDrag(false);
          void selectFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "group relative block cursor-pointer rounded-3xl p-10 text-center transition-all duration-300 sm:p-16",
          "glass shadow-card hover:shadow-glow",
          drag && "scale-[1.01] ring-2 ring-primary",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_PDF_TYPES}
          className="sr-only"
          onChange={(event) => {
            void selectFile(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition-transform group-hover:scale-110">
          <Upload className="h-7 w-7" />
        </div>
        <p className="responsive-file-name mx-auto text-lg font-medium" title={file?.name}>
          {file ? file.name : "Drop your PDF here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Select pages or enter page ranges to extract.
        </p>
      </label>

      {file && (
        <div className="mt-5 rounded-2xl glass px-4 py-3 shadow-soft">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="responsive-file-name text-sm font-medium" title={file.name}>
                  {file.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {fileSize}
                  {pageCount != null ? ` | ${pageCount} pages` : ""}
                </div>
              </div>
            </div>
            {status !== "processing" && (
              <button
                type="button"
                onClick={resetAll}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {file && pageCount != null && (
        <div className="mt-6 rounded-3xl glass p-4 shadow-card sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold">Select pages to extract</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Click page previews or enter a page range.
              </div>
            </div>
            <div className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium shadow-soft">
              {selectedPages.length} of {pageCount} selected
            </div>
          </div>
          <Input
            value={rangeInput}
            onChange={(event) => updateRangeInput(event.target.value)}
            placeholder="Examples: 1,3,5 or 1-3 or 1,3-5"
            className="h-12 rounded-xl border-border bg-card/70 px-4 text-sm shadow-soft"
            disabled={status === "processing"}
          />
          <div className="mt-2 text-xs text-muted-foreground">
            Select pages or enter page ranges to extract.
          </div>
          {pageRangePreview.error && (
            <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {pageRangePreview.error}
            </div>
          )}
          <div className="mt-5">
            <ExtractPageGrid
              file={file}
              pageCount={pageCount}
              selectedPages={selectedPageSet}
              disabled={status === "processing"}
              onTogglePage={togglePage}
            />
          </div>
          {!pageRangePreview.error && selectedPages.length > 0 && (
            <div className="mt-4 grid gap-2 rounded-xl bg-card/70 p-3 text-xs text-muted-foreground shadow-soft sm:grid-cols-2">
              <div>
                Selected pages:{" "}
                <span className="text-foreground">{formatPageSummary(selectedPages)}</span>
              </div>
              <div>
                Output pages: <span className="text-foreground">{selectedPages.length}</span>
              </div>
            </div>
          )}
          {!pageRangePreview.error && selectedPages.length === 0 && (
            <div className="mt-3 text-xs text-muted-foreground">
              Type a range or click a page card to choose pages.
            </div>
          )}
        </div>
      )}

      {status === "processing" && (
        <div className="mt-6 rounded-2xl glass p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {progressNote}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full origin-left animate-pulse bg-gradient-primary" />
          </div>
        </div>
      )}

      {status === "error" && error && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive shadow-soft">
          {error}
        </div>
      )}

      {status === "done" && downloadUrl && (
        <div className="mt-6 rounded-2xl glass p-6 text-center shadow-glow">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="font-semibold">Pages extracted</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your extracted PDF is ready to download.
          </p>
          <div className="mx-auto mt-4 grid max-w-md gap-2 rounded-2xl bg-card/70 p-4 text-left text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <span>Selected pages</span>
              <span className="font-medium text-foreground">
                {formatPageSummary(selectedPages)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Output pages</span>
              <span className="font-medium text-foreground">{selectedPages.length}</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="hero" size="lg" asChild>
              <a
                href={downloadUrl}
                download={downloadName}
                title={downloadName}
                onClick={() =>
                  trackAnalyticsEvent("extract_pages_download", {
                    tool_name: "extract_pages",
                    page_count: String(selectedPages.length),
                  })
                }
              >
                <Download className="h-4 w-4" /> Download Extracted PDF
              </a>
            </Button>
            <Button variant="glass" size="lg" onClick={resetAll}>
              Start over
            </Button>
          </div>
        </div>
      )}

      {status !== "done" && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button
            variant="glass"
            size="xl"
            onClick={resetAll}
            disabled={!file || status === "processing"}
          >
            <RotateCcw className="h-4 w-4" /> Clear
          </Button>
          <Button
            variant="hero"
            size="xl"
            onClick={handleExtract}
            disabled={status === "processing" || !canExtract}
          >
            {file ? (
              <>
                Extract pages <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" /> Choose PDF
              </>
            )}
          </Button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:gap-6">
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" /> Browser-based only
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" /> Selected pages
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Original quality
        </span>
      </div>
    </>
  );
}
