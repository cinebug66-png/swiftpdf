export type RouteSeoMetadata = {
  path: string;
  canonicalPath?: string;
  title: string;
  description: string;
  type: "website";
};

export const routeMetadata: Record<string, RouteSeoMetadata> = {
  "/": {
    path: "/",
    title: "SwiftPDF – Free PDF Tools Online | Convert, Merge & Compress PDFs",
    description:
      "Convert, compress, merge, split, sign, protect and edit PDFs online with SwiftPDF. Fast browser-based PDF tools with no signup required.",
    type: "website",
  },
  "/pdf-to-word": {
    path: "/pdf-to-word",
    title: "PDF to Word Online Free | SwiftPDF",
    description:
      "Convert PDF files to editable Word documents online with SwiftPDF. Fast, secure PDF to DOCX conversion with no signup required.",
    type: "website",
  },
  "/pdf-to-jpg": {
    path: "/pdf-to-jpg",
    title: "PDF to JPG Converter - Convert PDF Pages to JPG Online Free | SwiftPDF",
    description:
      "Convert PDF pages into high-quality JPG images online for free. Fast, secure, and works directly in your browser.",
    type: "website",
  },
  "/pdf-to-png": {
    path: "/pdf-to-png",
    title: "PDF to PNG Converter Online Free | SwiftPDF",
    description:
      "Convert PDF pages to high-quality PNG images online for free. Fast, secure, and works directly in your browser.",
    type: "website",
  },
  "/pdf-to-excel": {
    path: "/pdf-to-excel",
    title: "PDF to Excel Online Free | Convert PDF Tables to XLSX",
    description:
      "Convert PDF tables to Excel online with SwiftPDF. Extract readable table data from text-based PDFs and download an XLSX file for free.",
    type: "website",
  },
  "/compress-pdf": {
    path: "/compress-pdf",
    title: "Compress PDF Online Free | SwiftPDF",
    description:
      "Compress PDF files online to reduce file size while keeping documents clear and easy to share. Fast, secure and free with SwiftPDF.",
    type: "website",
  },
  "/merge-pdf": {
    path: "/merge-pdf",
    title: "Merge PDF Online Free | SwiftPDF",
    description:
      "Merge multiple PDF files into one document online. Combine PDFs quickly and securely in your browser with SwiftPDF.",
    type: "website",
  },
  "/split-pdf": {
    path: "/split-pdf",
    title: "Split PDF Online Free | SwiftPDF",
    description:
      "Split PDF files and extract the exact pages you need online. Create a new PDF quickly and securely with SwiftPDF.",
    type: "website",
  },
  "/extract-pages": {
    path: "/extract-pages",
    canonicalPath: "/extract-pdf-pages",
    title: "Extract PDF Pages Online Free | SwiftPDF",
    description:
      "Extract selected pages from a PDF online for free. Choose pages, preview them, and download a new PDF instantly in your browser.",
    type: "website",
  },
  "/extract-pdf-pages": {
    path: "/extract-pdf-pages",
    title: "Extract PDF Pages Online Free | SwiftPDF",
    description:
      "Extract selected pages from a PDF online for free. Choose pages, preview them, and download a new PDF instantly in your browser.",
    type: "website",
  },
  "/crop-pdf": {
    path: "/crop-pdf",
    title: "Crop PDF Online Free | Trim PDF Pages with SwiftPDF",
    description:
      "Crop PDF pages online with SwiftPDF. Trim margins, adjust the page area, and download a cropped PDF for free in your browser.",
    type: "website",
  },
  "/jpg-to-pdf": {
    path: "/jpg-to-pdf",
    title: "JPG to PDF Online Free | SwiftPDF",
    description:
      "Convert JPG, PNG and WEBP images to PDF online. Combine multiple images into one PDF quickly with SwiftPDF.",
    type: "website",
  },
  "/word-to-pdf": {
    path: "/word-to-pdf",
    title: "Word to PDF Online Free | SwiftPDF",
    description:
      "Convert DOC and DOCX files to PDF online with SwiftPDF. Create clean, shareable PDFs quickly with no signup required.",
    type: "website",
  },
  "/watermark-pdf": {
    path: "/watermark-pdf",
    title: "Watermark PDF Online Free | SwiftPDF",
    description:
      "Add a custom text watermark to every PDF page online. Adjust placement, opacity and size securely with SwiftPDF.",
    type: "website",
  },
  "/rotate-pdf": {
    path: "/rotate-pdf",
    title: "Rotate PDF Online Free | SwiftPDF",
    description:
      "Rotate PDF pages online by 90, 180 or 270 degrees. Fix document orientation quickly and securely with SwiftPDF.",
    type: "website",
  },
  "/delete-pages": {
    path: "/delete-pages",
    canonicalPath: "/delete-pdf-pages",
    title: "Delete PDF Pages Online Free | SwiftPDF",
    description:
      "Delete selected pages from a PDF online. Remove single pages or page ranges quickly and securely with SwiftPDF.",
    type: "website",
  },
  "/delete-pdf-pages": {
    path: "/delete-pdf-pages",
    title: "Delete PDF Pages Online Free | SwiftPDF",
    description:
      "Delete selected pages from a PDF online. Remove single pages or page ranges quickly and securely with SwiftPDF.",
    type: "website",
  },
  "/reorder-pdf": {
    path: "/reorder-pdf",
    canonicalPath: "/reorder-pdf-pages",
    title: "Reorder PDF Pages Online Free | SwiftPDF",
    description:
      "Reorder PDF pages online for free. Drag and arrange pages in your browser and download the updated PDF instantly.",
    type: "website",
  },
  "/reorder-pdf-pages": {
    path: "/reorder-pdf-pages",
    title: "Reorder PDF Pages Online Free | SwiftPDF",
    description:
      "Reorder PDF pages online for free. Drag and arrange pages in your browser and download the updated PDF instantly.",
    type: "website",
  },
  "/add-page-numbers": {
    path: "/add-page-numbers",
    title: "Add Page Numbers to PDF Online Free | SwiftPDF",
    description:
      "Add page numbers to PDF files online for free. Choose position, style, and format directly in your browser.",
    type: "website",
  },
  "/protect-pdf": {
    path: "/protect-pdf",
    title: "Protect PDF Online Free | SwiftPDF",
    description:
      "Password protect and encrypt PDF files online. Secure sensitive documents quickly with SwiftPDF.",
    type: "website",
  },
  "/unlock-pdf": {
    path: "/unlock-pdf",
    title: "Unlock PDF Online Free | SwiftPDF",
    description:
      "Unlock password-protected PDF files online when you have the password. Remove PDF protection securely with SwiftPDF.",
    type: "website",
  },
  "/sign-pdf": {
    path: "/sign-pdf",
    title: "Sign PDF Online Free | SwiftPDF",
    description:
      "Sign PDF files online by drawing, typing or uploading your signature. Place and download signed PDFs securely with SwiftPDF.",
    type: "website",
  },
  "/about": {
    path: "/about",
    title: "About SwiftPDF | Simple Online PDF Tools",
    description:
      "Learn about SwiftPDF and its fast, simple and privacy-friendly online tools for converting, compressing, merging, splitting and signing PDFs.",
    type: "website",
  },
  "/contact": {
    path: "/contact",
    title: "Contact SwiftPDF | Support and Feedback",
    description:
      "Contact SwiftPDF for product support, feedback or bug reports related to our online PDF tools.",
    type: "website",
  },
  "/privacy-policy": {
    path: "/privacy-policy",
    title: "Privacy Policy | SwiftPDF",
    description:
      "Read the SwiftPDF Privacy Policy to understand how files and related information are handled when you use our online PDF tools.",
    type: "website",
  },
  "/terms": {
    path: "/terms",
    title: "Terms of Service | SwiftPDF",
    description:
      "Read the SwiftPDF Terms of Service and the basic rules that apply when using our online PDF tools.",
    type: "website",
  },
};

export const publicRoutes = Object.keys(routeMetadata);

export const toolFeatureNames = [
  "PDF to Word",
  "PDF to JPG",
  "PDF to PNG",
  "PDF to Excel",
  "Compress PDF",
  "Merge PDF",
  "Split PDF",
  "Extract PDF Pages",
  "Crop PDF",
  "JPG to PDF",
  "Word to PDF",
  "Watermark PDF",
  "Rotate PDF",
  "Delete PDF Pages",
  "Reorder PDF Pages",
  "Add Page Numbers",
  "Protect PDF",
  "Unlock PDF",
  "Sign PDF",
];
