import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  LockOpen,
  Shield,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackConversionCompleted, trackConversionStarted } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { consumePendingFiles } from "@/lib/pending-file";
import { revokeDownloadUrl, unlockPdf } from "@/lib/cloudconvert";
import { LIMITED_TOOL_KEYS } from "@/lib/daily-usage-limits";
import { useDailyUsageLimit } from "@/hooks/use-daily-usage-limit";

type ToolStatus = "idle" | "processing" | "done" | "error";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function UnlockPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("Waiting for file");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("unlocked.pdf");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const usageLimit = useDailyUsageLimit(LIMITED_TOOL_KEYS.unlockPdf);

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
    setDownloadName("unlocked.pdf");
    setError(null);
    setStatus("idle");
    setProgressNote("Waiting for file");
    setFile(nextFile);
  };

  const clearPassword = () => {
    setPassword("");
    setShowPassword(false);
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

    if (!password) {
      setStatus("error");
      setError("Enter the PDF password.");
      setProgressNote("Password required.");
      return;
    }

    try {
      trackConversionStarted("unlock_pdf");
      setStatus("processing");
      setError(null);
      setProgressNote("Uploading your protected PDF securely...");

      const result = await unlockPdf(file, password, (job) => {
        const runningTask = job.tasks.find((task) => task.status === "processing");
        if (runningTask?.operation === "pdf/decrypt") {
          setProgressNote("Removing password protection...");
        } else if (runningTask?.operation === "export/url") {
          setProgressNote("Preparing your unlocked PDF download...");
        }
      });

      revokeDownloadUrl(downloadUrl);
      setDownloadUrl(result.downloadUrl);
      setDownloadName(result.filename);
      setProgressNote("Your unlocked PDF is ready.");
      usageLimit.recordSuccessfulUse();
      trackConversionCompleted("unlock_pdf");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed. Please try again.");
      setStatus("error");
      setProgressNote("Unlock failed.");
    } finally {
      clearPassword();
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
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
        />
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition-transform group-hover:scale-110">
          <Upload className="h-7 w-7" />
        </div>
        <p className="responsive-file-name mx-auto text-lg font-medium" title={file?.name}>
          {file ? file.name : "Drop your PDF here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload one password-protected PDF, enter its password, and download an unlocked copy.
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

      {file && (
        <div className="mt-6 rounded-2xl glass p-5 shadow-card">
          <div className="mb-3 text-sm font-medium">PDF password</div>
          <div className="relative">
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="h-12 rounded-xl border-border bg-card/70 px-4 pr-12 text-sm shadow-soft"
              disabled={status === "processing"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={status === "processing"}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Enter the password currently required to open this PDF.
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
          <div className="font-semibold">Unlock complete</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Your unlocked PDF is ready to download.
          </p>
          <div className="mx-auto mt-4 grid max-w-md gap-2 rounded-2xl bg-card/70 p-4 text-left text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <span>Password protection</span>
              <span className="font-medium text-foreground">Removed</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Original size</span>
              <span className="font-medium text-foreground">{fileSize}</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="hero" size="lg" asChild>
              <a href={downloadUrl} download={downloadName} title={downloadName}>
                <Download className="h-4 w-4" /> Download Unlocked PDF
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
                  usageLimit.remainingUses === 1 ? "use" : "uses"
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
                Unlock PDF <ArrowRight className="h-4 w-4" />
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
          <Shield className="h-3.5 w-3.5 text-primary" /> Secure decrypt
        </span>
        <span className="inline-flex items-center gap-1.5">
          <LockOpen className="h-3.5 w-3.5 text-primary" /> Password removed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Secure unlocking
        </span>
      </div>
    </>
  );
}
