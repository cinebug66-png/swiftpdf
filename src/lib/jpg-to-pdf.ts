import { jsPDF } from "jspdf";

const PDF_POINT_SCALE = 72 / 96;

type SupportedImageFormat = "JPEG" | "PNG" | "WEBP";

type ImagePage = {
  dataUrl: string;
  width: number;
  height: number;
  format: SupportedImageFormat;
};

function getImageFormat(file: File): SupportedImageFormat {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (type === "image/png" || name.endsWith(".png")) return "PNG";
  if (type === "image/webp" || name.endsWith(".webp")) return "WEBP";
  return "JPEG";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error(`"${file.name}" could not be read.`));
    };
    reader.onerror = () => reject(new Error(`"${file.name}" could not be read.`));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string, fileName: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`"${fileName}" is not a valid image file.`));
    image.src = dataUrl;
  });
}

async function toImagePage(file: File): Promise<ImagePage> {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl, file.name);

  return {
    dataUrl,
    width: image.naturalWidth,
    height: image.naturalHeight,
    format: getImageFormat(file),
  };
}

export async function createPdfFromImages(files: File[]) {
  if (files.length === 0) {
    throw new Error("Add at least one image to create a PDF.");
  }

  const pages = await Promise.all(files.map((file) => toImagePage(file)));
  const [firstPage, ...restPages] = pages;

  const pdf = new jsPDF({
    orientation: firstPage.width >= firstPage.height ? "landscape" : "portrait",
    unit: "pt",
    format: [firstPage.width * PDF_POINT_SCALE, firstPage.height * PDF_POINT_SCALE],
  });

  pdf.addImage(
    firstPage.dataUrl,
    firstPage.format,
    0,
    0,
    firstPage.width * PDF_POINT_SCALE,
    firstPage.height * PDF_POINT_SCALE,
  );

  for (const page of restPages) {
    pdf.addPage(
      [page.width * PDF_POINT_SCALE, page.height * PDF_POINT_SCALE],
      page.width >= page.height ? "landscape" : "portrait",
    );
    pdf.addImage(
      page.dataUrl,
      page.format,
      0,
      0,
      page.width * PDF_POINT_SCALE,
      page.height * PDF_POINT_SCALE,
    );
  }

  return pdf.output("arraybuffer");
}

export function createPdfDownloadUrl(pdfBytes: ArrayBuffer) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

export function revokeObjectUrl(url: string | null | undefined) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}
