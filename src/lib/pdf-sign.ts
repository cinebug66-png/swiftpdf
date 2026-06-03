import { degrees, PDFDocument } from "pdf-lib";

export type PdfPageInfo = {
  width: number;
  height: number;
};

export type SignatureSourceType = "drawn" | "image" | "typed";

export type SignaturePlacement = {
  id?: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  opacity: number;
  type: SignatureSourceType;
  signatureData: string;
  imageData: string;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
};

function dataUrlToBytes(dataUrl: string) {
  const [header, data] = dataUrl.split(",");

  if (!header || !data) {
    throw new Error("Signature image could not be read.");
  }

  const mimeMatch = header.match(/^data:(.*?);base64$/);
  const mimeType = mimeMatch?.[1] ?? "";
  const binary = window.atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return { bytes, mimeType };
}

export async function getPdfPageInfo(file: File): Promise<PdfPageInfo[]> {
  try {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);

    return pdf.getPages().map((page) => {
      const { width, height } = page.getSize();
      return { width, height };
    });
  } catch {
    throw new Error(`"${file.name}" is not a valid PDF or may be corrupted.`);
  }
}

export async function signPdf(file: File, signatures: SignaturePlacement[]): Promise<Uint8Array> {
  if (signatures.length === 0) {
    throw new Error("Create or upload a signature before signing.");
  }

  let pdf: PDFDocument;

  try {
    const bytes = await file.arrayBuffer();
    pdf = await PDFDocument.load(bytes);
  } catch {
    throw new Error(`"${file.name}" is not a valid PDF or may be corrupted.`);
  }

  for (const signature of signatures) {
    if (signature.pageIndex < 0 || signature.pageIndex >= pdf.getPageCount()) {
      throw new Error("A signature is placed on a page that does not exist.");
    }

    const page = pdf.getPage(signature.pageIndex);
    const { bytes: signatureBytes, mimeType } = dataUrlToBytes(signature.signatureData);
    const signatureImage =
      mimeType === "image/jpeg" || mimeType === "image/jpg"
        ? await pdf.embedJpg(signatureBytes)
        : await pdf.embedPng(signatureBytes);

    page.drawImage(signatureImage, {
      x: signature.x,
      y: signature.y,
      width: signature.width,
      height: signature.height,
      rotate: degrees(signature.rotation),
      opacity: signature.opacity,
    });
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
