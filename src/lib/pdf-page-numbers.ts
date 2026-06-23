import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type PageNumberPosition =
  | "bottom-center"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "top-right"
  | "top-left";

export type PageNumberFormat = "number" | "page-number" | "page-number-total";

export type PageNumberOptions = {
  position: PageNumberPosition;
  format: PageNumberFormat;
  fontSize: number;
  color: string;
  margin: number;
  startNumber: number;
  skipFirstPage: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex: string) {
  const normalized = hex.trim().replace(/^#/, "");
  const fallback = { red: 0.08, green: 0.1, blue: 0.16 };

  if (!/^[\da-f]{6}$/i.test(normalized)) return fallback;

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16) / 255,
    green: Number.parseInt(normalized.slice(2, 4), 16) / 255,
    blue: Number.parseInt(normalized.slice(4, 6), 16) / 255,
  };
}

const helveticaWidths: Record<string, number> = {
  " ": 278,
  P: 667,
  a: 556,
  e: 556,
  f: 278,
  g: 556,
  o: 556,
  "0": 556,
  "1": 556,
  "2": 556,
  "3": 556,
  "4": 556,
  "5": 556,
  "6": 556,
  "7": 556,
  "8": 556,
  "9": 556,
};

export function getPageNumberTextWidth(text: string, fontSize: number) {
  const totalUnits = Array.from(text).reduce(
    (total, character) => total + (helveticaWidths[character] ?? 556),
    0,
  );

  return (totalUnits / 1000) * fontSize;
}

export function formatPageNumberText(
  pageNumber: number,
  totalPages: number,
  format: PageNumberFormat,
) {
  if (format === "page-number") return `Page ${pageNumber}`;
  if (format === "page-number-total") return `Page ${pageNumber} of ${totalPages}`;
  return String(pageNumber);
}

function getPageNumberAnchor(
  position: PageNumberPosition,
  width: number,
  height: number,
  margin: number,
  textWidth: number,
  fontSize: number,
) {
  const normalizedMargin = clamp(margin, 8, Math.min(width, height) / 2);
  const isTop = position.startsWith("top");
  const verticalOffset = isTop ? height - normalizedMargin - fontSize : normalizedMargin;

  if (position.endsWith("left")) {
    return { x: normalizedMargin, y: verticalOffset };
  }

  if (position.endsWith("right")) {
    return { x: width - normalizedMargin - textWidth, y: verticalOffset };
  }

  return { x: (width - textWidth) / 2, y: verticalOffset };
}

export function getPageNumberPosition({
  position,
  pageWidth,
  pageHeight,
  margin,
  textWidth,
  fontSize,
  scale = 1,
}: {
  position: PageNumberPosition;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  textWidth: number;
  fontSize: number;
  scale?: number;
}) {
  const anchor = getPageNumberAnchor(position, pageWidth, pageHeight, margin, textWidth, fontSize);

  return {
    pdfX: anchor.x,
    pdfY: anchor.y,
    previewX: anchor.x * scale,
    previewY: (pageHeight - anchor.y) * scale,
  };
}

export async function addPageNumbersToPdf(
  file: File,
  options: PageNumberOptions,
): Promise<Uint8Array> {
  let pdf: PDFDocument;

  try {
    const bytes = await file.arrayBuffer();
    pdf = await PDFDocument.load(bytes);
  } catch {
    throw new Error(`"${file.name}" is not a valid PDF or may be corrupted.`);
  }

  const pages = pdf.getPages();
  if (pages.length === 0) {
    throw new Error("This PDF does not contain any pages.");
  }

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSize = clamp(options.fontSize, 8, 72);
  const margin = clamp(options.margin, 8, 144);
  const startNumber = Math.max(0, Math.floor(options.startNumber));
  const color = hexToRgb(options.color);

  pages.forEach((page, pageIndex) => {
    if (options.skipFirstPage && pageIndex === 0) return;

    const visiblePageNumber = startNumber + pageIndex - (options.skipFirstPage ? 1 : 0);
    const text = formatPageNumberText(visiblePageNumber, pages.length, options.format);
    const { width, height } = page.getSize();
    const textWidth = getPageNumberTextWidth(text, fontSize);
    const position = getPageNumberPosition({
      position: options.position,
      pageWidth: width,
      pageHeight: height,
      margin,
      textWidth,
      fontSize,
    });

    page.drawText(text, {
      x: position.pdfX,
      y: position.pdfY,
      size: fontSize,
      font,
      color: rgb(color.red, color.green, color.blue),
    });
  });

  return pdf.save();
}

export function createPdfDownloadUrl(bytes: Uint8Array) {
  const normalizedBytes = new Uint8Array(bytes);
  const blob = new Blob([normalizedBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}
