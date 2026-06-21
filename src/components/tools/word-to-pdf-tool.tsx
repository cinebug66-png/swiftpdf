import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { consumePendingFiles } from "@/lib/pending-file";
import { convertWordToPdf, revokeDownloadUrl } from "@/lib/cloudconvert";
import { LIMITED_TOOL_KEYS } from "@/lib/daily-usage-limits";
import { useDailyUsageLimit } from "@/hooks/use-daily-usage-limit";
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

const ACCEPTED_WORD_TYPES =
  ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function isWordFile(file: File) {
  return /\.(docx?)$/i.test(file.name);
}

export function WordToPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("Waiting for file");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("converted.pdf");
  const usageLimit = useDailyUsageLimit(LIMITED_TOOL_KEYS.wordToPdf);

  useEffect(() => {
    const pending = consumePendingFiles(ACCEPTED_WORD_TYPES, false);
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
    setDownloadName("converted.pdf");
    setError(null);
    setStatus("idle");
    setProgressNote("Waiting for file");

    if (nextFile && !isWordFile(nextFile)) {
      setFile(null);
      setStatus("error");
      setError("Please upload a DOC or DOCX file.");
      return;
    }

    setFile(nextFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }

    if (!usageLimit.canUse) {
      setStatus("error");
      setError("Free daily limit reached. Please try again tomorrow.");
      return;
    }

    try {
      setStatus("processing");
      setError(null);
      setProgressNote("Preparing your Word file for conversion...");

      const result = await convertWordToPdf(file, (job) => {
        const runningTask = job.tasks.find((task) => task.status === "processing");
        if (runningTask?.operation === "convert") {
          setProgressNote("Converting Word document to PDF...");
        } else if (runningTask?.operation === "export/url") {
          setProgressNote("Preparing your PDF download...");
        }
      });

      revokeDownloadUrl(downloadUrl);
      setDownloadUrl(result.downloadUrl);
      setDownloadName(result.filename);
      setProgressNote("Your PDF is ready.");
      usageLimit.recordSuccessfulUse();
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
          accept={ACCEPTED_WORD_TYPES}
          className="sr-only"
          onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
        />
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition-transform group-hover:scale-110">
          <Upload className="h-7 w-7" />
        </div>
        <p className="responsive-file-name mx-auto text-lg font-medium" title={file?.name}>
          {file ? file.name : "Drop your Word file here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a DOC or DOCX file and download a clean PDF.
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
                <div className="text-xs text-muted-foreground">{fileSize}</div>
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
          <p className="mt-1 text-sm text-muted-foreground">Your PDF is ready to download.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="hero" size="lg" asChild>
              <a href={downloadUrl} download={downloadName} title={downloadName}>
                <Download className="h-4 w-4" /> Download PDF
              </a>
            </Button>
            <Button variant="glass" size="lg" onClick={() => selectFile(null)}>
              Start over
            </Button>
          </div>
        </div>
      )}

      {status !== "done" && (
        <div className="mt-6 flex flex-col items-center">
          <p
            className={cn(
              "mb-2 text-center text-xs text-muted-foreground",
              !usageLimit.canUse && "text-destructive",
            )}
            aria-live="polite"
          >
            {usageLimit.canUse
              ? `${usageLimit.remainingUses} free ${
                  usageLimit.remainingUses === 1 ? "conversion" : "conversions"
                } remaining today`
              : "Free daily limit reached. Please try again tomorrow."}
          </p>
          <Button
            variant="hero"
            size="xl"
            onClick={handleSubmit}
            disabled={status === "processing" || (Boolean(file) && !usageLimit.canUse)}
          >
            {file ? (
              <>
                Convert to PDF <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" /> Choose Word File
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
          <Zap className="h-3.5 w-3.5 text-primary" /> Fast conversion
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> PDF output
        </span>
      </div>
    </>
  );
}
