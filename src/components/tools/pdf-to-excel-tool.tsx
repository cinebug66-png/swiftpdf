import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
  Shield,
  SlidersHorizontal,
  Table2,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { consumePendingFiles } from "@/lib/pending-file";
import {
  buildRowsWithManualSeparators,
  createExcelBytes,
  createExcelDownloadUrl,
  extractPdfForExcel,
  extractPdfWithOcrBeta,
  getRowsForPage,
  OCR_DEFAULT_PAGE_LIMIT,
  OCR_LANGUAGE,
  revokeObjectUrl,
  type ExtractedPdfPage,
  type PdfExcelExportMode,
  type PdfExcelExtraction,
  type PdfExcelOcrProgress,
  type PdfExcelTableMode,
} from "@/lib/pdf-to-excel";
import { cn } from "@/lib/utils";

type ToolStatus = "idle" | "analyzing" | "ready" | "processing" | "done" | "error";
type OcrStatus = "idle" | "loading" | "processing" | "done" | "error" | "cancelled";

const toolInfo = {
  tool_name: "PDF to Excel",
  tool_slug: "pdf-to-excel",
  input_type: "pdf",
  output_type: "xlsx",
};

const scannedMessage = "This looks like a scanned PDF. Normal text extraction found little or no selectable text.";
const ocrReadFailure = "OCR could not read text from this PDF. Try a clearer scan or use a text-based PDF.";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function confidenceLabel(confidence: PdfExcelExtraction["confidence"]) {
  if (confidence === "high") return "Good";
  if (confidence === "medium") return "Medium";
  return "Basic";
}

function getPreviewRows(
  extraction: PdfExcelExtraction | null,
  tableMode: PdfExcelTableMode,
  manualSeparators: number[],
  manualSeparatorPageWidth?: number,
) {
  if (!extraction) return [];

  return extraction.pages
    .flatMap((page) => {
      const rows =
        tableMode === "manual"
          ? buildRowsWithManualSeparators(page, manualSeparators, manualSeparatorPageWidth)
          : getRowsForPage(page, { tableMode });
      return rows.map((row) => ({ page: page.pageNumber, row }));
    })
    .slice(0, 20);
}

function getActiveTableStats(
  extraction: PdfExcelExtraction | null,
  tableMode: PdfExcelTableMode,
  manualSeparators: number[],
  manualSeparatorPageWidth?: number,
) {
  if (!extraction) return { rowCount: 0, columnCount: 0, cellCount: 0 };

  const rows = extraction.pages.flatMap((page) =>
    tableMode === "manual"
      ? buildRowsWithManualSeparators(page, manualSeparators, manualSeparatorPageWidth)
      : getRowsForPage(page, { tableMode }),
  );

  return {
    rowCount: rows.length,
    columnCount: rows.reduce((max, row) => Math.max(max, row.length), 0),
    cellCount: rows.reduce((sum, row) => sum + row.length, 0),
  };
}

function getFirstPreviewPage(extraction: PdfExcelExtraction | null): ExtractedPdfPage | null {
  return extraction?.pages.find((page) => page.textRows.length > 0) ?? extraction?.pages[0] ?? null;
}

function getColumnCount(rows: Array<{ row: string[] }>, fallback: number) {
  return Math.max(fallback, rows.reduce((max, item) => Math.max(max, item.row.length), 0));
}

function getExcelFileName(isOcrMode: boolean) {
  return isOcrMode ? "swiftpdf-ocr-excel.xlsx" : "converted-excel.xlsx";
}

export function PdfToExcelTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const ocrAbortRef = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState<ToolStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<PdfExcelExtraction | null>(null);
  const [ocrExtraction, setOcrExtraction] = useState<PdfExcelExtraction | null>(null);
  const [ocrStatus, setOcrStatus] = useState<OcrStatus>("idle");
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<PdfExcelOcrProgress | null>(null);
  const [processAllOcrPages, setProcessAllOcrPages] = useState(false);
  const [exportMode, setExportMode] = useState<PdfExcelExportMode>("one_sheet");
  const [tableMode, setTableMode] = useState<PdfExcelTableMode>("auto");
  const [includePageLabels, setIncludePageLabels] = useState(true);
  const [manualSeparators, setManualSeparators] = useState<number[]>([]);
  const [allowLowTextExport, setAllowLowTextExport] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [manualColumnsOpen, setManualColumnsOpen] = useState(false);

  useEffect(() => {
    const pending = consumePendingFiles(".pdf,application/pdf", false);
    if (pending?.[0]) {
      void selectFile(pending[0]);
    }
    // Pending-file bootstrapping should only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      ocrAbortRef.current?.abort();
      revokeObjectUrl(downloadUrl);
    };
  }, [downloadUrl]);

  const fileSize = useMemo(() => (file ? formatFileSize(file.size) : null), [file]);
  const activeExtraction = ocrExtraction ?? extraction;
  const isOcrMode = activeExtraction?.extractionMode === "ocr_beta";
  const activeTableMode: PdfExcelTableMode = isOcrMode ? "raw" : tableMode;
  const previewPage = useMemo(() => getFirstPreviewPage(activeExtraction), [activeExtraction]);
  const previewRows = useMemo(
    () => getPreviewRows(activeExtraction, activeTableMode, manualSeparators, previewPage?.width),
    [activeExtraction, activeTableMode, manualSeparators, previewPage?.width],
  );
  const activeStats = useMemo(
    () => getActiveTableStats(activeExtraction, activeTableMode, manualSeparators, previewPage?.width),
    [activeExtraction, activeTableMode, manualSeparators, previewPage?.width],
  );
  const detectedColumnCount = getColumnCount(previewRows, activeStats.columnCount || previewPage?.columnCount || 0);
  const canTryAnyway = Boolean(extraction?.hasAnyText && !extraction.hasUsefulText);
  const isScannedLike = Boolean(extraction && !extraction.hasUsefulText);
  const totalOcrPages = extraction?.pages.length ?? 0;
  const plannedOcrPages = processAllOcrPages ? totalOcrPages : Math.min(OCR_DEFAULT_PAGE_LIMIT, totalOcrPages);
  const canExport = Boolean(
    ocrExtraction?.hasUsefulText || extraction?.hasUsefulText || (extraction?.hasAnyText && allowLowTextExport),
  );
  const trackConversionEvent = (
    eventName: string,
    extra: Record<string, string | number | boolean> = {},
  ) => {
    trackEvent(eventName, {
      ...toolInfo,
      extraction_confidence: activeExtraction?.confidence ?? "low",
      export_mode: exportMode,
      table_mode: activeTableMode,
      extraction_mode: isOcrMode ? "ocr_beta" : "text",
      ...extra,
    });
  };

  const trackOcrEvent = (eventName: string, extra: Record<string, string | number | boolean> = {}) => {
    trackEvent(eventName, {
      ...toolInfo,
      extraction_mode: "ocr_beta",
      pages_processed_count: ocrExtraction?.pagesProcessedCount ?? plannedOcrPages,
      ocr_language: OCR_LANGUAGE,
      ...extra,
    });
  };

  const resetResult = () => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setStatus((current) => (current === "done" ? "ready" : current));
    setError(null);
  };

  const resetOcr = () => {
    ocrAbortRef.current?.abort();
    ocrAbortRef.current = null;
    setOcrExtraction(null);
    setOcrStatus("idle");
    setOcrError(null);
    setOcrProgress(null);
    setProcessAllOcrPages(false);
  };

  const resetManualSeparators = (nextExtraction = extraction) => {
    const page = getFirstPreviewPage(nextExtraction);
    setManualSeparators(page?.columnSeparators ?? []);
  };

  const clear = () => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setFile(null);
    setExtraction(null);
    resetOcr();
    setError(null);
    setManualSeparators([]);
    setAllowLowTextExport(false);
    setTableMode("auto");
    setExportMode("one_sheet");
    setIncludePageLabels(true);
    setAdvancedOpen(false);
    setManualColumnsOpen(false);
    setStatus("idle");
  };

  const selectFile = async (nextFile: File | null) => {
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setFile(nextFile);
    setExtraction(null);
    resetOcr();
    setError(null);
    setManualSeparators([]);
    setAllowLowTextExport(false);
    setTableMode("auto");
    setExportMode("one_sheet");
    setIncludePageLabels(true);
    setAdvancedOpen(false);
    setManualColumnsOpen(false);

    if (!nextFile) {
      setStatus("idle");
      return;
    }

    try {
      setStatus("analyzing");
      const nextExtraction = await extractPdfForExcel(nextFile);
      setExtraction(nextExtraction);
      resetManualSeparators(nextExtraction);
      setStatus("ready");

      if (!nextExtraction.hasUsefulText) {
        setError(scannedMessage);
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "PDF text extraction failed. Please try another PDF.");
    }
  };

  const setSeparator = (index: number, value: number) => {
    resetResult();
    const clampedValue = previewPage ? Math.round(Math.min(previewPage.width - 8, Math.max(8, value))) : value;
    setManualSeparators((separators) =>
      separators
        .map((separator, separatorIndex) => (separatorIndex === index ? clampedValue : separator))
        .sort((left, right) => left - right),
    );
  };

  const addSeparator = () => {
    if (!previewPage) return;
    resetResult();
    setTableMode("manual");
    setManualSeparators((separators) => {
      const sorted = [...separators].sort((left, right) => left - right);
      const bounds = [8, ...sorted, Math.round(previewPage.width - 8)];
      const widestGap = bounds.slice(1).reduce(
        (best, right, index) => {
          const left = bounds[index];
          const width = right - left;
          return width > best.width ? { left, right, width } : best;
        },
        { left: 8, right: Math.round(previewPage.width - 8), width: 0 },
      );
      const next = Math.round((widestGap.left + widestGap.right) / 2);
      return [...sorted, Math.min(Math.round(previewPage.width - 12), Math.max(12, next))].sort(
        (left, right) => left - right,
      );
    });
  };

  const removeSeparator = (index: number) => {
    resetResult();
    setManualSeparators((separators) => separators.filter((_, separatorIndex) => separatorIndex !== index));
  };

  const startOcr = async () => {
    if (!file || !extraction) return;

    ocrAbortRef.current?.abort();
    const controller = new AbortController();
    ocrAbortRef.current = controller;
    revokeObjectUrl(downloadUrl);
    setDownloadUrl(null);
    setOcrExtraction(null);
    setOcrError(null);
    setOcrProgress({
      phase: "loading",
      pageNumber: 0,
      totalPages: plannedOcrPages,
      progress: 0,
    });
    setOcrStatus("loading");

    try {
      trackOcrEvent("ocr_beta_started", {
        pages_processed_count: plannedOcrPages,
      });
      const result = await extractPdfWithOcrBeta(file, {
        processAllPages: processAllOcrPages,
        signal: controller.signal,
        onProgress: (progress) => {
          setOcrProgress(progress);
          setOcrStatus(progress.phase === "loading" ? "loading" : "processing");
        },
      });

      if (!result.hasUsefulText) {
        setOcrStatus("error");
        setOcrError(ocrReadFailure);
        trackOcrEvent("ocr_beta_error", {
          pages_processed_count: result.pagesProcessedCount ?? plannedOcrPages,
        });
        return;
      }

      setOcrExtraction(result);
      setOcrStatus("done");
      setOcrProgress({
        phase: "recognizing",
        pageNumber: result.pagesProcessedCount ?? plannedOcrPages,
        totalPages: result.pagesProcessedCount ?? plannedOcrPages,
        progress: 1,
      });
      setError(null);
      trackEvent("conversion_success", {
        ...toolInfo,
        extraction_mode: "ocr_beta",
        pages_processed_count: result.pagesProcessedCount ?? plannedOcrPages,
        ocr_language: OCR_LANGUAGE,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : ocrReadFailure;
      const cancelled = message.toLowerCase().includes("cancelled");
      setOcrStatus(cancelled ? "cancelled" : "error");
      setOcrError(cancelled ? "OCR cancelled." : message);
      trackOcrEvent(cancelled ? "ocr_beta_cancelled" : "ocr_beta_error");
    } finally {
      ocrAbortRef.current = null;
    }
  };

  const cancelOcr = () => {
    ocrAbortRef.current?.abort();
  };

  const convert = async (autoDownload = false) => {
    if (!file) {
      inputRef.current?.click();
      return;
    }

    if (!activeExtraction) {
      setStatus("error");
      setError("Upload a PDF and wait for extraction before converting.");
      return;
    }

    if (!canExport) {
      setStatus("error");
      setError(scannedMessage);
      trackConversionEvent("conversion_error", {
        error_type: "no_extractable_text",
        error_message_short: "No useful extractable text found",
      });
      return;
    }

    try {
      trackConversionEvent("conversion_started");
      setStatus("processing");
      setError(null);
      const bytes = createExcelBytes(activeExtraction, {
        exportMode,
        tableMode: activeTableMode,
        includePageLabels,
        manualSeparators,
        manualSeparatorPageWidth: previewPage?.width,
      });
      const nextDownloadUrl = createExcelDownloadUrl(bytes);

      revokeObjectUrl(downloadUrl);
      setDownloadUrl(nextDownloadUrl);
      setStatus("done");
      trackConversionEvent("conversion_success");

      if (autoDownload) {
        const link = document.createElement("a");
        link.href = nextDownloadUrl;
        link.download = getExcelFileName(isOcrMode);
        document.body.appendChild(link);
        link.click();
        link.remove();
        trackConversionEvent("download_click");
      }
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
          Upload your PDF, review the Excel preview, then download your file.
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
            Detecting rows, columns, and table-like structure...
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full origin-left animate-pulse bg-gradient-primary" />
          </div>
        </div>
      )}

      {activeExtraction && (
        <div className="mt-6 grid max-w-full gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
          <section className="min-w-0 max-w-full rounded-3xl glass p-4 shadow-card sm:p-5">
            <div className="mb-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-base font-semibold">Excel preview ready</div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    SwiftPDF detected rows and columns automatically. Review the preview, then download your Excel file.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    PDF table extraction may not be perfect. Review the preview before using the Excel file.
                  </p>
                </div>
              </div>
            </div>

            {isScannedLike && !ocrExtraction && (
              <div className="mb-4 rounded-2xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-950">
                <div className="text-base font-semibold">Scanned PDF detected</div>
                <p className="mt-1">{scannedMessage}</p>
                <p className="mt-2">
                  OCR Beta can try to read scanned pages. It may take longer, especially on phones.
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={processAllOcrPages}
                      onChange={(event) => setProcessAllOcrPages(event.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    Process all pages
                  </label>
                  <button
                    type="button"
                    onClick={() => void startOcr()}
                    disabled={ocrStatus === "loading" || ocrStatus === "processing"}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {ocrStatus === "loading" || ocrStatus === "processing" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> OCR running
                      </>
                    ) : (
                      "Try OCR Beta"
                    )}
                  </button>
                </div>
                <p className="mt-3 text-xs text-amber-900">
                  OCR accuracy depends on scan quality. Please review the preview before using the Excel file.
                </p>
                {canTryAnyway && (
                  <button
                    type="button"
                    onClick={() => {
                      setAllowLowTextExport(true);
                      setError(null);
                    }}
                    className="mt-3 rounded-xl bg-amber-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Try anyway
                  </button>
                )}
              </div>
            )}

            {(ocrStatus === "loading" || ocrStatus === "processing" || ocrStatus === "done" || ocrError) && (
              <div className="mb-4 rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">OCR Beta</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {ocrProgress?.pageNumber
                        ? `Reading page ${ocrProgress.pageNumber} of ${ocrProgress.totalPages}`
                        : "Preparing OCR"}
                    </div>
                  </div>
                  {(ocrStatus === "loading" || ocrStatus === "processing") && (
                    <button
                      type="button"
                      onClick={cancelOcr}
                      className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-destructive/50 hover:text-destructive"
                    >
                      Cancel OCR
                    </button>
                  )}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-primary transition-[width] duration-200"
                    style={{ width: `${Math.round((ocrProgress?.progress ?? 0) * 100)}%` }}
                  />
                </div>
                {ocrError && <p className="mt-3 text-sm text-destructive">{ocrError}</p>}
                {ocrExtraction && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    OCR processed {ocrExtraction.pagesProcessedCount} pages. Review the preview before downloading.
                  </p>
                )}
              </div>
            )}

            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "Pages scanned", value: activeExtraction.pages.length },
                { label: "Rows found", value: activeStats.rowCount },
                { label: "Columns detected", value: detectedColumnCount },
                { label: "Detection quality", value: confidenceLabel(activeExtraction.confidence) },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-background p-3">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="mt-1 text-base font-semibold">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="mb-3 flex items-center gap-2 text-base font-semibold">
              <Table2 className="h-4 w-4 text-primary" />
              Preview table
            </div>

            {previewRows.length > 0 ? (
              <div className="max-h-[28rem] max-w-full overflow-auto rounded-2xl border border-border bg-background shadow-soft">
                <table className="min-w-full border-collapse text-left text-sm">
                  <tbody>
                    {previewRows.map((item, rowIndex) => (
                      <tr key={`${item.page}-${rowIndex}`} className="border-b border-border last:border-0">
                        <td className="whitespace-nowrap bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                          P{item.page}
                        </td>
                        {item.row.map((cell, cellIndex) => (
                          <td
                            key={`${rowIndex}-${cellIndex}`}
                            className="min-w-32 max-w-64 whitespace-normal break-words px-3 py-2 align-top"
                          >
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

            <p className="mt-3 text-xs text-muted-foreground">
              Preview shows the first rows. The Excel file includes all detected rows.
            </p>
          </section>

          <aside className="min-w-0 rounded-3xl glass p-4 shadow-card sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-base font-semibold">Excel output</div>
                <div className="mt-1 text-xs text-muted-foreground">Auto Best Output is selected.</div>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
            </div>

            <div className="grid gap-2 rounded-2xl bg-card/60 p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Format</span>
                <span className="font-semibold">XLSX</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Layout</span>
                <span className="font-semibold">{exportMode === "one_sheet" ? "One sheet" : "Separate sheets"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Detection</span>
                <span className="font-semibold">{confidenceLabel(activeExtraction.confidence)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">OCR</span>
                <span className="font-semibold">{isOcrMode ? "On" : "Off"}</span>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              {downloadUrl ? (
                <Button variant="hero" size="lg" asChild>
                  <a
                    href={downloadUrl}
                    download={getExcelFileName(isOcrMode)}
                    title={getExcelFileName(isOcrMode)}
                    onClick={() => trackConversionEvent("download_click")}
                  >
                    <Download className="h-4 w-4" /> Download Excel
                  </a>
                </Button>
              ) : (
                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => void convert(true)}
                  disabled={
                    status === "processing" ||
                    status === "analyzing" ||
                    ocrStatus === "loading" ||
                    ocrStatus === "processing" ||
                    !canExport
                  }
                >
                  {status === "processing" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating Excel
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" /> Download Excel
                    </>
                  )}
                </Button>
              )}

              <button
                type="button"
                onClick={() => setAdvancedOpen((value) => !value)}
                className="justify-self-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Advanced settings
              </button>
            </div>

            {advancedOpen && (
              <div className="mt-4 rounded-2xl border border-border bg-card/70 p-4 text-sm">
                <div className="font-semibold">Advanced settings</div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Only use this if the preview does not look right.
                </p>

                <div className="mt-4 space-y-4">
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Export layout
                    </div>
                    <div className="grid gap-2">
                      {[
                        { value: "one_sheet", label: "One sheet" },
                        { value: "sheets_by_page", label: "Separate sheets per page" },
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
                              : "border-border bg-background text-foreground hover:border-primary/60",
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetResult();
                      setIncludePageLabels((value) => !value);
                    }}
                    disabled={status === "processing"}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-[background-color,border-color,color] duration-200",
                      includePageLabels
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span>Include page labels</span>
                    <span>{includePageLabels ? "On" : "Off"}</span>
                  </button>

                  {!isOcrMode && (
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Extraction fallback
                      </div>
                      <div className="grid gap-2">
                        {[
                          { value: "auto", label: "Smart table" },
                          { value: "raw", label: "Plain text fallback" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              resetResult();
                              setManualColumnsOpen(false);
                              setTableMode(option.value as PdfExcelTableMode);
                            }}
                            className={cn(
                              "rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-[background-color,border-color,color] duration-200",
                              tableMode === option.value && !manualColumnsOpen
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground hover:border-primary/60",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isOcrMode && previewPage && (
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          resetResult();
                          setManualColumnsOpen((value) => {
                            const next = !value;
                            setTableMode(next ? "manual" : "auto");
                            return next;
                          });
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold hover:border-primary/60"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Adjust columns manually
                      </button>

                      {manualColumnsOpen && tableMode === "manual" && (
                        <div className="mt-3 rounded-2xl border border-border bg-background p-3">
                          <div className="mb-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={addSeparator}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/60"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add separator
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                resetResult();
                                setManualSeparators(previewPage.columnSeparators);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary/60"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Reset auto detection
                            </button>
                          </div>

                          <div className="space-y-3">
                            {manualSeparators.length > 0 ? (
                              manualSeparators.map((separator, index) => (
                                <div
                                  key={`${index}-${separator}`}
                                  className="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)_5rem_3rem] sm:items-center"
                                >
                                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <GripVertical className="h-3.5 w-3.5" />
                                    Separator {index + 1}
                                  </label>
                                  <input
                                    type="range"
                                    min={8}
                                    max={Math.max(24, Math.round(previewPage.width - 8))}
                                    value={separator}
                                    onChange={(event) => setSeparator(index, Number(event.target.value))}
                                    className="w-full accent-primary"
                                  />
                                  <input
                                    type="number"
                                    min={8}
                                    max={Math.max(24, Math.round(previewPage.width - 8))}
                                    value={Math.round(separator)}
                                    onChange={(event) => setSeparator(index, Number(event.target.value))}
                                    className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm"
                                    aria-label={`Separator ${index + 1} position`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeSeparator(index)}
                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                                    aria-label={`Remove separator ${index + 1}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No separators yet. Add a separator to split rows manually.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!ocrExtraction && (
                    <div className="rounded-2xl border border-border bg-background p-3">
                      <div className="font-semibold">OCR Beta</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Optional for scanned PDFs. OCR accuracy depends on scan quality.
                      </p>
                      <label className="mt-3 inline-flex items-center gap-2 text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={processAllOcrPages}
                          onChange={(event) => setProcessAllOcrPages(event.target.checked)}
                          className="h-4 w-4 accent-primary"
                        />
                        Process all pages
                      </label>
                      <Button
                        variant="glass"
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => void startOcr()}
                        disabled={ocrStatus === "loading" || ocrStatus === "processing"}
                      >
                        {ocrStatus === "loading" || ocrStatus === "processing" ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> OCR running
                          </>
                        ) : (
                          "Try OCR Beta"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
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
          <Shield className="h-3.5 w-3.5 text-primary" /> Browser-side text extraction
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
