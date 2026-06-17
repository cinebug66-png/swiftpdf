import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type WatermarkOptions = {
  text: string;
  opacity: number;
  fontSize: number;
  rotation: number;
  color?: string;
  x?: number;
  y?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex: string | undefined) {
  const normalized = hex?.trim().replace(/^#/, "") ?? "";
  const fallback = { red: 0.08, green: 0.1, blue: 0.16 };

  if (!/^[\da-f]{6}$/i.test(normalized)) {
    return fallback;
  }

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16) / 255,
    green: Number.parseInt(normalized.slice(2, 4), 16) / 255,
    blue: Number.parseInt(normalized.slice(4, 6), 16) / 255,
  };
}

export async function watermarkPdf(file: File, options: WatermarkOptions): Promise<Uint8Array> {
  const text = options.text.trim();

  if (!text) {
    throw new Error("Enter watermark text.");
  }

  let pdf: PDFDocument;

  try {
    const bytes = await file.arrayBuffer();
    pdf = await PDFDocument.load(bytes);
  } catch {
    throw new Error(`"${file.name}" is not a valid PDF or may be corrupted.`);
  }

  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontSize = clamp(options.fontSize, 12, 160);
  const opacity = clamp(options.opacity, 0.05, 1);
  const rotation = clamp(options.rotation, -90, 90);
  const xRatio = clamp(options.x ?? 0.5, 0, 1);
  const yRatio = clamp(options.y ?? 0.5, 0, 1);
  const color = hexToRgb(options.color);
  const pdfRotation = -rotation;
  const angle = (pdfRotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = fontSize;
    const centerX = width * xRatio;
    const centerY = height * yRatio;
    const rotatedCenterOffsetX = cos * (textWidth / 2) - sin * (textHeight / 2);
    const rotatedCenterOffsetY = sin * (textWidth / 2) + cos * (textHeight / 2);

    page.drawText(text, {
      x: centerX - rotatedCenterOffsetX,
      y: centerY - rotatedCenterOffsetY,
      size: fontSize,
      font,
      color: rgb(color.red, color.green, color.blue),
      opacity,
      rotate: degrees(pdfRotation),
    });
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
