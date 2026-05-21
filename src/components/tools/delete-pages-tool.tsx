import { useEffect, useMemo, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { consumePendingFiles } from "@/lib/pending-file";
import {
  createPdfDownloadUrl,
  deletePdfPages,
  getPdfPageCount,
  revokeObjectUrl,
} from "@/lib/pdf-delete-pages";

type ToolStatus = "idle" | "processing" | "done" | "error";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getDownloadName(file: File | null) {
  if (!file) return "updated.pdf";
  return `${file.name.replace(/\.pdf$/i, "")}-updated.pdf`;
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

  const handleSubmit = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }

    try {
      setStatus("processing");
      setError(null);
      setProgressNote("Removing selected pages...");

      const bytes = await deletePdfPages(file, pagesInput);
      const nextDownloadUrl = createPdfDownloadUrl(bytes);

      revokeObjectUrl(downloadUrl);
      setDownloadUrl(nextDownloadUrl);
      setDownloadName(getDownloadName(file));
      setProgressNote("Your updated PDF is ready.");
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
        <p className="text-lg font-medium">
          {file ? file.name : "Drop your PDF here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload one PDF and choose the pages you want to remove.
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
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {file && pageCount != null && (
        <div className="mt-6 rounded-2xl glass p-5 shadow-card">
          <div className="mb-3 text-sm font-medium">Pages to delete</div>
          <Input
            value={pagesInput}
            onChange={(event) => setPagesInput(event.target.value)}
            placeholder="Examples: 2, 1,3,5, 2-4"
            className="h-12 rounded-xl border-border bg-card/70 px-4 text-sm shadow-soft"
            disabled={status === "processing"}
          />
          <div className="mt-3 text-xs text-muted-foreground">
            Enter single pages or ranges from 1 to {pageCount}. Example: 1,3,5 or 2-4
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
              <a href={downloadUrl} download={downloadName}>
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
            disabled={status === "processing"}
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
          <Zap className="h-3.5 w-3.5 text-primary" /> Powered by pdf-lib
        </span>
      </div>
    </>
  );
}
