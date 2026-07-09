import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "xlsx";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type PdfExcelExportMode = "one_sheet" | "sheets_by_page";
export type PdfExcelTableMode = "auto" | "manual" | "raw";
export type PdfExcelConfidence = "high" | "medium" | "low";
export type PdfExcelExtractionMode = "text" | "ocr_beta";

export type PdfExcelOptions = {
  exportMode: PdfExcelExportMode;
  tableMode: PdfExcelTableMode;
  includePageLabels: boolean;
  manualSeparators?: number[];
  manualSeparatorPageWidth?: number;
};

export type ExtractedPdfPage = {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  rows: string[][];
  rawRows: string[][];
  textRows: PositionedTextRow[];
  columnStarts: number[];
  columnSeparators: number[];
  rowCount: number;
  columnCount: number;
  confidence: PdfExcelConfidence;
};

export type PdfExcelExtraction = {
  pages: ExtractedPdfPage[];
  totalRows: number;
  totalCells: number;
  totalCharacters: number;
  totalTextItems: number;
  hasAnyText: boolean;
  hasUsefulText: boolean;
  confidence: PdfExcelConfidence;
  extractionMode?: PdfExcelExtractionMode;
  ocrLanguage?: string;
  pagesProcessedCount?: number;
};

export type PositionedText = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
};

export type PositionedCell = {
  text: string;
  x: number;
  right: number;
};

export type PositionedTextRow = {
  y: number;
  height: number;
  cells: PositionedCell[];
};

type TextItem = {
  str?: string;
  width?: number;
  height?: number;
  transform?: number[];
};

type PdfPageProxy = {
  rotate?: number;
  getViewport: (options: { scale: number; rotation?: number }) => { width: number; height: number };
  getTextContent: () => Promise<{ items: unknown[] }>;
  render?: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
    canvas?: HTMLCanvasElement;
  }) => { promise: Promise<void> };
};

type PdfDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
  destroy: () => Promise<void>;
};

type PdfLoadingTask = {
  promise: Promise<PdfDocumentProxy>;
  destroy: () => Promise<void>;
};

const MIN_USEFUL_CHARACTERS = 20;
export const OCR_DEFAULT_PAGE_LIMIT = 5;
export const OCR_LANGUAGE = "eng";

export type PdfExcelOcrProgress = {
  phase: "loading" | "rendering" | "recognizing";
  pageNumber: number;
  totalPages: number;
  progress: number;
};

export type PdfExcelOcrOptions = {
  processAllPages: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: PdfExcelOcrProgress) => void;
};

function isTextItem(item: unknown): item is TextItem {
  return Boolean(item && typeof item === "object" && "str" in item && "transform" in item);
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function median(values: number[], fallback: number) {
  const sorted = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return fallback;
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[midpoint - 1] + sorted[midpoint]) / 2 : sorted[midpoint];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function uniqueSorted(values: number[], tolerance = 4) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const unique: number[] = [];

  for (const value of sorted) {
    const previous = unique[unique.length - 1];
    if (previous === undefined || Math.abs(previous - value) > tolerance) {
      unique.push(Math.round(value));
    } else {
      unique[unique.length - 1] = Math.round((previous + value) / 2);
    }
  }

  return unique;
}

function emptyPage(pageNumber: number, width: number, height: number, rotation: number): ExtractedPdfPage {
  return {
    pageNumber,
    width,
    height,
    rotation,
    rows: [],
    rawRows: [],
    textRows: [],
    columnStarts: [],
    columnSeparators: [],
    rowCount: 0,
    columnCount: 0,
    confidence: "low",
  };
}

function getPositionedItems(items: unknown[], pageHeight: number): PositionedText[] {
  return items
    .filter(isTextItem)
    .map((item) => {
      const text = normalizeText(item.str ?? "");
      const transform = item.transform ?? [];
      const x = Number(transform[4] ?? 0);
      const baselineY = Number(transform[5] ?? 0);
      const fontSize = Math.abs(Number(transform[3] ?? transform[0] ?? item.height ?? 10)) || 10;
      const width = Math.max(Number(item.width ?? 0), text.length * fontSize * 0.32);
      const height = Math.max(Number(item.height ?? 0), fontSize);

      return {
        text,
        x,
        y: pageHeight - baselineY,
        width,
        height,
        fontSize,
      };
    })
    .filter((item) => item.text && Number.isFinite(item.x) && Number.isFinite(item.y));
}

function groupIntoRows(items: PositionedText[]) {
  const fontSize = median(
    items.map((item) => item.fontSize || item.height),
    10,
  );
  const rowTolerance = clamp(fontSize * 0.65, 3, 10);
  const rows: PositionedText[][] = [];

  for (const item of [...items].sort((left, right) => left.y - right.y || left.x - right.x)) {
    const row = rows.find((group) => Math.abs(group[0].y - item.y) <= rowTolerance);
    if (row) {
      row.push(item);
      const averageY = row.reduce((sum, rowItem) => sum + rowItem.y, 0) / row.length;
      row[0] = { ...row[0], y: averageY };
    } else {
      rows.push([item]);
    }
  }

  return rows
    .map((row) => row.sort((left, right) => left.x - right.x))
    .sort((left, right) => left[0].y - right[0].y);
}

function mergeRowItems(row: PositionedText[], gapMultiplier: number): PositionedTextRow {
  const fontSize = median(
    row.map((item) => item.fontSize || item.height),
    10,
  );
  const gapTolerance = clamp(fontSize * gapMultiplier, 4, 30);
  const cells: PositionedCell[] = [];
  let current: PositionedCell | null = null;

  for (const item of row) {
    const right = item.x + Math.max(item.width, item.text.length * fontSize * 0.32);
    const gap = current ? item.x - current.right : 0;

    if (current && gap <= gapTolerance) {
      current.text = normalizeText(`${current.text} ${item.text}`);
      current.right = Math.max(current.right, right);
    } else {
      if (current?.text) cells.push(current);
      current = { text: item.text, x: item.x, right };
    }
  }

  if (current?.text) cells.push(current);

  return {
    y: row.reduce((sum, item) => sum + item.y, 0) / row.length,
    height: median(
      row.map((item) => item.height),
      fontSize,
    ),
    cells,
  };
}

function clusterValues(values: number[], tolerance: number) {
  const clusters: Array<{ values: number[]; center: number; count: number }> = [];

  for (const value of values.filter(Number.isFinite).sort((a, b) => a - b)) {
    const cluster = clusters.find((item) => Math.abs(item.center - value) <= tolerance);
    if (cluster) {
      cluster.values.push(value);
      cluster.count += 1;
      cluster.center = cluster.values.reduce((sum, value) => sum + value, 0) / cluster.values.length;
    } else {
      clusters.push({ values: [value], center: value, count: 1 });
    }
  }

  return clusters;
}

function clusterColumnStarts(rows: PositionedTextRow[], pageWidth: number) {
  const starts = rows.flatMap((row) => row.cells.map((cell) => cell.x));
  const tolerance = clamp(pageWidth * 0.018, 7, 18);
  const clusters = clusterValues(starts, tolerance);

  const repeatedStarts = clusters
    .filter((cluster) => cluster.count >= 2 || cluster.count / Math.max(rows.length, 1) >= 0.25)
    .map((cluster) => Math.round(cluster.center))
    .sort((a, b) => a - b);

  if (repeatedStarts.length >= 2) return repeatedStarts;

  const widestRows = [...rows].sort((left, right) => right.cells.length - left.cells.length);
  return (widestRows[0]?.cells.map((cell) => Math.round(cell.x)) ?? []).sort((a, b) => a - b);
}

function buildSeparatorsFromStarts(starts: number[]) {
  return starts.slice(1).map((start, index) => Math.round((starts[index] + start) / 2));
}

function detectColumnSeparators(rows: PositionedTextRow[], pageWidth: number) {
  const gapSamples = rows.flatMap((row) =>
    row.cells.slice(1).map((cell, index) => {
      const previous = row.cells[index];
      return cell.x - previous.right;
    }),
  );
  const typicalGap = median(gapSamples, 8);
  const largeGapThreshold = clamp(Math.max(typicalGap * 1.8, pageWidth * 0.025), 12, 42);
  const gapSeparators = rows.flatMap((row) =>
    row.cells.slice(1).flatMap((cell, index) => {
      const previous = row.cells[index];
      const gap = cell.x - previous.right;
      return gap >= largeGapThreshold ? [previous.right + gap / 2] : [];
    }),
  );
  const gapTolerance = clamp(pageWidth * 0.02, 8, 22);
  const repeatedGapSeparators = clusterValues(gapSeparators, gapTolerance)
    .filter((cluster) => cluster.count >= 2 || cluster.count / Math.max(rows.length, 1) >= 0.22)
    .map((cluster) => Math.round(cluster.center));
  const columnStarts = clusterColumnStarts(rows, pageWidth);
  const startSeparators = buildSeparatorsFromStarts(columnStarts);
  const separators = uniqueSorted([...repeatedGapSeparators, ...startSeparators], gapTolerance);

  return {
    columnStarts,
    separators: separators.filter((separator) => separator > 4 && separator < pageWidth - 4),
  };
}

function rowsFromSeparators(rows: PositionedTextRow[], separators: number[]) {
  const sortedSeparators = [...separators].filter(Number.isFinite).sort((a, b) => a - b);
  const columnCount = sortedSeparators.length + 1;

  return rows
    .map((row) => {
      const cells = Array.from({ length: columnCount }, () => "");

      for (const cell of row.cells) {
        const center = (cell.x + cell.right) / 2;
        const index = sortedSeparators.findIndex((separator) => center < separator);
        const columnIndex = index === -1 ? columnCount - 1 : index;
        cells[columnIndex] = normalizeText(cells[columnIndex] ? `${cells[columnIndex]} ${cell.text}` : cell.text);
      }

      return cells;
    })
    .filter((row) => row.some(Boolean));
}

function removeDuplicateBlankRows(rows: string[][]) {
  const normalized: string[][] = [];
  let previousBlank = false;

  for (const row of rows) {
    const cleaned = row.map((cell) => normalizeText(cell));
    const blank = cleaned.every((cell) => !cell);
    if (blank && previousBlank) continue;
    normalized.push(cleaned);
    previousBlank = blank;
  }

  return normalized;
}

function getConfidence(rows: string[][], columnCount: number): PdfExcelConfidence {
  if (rows.length < 2 || columnCount < 2) return "low";

  const populatedRows = rows.filter((row) => row.some(Boolean));
  const multiColumnRows = populatedRows.filter((row) => row.filter(Boolean).length >= 2);
  const repeatedColumnRows = populatedRows.filter((row) => row.length === columnCount && row.filter(Boolean).length >= 2);
  const multiColumnRatio = multiColumnRows.length / Math.max(populatedRows.length, 1);
  const repeatedRatio = repeatedColumnRows.length / Math.max(populatedRows.length, 1);

  if (populatedRows.length >= 4 && repeatedRatio >= 0.55 && multiColumnRatio >= 0.65) return "high";
  if (populatedRows.length >= 2 && multiColumnRatio >= 0.3) return "medium";
  return "low";
}

function getOcrConfidence(rows: string[][], confidence: number): PdfExcelConfidence {
  if (rows.length >= 4 && confidence >= 70) return "medium";
  if (rows.length >= 1 && confidence >= 35) return "medium";
  return "low";
}

function confidenceScore(confidence: PdfExcelConfidence) {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  return 1;
}

function combineConfidence(pages: ExtractedPdfPage[]): PdfExcelConfidence {
  const pagesWithRows = pages.filter((page) => page.rowCount > 0);
  if (pagesWithRows.length === 0) return "low";
  const average =
    pagesWithRows.reduce((sum, page) => sum + confidenceScore(page.confidence), 0) / pagesWithRows.length;
  if (average >= 2.5) return "high";
  if (average >= 1.6) return "medium";
  return "low";
}

function buildPage(pageNumber: number, items: PositionedText[], width: number, height: number, rotation: number) {
  if (items.length === 0) return emptyPage(pageNumber, width, height, rotation);

  const groupedRows = groupIntoRows(items);
  const compactRows = groupedRows.map((row) => mergeRowItems(row, 0.9)).filter((row) => row.cells.length > 0);
  const rawTextRows = groupedRows
    .map((row) => mergeRowItems(row, 2.4).cells.map((cell) => cell.text))
    .filter((row) => row.some(Boolean));
  const { columnStarts, separators } = detectColumnSeparators(compactRows, width);
  const autoRows =
    separators.length > 0
      ? rowsFromSeparators(compactRows, separators)
      : compactRows.map((row) => row.cells.map((cell) => cell.text));
  const rows = removeDuplicateBlankRows(autoRows);
  const confidence = getConfidence(rows, Math.max(columnStarts.length, separators.length + 1));

  return {
    pageNumber,
    width,
    height,
    rotation,
    rows,
    rawRows: removeDuplicateBlankRows(rawTextRows),
    textRows: compactRows,
    columnStarts,
    columnSeparators: separators,
    rowCount: rows.length,
    columnCount: Math.max(columnStarts.length, separators.length + 1, rows.reduce((max, row) => Math.max(max, row.length), 0)),
    confidence,
  };
}

function scaleSeparatorsToPage(page: ExtractedPdfPage, separators: number[], sourcePageWidth?: number) {
  if (!sourcePageWidth || sourcePageWidth <= 0 || Math.abs(sourcePageWidth - page.width) < 1) {
    return separators;
  }

  const scale = page.width / sourcePageWidth;
  return separators.map((separator) => Math.round(separator * scale));
}

export function buildRowsWithManualSeparators(
  page: ExtractedPdfPage,
  separators: number[],
  sourcePageWidth?: number,
) {
  return removeDuplicateBlankRows(
    rowsFromSeparators(page.textRows, scaleSeparatorsToPage(page, separators, sourcePageWidth)),
  );
}

export function getRowsForPage(
  page: ExtractedPdfPage,
  options: Pick<PdfExcelOptions, "tableMode" | "manualSeparators" | "manualSeparatorPageWidth">,
) {
  if (options.tableMode === "raw") return page.rawRows;
  if (options.tableMode === "manual") {
    return buildRowsWithManualSeparators(
      page,
      options.manualSeparators ?? page.columnSeparators,
      options.manualSeparatorPageWidth,
    );
  }
  return page.confidence === "low" ? page.rawRows : page.rows;
}

export async function extractPdfForExcel(file: File): Promise<PdfExcelExtraction> {
  let loadingTask: PdfLoadingTask | null = null;
  let pdfDocument: PdfDocumentProxy | null = null;

  try {
    const data = await file.arrayBuffer();
    loadingTask = pdfjsLib.getDocument({ data: data.slice(0) }) as unknown as PdfLoadingTask;
    pdfDocument = await loadingTask.promise;

    const pages: ExtractedPdfPage[] = [];
    let totalRows = 0;
    let totalCells = 0;
    let totalCharacters = 0;
    let totalTextItems = 0;

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const rotation = Number(page.rotate ?? 0);
      const viewport = page.getViewport({ scale: 1, rotation });
      const textContent = await page.getTextContent();
      const positionedItems = getPositionedItems(textContent.items, viewport.height);
      const extractedPage = buildPage(pageNumber, positionedItems, viewport.width, viewport.height, rotation);

      pages.push(extractedPage);
      totalRows += extractedPage.rowCount;
      totalCells += extractedPage.rows.reduce((sum, row) => sum + row.length, 0);
      totalCharacters += extractedPage.rows.flat().join("").length;
      totalTextItems += positionedItems.length;
    }

    const hasAnyText = totalTextItems > 0 && totalCharacters > 0;

    return {
      pages,
      totalRows,
      totalCells,
      totalCharacters,
      totalTextItems,
      hasAnyText,
      hasUsefulText: hasAnyText && totalCharacters >= MIN_USEFUL_CHARACTERS,
      confidence: combineConfidence(pages),
      extractionMode: "text",
    };
  } catch {
    throw new Error("This PDF could not be read. It may be encrypted, password-protected, or corrupted.");
  } finally {
    await loadingTask?.destroy().catch(() => undefined);
    await pdfDocument?.destroy().catch(() => undefined);
  }
}

function getOcrLines(pageData: {
  text?: string;
  blocks?: Array<{
    paragraphs?: Array<{
      lines?: Array<{
        text?: string;
        confidence?: number;
        bbox?: { x0: number; x1: number };
        words?: Array<{ text?: string; bbox?: { x0: number; x1: number } }>;
      }>;
    }>;
  }> | null;
}) {
  const structuredLines =
    pageData.blocks
      ?.flatMap((block) => block.paragraphs ?? [])
      .flatMap((paragraph) => paragraph.lines ?? [])
      .filter((line) => normalizeText(line.text ?? "")) ?? [];

  if (structuredLines.length > 0) return structuredLines;

  return normalizeText(pageData.text ?? "")
    .split(/\r?\n/u)
    .map((line) => ({ text: line, words: [] }))
    .filter((line) => normalizeText(line.text ?? ""));
}

function lineToOcrRow(line: {
  text?: string;
  bbox?: { x0: number; x1: number };
  words?: Array<{ text?: string; bbox?: { x0: number; x1: number } }>;
}) {
  const words = (line.words ?? [])
    .filter((word) => normalizeText(word.text ?? "") && word.bbox)
    .sort((left, right) => (left.bbox?.x0 ?? 0) - (right.bbox?.x0 ?? 0));

  if (words.length < 2) return [normalizeText(line.text ?? "")].filter(Boolean);

  const gaps = words.slice(1).map((word, index) => (word.bbox?.x0 ?? 0) - (words[index].bbox?.x1 ?? 0));
  const lineWidth = Math.max((line.bbox?.x1 ?? words[words.length - 1].bbox?.x1 ?? 0) - (line.bbox?.x0 ?? words[0].bbox?.x0 ?? 0), 1);
  const gapThreshold = Math.max(median(gaps, 0) * 2.8, lineWidth * 0.08, 24);
  const cells: string[] = [];
  let current = normalizeText(words[0].text ?? "");

  for (let index = 1; index < words.length; index += 1) {
    const word = words[index];
    if (gaps[index - 1] >= gapThreshold) {
      if (current) cells.push(current);
      current = normalizeText(word.text ?? "");
    } else {
      current = normalizeText(`${current} ${word.text ?? ""}`);
    }
  }

  if (current) cells.push(current);
  return cells.length > 0 ? cells : [normalizeText(line.text ?? "")].filter(Boolean);
}

function buildOcrPage(pageNumber: number, rows: string[][], width: number, height: number, confidence: number): ExtractedPdfPage {
  return {
    pageNumber,
    width,
    height,
    rotation: 0,
    rows,
    rawRows: rows,
    textRows: [],
    columnStarts: [],
    columnSeparators: [],
    rowCount: rows.length,
    columnCount: rows.reduce((max, row) => Math.max(max, row.length), 0),
    confidence: getOcrConfidence(rows, confidence),
  };
}

function assertOcrNotCancelled(signal?: AbortSignal) {
  if (signal?.aborted) throw new Error("OCR cancelled.");
}

async function renderPageToCanvas(page: PdfPageProxy, rotation: number) {
  if (typeof document === "undefined" || !page.render) {
    throw new Error("PDF page rendering is not available in this browser.");
  }

  const baseViewport = page.getViewport({ scale: 1, rotation });
  const scale = clamp(1600 / Math.max(baseViewport.width, baseViewport.height), 1.25, 2);
  const viewport = page.getViewport({ scale, rotation });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const canvasContext = canvas.getContext("2d", { alpha: false });
  if (!canvasContext) throw new Error("OCR could not prepare this PDF page.");

  await page.render({ canvasContext, viewport, canvas }).promise;
  return { canvas, width: baseViewport.width, height: baseViewport.height };
}

export async function extractPdfWithOcrBeta(file: File, options: PdfExcelOcrOptions): Promise<PdfExcelExtraction> {
  let loadingTask: PdfLoadingTask | null = null;
  let pdfDocument: PdfDocumentProxy | null = null;
  let worker: { recognize: (image: HTMLCanvasElement) => Promise<{ data: unknown }>; terminate: () => Promise<unknown> } | null =
    null;
  let cancelled = false;

  const cancelWorker = () => {
    cancelled = true;
    void worker?.terminate().catch(() => undefined);
  };

  options.signal?.addEventListener("abort", cancelWorker, { once: true });

  try {
    assertOcrNotCancelled(options.signal);
    options.onProgress?.({ phase: "loading", pageNumber: 0, totalPages: 0, progress: 0 });
    const [{ createWorker }, data] = await Promise.all([
      import("tesseract.js") as Promise<{
        createWorker: (
          language: string,
          oem?: number,
          options?: { logger?: (message: { status: string; progress: number }) => void },
        ) => Promise<{ recognize: (image: HTMLCanvasElement) => Promise<{ data: unknown }>; terminate: () => Promise<unknown> }>;
      }>,
      file.arrayBuffer(),
    ]);

    assertOcrNotCancelled(options.signal);
    loadingTask = pdfjsLib.getDocument({ data: data.slice(0) }) as unknown as PdfLoadingTask;
    pdfDocument = await loadingTask.promise;
    const pagesToProcess = options.processAllPages
      ? pdfDocument.numPages
      : Math.min(OCR_DEFAULT_PAGE_LIMIT, pdfDocument.numPages);
    let currentPageNumber = 0;

    worker = await createWorker(OCR_LANGUAGE, 1, {
      logger: (message) => {
        if (message.status !== "recognizing text" || currentPageNumber === 0) return;
        const pageProgress = clamp(message.progress, 0, 1);
        options.onProgress?.({
          phase: "recognizing",
          pageNumber: currentPageNumber,
          totalPages: pagesToProcess,
          progress: ((currentPageNumber - 1) + pageProgress) / Math.max(pagesToProcess, 1),
        });
      },
    });

    const pages: ExtractedPdfPage[] = [];
    let totalRows = 0;
    let totalCells = 0;
    let totalCharacters = 0;

    for (let pageNumber = 1; pageNumber <= pagesToProcess; pageNumber += 1) {
      assertOcrNotCancelled(options.signal);
      currentPageNumber = pageNumber;
      options.onProgress?.({
        phase: "rendering",
        pageNumber,
        totalPages: pagesToProcess,
        progress: (pageNumber - 1) / Math.max(pagesToProcess, 1),
      });

      const page = await pdfDocument.getPage(pageNumber);
      const rotation = Number(page.rotate ?? 0);
      const renderedPage = await renderPageToCanvas(page, rotation);
      assertOcrNotCancelled(options.signal);
      const result = await worker.recognize(renderedPage.canvas);
      const ocrData = result.data as {
        text?: string;
        confidence?: number;
        blocks?: Array<{
          paragraphs?: Array<{
            lines?: Array<{
              text?: string;
              confidence?: number;
              bbox?: { x0: number; x1: number };
              words?: Array<{ text?: string; bbox?: { x0: number; x1: number } }>;
            }>;
          }>;
        }> | null;
      };
      const rows = removeDuplicateBlankRows(getOcrLines(ocrData).map(lineToOcrRow).filter((row) => row.some(Boolean)));
      const extractedPage = buildOcrPage(
        pageNumber,
        rows,
        renderedPage.width,
        renderedPage.height,
        Number(ocrData.confidence ?? 0),
      );

      pages.push(extractedPage);
      totalRows += rows.length;
      totalCells += rows.reduce((sum, row) => sum + row.length, 0);
      totalCharacters += rows.flat().join("").length;
    }

    const hasAnyText = totalCharacters > 0;

    return {
      pages,
      totalRows,
      totalCells,
      totalCharacters,
      totalTextItems: totalRows,
      hasAnyText,
      hasUsefulText: hasAnyText,
      confidence: combineConfidence(pages),
      extractionMode: "ocr_beta",
      ocrLanguage: OCR_LANGUAGE,
      pagesProcessedCount: pages.length,
    };
  } catch (error) {
    if (cancelled || options.signal?.aborted) throw new Error("OCR cancelled.");
    if (error instanceof Error && error.message === "OCR cancelled.") throw error;
    throw new Error("OCR could not read text from this PDF. Try a clearer scan or use a text-based PDF.");
  } finally {
    options.signal?.removeEventListener("abort", cancelWorker);
    await worker?.terminate().catch(() => undefined);
    await loadingTask?.destroy().catch(() => undefined);
    await pdfDocument?.destroy().catch(() => undefined);
  }
}

function normalizeWorksheetRows(extraction: PdfExcelExtraction, options: PdfExcelOptions) {
  const rows: string[][] = [];
  for (const page of extraction.pages) {
    const pageRows = getRowsForPage(page, options);
    if (pageRows.length === 0) continue;
    if (options.includePageLabels) rows.push([`Page ${page.pageNumber}`]);
    rows.push(...pageRows);
    if (options.includePageLabels) rows.push([]);
  }
  return removeDuplicateBlankRows(rows);
}

function safeSheetName(name: string) {
  return name.replace(/[:\\/?*[\]]/g, " ").slice(0, 31) || "Sheet";
}

export function createExcelBytes(extraction: PdfExcelExtraction, options: PdfExcelOptions) {
  const workbook = XLSX.utils.book_new();

  if (options.exportMode === "sheets_by_page") {
    for (const page of extraction.pages) {
      const pageRows = getRowsForPage(page, options);
      const rows = options.includePageLabels ? [[`Page ${page.pageNumber}`], ...pageRows] : pageRows;
      const worksheet = XLSX.utils.aoa_to_sheet(removeDuplicateBlankRows(rows));
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(`Page ${page.pageNumber}`));
    }
  } else {
    const worksheet = XLSX.utils.aoa_to_sheet(normalizeWorksheetRows(extraction, options));
    XLSX.utils.book_append_sheet(workbook, worksheet, "Extracted Rows");
  }

  return XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
}

export function createExcelDownloadUrl(bytes: ArrayBuffer) {
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}
