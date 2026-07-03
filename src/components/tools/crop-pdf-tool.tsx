import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crop,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Shield,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PdfPagePreview } from "@/components/tools/pdf-page-preview";
import { trackConversionCompleted, trackConversionStarted } from "@/lib/analytics";
import { consumePendingFiles } from "@/lib/pending-file";
import {
  createPdfDownloadUrl,
  cropPdf,
  getPdfPageCount,
  normalizeCropMargins,
  revokeObjectUrl,
  validateCropMargins,
  type CropMargins,
  type CropScope,
} from "@/lib/pdf-crop";
import { cn } from "@/lib/utils";

type ToolStatus = "idle" | "processing" | "done" | "error";

const defaultMargins: CropMargins = { top: 0, bottom: 0, left: 0, right: 0 };
const presets: { label: string; margins: CropMargins }[] = [
  { label: "Remove margins", margins: { top: 8, bottom: 8, left: 8, right: 8 } },
  { label: "Center crop", margins: { top: 12, bottom: 12, left: 12, right: 12 } },
  { label: "A4 safe area", margins: { top: 5, bottom: 5, left: 6, right: 6 } },
  { label: "Reset", margins: defaultMargins },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getDownloadName(file: File | null) {
  if (!file) return "cropped.pdf";
  return `${file.name.replace(/\.pdf$/i, "")}-cropped.pdf`;
}

function MarginControl({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-2xl border border-border/80 bg-card/70 p-3 shadow-soft">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {value}%
        </span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={45}
        step={1}
        disabled={disabled}
        onValueChange={([nextValue]) => onChange(nextValue ?? 0)}
        aria-label={`${label} crop margin`}
        className="py-2"
      />
    </label>
  );
}

export function CropPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("Waiting for file");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("cropped.pdf");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scope, setScope] = useState<CropScope>("all");
  const [margins, setMargins] = useState<CropMargins>(defaultMargins);

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
  const normalizedMargins = useMemo(() => normalizeCropMargins(margins), [margins]);
  const cropArea = useMemo(() => {
    const width = 100 - normalizedMargins.left - normalizedMargins.right;
    const height = 100 - normalizedMargins.top - normalizedMargins.bottom;
    return { width, height };
  }, [normalizedMargins]);

  const resetResultState = (nextFile: File | null) => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setDownloadName(getDownloadName(nextFile));
    setStatus("idle");
    setError(null);
  };

  const selectFile = async (nextFile: File | null) => {
    resetResultState(nextFile);
    setPageCount(null);
    setCurrentPage(1);
    setProgressNote("Waiting for file");
    setFile(nextFile);

    if (!nextFile) return;

    try {
      const totalPages = await getPdfPageCount(nextFile);
      setPageCount(totalPages);
      setProgressNote("Adjust the crop area");
    } catch (err) {
      setFile(null);
      setStatus("error");
      setError(err instanceof Error ? err.message : "This PDF could not be read.");
      setProgressNote("Failed to read PDF");
    }
  };

  const updateMargin = (key: keyof CropMargins, value: number) => {
    resetResultState(file);
    setMargins((current) => normalizeCropMargins({ ...current, [key]: value }));
  };

  const applyPreset = (nextMargins: CropMargins) => {
    resetResultState(file);
    setMargins(nextMargins);
  };

  const resetCrop = () => applyPreset(defaultMargins);

  const handleSubmit = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }

    try {
      validateCropMargins(margins);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Crop area is invalid.");
      setProgressNote("Adjust the crop area");
      return;
    }

    try {
      trackConversionStarted("crop_pdf");
      setStatus("processing");
      setError(null);
      setProgressNote(scope === "all" ? "Cropping every page..." : `Cropping page ${currentPage}...`);

      const bytes = await cropPdf(file, { margins, scope, currentPage });
      const nextDownloadUrl = createPdfDownloadUrl(bytes);

      revokeObjectUrl(downloadUrl);
      setDownloadUrl(nextDownloadUrl);
      setDownloadName(getDownloadName(file));
      setProgressNote("Your cropped PDF is ready.");
      trackConversionCompleted("crop_pdf");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crop PDF failed. Please try again.");
      setStatus("error");
      setProgressNote("Crop failed.");
    }
  };

  const canGoPrevious = currentPage > 1 && status !== "processing";
  const canGoNext = pageCount != null && currentPage < pageCount && status !== "processing";

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
          "group relative block cursor-pointer rounded-3xl p-8 text-center transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 sm:p-12",
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
          Upload one PDF, preview the crop area, and download a trimmed copy.
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
                onClick={() => void selectFile(null)}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {file && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
          <div className="min-w-0 rounded-3xl glass p-4 shadow-card sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-base font-semibold">Crop preview</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  The bright area is kept in the output PDF.
                </div>
              </div>
              {pageCount != null && pageCount > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={!canGoPrevious}
                    aria-label="Previous page"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-20 text-center text-xs font-medium text-muted-foreground">
                    {currentPage} / {pageCount}
                  </div>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(pageCount ?? page, page + 1))
                    }
                    disabled={!canGoNext}
                    aria-label="Next page"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <PdfPagePreview
              file={file}
              pageNumber={currentPage}
              title="Page preview"
              note={`${Math.max(cropArea.width, 0)}% width x ${Math.max(cropArea.height, 0)}% height kept`}
              className="mt-0 border border-border/70 bg-card/50 shadow-none"
              onPageCountChange={setPageCount}
              overlay={() => (
                <div className="pointer-events-none absolute inset-0 rounded-xl">
                  <div className="absolute inset-0 rounded-xl bg-slate-950/45" />
                  <div
                    className="absolute rounded-lg border-2 border-cyan-300 bg-white/5 shadow-[0_0_0_9999px_rgba(2,6,23,0.18)]"
                    style={{
                      left: `${normalizedMargins.left}%`,
                      right: `${normalizedMargins.right}%`,
                      top: `${normalizedMargins.top}%`,
                      bottom: `${normalizedMargins.bottom}%`,
                    }}
                  >
                    <div className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border border-white bg-cyan-400 shadow-soft" />
                    <div className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border border-white bg-cyan-400 shadow-soft" />
                    <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full border border-white bg-cyan-400 shadow-soft" />
                    <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full border border-white bg-cyan-400 shadow-soft" />
                  </div>
                </div>
              )}
            />
          </div>

          <aside className="min-w-0 rounded-3xl glass p-4 shadow-card sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold">Crop settings</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Use margins to shape the visible page area.
                </div>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
                <Crop className="h-4 w-4" />
              </span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              {(["current", "all"] as CropScope[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScope(option)}
                  disabled={status === "processing"}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-medium shadow-soft transition-[background-color,border-color,box-shadow,color] duration-200",
                    scope === option
                      ? "border-primary bg-primary text-primary-foreground shadow-glow"
                      : "border-border bg-card/70 text-foreground hover:border-primary/60",
                  )}
                >
                  {option === "current" ? "Current page" : "All pages"}
                </button>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.margins)}
                  disabled={status === "processing"}
                  className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft transition-colors hover:border-primary/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-60"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3">
              <MarginControl
                label="Top"
                value={normalizedMargins.top}
                disabled={status === "processing"}
                onChange={(value) => updateMargin("top", value)}
              />
              <MarginControl
                label="Bottom"
                value={normalizedMargins.bottom}
                disabled={status === "processing"}
                onChange={(value) => updateMargin("bottom", value)}
              />
              <MarginControl
                label="Left"
                value={normalizedMargins.left}
                disabled={status === "processing"}
                onChange={(value) => updateMargin("left", value)}
              />
              <MarginControl
                label="Right"
                value={normalizedMargins.right}
                disabled={status === "processing"}
                onChange={(value) => updateMargin("right", value)}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-card/60 p-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Width kept</div>
                <div className="font-semibold">{Math.max(cropArea.width, 0)}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Height kept</div>
                <div className="font-semibold">{Math.max(cropArea.height, 0)}%</div>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-[auto_1fr] lg:grid-cols-1">
              <Button variant="glass" size="lg" onClick={resetCrop} disabled={status === "processing"}>
                <RotateCcw className="h-4 w-4" /> Reset crop
              </Button>
              <Button
                variant="hero"
                size="lg"
                onClick={handleSubmit}
                disabled={status === "processing"}
              >
                {status === "processing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Cropping
                  </>
                ) : (
                  <>
                    Crop PDF <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </aside>
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
          <div className="font-semibold">Crop complete</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your cropped PDF is ready to download.
          </p>
          <div className="mx-auto mt-4 grid max-w-md gap-2 rounded-2xl bg-card/70 p-4 text-left text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <span>Scope</span>
              <span className="font-medium text-foreground">
                {scope === "all" ? "All pages" : `Page ${currentPage}`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Margins</span>
              <span className="font-medium text-foreground">
                {normalizedMargins.top}/{normalizedMargins.right}/{normalizedMargins.bottom}/
                {normalizedMargins.left}%
              </span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="hero" size="lg" asChild>
              <a href={downloadUrl} download={downloadName} title={downloadName}>
                <Download className="h-4 w-4" /> Download Cropped PDF
              </a>
            </Button>
            <Button variant="glass" size="lg" onClick={() => void selectFile(null)}>
              Start over
            </Button>
          </div>
        </div>
      )}

      {!file && status !== "error" && (
        <div className="mt-6 flex justify-center">
          <Button variant="hero" size="xl" onClick={() => inputRef.current?.click()}>
            <Upload className="h-5 w-5" /> Choose PDF
          </Button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:gap-6">
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" /> Client-side only
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Crop className="h-3.5 w-3.5 text-primary" /> Visual crop overlay
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Fast PDF crop
        </span>
      </div>
    </>
  );
}
