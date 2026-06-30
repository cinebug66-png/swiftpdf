import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Hash,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Shield,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PdfPagePreview } from "@/components/tools/pdf-page-preview";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { consumePendingFiles } from "@/lib/pending-file";
import {
  addPageNumbersToPdf,
  createPdfDownloadUrl,
  formatPageNumberText,
  getPageNumberPosition,
  getPageNumberTextWidth,
  revokeObjectUrl,
  type PageNumberFormat,
  type PageNumberOptions,
  type PageNumberPosition,
} from "@/lib/pdf-page-numbers";
import { cn } from "@/lib/utils";

type ToolStatus = "idle" | "processing" | "done" | "error";

const ACCEPTED_PDF_TYPES = ".pdf,application/pdf";

const positionOptions: { value: PageNumberPosition; label: string }[] = [
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "top-center", label: "Top center" },
  { value: "top-right", label: "Top right" },
  { value: "top-left", label: "Top left" },
];

const formatOptions: { value: PageNumberFormat; label: string }[] = [
  { value: "number", label: "1" },
  { value: "page-number", label: "Page 1" },
  { value: "page-number-total", label: "Page 1 of 10" },
];

const defaultOptions: PageNumberOptions = {
  position: "bottom-center",
  format: "number",
  fontSize: 12,
  color: "#111827",
  margin: 36,
  startNumber: 1,
  skipFirstPage: false,
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function isPdfFile(file: File | null | undefined): file is File {
  return Boolean(
    file &&
    typeof file.name === "string" &&
    typeof file.arrayBuffer === "function" &&
    (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")),
  );
}

function getDownloadName(file: File | null) {
  if (!file) return "numbered.pdf";
  return `${file.name.replace(/\.pdf$/i, "")}-numbered.pdf`;
}

function normalizeHexColor(value: string) {
  const normalized = value.trim().replace(/^#/, "");
  if (!/^[\da-f]{6}$/i.test(normalized)) return null;
  return `#${normalized.toUpperCase()}`;
}

function getPreviewText(options: PageNumberOptions, pageCount: number) {
  const previewPageIndex = options.skipFirstPage && pageCount > 1 ? 1 : 0;
  const skippedOffset = options.skipFirstPage && pageCount > 1 ? 1 : 0;
  const pageNumber = options.startNumber + previewPageIndex - skippedOffset;
  return formatPageNumberText(pageNumber, Math.max(pageCount, 1), options.format);
}

export function AddPageNumbersTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("Waiting for file");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("numbered.pdf");
  const [pageCount, setPageCount] = useState(0);
  const [options, setOptions] = useState<PageNumberOptions>(defaultOptions);

  useEffect(() => {
    const pending = consumePendingFiles(ACCEPTED_PDF_TYPES, false);
    if (pending?.[0]) {
      selectFile(pending[0]);
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
  const previewPageNumber = options.skipFirstPage && pageCount > 1 ? 2 : 1;
  const previewText = getPreviewText(options, pageCount);
  const canProcess = Boolean(file && status !== "processing");

  const updateOptions = (patch: Partial<PageNumberOptions>) => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setStatus((current) => (current === "done" ? "idle" : current));
    setOptions((current) => ({ ...current, ...patch }));
  };

  const updateColor = (value: string) => {
    const nextColor = normalizeHexColor(value);
    if (nextColor) {
      updateOptions({ color: nextColor });
    }
  };

  const updateStartNumber = (value: string | number) => {
    const numericValue = typeof value === "number" ? value : Number(value);
    const nextValue = Number.isFinite(numericValue) && numericValue >= 1 ? numericValue : 1;
    updateOptions({ startNumber: Math.floor(nextValue) });
  };

  const resetResultState = (nextFile: File | null) => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setDownloadName(getDownloadName(nextFile));
    setStatus("idle");
    setError(null);
    setProgressNote("Waiting for file");
  };

  const selectFile = (nextFile: File | null) => {
    resetResultState(nextFile);
    setPageCount(0);

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
  };

  const resetAll = () => {
    setOptions(defaultOptions);
    selectFile(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }

    try {
      trackAnalyticsEvent("page_numbers_started", { tool_name: "add_page_numbers" });
      setStatus("processing");
      setError(null);
      setProgressNote("Adding page numbers...");

      const bytes = await addPageNumbersToPdf(file, options);
      const nextDownloadUrl = createPdfDownloadUrl(bytes);

      revokeObjectUrl(downloadUrl);
      setDownloadUrl(nextDownloadUrl);
      setDownloadName(getDownloadName(file));
      setProgressNote("Your numbered PDF is ready.");
      setStatus("done");
      trackAnalyticsEvent("page_numbers_completed", {
        tool_name: "add_page_numbers",
        page_count: String(pageCount || ""),
      });

      const anchor = window.document.createElement("a");
      anchor.href = nextDownloadUrl;
      anchor.download = getDownloadName(file);
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      trackAnalyticsEvent("page_numbers_download", {
        tool_name: "add_page_numbers",
        page_count: String(pageCount || ""),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add page numbers. Please try again.",
      );
      setStatus("error");
      setProgressNote("Page numbering failed.");
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
          selectFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "group relative block cursor-pointer rounded-3xl p-10 text-center transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 sm:p-16",
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
            selectFile(event.target.files?.[0] ?? null);
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
          Upload one PDF, preview the numbering, and download a numbered copy.
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
                  {pageCount > 0 ? ` | ${pageCount} pages` : ""}
                </div>
              </div>
            </div>
            {status !== "processing" && (
              <button
                type="button"
                onClick={() => selectFile(null)}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {file && (
        <div className="mt-6 rounded-2xl glass p-5 shadow-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-medium">Page number settings</div>
            <div className="text-xs text-muted-foreground">Preview updates before download</div>
          </div>

          <div className="grid gap-5">
            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground">Position</div>
              <div className="grid gap-2 sm:grid-cols-3">
                {positionOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => updateOptions({ position: item.value })}
                    disabled={status === "processing"}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm font-medium shadow-soft transition-[background-color,border-color,box-shadow,color] duration-200",
                      options.position === item.value
                        ? "border-primary bg-primary text-primary-foreground shadow-glow"
                        : "border-border bg-card/70 hover:border-primary/60",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-medium text-muted-foreground">Format</div>
              <div className="grid gap-2 sm:grid-cols-3">
                {formatOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => updateOptions({ format: item.value })}
                    disabled={status === "processing"}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm font-medium shadow-soft transition-[background-color,border-color,box-shadow,color] duration-200",
                      options.format === item.value
                        ? "border-primary bg-primary text-primary-foreground shadow-glow"
                        : "border-border bg-card/70 hover:border-primary/60",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                <div className="mb-2 flex items-center justify-between">
                  <span>Font size</span>
                  <span className="text-foreground">{options.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={36}
                  value={options.fontSize}
                  onChange={(event) => updateOptions({ fontSize: Number(event.target.value) })}
                  className="w-full accent-primary"
                  disabled={status === "processing"}
                />
              </label>

              <label className="text-xs text-muted-foreground">
                <div className="mb-2 flex items-center justify-between">
                  <span>Margin</span>
                  <span className="text-foreground">{options.margin}px</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={96}
                  value={options.margin}
                  onChange={(event) => updateOptions({ margin: Number(event.target.value) })}
                  className="w-full accent-primary"
                  disabled={status === "processing"}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-xs text-muted-foreground">
                <div className="mb-2">Text color</div>
                <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-card/70 px-3 shadow-soft transition-colors focus-within:border-primary/60">
                  <button
                    type="button"
                    onClick={() => colorInputRef.current?.click()}
                    disabled={status === "processing"}
                    className="h-6 w-6 shrink-0 rounded-lg border border-border shadow-soft disabled:pointer-events-none disabled:opacity-60"
                    style={{ backgroundColor: options.color }}
                    aria-label="Choose page number text color"
                  />
                  <Input
                    value={options.color.toUpperCase()}
                    onChange={(event) => updateColor(event.target.value)}
                    onBlur={(event) => updateColor(event.target.value)}
                    className="h-8 border-0 bg-transparent px-0 font-mono text-xs shadow-none focus-visible:ring-0"
                    disabled={status === "processing"}
                    aria-label="Page number text color hex value"
                  />
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={options.color}
                    onChange={(event) => updateColor(event.target.value)}
                    className="sr-only"
                    tabIndex={-1}
                    disabled={status === "processing"}
                  />
                </div>
              </label>

              <label className="text-xs text-muted-foreground sm:col-span-1">
                <div className="mb-2">Start numbering from</div>
                <div className="flex h-11 items-center overflow-hidden rounded-xl border border-border bg-card/70 shadow-soft transition-colors focus-within:border-primary/60">
                  <button
                    type="button"
                    onClick={() => updateStartNumber(options.startNumber - 1)}
                    disabled={status === "processing" || options.startNumber <= 1}
                    className="grid h-full w-10 shrink-0 place-items-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                    aria-label="Decrease start number"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <Input
                    type="number"
                    min={1}
                    max={9999}
                    value={options.startNumber}
                    onChange={(event) => updateStartNumber(event.target.value)}
                    onBlur={(event) => updateStartNumber(event.target.value)}
                    className="h-full border-0 bg-transparent px-2 text-center shadow-none focus-visible:ring-0"
                    disabled={status === "processing"}
                    aria-label="Start numbering from"
                  />
                  <button
                    type="button"
                    onClick={() => updateStartNumber(options.startNumber + 1)}
                    disabled={status === "processing"}
                    className="grid h-full w-10 shrink-0 place-items-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                    aria-label="Increase start number"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 text-sm shadow-soft">
                <input
                  type="checkbox"
                  checked={options.skipFirstPage}
                  onChange={(event) => updateOptions({ skipFirstPage: event.target.checked })}
                  className="h-4 w-4 accent-primary"
                  disabled={status === "processing"}
                />
                <span>Skip first page</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {file && (
        <PdfPagePreview
          file={file}
          pageNumber={previewPageNumber}
          title="Numbering preview"
          note={
            options.skipFirstPage
              ? "First page is skipped. Preview shows the first numbered page."
              : "Preview shows how page numbers will appear before download."
          }
          onPageCountChange={setPageCount}
          overlay={(renderSize) => {
            const pageWidth = renderSize.width / renderSize.scale;
            const pageHeight = renderSize.height / renderSize.scale;
            const textWidth = getPageNumberTextWidth(previewText, options.fontSize);
            const previewPosition = getPageNumberPosition({
              position: options.position,
              pageWidth,
              pageHeight,
              margin: options.margin,
              textWidth,
              fontSize: options.fontSize,
              scale: renderSize.scale,
            });

            return (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                <svg
                  className="absolute inset-0 h-full w-full overflow-visible"
                  viewBox={`0 0 ${renderSize.width} ${renderSize.height}`}
                  aria-hidden="true"
                >
                  <text
                    x={previewPosition.previewX}
                    y={previewPosition.previewY}
                    fill={options.color}
                    fontFamily="Helvetica, Arial, sans-serif"
                    fontSize={options.fontSize * renderSize.scale}
                    fontWeight={400}
                  >
                    {previewText}
                  </text>
                </svg>
              </div>
            );
          }}
        />
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
          <div className="font-semibold">Page numbers added</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your numbered PDF is ready to download.
          </p>
          <div className="mx-auto mt-4 grid max-w-md gap-2 rounded-2xl bg-card/70 p-4 text-left text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <span>Format</span>
              <span className="font-medium text-foreground">{previewText}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Position</span>
              <span className="font-medium text-foreground">
                {positionOptions.find((item) => item.value === options.position)?.label}
              </span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="hero" size="lg" asChild>
              <a
                href={downloadUrl}
                download={downloadName}
                title={downloadName}
                onClick={() =>
                  trackAnalyticsEvent("page_numbers_download", {
                    tool_name: "add_page_numbers",
                    page_count: String(pageCount || ""),
                  })
                }
              >
                <Download className="h-4 w-4" /> Download Numbered PDF
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
          <Button variant="hero" size="xl" onClick={handleSubmit} disabled={!canProcess}>
            {file ? (
              <>
                Add page numbers <ArrowRight className="h-4 w-4" />
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
          <Hash className="h-3.5 w-3.5 text-primary" /> Custom numbering
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> No upload required
        </span>
      </div>
    </>
  );
}
