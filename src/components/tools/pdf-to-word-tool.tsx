import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { consumePendingFiles } from "@/lib/pending-file";
import { convertPdfToWord, revokeDownloadUrl } from "@/lib/cloudconvert";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Shield,
  Upload,
  Zap,
} from "lucide-react";

type ToolStatus = "idle" | "processing" | "done" | "error";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function PdfToWordTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("Waiting for file");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("converted.docx");

  useEffect(() => {
    const pending = consumePendingFiles(".pdf,application/pdf", false);
    if (pending?.[0]) {
      setFile(pending[0]);
    }
  }, []);

  useEffect(() => {
    return () => revokeDownloadUrl(downloadUrl);
  }, [downloadUrl]);

  const fileSize = useMemo(() => (file ? formatFileSize(file.size) : null), [file]);

  const selectFile = (nextFile: File | null) => {
    revokeDownloadUrl(downloadUrl);
    setDownloadUrl(null);
    setDownloadName("converted.docx");
    setError(null);
    setStatus("idle");
    setProgressNote("Waiting for file");
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
      setProgressNote("Uploading your PDF to CloudConvert...");

      const result = await convertPdfToWord(file, (job) => {
        const runningTask = job.tasks.find((task) => task.status === "processing");
        if (runningTask?.operation === "convert") {
          setProgressNote("Converting PDF to DOCX...");
        } else if (runningTask?.operation === "export/url") {
          setProgressNote("Preparing your Word download...");
        }
      });

      revokeDownloadUrl(downloadUrl);
      setDownloadUrl(result.downloadUrl);
      setDownloadName(result.filename);
      setProgressNote("Your Word file is ready.");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed. Please try again.");
      setStatus("error");
      setProgressNote("Conversion failed.");
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
          Upload a PDF and CloudConvert will return an editable DOCX file.
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
          <div className="font-semibold">Conversion complete</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your Word file is ready to download.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="hero" size="lg" asChild>
              <a href={downloadUrl} download={downloadName}>
                <Download className="h-4 w-4" /> Download Word File
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
          <Button variant="hero" size="xl" onClick={handleSubmit}>
            {file ? (
              <>
                Convert to Word <ArrowRight className="h-4 w-4" />
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
          <Shield className="h-3.5 w-3.5 text-primary" /> Secure
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> CloudConvert REST API
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> DOCX output
        </span>
      </div>
    </>
  );
}
