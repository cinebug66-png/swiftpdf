import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileImage,
  Loader2,
  Shield,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackConversionCompleted, trackConversionStarted } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { consumePendingFiles } from "@/lib/pending-file";
import { createPdfDownloadUrl, createPdfFromImages, revokeObjectUrl } from "@/lib/jpg-to-pdf";

type ToolStatus = "idle" | "processing" | "done" | "error";

const ACCEPTED_IMAGE_TYPES = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function isSupportedImage(file: File) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return /\.(jpe?g|png|webp)$/.test(name) || /^image\/(jpeg|png|webp)$/.test(type);
}

function getDownloadName(files: File[]) {
  if (files.length === 1) {
    return files[0].name.replace(/\.[^.]+$/, "") + ".pdf";
  }

  return "images-to-pdf.pdf";
}

export function JpgToPdfTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressNote, setProgressNote] = useState("Add at least one image");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("images-to-pdf.pdf");

  useEffect(() => {
    const pending = consumePendingFiles(ACCEPTED_IMAGE_TYPES, true);
    if (pending?.length) {
      setFiles(pending.filter(isSupportedImage));
      setProgressNote("Ready to create your PDF");
    }
  }, []);

  useEffect(() => {
    return () => revokeObjectUrl(downloadUrl);
  }, [downloadUrl]);

  const totalSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const canConvert = files.length > 0 && status !== "processing";

  const getReadyNote = (count: number) =>
    count > 0 ? "Ready to create your PDF" : "Add at least one image";

  const resetResultState = (nextCount = files.length) => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setDownloadName(getDownloadName(files));
    setStatus("idle");
    setError(null);
    setProgressNote(getReadyNote(nextCount));
  };

  const appendFiles = (incoming: FileList | File[] | null | undefined) => {
    if (!incoming?.length) return;

    const nextFiles = Array.from(incoming);
    const invalidFile = nextFiles.find((file) => !isSupportedImage(file));

    if (invalidFile) {
      revokeObjectUrl(downloadUrl);
      setDownloadUrl(null);
      setStatus("error");
      setError(
        `"${invalidFile.name}" is not supported. Please upload JPG, PNG, or WEBP images only.`,
      );
      setProgressNote("Only JPG, PNG, and WEBP images are supported");
      return;
    }

    const mergedFiles = [...files, ...nextFiles];
    setFiles(mergedFiles);
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setDownloadName(getDownloadName(mergedFiles));
    setStatus("idle");
    setError(null);
    setProgressNote(getReadyNote(mergedFiles.length));
  };

  const removeFile = (index: number) => {
    const nextFiles = files.filter((_, fileIndex) => fileIndex !== index);
    setFiles(nextFiles);
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setDownloadName(getDownloadName(nextFiles));
    setStatus("idle");
    setError(null);
    setProgressNote(getReadyNote(nextFiles.length));
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      inputRef.current?.click();
      return;
    }

    try {
      trackConversionStarted("jpg_to_pdf");
      setStatus("processing");
      setError(null);
      setProgressNote(
        `Converting ${files.length} image${files.length === 1 ? "" : "s"} into PDF...`,
      );

      const pdfBytes = await createPdfFromImages(files);
      const nextDownloadUrl = createPdfDownloadUrl(pdfBytes);

      revokeObjectUrl(downloadUrl);
      setDownloadUrl(nextDownloadUrl);
      setDownloadName(getDownloadName(files));
      trackConversionCompleted("jpg_to_pdf");
      setStatus("done");
      setProgressNote("Your PDF is ready");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Conversion failed. Please try again with valid image files.",
      );
      setProgressNote("Conversion failed");
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
          "group relative block cursor-pointer rounded-3xl p-10 text-center transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 sm:p-16",
          "glass shadow-card hover:shadow-glow",
          drag && "scale-[1.01] ring-2 ring-primary",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
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
          {files.length
            ? `${files.length} image${files.length === 1 ? "" : "s"} selected`
            : "Drop your images here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload JPG, PNG, or WEBP files and combine them into one PDF right in your browser.
        </p>
      </label>

      {files.length > 0 && (
        <div className="mt-5 rounded-2xl glass px-4 py-3 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-medium">Uploaded images</div>
            <div className="text-xs text-muted-foreground">
              {files.length} files | {formatFileSize(totalSize)}
            </div>
          </div>
          <div className="grid gap-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-card/70 px-3 py-2"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                    <FileImage className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="responsive-file-name text-sm font-medium" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                  </div>
                </div>
                {status !== "processing" && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
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

      {status === "done" && downloadUrl && (
        <div className="mt-6 rounded-2xl glass p-6 text-center shadow-glow">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="font-semibold">Conversion complete</div>
          <p className="mt-1 text-sm text-muted-foreground">Your PDF is ready to download.</p>
          <div className="mx-auto mt-4 grid max-w-md gap-2 rounded-2xl bg-card/70 p-4 text-left text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <span>Images included</span>
              <span className="font-medium text-foreground">{files.length}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Total upload size</span>
              <span className="font-medium text-foreground">{formatFileSize(totalSize)}</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="hero" size="lg" asChild>
              <a href={downloadUrl} download={downloadName} title={downloadName}>
                <Download className="h-4 w-4" /> Download PDF
              </a>
            </Button>
            <Button variant="glass" size="lg" onClick={() => resetResultState()}>
              Convert more images
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Button variant="hero" size="xl" onClick={handleConvert} disabled={!canConvert}>
          {status === "processing" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Creating PDF
            </>
          ) : files.length > 0 ? (
            <>
              Convert to PDF <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" /> Choose Images
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" /> Client-side only
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Fast conversion
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Multiple image support
        </span>
      </div>
    </>
  );
}
