import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Shield,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackConversionCompleted, trackConversionStarted } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { consumePendingFiles } from "@/lib/pending-file";
import { parsePageRangePreview } from "@/lib/pdf-page-ranges";
import {
  createPdfDownloadUrl,
  deletePdfPages,
  getPdfPageCount,
  revokeObjectUrl,
} from "@/lib/pdf-delete-pages";

type ToolStatus = "idle" | "processing" | "done" | "error";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getDownloadName(file: File | null) {
  if (!file) return "updated.pdf";
  return `${file.name.replace(/\.pdf$/i, "")}-updated.pdf`;
}

function formatPageSummary(pages: number[]) {
  if (pages.length === 0) return "";
  const visiblePages = pages.slice(0, 18).join(", ");
  return pages.length > 18 ? `${visiblePages}, +${pages.length - 18} more` : visiblePages;
}

function formatPagesForInput(pages: number[]) {
  return pages.join(",");
}

const DeletePageThumbnail = memo(function DeletePageThumbnail({
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
      { rootMargin: "600px 0px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let renderTask: PdfRenderTask | null = null;

    const renderThumbnail = async () => {
      const canvas = canvasRef.current;
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
        const context = canvas.getContext("2d");

        if (!context) throw new Error("Thumbnail failed.");

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.clearRect(0, 0, viewport.width, viewport.height);

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

function DeletePageGrid({
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
            const deleted = selectedPages.has(page);
            return (
              <button
                key={page}
                type="button"
                aria-pressed={deleted}
                aria-label={`${deleted ? "Keep" : "Delete"} page ${page}`}
                onClick={() => onTogglePage(page)}
                disabled={disabled}
                className={cn(
                  "group relative isolate min-w-0 overflow-hidden rounded-2xl border bg-card text-left shadow-soft outline-none transition-all duration-300",
                  "hover:-translate-y-0.5 hover:shadow-card focus-visible:border-destructive focus-visible:shadow-glow",
                  "disabled:pointer-events-none disabled:opacity-70",
                  deleted
                    ? "border-destructive shadow-glow"
                    : "border-border/80 hover:border-primary/50",
                )}
              >
                <div className="relative h-40 overflow-hidden bg-muted/30 p-2 sm:h-44">
                  <DeletePageThumbnail pdfDocument={pdfDocument} pageNumber={page} />
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-destructive/78 px-2 text-center text-destructive-foreground backdrop-blur-[1px] transition-opacity duration-300",
                      deleted ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-destructive shadow-lg">
                      <Trash2 className="h-4 w-4" />
                    </span>
                    <span className="rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold sm:text-xs">
                      Will be deleted
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-center justify-between gap-2 border-t border-border/70 px-3 py-2.5 transition-colors",
                    deleted ? "bg-destructive/10" : "bg-card",
                  )}
                >
                  <span className="text-sm font-semibold">Page {page}</span>
                  <span
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full border transition-all",
                      deleted
                        ? "border-destructive bg-destructive text-destructive-foreground"
                        : "border-border text-muted-foreground group-hover:border-primary/60 group-hover:text-primary",
                    )}
                  >
                    {deleted ? (
                      <Trash2 className="h-3.5 w-3.5" />
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

export function DeletePagesTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("Waiting for file");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("updated.pdf");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [pagesInput, setPagesInput] = useState("");

  useEffect(() => {
    const pending = consumePendingFiles(".pdf,application/pdf", false);
    if (pending?.[0]) {
      void selectFile(pending[0]);
    }
    // Pending-file bootstrapping should only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => revokeObjectUrl(downloadUrl);
  }, [downloadUrl]);

  const fileSize = useMemo(() => (file ? formatFileSize(file.size) : null), [file]);
  const deletePagePreview = useMemo(
    () =>
      pageCount == null
        ? { pages: [] as number[], error: null as string | null }
        : parsePageRangePreview(pagesInput, pageCount, { requireRemaining: true }),
    [pageCount, pagesInput],
  );
  const deletePageSet = useMemo(() => new Set(deletePagePreview.pages), [deletePagePreview.pages]);
  const remainingPages = useMemo(() => {
    if (pageCount == null) return [];
    return Array.from({ length: pageCount }, (_, index) => index + 1).filter(
      (page) => !deletePageSet.has(page),
    );
  }, [deletePageSet, pageCount]);
  const deletePreviewInvalid = Boolean(deletePagePreview.error);

  const resetResultState = (nextFile: File | null) => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setDownloadName(getDownloadName(nextFile));
    setStatus("idle");
    setError(null);
  };

  const selectFile = async (nextFile: File | null) => {
    resetResultState(nextFile);
    setPagesInput("");
    setPageCount(null);
    setProgressNote("Waiting for file");
    setFile(nextFile);

    if (!nextFile) {
      return;
    }

    try {
      const totalPages = await getPdfPageCount(nextFile);
      setPageCount(totalPages);
      setProgressNote("Choose pages to delete");
    } catch (err) {
      setFile(null);
      setStatus("error");
      setError(err instanceof Error ? err.message : "This PDF could not be read.");
      setProgressNote("Failed to read PDF");
    }
  };

  const togglePage = (page: number) => {
    if (status === "processing") return;

    const currentPages = deletePagePreview.error ? [] : deletePagePreview.pages;
    const nextPages = deletePageSet.has(page)
      ? currentPages.filter((deletedPage) => deletedPage !== page)
      : [...currentPages, page];

    setPagesInput(formatPagesForInput(nextPages.sort((left, right) => left - right)));
  };

  const handleSubmit = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }

    if (deletePreviewInvalid && deletePagePreview.error) {
      setStatus("error");
      setError(deletePagePreview.error);
      setProgressNote("Choose valid pages to delete");
      return;
    }

    try {
      trackConversionStarted("delete_pages");
      setStatus("processing");
      setError(null);
      setProgressNote("Removing selected pages...");

      const bytes = await deletePdfPages(file, pagesInput);
      const nextDownloadUrl = createPdfDownloadUrl(bytes);

      revokeObjectUrl(downloadUrl);
      setDownloadUrl(nextDownloadUrl);
      setDownloadName(getDownloadName(file));
      setProgressNote("Your updated PDF is ready.");
      trackConversionCompleted("delete_pages");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete pages failed. Please try again.");
      setStatus("error");
      setProgressNote("Delete pages failed.");
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
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={(event) => {
            void selectFile(event.target.files?.[0] ?? null);
          }}
        />
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition-transform group-hover:scale-110">
          <Upload className="h-7 w-7" />
        </div>
        <p className="responsive-file-name mx-auto text-lg font-medium" title={file?.name}>
          {file ? file.name : "Drop your PDF here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload one PDF and choose the pages you want to remove.
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
                onClick={() => {
                  void selectFile(null);
                }}
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
              <div className="text-base font-semibold">Select pages to delete</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Click any page preview to mark it for removal.
              </div>
            </div>
            <div className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium shadow-soft">
              {deletePagePreview.error ? 0 : deletePagePreview.pages.length} of {pageCount} selected
            </div>
          </div>
          <Input
            value={pagesInput}
            onChange={(event) => setPagesInput(event.target.value)}
            placeholder="Examples: 2, 1,3,5, 2-4"
            className="h-12 rounded-xl border-border bg-card/70 px-4 text-sm shadow-soft"
            disabled={status === "processing"}
          />
          <div className="mt-2 text-xs text-muted-foreground">
            Enter single pages or ranges from 1 to {pageCount}. Example: 1,3,5 or 2-4
          </div>
          {deletePagePreview.error && (
            <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {deletePagePreview.error}
            </div>
          )}
          <div className="mt-5">
            <DeletePageGrid
              file={file}
              pageCount={pageCount}
              selectedPages={deletePageSet}
              disabled={status === "processing"}
              onTogglePage={togglePage}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {[
              { label: "Total pages", value: pageCount },
              {
                label: "Selected for deletion",
                value: deletePagePreview.error ? 0 : deletePagePreview.pages.length,
              },
              { label: "Remaining pages", value: remainingPages.length },
              { label: "Output pages", value: remainingPages.length },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-border/80 bg-card/75 p-3 shadow-soft sm:p-4"
              >
                <div className="text-xl font-semibold tracking-tight sm:text-2xl">{item.value}</div>
                <div className="mt-1 text-[11px] leading-tight text-muted-foreground sm:text-xs">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
          {deletePagePreview.pages.length > 0 && !deletePagePreview.error && (
            <div className="mt-3 rounded-xl bg-card/60 px-3 py-2.5 text-xs text-muted-foreground">
              Deleting:{" "}
              <span className="font-medium text-foreground">
                {formatPageSummary(deletePagePreview.pages)}
              </span>
            </div>
          )}
          {!deletePagePreview.error && deletePagePreview.pages.length === 0 && (
            <div className="mt-3 text-xs text-muted-foreground">
              Type a range or click a page card to mark pages for deletion.
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
          <div className="font-semibold">Pages deleted</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your updated PDF is ready to download.
          </p>
          <div className="mx-auto mt-4 grid max-w-md gap-2 rounded-2xl bg-card/70 p-4 text-left text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <span>Deleted pages</span>
              <span className="font-medium text-foreground">{pagesInput}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Total pages in source</span>
              <span className="font-medium text-foreground">{pageCount}</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="hero" size="lg" asChild>
              <a href={downloadUrl} download={downloadName} title={downloadName}>
                <Download className="h-4 w-4" /> Download Updated PDF
              </a>
            </Button>
            <Button variant="glass" size="lg" onClick={() => void selectFile(null)}>
              Start over
            </Button>
          </div>
        </div>
      )}

      {status !== "done" && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="hero"
            size="xl"
            onClick={handleSubmit}
            disabled={
              status === "processing" ||
              Boolean(file && (deletePreviewInvalid || deletePagePreview.pages.length === 0))
            }
          >
            {file ? (
              <>
                Delete Pages <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" /> Choose PDF
              </>
            )}
          </Button>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" /> Client-side only
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Trash2 className="h-3.5 w-3.5 text-primary" /> Precise page removal
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Fast page removal
        </span>
      </div>
    </>
  );
}
