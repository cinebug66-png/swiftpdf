import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Shield,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { consumePendingFiles } from "@/lib/pending-file";
import { createPdfDownloadUrl, mergePdfs, revokeObjectUrl } from "@/lib/pdf-merge";

type ToolStatus = "idle" | "processing" | "done" | "error";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function MergePdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("Add at least two PDF files");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    const pending = consumePendingFiles(".pdf,application/pdf", true);
    if (pending?.length) {
      setFiles(pending.filter(isPdfFile));
    }
  }, []);

  useEffect(() => {
    return () => {
      revokeObjectUrl(downloadUrl);
    };
  }, [downloadUrl]);

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const canMerge = files.length >= 2 && status !== "processing";
  const getReadyNote = (count: number) =>
    count >= 2 ? "Ready to merge your PDFs" : "Add at least two PDF files";

  const resetResultState = () => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setStatus("idle");
    setError(null);
    setProgressNote(getReadyNote(files.length));
  };

  const appendFiles = (incoming: FileList | File[] | null | undefined) => {
    if (!incoming?.length) return;

    const nextFiles = Array.from(incoming);
    const invalidFile = nextFiles.find((file) => !isPdfFile(file));

    if (invalidFile) {
      revokeObjectUrl(downloadUrl);
      setDownloadUrl(null);
      setStatus("error");
      setError(`"${invalidFile.name}" is not a PDF. Please upload PDF files only.`);
      setProgressNote("Only PDF files can be merged");
      return;
    }

    const nextCount = files.length + nextFiles.length;
    setFiles((current) => [...current, ...nextFiles]);
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setStatus("idle");
    setError(null);
    setProgressNote(getReadyNote(nextCount));
  };

  const removeFile = (index: number) => {
    const nextCount = files.length - 1;
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setStatus("idle");
    setError(null);
    setProgressNote(getReadyNote(nextCount));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      if (files.length === 0) {
        inputRef.current?.click();
      }
      return;
    }

    try {
      setStatus("processing");
      setError(null);
      setProgressNote(`Merging ${files.length} PDF files...`);

      const mergedBytes = await mergePdfs(files);
      const nextDownloadUrl = createPdfDownloadUrl(mergedBytes);

      revokeObjectUrl(downloadUrl);
      setDownloadUrl(nextDownloadUrl);
      setStatus("done");
      setProgressNote("Your merged PDF is ready");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Merge failed. Please try again with valid PDF files.",
      );
      setProgressNote("Merge failed");
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
          appendFiles(event.dataTransfer.files);
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
          multiple
          className="sr-only"
          onChange={(event) => {
            appendFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition-transform group-hover:scale-110">
          <Upload className="h-7 w-7" />
        </div>
        <p className="text-lg font-medium">
          {files.length ? `${files.length} PDF files selected` : "Drop your PDFs here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload multiple PDFs and merge them into a single document right in your browser.
        </p>
      </label>

      {files.length > 0 && (
        <div className="mt-5 rounded-2xl glass px-4 py-3 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-medium">Uploaded PDFs</div>
            <div className="text-xs text-muted-foreground">
              {files.length} files | {formatFileSize(totalSize)}
            </div>
          </div>
          <div className="grid gap-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl bg-card/70 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                {status !== "processing" && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
            ))}
          </div>
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

      {status === "done" && (
        <div className="mt-6 rounded-2xl glass p-6 text-center shadow-glow">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="font-semibold">Merge complete</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your merged PDF is ready to download.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {downloadUrl && (
              <Button variant="hero" size="lg" asChild>
                <a href={downloadUrl} download="merged.pdf">
                  <Download className="h-4 w-4" /> Download Again
                </a>
              </Button>
            )}
            <Button variant="glass" size="lg" onClick={resetResultState}>
              Merge more PDFs
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Button variant="hero" size="xl" onClick={handleMerge} disabled={!canMerge}>
          {status === "processing" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Merging PDFs
            </>
          ) : files.length > 0 ? (
            <>
              Merge PDFs <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" /> Choose PDFs
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" /> Client-side only
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Powered by pdf-lib
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Auto-download
        </span>
      </div>
    </>
  );
}
