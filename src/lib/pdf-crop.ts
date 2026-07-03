import { PDFDocument } from "pdf-lib";

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CropScope = "current" | "all";

export type CropPdfOptions = {
  cropRect: CropRect;
  scope: CropScope;
  currentPage: number;
};

const MIN_CROP_RATIO = 0.04;

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function normalizeCropRect(rect: CropRect): CropRect {
  const width = clamp(rect.width, MIN_CROP_RATIO * 100, 100);
  const height = clamp(rect.height, MIN_CROP_RATIO * 100, 100);
  return {
    x: clamp(rect.x, 0, 100 - width),
    y: clamp(rect.y, 0, 100 - height),
    width,
    height,
  };
}

export function validateCropRect(rect: CropRect) {
  const normalized = normalizeCropRect(rect);

  if (normalized.width < MIN_CROP_RATIO * 100 || normalized.height < MIN_CROP_RATIO * 100) {
    throw new Error("Crop area is too small. Resize the crop box and try again.");
  }

  if (
    normalized.x < 0 ||
    normalized.y < 0 ||
    normalized.x + normalized.width > 100 ||
    normalized.y + normalized.height > 100
  ) {
    throw new Error("Crop box is outside the page. Move it inside the preview and try again.");
  }

  return normalized;
}

export function cropRectToMargins(rect: CropRect) {
  const normalized = normalizeCropRect(rect);
  return {
    left: normalized.x,
    top: normalized.y,
    right: 100 - normalized.x - normalized.width,
    bottom: 100 - normalized.y - normalized.height,
  };
}

export function cropMarginsToRect(margins: {
  left: number;
  top: number;
  right: number;
  bottom: number;
}): CropRect {
  return normalizeCropRect({
    x: clamp(margins.left, 0, 96),
    y: clamp(margins.top, 0, 96),
    width: 100 - clamp(margins.left, 0, 96) - clamp(margins.right, 0, 96),
    height: 100 - clamp(margins.top, 0, 96) - clamp(margins.bottom, 0, 96),
  });
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

  const rect = validateCropRect(options.cropRect);
  const pages = pdf.getPages();
  const pageIndexes =
    options.scope === "all"
      ? pages.map((_, index) => index)
      : [Math.min(Math.max(options.currentPage - 1, 0), pages.length - 1)];

  for (const pageIndex of pageIndexes) {
    const page = pages[pageIndex];
    const cropBox = page.getCropBox();
    const x = cropBox.x + (cropBox.width * rect.x) / 100;
    const y = cropBox.y + (cropBox.height * (100 - rect.y - rect.height)) / 100;
    const width = (cropBox.width * rect.width) / 100;
    const height = (cropBox.height * rect.height) / 100;

    if (width <= 0 || height <= 0) {
      throw new Error("Crop box is outside the page bounds.");
    }

    page.setCropBox(x, y, width, height);
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
