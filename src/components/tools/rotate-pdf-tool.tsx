import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RotateCw,
  Shield,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfPagePreview } from "@/components/tools/pdf-page-preview";
import { cn } from "@/lib/utils";
import { consumePendingFiles } from "@/lib/pending-file";
import {
  createPdfDownloadUrl,
  revokeObjectUrl,
  rotatePdf,
  type PdfRotation,
} from "@/lib/pdf-rotate";

type ToolStatus = "idle" | "processing" | "done" | "error";

const rotationOptions: PdfRotation[] = [90, 180, 270];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getDownloadName(file: File | null) {
  if (!file) return "rotated.pdf";
  return `${file.name.replace(/\.pdf$/i, "")}-rotated.pdf`;
}

export function RotatePdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("Waiting for file");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("rotated.pdf");
  const [rotation, setRotation] = useState<PdfRotation>(90);

  useEffect(() => {
    const pending = consumePendingFiles(".pdf,application/pdf", false);
    if (pending?.[0]) {
      selectFile(pending[0]);
    }
  }, []);

  useEffect(() => {
    return () => revokeObjectUrl(downloadUrl);
  }, [downloadUrl]);

  const fileSize = useMemo(() => (file ? formatFileSize(file.size) : null), [file]);

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
    setFile(nextFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }

    try {
      setStatus("processing");
      setError(null);
      setProgressNote("Rotating every page...");

      const bytes = await rotatePdf(file, rotation);
      const nextDownloadUrl = createPdfDownloadUrl(bytes);

      revokeObjectUrl(downloadUrl);
      setDownloadUrl(nextDownloadUrl);
      setDownloadName(getDownloadName(file));
      setProgressNote("Your rotated PDF is ready.");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rotate failed. Please try again.");
      setStatus("error");
      setProgressNote("Rotate failed.");
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
          onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
        />
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition-transform group-hover:scale-110">
          <Upload className="h-7 w-7" />
        </div>
        <p className="text-lg font-medium">
          {file ? file.name : "Drop your PDF here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload one PDF, choose a rotation, and download a rotated copy.
        </p>
      </label>

      {file && (
        <div className="mt-5 rounded-2xl glass px-4 py-3 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">{fileSize}</div>
              </div>
            </div>
            {status !== "processing" && (
              <button
                type="button"
                onClick={() => selectFile(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {file && (
        <div className="mt-6 rounded-2xl glass p-5 shadow-card">
          <div className="mb-3 text-sm font-medium">Rotation</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {rotationOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRotation(option)}
                disabled={status === "processing"}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm font-medium shadow-soft transition-all",
                  rotation === option
                    ? "border-primary bg-primary text-primary-foreground shadow-glow"
                    : "border-border bg-card/70 text-foreground hover:border-primary/60",
                )}
              >
                {option}&deg;
              </button>
            ))}
          </div>
        </div>
      )}

      {file && (
        <PdfPagePreview
          file={file}
          pageNumber={1}
          title="PDF preview"
          note={`Preview: pages will rotate by ${rotation}\u00b0`}
          visualRotation={rotation}
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
          <div className="font-semibold">Rotation complete</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your rotated PDF is ready to download.
          </p>
          <div className="mx-auto mt-4 grid max-w-md gap-2 rounded-2xl bg-card/70 p-4 text-left text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <span>Applied rotation</span>
              <span className="font-medium text-foreground">{rotation}&deg;</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="hero" size="lg" asChild>
              <a href={downloadUrl} download={downloadName}>
                <Download className="h-4 w-4" /> Download Rotated PDF
              </a>
            </Button>
            <Button variant="glass" size="lg" onClick={() => selectFile(null)}>
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
            disabled={status === "processing"}
          >
            {file ? (
              <>
                Rotate PDF <ArrowRight className="h-4 w-4" />
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
          <RotateCw className="h-3.5 w-3.5 text-primary" /> All pages
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Powered by pdf-lib
        </span>
      </div>
    </>
  );
}
