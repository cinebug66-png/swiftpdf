import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "xlsx";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type PdfExcelExportMode = "one_sheet" | "sheets_by_page";
export type PdfExcelTableMode = "auto" | "manual" | "raw";
export type PdfExcelConfidence = "high" | "medium" | "low";

export type PdfExcelOptions = {
  exportMode: PdfExcelExportMode;
  tableMode: PdfExcelTableMode;
  includePageLabels: boolean;
  manualSeparators?: number[];
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

function clusterColumnStarts(rows: PositionedTextRow[], pageWidth: number) {
  const starts = rows.flatMap((row) => row.cells.map((cell) => cell.x));
  const tolerance = clamp(pageWidth * 0.018, 7, 18);
  const clusters: Array<{ values: number[]; center: number; count: number }> = [];

  for (const start of starts.sort((a, b) => a - b)) {
    const cluster = clusters.find((item) => Math.abs(item.center - start) <= tolerance);
    if (cluster) {
      cluster.values.push(start);
      cluster.count += 1;
      cluster.center = cluster.values.reduce((sum, value) => sum + value, 0) / cluster.values.length;
    } else {
      clusters.push({ values: [start], center: start, count: 1 });
    }
  }

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
  const columnStarts = clusterColumnStarts(compactRows, width);
  const separators = buildSeparatorsFromStarts(columnStarts);
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

export function buildRowsWithManualSeparators(page: ExtractedPdfPage, separators: number[]) {
  return removeDuplicateBlankRows(rowsFromSeparators(page.textRows, separators));
}

export function getRowsForPage(page: ExtractedPdfPage, options: Pick<PdfExcelOptions, "tableMode" | "manualSeparators">) {
  if (options.tableMode === "raw") return page.rawRows;
  if (options.tableMode === "manual") {
    return buildRowsWithManualSeparators(page, options.manualSeparators ?? page.columnSeparators);
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
    };
  } catch {
    throw new Error("This PDF could not be read. It may be encrypted, password-protected, or corrupted.");
  } finally {
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
