import { PDFDocument } from "pdf-lib";

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  if (files.length < 2) {
    throw new Error("Please upload at least two PDF files to merge.");
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    let sourcePdf: PDFDocument;

    try {
      const bytes = await file.arrayBuffer();
      sourcePdf = await PDFDocument.load(bytes);
    } catch {
      throw new Error(`"${file.name}" is not a valid PDF or may be corrupted.`);
    }

    const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    for (const page of pages) {
      mergedPdf.addPage(page);
    }
  }

  return mergedPdf.save();
}

export function createPdfDownloadUrl(bytes: Uint8Array) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}
