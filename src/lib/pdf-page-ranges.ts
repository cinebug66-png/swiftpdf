export type PageRangePreview = {
  pages: number[];
  error: string | null;
};

export function parsePageRangePreview(
  input: string,
  totalPages: number,
  options?: { requireRemaining?: boolean },
): PageRangePreview {
  const trimmed = input.trim();

  if (!trimmed) {
    return { pages: [], error: null };
  }

  const selectedPages = new Set<number>();
  const segments = trimmed.split(",");

  for (const rawSegment of segments) {
    const segment = rawSegment.trim();

    if (!segment) {
      return { pages: [], error: "Page ranges must not contain empty values." };
    }

    if (segment.includes("-")) {
      const [startText, endText, extra] = segment.split("-").map((value) => value.trim());

      if (!startText || !endText || extra) {
        return { pages: [], error: `"${segment}" is not a valid page range.` };
      }

      const start = Number(startText);
      const end = Number(endText);

      if (!Number.isInteger(start) || !Number.isInteger(end) || start <= 0 || end <= 0) {
        return { pages: [], error: `"${segment}" is not a valid page range.` };
      }

      if (start > end) {
        return { pages: [], error: `"${segment}" must start with the lower page number.` };
      }

      if (end > totalPages) {
        return {
          pages: [],
          error: `"${segment}" is out of bounds. This PDF has ${totalPages} pages.`,
        };
      }

      for (let page = start; page <= end; page += 1) {
        selectedPages.add(page);
      }
      continue;
    }

    const page = Number(segment);

    if (!Number.isInteger(page) || page <= 0) {
      return { pages: [], error: `"${segment}" is not a valid page number.` };
    }

    if (page > totalPages) {
      return {
        pages: [],
        error: `Page ${page} is out of bounds. This PDF has ${totalPages} pages.`,
      };
    }

    selectedPages.add(page);
  }

  const pages = Array.from(selectedPages).sort((left, right) => left - right);

  if (options?.requireRemaining && pages.length >= totalPages) {
    return { pages, error: "You cannot delete every page. Keep at least one page in the PDF." };
  }

  return { pages, error: null };
}
