import { PDFDocument } from "pdf-lib";

export async function reorderPdfPages(file: File, pageOrder: number[]): Promise<Uint8Array> {
  try {
    const bytes = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(bytes);
    const pageCount = sourcePdf.getPageCount();

    if (pageOrder.length !== pageCount) {
      throw new Error("The page order does not include every page in the PDF.");
    }

    const uniquePages = new Set(pageOrder);
    const hasInvalidPage = pageOrder.some(
      (pageNumber) => !Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pageCount,
    );

    if (uniquePages.size !== pageCount || hasInvalidPage) {
      throw new Error("The page order is invalid. Reset the order and try again.");
    }

    const reorderedPdf = await PDFDocument.create();
    const copiedPages = await reorderedPdf.copyPages(
      sourcePdf,
      pageOrder.map((pageNumber) => pageNumber - 1),
    );

    copiedPages.forEach((page) => reorderedPdf.addPage(page));
    return reorderedPdf.save();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("The page order")) {
      throw error;
    }

    throw new Error(`"${file.name}" is not a valid PDF or may be corrupted.`);
  }
}

export function createPdfDownloadUrl(bytes: Uint8Array) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}
