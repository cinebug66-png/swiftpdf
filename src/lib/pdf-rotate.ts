import { degrees, PDFDocument } from "pdf-lib";

export type PdfRotation = 90 | 180 | 270;

export async function rotatePdf(file: File, rotation: PdfRotation): Promise<Uint8Array> {
  let pdf: PDFDocument;

  try {
    const bytes = await file.arrayBuffer();
    pdf = await PDFDocument.load(bytes);
  } catch {
    throw new Error(`"${file.name}" is not a valid PDF or may be corrupted.`);
  }

  for (const page of pdf.getPages()) {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + rotation) % 360));
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
