import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Shield,
  Table2,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { consumePendingFiles } from "@/lib/pending-file";
import {
  createExcelBytes,
  createExcelDownloadUrl,
  extractPdfForExcel,
  revokeObjectUrl,
  type PdfExcelExportMode,
  type PdfExcelExtraction,
} from "@/lib/pdf-to-excel";
import { cn } from "@/lib/utils";

type ToolStatus = "idle" | "analyzing" | "ready" | "processing" | "done" | "error";

const toolInfo = {
  tool_name: "PDF to Excel",
  tool_slug: "pdf-to-excel",
  input_type: "pdf",
  output_type: "xlsx",
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getPreviewRows(extraction: PdfExcelExtraction | null) {
  if (!extraction) return [];
  return extraction.pages.flatMap((page) => page.rows.map((row) => ({ page: page.pageNumber, row }))).slice(0, 20);
}

export function PdfToExcelTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<PdfExcelExtraction | null>(null);
  const [exportMode, setExportMode] = useState<PdfExcelExportMode>("one_sheet");
  const [includePageLabels, setIncludePageLabels] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

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
  const previewRows = useMemo(() => getPreviewRows(extraction), [extraction]);
  const hasManyRows = Boolean(extraction && extraction.totalRows > previewRows.length);

  const trackConversionEvent = (
    eventName: string,
    extra: Record<string, string | number | boolean> = {},
  ) => {
    trackEvent(eventName, {
      ...toolInfo,
      export_mode: exportMode,
      ...extra,
    });
  };

  const resetResult = () => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setStatus((current) => (current === "done" ? "ready" : current));
    setError(null);
  };

  const clear = () => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setFile(null);
    setExtraction(null);
    setError(null);
    setStatus("idle");
  };

  const selectFile = async (nextFile: File | null) => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setFile(nextFile);
    setExtraction(null);
    setError(null);

    if (!nextFile) {
      setStatus("idle");
      return;
    }

    try {
      setStatus("analyzing");
      const nextExtraction = await extractPdfForExcel(nextFile);
      setExtraction(nextExtraction);
      setStatus("ready");

      if (!nextExtraction.hasUsefulText) {
        setError(
          "This PDF looks scanned or image-based. PDF to Excel currently works best with text-based PDFs. OCR support will be added later.",
        );
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "PDF text extraction failed. Please try another PDF.");
    }
  };

  const convert = async () => {
    if (!file) {
      inputRef.current?.click();
      return;
    }

    if (!extraction) {
      setStatus("error");
      setError("Upload a PDF and wait for extraction before converting.");
      return;
    }

    if (!extraction.hasUsefulText) {
      setStatus("error");
      setError(
        "This PDF looks scanned or image-based. PDF to Excel currently works best with text-based PDFs. OCR support will be added later.",
      );
      trackConversionEvent("conversion_error", {
        error_type: "no_extractable_text",
        error_message_short: "No extractable text found",
      });
      return;
    }

    try {
      trackConversionEvent("conversion_started");
      setStatus("processing");
      setError(null);
      const bytes = createExcelBytes(extraction, { exportMode, includePageLabels });
      const nextDownloadUrl = createExcelDownloadUrl(bytes);

      revokeObjectUrl(downloadUrl);
      setDownloadUrl(nextDownloadUrl);
      setStatus("done");
      trackConversionEvent("conversion_success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Excel generation failed. Please try again.";
      setStatus("error");
      setError(message);
      trackConversionEvent("conversion_error", {
        error_type: "excel_generation_failed",
        error_message_short: message.slice(0, 96),
      });
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
          onChange={(event) => void selectFile(event.target.files?.[0] ?? null)}
        />
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition-transform group-hover:scale-110">
          <Upload className="h-7 w-7" />
        </div>
        <p className="responsive-file-name mx-auto text-lg font-medium" title={file?.name}>
          {file ? file.name : "Drop your PDF here or click to browse"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF to Excel works best with text-based PDFs. Scanned documents may need OCR.
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
            {status !== "analyzing" && status !== "processing" && (
              <button
                type="button"
                onClick={clear}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {status === "analyzing" && (
        <div className="mt-6 rounded-2xl glass p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Extracting text and table-like rows...
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full origin-left animate-pulse bg-gradient-primary" />
          </div>
        </div>
      )}

      {extraction && (
        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
          <section className="min-w-0 rounded-3xl glass p-4 shadow-card sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-base font-semibold">
                  <Table2 className="h-4 w-4 text-primary" />
                  Extracted preview
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {hasManyRows ? "Previewing first 20 rows" : "Review the extracted rows before exporting"}
                </div>
              </div>
              <div className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium shadow-soft">
                {extraction.totalRows} rows
              </div>
            </div>

            {error && !extraction.hasUsefulText && (
              <div className="mb-4 rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-900">
                {error}
              </div>
            )}

            {previewRows.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-border bg-background shadow-soft">
                <table className="min-w-full border-collapse text-left text-sm">
                  <tbody>
                    {previewRows.map((item, rowIndex) => (
                      <tr key={`${item.page}-${rowIndex}`} className="border-b border-border last:border-0">
                        <td className="whitespace-nowrap bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                          P{item.page}
                        </td>
                        {item.row.map((cell, cellIndex) => (
                          <td key={`${rowIndex}-${cellIndex}`} className="min-w-32 px-3 py-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-background p-5 text-sm text-muted-foreground">
                No readable table rows were found.
              </div>
            )}
          </section>

          <aside className="rounded-3xl glass p-4 shadow-card sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold">Excel options</div>
                <div className="mt-1 text-xs text-muted-foreground">Keep the export simple and reviewable.</div>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
            </div>

            <div className="grid gap-2">
              {[
                { value: "one_sheet", label: "One sheet" },
                { value: "sheets_by_page", label: "Separate sheet per page" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    resetResult();
                    setExportMode(option.value as PdfExcelExportMode);
                  }}
                  disabled={status === "processing"}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-[background-color,border-color,color] duration-200",
                    exportMode === option.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card/70 text-foreground hover:border-primary/60",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                resetResult();
                setIncludePageLabels((value) => !value);
              }}
              disabled={status === "processing"}
              className={cn(
                "mt-4 flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-[background-color,border-color,color] duration-200",
                includePageLabels
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card/70 text-muted-foreground hover:text-foreground",
              )}
            >
              <span>Include page labels</span>
              <span>{includePageLabels ? "Yes" : "No"}</span>
            </button>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-card/60 p-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Cells</div>
                <div className="font-semibold">{extraction.totalCells}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Pages</div>
                <div className="font-semibold">{extraction.pages.length}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <Button
                variant="hero"
                size="lg"
                onClick={() => void convert()}
                disabled={status === "processing" || status === "analyzing" || !extraction.hasUsefulText}
              >
                {status === "processing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating Excel
                  </>
                ) : (
                  <>
                    Convert to Excel <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              {downloadUrl && (
                <Button variant="glass" size="lg" asChild>
                  <a href={downloadUrl} download="converted-excel.xlsx" title="converted-excel.xlsx">
                    <Download className="h-4 w-4" /> Download Excel
                  </a>
                </Button>
              )}
            </div>
          </aside>
        </div>
      )}

      {status === "error" && error && (!extraction || extraction.hasUsefulText) && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive shadow-soft">
          {error}
        </div>
      )}

      {status === "done" && downloadUrl && (
        <div className="mt-6 rounded-2xl glass p-6 text-center shadow-glow">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="font-semibold">Excel file ready</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Review the spreadsheet after downloading, especially for complex tables.
          </p>
        </div>
      )}

      {!file && (
        <div className="mt-6 flex justify-center">
          <Button variant="hero" size="xl" onClick={() => inputRef.current?.click()}>
            <Upload className="h-5 w-5" /> Choose PDF
          </Button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:gap-6">
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" /> Browser-side extraction
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Table2 className="h-3.5 w-3.5 text-primary" /> Text-based PDFs
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> XLSX export
        </span>
      </div>
    </>
  );
}
