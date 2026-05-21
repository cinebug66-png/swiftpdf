import { PDFDocument } from "pdf-lib";

function parsePagesToDelete(input: string, totalPages: number): number[] {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Enter at least one page or page range to delete.");
  }

  const pagesToDelete = new Set<number>();
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
        pagesToDelete.add(page - 1);
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

    pagesToDelete.add(page - 1);
  }

  const sortedPages = Array.from(pagesToDelete).sort((left, right) => right - left);

  if (sortedPages.length === 0) {
    throw new Error("Enter at least one page or page range to delete.");
  }

  if (sortedPages.length >= totalPages) {
    throw new Error("You cannot delete every page. Keep at least one page in the PDF.");
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

export async function deletePdfPages(file: File, pagesInput: string): Promise<Uint8Array> {
  let pdf: PDFDocument;

  try {
    const bytes = await file.arrayBuffer();
    pdf = await PDFDocument.load(bytes);
  } catch {
    throw new Error(`"${file.name}" is not a valid PDF or may be corrupted.`);
  }

  const pagesToDelete = parsePagesToDelete(pagesInput, pdf.getPageCount());

  for (const pageIndex of pagesToDelete) {
    pdf.removePage(pageIndex);
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
