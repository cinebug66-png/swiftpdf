import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import * as XLSX from "xlsx";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type PdfExcelExportMode = "one_sheet" | "sheets_by_page";

export type PdfExcelOptions = {
  exportMode: PdfExcelExportMode;
  includePageLabels: boolean;
};

export type ExtractedPdfPage = {
  pageNumber: number;
  rows: string[][];
};

export type PdfExcelExtraction = {
  pages: ExtractedPdfPage[];
  totalRows: number;
  totalCells: number;
  totalCharacters: number;
  hasUsefulText: boolean;
};

type TextItem = {
  str?: string;
  width?: number;
  transform?: number[];
};

type PositionedText = {
  text: string;
  x: number;
  y: number;
  width: number;
};

type PdfPageProxy = {
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

const ROW_TOLERANCE = 4;
const COLUMN_GAP = 18;

function isTextItem(item: unknown): item is TextItem {
  return Boolean(item && typeof item === "object" && "str" in item && "transform" in item);
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function groupPageRows(items: PositionedText[]) {
  const rowGroups: PositionedText[][] = [];

  for (const item of [...items].sort((left, right) => right.y - left.y || left.x - right.x)) {
    const row = rowGroups.find((group) => Math.abs(group[0].y - item.y) <= ROW_TOLERANCE);
    if (row) {
      row.push(item);
    } else {
      rowGroups.push([item]);
    }
  }

  return rowGroups
    .map((row) => {
      const cells: string[] = [];
      const sorted = row.sort((left, right) => left.x - right.x);
      let current = "";
      let previousRight: number | null = null;

      for (const item of sorted) {
        const gap = previousRight == null ? 0 : item.x - previousRight;
        if (previousRight != null && gap > COLUMN_GAP && current.trim()) {
          cells.push(normalizeText(current));
          current = item.text;
        } else {
          current = current ? `${current} ${item.text}` : item.text;
        }
        previousRight = item.x + Math.max(item.width, item.text.length * 4);
      }

      if (current.trim()) {
        cells.push(normalizeText(current));
      }

      return cells;
    })
    .filter((row) => row.some(Boolean));
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

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const positionedItems = textContent.items
        .filter(isTextItem)
        .map((item) => {
          const text = normalizeText(item.str ?? "");
          const transform = item.transform ?? [];
          return {
            text,
            x: Number(transform[4] ?? 0),
            y: Number(transform[5] ?? 0),
            width: Number(item.width ?? 0),
          };
        })
        .filter((item) => item.text);

      const rows = groupPageRows(positionedItems);
      pages.push({ pageNumber, rows });
      totalRows += rows.length;
      totalCells += rows.reduce((sum, row) => sum + row.length, 0);
      totalCharacters += rows.flat().join("").length;
    }

    return {
      pages,
      totalRows,
      totalCells,
      totalCharacters,
      hasUsefulText: totalRows > 0 && totalCells > 0 && totalCharacters >= 20,
    };
  } catch {
    throw new Error("This PDF could not be read. It may be encrypted, password-protected, or corrupted.");
  } finally {
    await loadingTask?.destroy().catch(() => undefined);
    await pdfDocument?.destroy().catch(() => undefined);
  }
}

function normalizeWorksheetRows(extraction: PdfExcelExtraction, includePageLabels: boolean) {
  const rows: string[][] = [];
  for (const page of extraction.pages) {
    if (includePageLabels) rows.push([`Page ${page.pageNumber}`]);
    rows.push(...page.rows);
    if (includePageLabels) rows.push([]);
  }
  return rows.length > 0 ? rows : [["No extractable text found"]];
}

function safeSheetName(name: string) {
  return name.replace(/[:\\/?*[\]]/g, " ").slice(0, 31) || "Sheet";
}

export function createExcelBytes(extraction: PdfExcelExtraction, options: PdfExcelOptions) {
  const workbook = XLSX.utils.book_new();

  if (options.exportMode === "sheets_by_page") {
    for (const page of extraction.pages) {
      const rows = options.includePageLabels ? [[`Page ${page.pageNumber}`], ...page.rows] : page.rows;
      const worksheet = XLSX.utils.aoa_to_sheet(rows.length > 0 ? rows : [["No extractable text found"]]);
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName(`Page ${page.pageNumber}`));
    }
  } else {
    const worksheet = XLSX.utils.aoa_to_sheet(normalizeWorksheetRows(extraction, options.includePageLabels));
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
