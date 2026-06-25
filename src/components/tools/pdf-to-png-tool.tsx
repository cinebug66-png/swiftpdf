import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileArchive,
  FileImage,
  FileText,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Shield,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { consumePendingFiles } from "@/lib/pending-file";
import {
  convertPdfToPng,
  getPngSourcePageCount,
  revokePngPages,
  type ConvertedPngPage,
} from "@/lib/pdf-to-png";
import { cn } from "@/lib/utils";

type ToolStatus = "idle" | "processing" | "done" | "error";

const ACCEPTED_PDF_TYPES = ".pdf,application/pdf";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function getBaseName(file: File) {
  return file.name.replace(/\.pdf$/i, "") || "pdf";
}

function getPageFileName(file: File, pageNumber: number, totalPages: number) {
  const digits = Math.max(2, String(totalPages).length);
  return `${getBaseName(file)}-page-${String(pageNumber).padStart(digits, "0")}.png`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function PdfToPngTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const pagesRef = useRef<ConvertedPngPage[]>([]);
  const conversionIdRef = useRef(0);
  const fileReadIdRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<ConvertedPngPage[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressNote, setProgressNote] = useState("Waiting for PDF");
  const [isCreatingZip, setIsCreatingZip] = useState(false);

  useEffect(() => {
    const pending = consumePendingFiles(ACCEPTED_PDF_TYPES);
    if (pending?.[0]) {
      void selectFile(pending[0]);
    }
    // Pending-file bootstrapping should only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    return () => {
      conversionIdRef.current += 1;
      fileReadIdRef.current += 1;
      revokePngPages(pagesRef.current);
    };
  }, []);

  const totalOutputSize = useMemo(
    () => pages.reduce((total, page) => total + page.blob.size, 0),
    [pages],
  );

  const clearResults = () => {
    revokePngPages(pagesRef.current);
    pagesRef.current = [];
    setPages([]);
    setProgress(0);
    setIsCreatingZip(false);
  };

  const selectFile = async (nextFile: File | null | undefined) => {
    if (!nextFile) return;

    conversionIdRef.current += 1;
    const readId = fileReadIdRef.current + 1;
    fileReadIdRef.current = readId;
    clearResults();
    setPageCount(0);

    if (!isPdfFile(nextFile)) {
      setFile(null);
      setStatus("error");
      setError("Please choose a valid PDF file.");
      setProgressNote("Invalid file type");
      return;
    }

    setFile(nextFile);
    setStatus("idle");
    setError(null);
    setIsReadingFile(true);
    setProgressNote("Reading PDF...");

    try {
      const totalPages = await getPngSourcePageCount(nextFile);
      if (fileReadIdRef.current !== readId) return;
      setPageCount(totalPages);
      setProgressNote("Ready to convert every page");
    } catch (readError) {
      if (fileReadIdRef.current !== readId) return;
      setFile(null);
      setStatus("error");
      setError(readError instanceof Error ? readError.message : "This PDF could not be opened.");
      setProgressNote("Failed to read PDF");
    } finally {
      if (fileReadIdRef.current === readId) setIsReadingFile(false);
    }
  };

  const reset = () => {
    conversionIdRef.current += 1;
    fileReadIdRef.current += 1;
    clearResults();
    setFile(null);
    setPageCount(0);
    setIsReadingFile(false);
    setStatus("idle");
    setError(null);
    setProgressNote("Waiting for PDF");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleConvert = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }

    clearResults();
    const conversionId = conversionIdRef.current + 1;
    conversionIdRef.current = conversionId;
    setStatus("processing");
    setError(null);
    setProgress(0);
    setProgressNote("Opening your PDF...");
    trackAnalyticsEvent("pdf_to_png_started", { tool_name: "pdf_to_png" });

    try {
      const convertedPages = await convertPdfToPng(file, ({ completedPages, totalPages }) => {
        if (conversionIdRef.current !== conversionId) return;
        setProgress(Math.round((completedPages / totalPages) * 100));
        setProgressNote(`Rendered page ${completedPages} of ${totalPages}`);
      });

      if (conversionIdRef.current !== conversionId) {
        revokePngPages(convertedPages);
        return;
      }

      pagesRef.current = convertedPages;
      setPages(convertedPages);
      setPageCount(convertedPages.length);
      setProgress(100);
      setProgressNote(`${convertedPages.length} PNG images ready`);
      setStatus("done");
      trackAnalyticsEvent("pdf_to_png_completed", {
        tool_name: "pdf_to_png",
        page_count: String(convertedPages.length),
      });
    } catch (conversionError) {
      if (conversionIdRef.current !== conversionId) return;
      setStatus("error");
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "Could not convert this PDF. Please try another file.",
      );
      setProgressNote("Conversion failed");
    }
  };

  const downloadPage = (page: ConvertedPngPage) => {
    if (!file) return;

    trackAnalyticsEvent("pdf_to_png_download", {
      tool_name: "pdf_to_png",
      page_number: String(page.pageNumber),
    });
    downloadBlob(page.blob, getPageFileName(file, page.pageNumber, pages.length));
  };

  const downloadAll = async () => {
    if (!file || pages.length === 0 || isCreatingZip) return;

    setIsCreatingZip(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      pages.forEach((page) => {
        zip.file(getPageFileName(file, page.pageNumber, pages.length), page.blob);
      });
      const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      trackAnalyticsEvent("pdf_to_png_zip_download", {
        tool_name: "pdf_to_png",
        page_count: String(pages.length),
      });
      downloadBlob(zipBlob, `${getBaseName(file)}-png-pages.zip`);
    } catch {
      setError("Could not create the ZIP file. Please download the PNG pages individually.");
      setStatus("error");
    } finally {
      setIsCreatingZip(false);
    }
  };

  return (
    <div className="min-w-0">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDrag(false);
          void selectFile(event.dataTransfer.files[0]);
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
          accept={ACCEPTED_PDF_TYPES}
          className="sr-only"
          onChange={(event) => {
            void selectFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition-transform group-hover:scale-110">
          <Upload className="h-7 w-7" />
        </div>
        <p className="text-lg font-medium">
          {file ? "Choose a different PDF" : "Drop your PDF here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Every page is converted privately in your browser using PDF.js.
        </p>
      </label>

      {file && (
        <div className="mt-5 rounded-2xl glass p-4 shadow-soft">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="responsive-file-name font-medium" title={file.name}>
                  {file.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                  {pageCount > 0 ? ` · ${pageCount} ${pageCount === 1 ? "page" : "pages"}` : ""}
                </div>
              </div>
            </div>
            <Button variant="glass" size="sm" onClick={reset} disabled={status === "processing"}>
              <RotateCcw className="h-4 w-4" /> Clear
            </Button>
          </div>
        </div>
      )}

      {isReadingFile && (
        <div className="mt-6 rounded-2xl glass p-5 shadow-card">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Reading PDF details
          </div>
        </div>
      )}

      {status === "processing" && (
        <div className="mt-6 rounded-2xl glass p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {progressNote}
            </span>
            <span className="font-semibold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {status === "error" && error && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive shadow-soft">
          {error}
        </div>
      )}

      {pages.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {pages.length} PNG {pages.length === 1 ? "image" : "images"} ready
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatFileSize(totalOutputSize)} total · {progressNote}
              </div>
            </div>
            <Button variant="hero" onClick={() => void downloadAll()} disabled={isCreatingZip}>
              {isCreatingZip ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileArchive className="h-4 w-4" />
              )}
              {isCreatingZip ? "Creating ZIP" : "Download all as ZIP"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {pages.map((page) => (
              <article
                key={page.pageNumber}
                className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
              >
                <div className="flex h-40 items-center justify-center bg-muted/40 p-2 sm:h-44">
                  <img
                    src={page.url}
                    alt={`PDF page ${page.pageNumber} converted to PNG`}
                    className="max-h-full max-w-full rounded-lg object-contain shadow-soft"
                    loading="lazy"
                  />
                </div>
                <div className="border-t border-border p-3">
                  <div className="text-sm font-semibold">Page {page.pageNumber}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {page.width} × {page.height} · {formatFileSize(page.blob.size)}
                  </div>
                  <Button
                    variant="glass"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => downloadPage(page)}
                  >
                    <Download className="h-4 w-4" /> PNG
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button
          variant="hero"
          size="xl"
          onClick={() => void handleConvert()}
          disabled={status === "processing" || isReadingFile || Boolean(file && pageCount === 0)}
        >
          {status === "processing" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Converting pages
            </>
          ) : file ? (
            <>
              Convert PDF to PNG <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" /> Choose PDF
            </>
          )}
        </Button>
        {file && (
          <Button variant="glass" size="xl" onClick={reset} disabled={status === "processing"}>
            <RotateCcw className="h-5 w-5" /> Clear
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:gap-6">
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" /> 100% browser-based
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> High-resolution rendering
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-primary" /> PNG preview included
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileImage className="h-3.5 w-3.5 text-primary" /> No upload required
        </span>
      </div>
    </div>
  );
}
