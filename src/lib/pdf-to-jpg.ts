import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type JpgQuality = 0.6 | 0.8 | 0.95;

export type ConvertedJpgPage = {
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

function canvasToJpgBlob(canvas: HTMLCanvasElement, quality: JpgQuality) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("This browser could not create a JPG image."));
      },
      "image/jpeg",
      quality,
    );
  });
}

function getConversionError(error: unknown) {
  if (!(error instanceof Error)) {
    return new Error("Could not convert this PDF. Please try another file.");
  }

  const errorName = error.name.toLowerCase();
  const message = error.message.toLowerCase();

  if (
    message === "this pdf does not contain any pages." ||
    message === "this browser could not create a jpg image."
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

  if (errorName.includes("unexpectedresponse")) {
    return new Error("The PDF could not be loaded. Please choose the file again.");
  }

  if (message.includes("canvas")) {
    return new Error("Your browser could not render this PDF page. Please try a modern browser.");
  }

  return new Error("Could not convert this PDF. It may be damaged or use unsupported features.");
}

export function revokeJpgPages(pages: ConvertedJpgPage[]) {
  pages.forEach((page) => URL.revokeObjectURL(page.url));
}

export async function convertPdfToJpg(
  file: File,
  quality: JpgQuality,
  onProgress?: (progress: ConversionProgress) => void,
): Promise<ConvertedJpgPage[]> {
  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });
  const pages: ConvertedJpgPage[] = [];

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
        const context = canvas.getContext("2d", { alpha: false });

        if (!context) {
          throw new Error("Canvas rendering is not supported in this browser.");
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        const blob = await canvasToJpgBlob(canvas, quality);
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
    revokeJpgPages(pages);
    throw getConversionError(error);
  } finally {
    await loadingTask.destroy().catch(() => undefined);
  }
}
