import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type ConvertedPngPage = {
  pageNumber: number;
  blob: Blob;
  url: string;
  width: number;
  height: number;
};

type ConversionProgress = {
  completedPages: number;
  totalPages: number;
};

function dataUrlToBlob(dataUrl: string) {
  const [metadata, encodedData] = dataUrl.split(",");
  if (!metadata || !encodedData) {
    throw new Error("This browser could not create a PNG image.");
  }

  const mimeType = metadata.match(/^data:([^;]+)/)?.[1] ?? "image/png";
  const binary = window.atob(encodedData);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function getConversionError(error: unknown) {
  if (!(error instanceof Error)) {
    return new Error("Could not convert this PDF. Please try another file.");
  }

  const errorName = error.name.toLowerCase();
  const message = error.message.toLowerCase();

  if (
    message === "this pdf does not contain any pages." ||
    message === "this browser could not create a png image."
  ) {
    return error;
  }

  if (errorName.includes("password") || message.includes("password")) {
    return new Error("Password-protected PDFs are not supported. Unlock the PDF first.");
  }

  if (
    errorName.includes("invalidpdf") ||
    errorName.includes("missingpdf") ||
    message.includes("invalid pdf") ||
    message.includes("missing pdf")
  ) {
    return new Error("This file is not a valid PDF or is corrupted.");
  }

  if (message.includes("canvas")) {
    return new Error("Your browser could not render this PDF page. Please try a modern browser.");
  }

  return new Error("Could not convert this PDF. It may be damaged or use unsupported features.");
}

export function revokePngPages(pages: ConvertedPngPage[]) {
  pages.forEach((page) => URL.revokeObjectURL(page.url));
}

export async function getPngSourcePageCount(file: File) {
  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });

  try {
    const pdfDoc = await loadingTask.promise;
    if (pdfDoc.numPages < 1) {
      throw new Error("This PDF does not contain any pages.");
    }
    return pdfDoc.numPages;
  } catch (error) {
    throw getConversionError(error);
  } finally {
    await loadingTask.destroy().catch(() => undefined);
  }
}

export async function convertPdfToPng(
  file: File,
  onProgress?: (progress: ConversionProgress) => void,
): Promise<ConvertedPngPage[]> {
  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });
  const pages: ConvertedPngPage[] = [];

  try {
    const pdfDoc = await loadingTask.promise;

    if (pdfDoc.numPages < 1) {
      throw new Error("This PDF does not contain any pages.");
    }

    for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
      const page = await pdfDoc.getPage(pageNumber);
      const canvas = window.document.createElement("canvas");

      try {
        const viewport = page.getViewport({ scale: 2 });
        const context = canvas.getContext("2d", { alpha: true });

        if (!context) {
          throw new Error("Canvas rendering is not supported in this browser.");
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        const dataUrl = canvas.toDataURL("image/png");
        const blob = dataUrlToBlob(dataUrl);
        pages.push({
          pageNumber,
          blob,
          url: URL.createObjectURL(blob),
          width: canvas.width,
          height: canvas.height,
        });
      } finally {
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
      }

      onProgress?.({
        completedPages: pageNumber,
        totalPages: pdfDoc.numPages,
      });
    }

    return pages;
  } catch (error) {
    revokePngPages(pages);
    throw getConversionError(error);
  } finally {
    await loadingTask.destroy().catch(() => undefined);
  }
}
