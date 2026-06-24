import { PDFDocument } from "pdf-lib";

export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    return pdf.getPageCount();
  } catch {
    throw new Error(`"${file.name}" is not a valid PDF or may be corrupted.`);
  }
}

export async function extractPdfPages(file: File, pages: number[]): Promise<Uint8Array> {
  if (pages.length === 0) {
    throw new Error("Select at least one page to extract.");
  }

  let sourcePdf: PDFDocument;

  try {
    const bytes = await file.arrayBuffer();
    sourcePdf = await PDFDocument.load(bytes);
  } catch {
    throw new Error(`"${file.name}" is not a valid PDF or may be corrupted.`);
  }

  const totalPages = sourcePdf.getPageCount();
  const pageIndices = pages.map((page) => {
    if (!Number.isInteger(page) || page < 1 || page > totalPages) {
      throw new Error(`Page ${page} is out of bounds. This PDF has ${totalPages} pages.`);
    }

    return page - 1;
  });

  const outputPdf = await PDFDocument.create();
  const copiedPages = await outputPdf.copyPages(sourcePdf, pageIndices);

  for (const page of copiedPages) {
    outputPdf.addPage(page);
  }

  return outputPdf.save();
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
