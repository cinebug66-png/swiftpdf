import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type WatermarkOptions = {
  text: string;
  opacity: number;
  fontSize: number;
  rotation: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.15, 0.17, 0.25),
      opacity,
      rotate: degrees(rotation),
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
