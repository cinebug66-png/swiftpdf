import { PDFDocument } from "pdf-lib";

export type CropMargins = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type CropScope = "current" | "all";

export type CropPdfOptions = {
  margins: CropMargins;
  scope: CropScope;
  currentPage: number;
};

const MIN_CROP_RATIO = 0.08;

function normalizeMargin(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 45);
}

export function normalizeCropMargins(margins: CropMargins): CropMargins {
  return {
    top: normalizeMargin(margins.top),
    bottom: normalizeMargin(margins.bottom),
    left: normalizeMargin(margins.left),
    right: normalizeMargin(margins.right),
  };
}

export function validateCropMargins(margins: CropMargins) {
  const normalized = normalizeCropMargins(margins);
  const widthRatio = 1 - (normalized.left + normalized.right) / 100;
  const heightRatio = 1 - (normalized.top + normalized.bottom) / 100;

  if (widthRatio < MIN_CROP_RATIO || heightRatio < MIN_CROP_RATIO) {
    throw new Error("Crop area is too small. Reduce one or more margins and try again.");
  }

  return normalized;
}

export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    return pdf.getPageCount();
  } catch {
    throw new Error(`"${file.name}" is not a valid PDF, is encrypted, or may be corrupted.`);
  }
}

export async function cropPdf(file: File, options: CropPdfOptions): Promise<Uint8Array> {
  let pdf: PDFDocument;

  try {
    const bytes = await file.arrayBuffer();
    pdf = await PDFDocument.load(bytes);
  } catch {
    throw new Error(`"${file.name}" is not a valid PDF, is encrypted, or may be corrupted.`);
  }

  const margins = validateCropMargins(options.margins);
  const pages = pdf.getPages();
  const pageIndexes =
    options.scope === "all"
      ? pages.map((_, index) => index)
      : [Math.min(Math.max(options.currentPage - 1, 0), pages.length - 1)];

  for (const pageIndex of pageIndexes) {
    const page = pages[pageIndex];
    const cropBox = page.getCropBox();
    const left = (cropBox.width * margins.left) / 100;
    const right = (cropBox.width * margins.right) / 100;
    const top = (cropBox.height * margins.top) / 100;
    const bottom = (cropBox.height * margins.bottom) / 100;
    const width = cropBox.width - left - right;
    const height = cropBox.height - top - bottom;

    if (width <= 0 || height <= 0) {
      throw new Error("Crop values are outside the page bounds.");
    }

    page.setCropBox(cropBox.x + left, cropBox.y + bottom, width, height);
  }

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
