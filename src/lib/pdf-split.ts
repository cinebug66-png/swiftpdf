import { PDFDocument } from "pdf-lib";

function parsePageRanges(input: string, totalPages: number): number[] {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Enter at least one page or page range.");
  }

  const selectedPages = new Set<number>();
  const segments = trimmed.split(",");

  for (const rawSegment of segments) {
    const segment = rawSegment.trim();

    if (!segment) {
      throw new Error("Page ranges must not contain empty values.");
    }

    if (segment.includes("-")) {
      const [startText, endText, extra] = segment.split("-").map((value) => value.trim());

      if (!startText || !endText || extra) {
        throw new Error(`"${segment}" is not a valid page range.`);
      }

      const start = Number(startText);
      const end = Number(endText);

      if (!Number.isInteger(start) || !Number.isInteger(end) || start <= 0 || end <= 0) {
        throw new Error(`"${segment}" is not a valid page range.`);
      }

      if (start > end) {
        throw new Error(`"${segment}" must start with the lower page number.`);
      }

      if (end > totalPages) {
        throw new Error(`"${segment}" is out of bounds. This PDF has ${totalPages} pages.`);
      }

      for (let page = start; page <= end; page += 1) {
        selectedPages.add(page - 1);
      }
      continue;
    }

    const page = Number(segment);

    if (!Number.isInteger(page) || page <= 0) {
      throw new Error(`"${segment}" is not a valid page number.`);
    }

    if (page > totalPages) {
      throw new Error(`Page ${page} is out of bounds. This PDF has ${totalPages} pages.`);
    }

    selectedPages.add(page - 1);
  }

  const sortedPages = Array.from(selectedPages).sort((left, right) => left - right);

  if (sortedPages.length === 0) {
    throw new Error("Enter at least one page or page range.");
  }

  return sortedPages;
}

export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    return pdf.getPageCount();
  } catch {
    throw new Error(`"${file.name}" is not a valid PDF or may be corrupted.`);
  }
}

export async function splitPdf(file: File, rangeInput: string): Promise<Uint8Array> {
  let sourcePdf: PDFDocument;

  try {
    const bytes = await file.arrayBuffer();
    sourcePdf = await PDFDocument.load(bytes);
  } catch {
    throw new Error(`"${file.name}" is not a valid PDF or may be corrupted.`);
  }

  const pageIndices = parsePageRanges(rangeInput, sourcePdf.getPageCount());
  const outputPdf = await PDFDocument.create();
  const copiedPages = await outputPdf.copyPages(sourcePdf, pageIndices);

  for (const page of copiedPages) {
    outputPdf.addPage(page);
  }

  return outputPdf.save();
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
