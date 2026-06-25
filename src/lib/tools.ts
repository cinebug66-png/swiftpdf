import {
  FileText,
  FileImage,
  FileType2,
  Combine,
  Images,
  Lock,
  LockOpen,
  Minimize2,
  PenLine,
  ListOrdered,
  Hash,
  Layers,
  RotateCw,
  Scissors,
  Trash2,
  Type,
  type LucideIcon,
} from "lucide-react";

export type Tool = {
  slug: string;
  icon: LucideIcon;
  name: string;
  desc: string;
  color: string;
  long: string;
  benefits: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  cta: string;
  accept: string;
  multiple?: boolean;
};

export const tools: Tool[] = [
  {
    slug: "pdf-to-word",
    icon: FileType2,
    name: "PDF to Word",
    desc: "Editable .docx export",
    color: "from-blue-500 to-indigo-500",
    long: "Convert PDF files into editable Word documents while preserving formatting.",
    cta: "Convert to Word",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Editable DOCX output",
        desc: "Download a Word document you can continue editing right away.",
      },
      {
        title: "Formatting preserved",
        desc: "Keep layouts, fonts, tables, and images as close to the original as possible.",
      },
      {
        title: "Simple browser flow",
        desc: "Upload, wait, and download without leaving the page.",
      },
    ],
    faqs: [
      {
        q: "Will my formatting be preserved?",
        a: "SwiftPDF works to preserve layouts, fonts, tables, and images as closely as possible.",
      },
      {
        q: "Do I need to install anything?",
        a: "No. Upload your PDF, convert it, and download the editable Word file online.",
      },
    ],
  },
  {
    slug: "pdf-to-jpg",
    icon: FileImage,
    name: "PDF to JPG",
    desc: "Export pages as images",
    color: "from-violet-500 to-fuchsia-500",
    long: "Convert every PDF page into a crisp, downloadable JPG image in your browser.",
    cta: "Convert to JPG",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Every page converted",
        desc: "Render the complete PDF into high-quality JPG images with clear page numbering.",
      },
      {
        title: "Private browser processing",
        desc: "Your PDF stays on your device and is never sent to a conversion server.",
      },
      {
        title: "Flexible downloads",
        desc: "Preview and download individual pages or bundle every JPG into one ZIP file.",
      },
    ],
    faqs: [
      {
        q: "Does SwiftPDF upload my PDF?",
        a: "No. PDF.js renders every page locally in your browser, so the file stays on your device.",
      },
      {
        q: "Can I download all pages at once?",
        a: "Yes. Download any page individually or create a ZIP containing every generated JPG.",
      },
      {
        q: "Which JPG quality should I choose?",
        a: "High gives the clearest images, Medium balances quality and file size, and Low creates smaller downloads.",
      },
    ],
  },
  {
    slug: "pdf-to-png",
    icon: FileImage,
    name: "PDF to PNG",
    desc: "Export pages as PNG",
    color: "from-blue-500 to-violet-500",
    long: "Convert every PDF page into a high-quality PNG image directly in your browser.",
    cta: "Convert to PNG",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Lossless PNG output",
        desc: "Render every page as a crisp PNG image with clear text and graphics.",
      },
      {
        title: "Private browser processing",
        desc: "Your PDF stays on your device with no API, upload, or backend conversion.",
      },
      {
        title: "Flexible downloads",
        desc: "Download individual PNG pages or bundle every image into one ZIP file.",
      },
    ],
    faqs: [
      {
        q: "Does SwiftPDF upload my PDF?",
        a: "No. PDF.js renders each page locally in your browser, so your document stays on your device.",
      },
      {
        q: "Can I download all PNG pages at once?",
        a: "Yes. Download pages individually or create a ZIP containing every generated PNG.",
      },
      {
        q: "What quality are the PNG images?",
        a: "Pages are rendered at high resolution and exported as lossless PNG images.",
      },
    ],
  },
  {
    slug: "jpg-to-pdf",
    icon: Images,
    name: "JPG to PDF",
    desc: "Convert images into PDF",
    color: "from-blue-500 to-violet-500",
    long: "Convert JPG, PNG, and WEBP images into a polished PDF document.",
    cta: "Convert to PDF",
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    multiple: true,
    benefits: [
      {
        title: "Multiple image support",
        desc: "Upload several JPG, PNG, or WEBP files and combine them into one PDF.",
      },
      {
        title: "Private processing",
        desc: "Create your PDF securely without a complicated setup.",
      },
      {
        title: "Fast PDF download",
        desc: "Generate and download your finished PDF in a single smooth flow.",
      },
    ],
    faqs: [
      {
        q: "Can I upload more than one image?",
        a: "Yes. Add multiple JPG, PNG, or WEBP files and SwiftPDF will turn them into one PDF.",
      },
      {
        q: "Will my images keep their quality?",
        a: "SwiftPDF keeps images clear and fits them neatly onto each PDF page.",
      },
    ],
  },
  {
    slug: "word-to-pdf",
    icon: FileText,
    name: "Word to PDF",
    desc: "Pixel-perfect conversion",
    color: "from-indigo-500 to-violet-500",
    long: "Convert Word documents into clean, shareable PDF files.",
    cta: "Convert to PDF",
    accept: ".doc,.docx",
    benefits: [
      {
        title: "DOC and DOCX support",
        desc: "Upload Word documents and convert them into shareable PDF files.",
      },
      { title: "Reliable PDF output", desc: "Create a polished PDF that is ready to share." },
      {
        title: "Simple conversion",
        desc: "Upload your document and download the finished PDF in a few steps.",
      },
    ],
    faqs: [
      {
        q: "Which Word files are supported?",
        a: "You can upload DOC or DOCX files and download the converted result as a PDF.",
      },
    ],
  },
  {
    slug: "merge-pdf",
    icon: Combine,
    name: "Merge PDF",
    desc: "Combine multiple files",
    color: "from-sky-500 to-blue-500",
    long: "Combine multiple PDF files into one document in seconds.",
    cta: "Merge PDFs",
    accept: ".pdf,application/pdf",
    multiple: true,
    benefits: [
      {
        title: "Quick, secure merging",
        desc: "Combine your documents in one simple, privacy-friendly workflow.",
      },
      {
        title: "Multiple file support",
        desc: "Add several PDFs, remove individual files, and merge them in one flow.",
      },
      {
        title: "Instant download",
        desc: "The final combined file downloads automatically as merged.pdf.",
      },
    ],
    faqs: [
      {
        q: "Will the page order stay the same?",
        a: "Yes. Files are combined in the order shown in your uploaded PDF list.",
      },
      {
        q: "What file types are supported?",
        a: "Upload PDF files only. If a file is invalid or corrupted, the page will show a friendly error.",
      },
    ],
  },
  {
    slug: "split-pdf",
    icon: Scissors,
    name: "Split PDF",
    desc: "Extract selected pages",
    color: "from-blue-500 to-violet-500",
    long: "Extract selected pages into a new PDF instantly.",
    cta: "Split PDF",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Flexible page selection",
        desc: "Pick single pages, full ranges, or mixed selections like 1-3,5,7-9.",
      },
      {
        title: "Secure page extraction",
        desc: "Create a focused PDF while keeping the workflow simple and private.",
      },
      {
        title: "Quick download",
        desc: "Generate a new PDF with only the pages you want and download it as split.pdf.",
      },
    ],
    faqs: [
      {
        q: "What page formats are supported?",
        a: "You can enter single pages, ranges, or mixed values such as 3, 1-5, or 1-3,5,7-9.",
      },
      {
        q: "What happens if I enter an invalid range?",
        a: "The page shows a friendly error if the range is empty, invalid, or outside the total page count.",
      },
    ],
  },
  {
    slug: "extract-pages",
    icon: Layers,
    name: "Extract PDF Pages",
    desc: "Save selected pages",
    color: "from-sky-500 to-indigo-500",
    long: "Extract selected PDF pages into a new document instantly in your browser.",
    cta: "Extract Pages",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Visual page picking",
        desc: "Select pages by clicking thumbnails or entering page ranges like 1,3-5.",
      },
      {
        title: "Quality preserved",
        desc: "Extract original PDF pages without converting or reducing their quality.",
      },
      {
        title: "Private browser editing",
        desc: "Your PDF stays on your device with no upload, API, or backend processing.",
      },
    ],
    faqs: [
      {
        q: "Which page range formats are supported?",
        a: "You can enter single pages, comma-separated pages, or ranges such as 1,3,5, 1-3, or 1,3-5.",
      },
      {
        q: "Can I preview selected pages?",
        a: "Yes. Selected pages are highlighted and shown in a separate preview before download.",
      },
      {
        q: "Does extraction reduce PDF quality?",
        a: "No. SwiftPDF copies the original PDF pages into a new file without rasterizing them.",
      },
    ],
  },
  {
    slug: "compress-pdf",
    icon: Minimize2,
    name: "Compress PDF",
    desc: "Reduce size, keep quality",
    color: "from-cyan-500 to-sky-500",
    long: "Reduce PDF file size without sacrificing quality.",
    cta: "Compress PDF",
    accept: ".pdf,application/pdf",
    benefits: [
      { title: "Smaller files", desc: "Optimize PDFs for easier sharing and upload." },
      {
        title: "Size comparison",
        desc: "The page shows original and compressed file sizes when the result is ready.",
      },
      {
        title: "Ready to share",
        desc: "Create a lighter PDF for email, uploads, and everyday storage.",
      },
    ],
    faqs: [
      {
        q: "How much can I reduce?",
        a: "The result depends on the PDF, but the app shows the before and after size when possible.",
      },
      {
        q: "Will the PDF still look good?",
        a: "SwiftPDF balances file-size reduction with clear, readable document quality.",
      },
    ],
  },
  {
    slug: "watermark-pdf",
    icon: Type,
    name: "Watermark PDF",
    desc: "Add text watermark",
    color: "from-indigo-500 to-sky-500",
    long: "Add text watermarks to protect and brand your PDFs.",
    cta: "Add Watermark",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Custom watermark text",
        desc: "Choose the text you want stamped across every page.",
      },
      {
        title: "Adjustable appearance",
        desc: "Control opacity, font size, and rotation before creating the final PDF.",
      },
      {
        title: "Consistent protection",
        desc: "Apply your watermark across every page in one step.",
      },
    ],
    faqs: [
      {
        q: "Can I watermark every page?",
        a: "Yes. Your chosen watermark is applied consistently across the full PDF.",
      },
      {
        q: "Can I change the watermark style?",
        a: "Yes. You can adjust the watermark text, opacity, font size, and rotation.",
      },
    ],
  },
  {
    slug: "rotate-pdf",
    icon: RotateCw,
    name: "Rotate PDF",
    desc: "Rotate every page",
    color: "from-sky-500 to-indigo-500",
    long: "Rotate PDF pages and save the corrected document.",
    cta: "Rotate PDF",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Rotate all pages",
        desc: "Apply the selected rotation to every page in one quick step.",
      },
      {
        title: "Quick correction",
        desc: "Fix page orientation without recreating or rescanning the document.",
      },
      {
        title: "Simple download",
        desc: "Preview the completed state and download the rotated PDF only when you choose.",
      },
    ],
    faqs: [
      {
        q: "Which rotations are supported?",
        a: "You can rotate the PDF by 90, 180, or 270 degrees.",
      },
      {
        q: "Will rotation change the page quality?",
        a: "No. Rotating pages changes their orientation without reducing document quality.",
      },
    ],
  },
  {
    slug: "delete-pages",
    icon: Trash2,
    name: "Delete PDF Pages",
    desc: "Remove selected pages",
    color: "from-blue-500 to-sky-500",
    long: "Remove unwanted pages and keep only what matters.",
    cta: "Delete Pages",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Flexible page removal",
        desc: "Delete single pages, comma-separated pages, or full ranges like 2-4.",
      },
      {
        title: "Clean final document",
        desc: "Create a focused PDF containing only the pages you need.",
      },
      {
        title: "Validated page numbers",
        desc: "The page shows a clear error for invalid, empty, or out-of-bounds selections.",
      },
    ],
    faqs: [
      {
        q: "Which page formats are supported?",
        a: "You can enter a single page, comma-separated pages like 1,3,5, or ranges like 2-4.",
      },
      {
        q: "Can I delete every page?",
        a: "No. SwiftPDF keeps at least one page so the updated PDF remains valid.",
      },
    ],
  },
  {
    slug: "reorder-pdf",
    icon: ListOrdered,
    name: "Reorder PDF Pages",
    desc: "Drag pages into order",
    color: "from-fuchsia-500 to-indigo-500",
    long: "Drag and arrange PDF pages, then download the reordered document instantly.",
    cta: "Reorder Pages",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Visual page sorting",
        desc: "Use clear page thumbnails and numbers to arrange the document exactly as needed.",
      },
      {
        title: "Quality preserved",
        desc: "Reorder original PDF pages without rasterizing or reducing their content quality.",
      },
      {
        title: "Private browser editing",
        desc: "Your PDF stays on your device with no upload, API, or backend processing.",
      },
    ],
    faqs: [
      {
        q: "Does reordering reduce PDF quality?",
        a: "No. SwiftPDF copies the original PDF pages into the new order without converting them to images.",
      },
      {
        q: "Does this work on mobile?",
        a: "Yes. Use the grip handle beside each page to drag it to a new position on touch devices.",
      },
      {
        q: "Is my PDF uploaded?",
        a: "No. Page previews and the reordered PDF are created entirely in your browser.",
      },
    ],
  },
  {
    slug: "add-page-numbers",
    icon: Hash,
    name: "Add Page Numbers",
    desc: "Number PDF pages",
    color: "from-indigo-500 to-sky-500",
    long: "Add page numbers to PDF files with custom position, style, and format.",
    cta: "Add Page Numbers",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Flexible numbering",
        desc: "Choose the number format, start value, and whether the first page should be skipped.",
      },
      {
        title: "Precise placement",
        desc: "Place page numbers in any corner or centered at the top or bottom.",
      },
      {
        title: "Private browser editing",
        desc: "Preview and number your PDF locally with no upload, API, or backend processing.",
      },
    ],
    faqs: [
      {
        q: "Can I choose where page numbers appear?",
        a: "Yes. Place numbers at the top or bottom, left, center, or right.",
      },
      {
        q: "Can I skip the cover page?",
        a: "Yes. Enable skip first page to start numbering from the second page.",
      },
      {
        q: "Is my PDF uploaded?",
        a: "No. Page numbers are added entirely in your browser.",
      },
    ],
  },
  {
    slug: "protect-pdf",
    icon: Lock,
    name: "Protect PDF",
    desc: "Add password protection",
    color: "from-indigo-500 to-blue-500",
    long: "Secure your PDF with password protection.",
    cta: "Protect PDF",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Strong document security",
        desc: "Add password protection that helps prevent unauthorized access.",
      },
      {
        title: "Password validation",
        desc: "Checks minimum length and confirmation before the file is processed.",
      },
      {
        title: "Manual download",
        desc: "The protected PDF is only downloaded when you click the download button.",
      },
    ],
    faqs: [
      {
        q: "How strong should my password be?",
        a: "Use a unique password with a mix of letters, numbers, and symbols for better protection.",
      },
      {
        q: "Does SwiftPDF store the password?",
        a: "No. The password is not stored or logged, and the password fields are cleared after processing.",
      },
    ],
  },
  {
    slug: "unlock-pdf",
    icon: LockOpen,
    name: "Unlock PDF",
    desc: "Remove PDF password",
    color: "from-sky-500 to-cyan-500",
    long: "Remove password restrictions from PDFs you own.",
    cta: "Unlock PDF",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Restore easy access",
        desc: "Create an unlocked copy for documents you are authorized to use.",
      },
      {
        title: "Password required",
        desc: "The tool validates that you enter the current PDF password before processing.",
      },
      {
        title: "Manual download",
        desc: "The unlocked PDF is only downloaded when you click the download button.",
      },
    ],
    faqs: [
      {
        q: "Can I unlock any PDF?",
        a: "You must know the current password and have permission to remove the document restriction.",
      },
      {
        q: "What if the password is wrong?",
        a: "SwiftPDF shows an error and does not create an unlocked PDF.",
      },
    ],
  },
  {
    slug: "sign-pdf",
    icon: PenLine,
    name: "Sign PDF",
    desc: "Draw or upload signature",
    color: "from-blue-500 to-indigo-500",
    long: "Add typed, drawn, or uploaded signatures online.",
    cta: "Sign PDF",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Draw or upload",
        desc: "Create a signature with the drawing pad or upload a PNG or JPG image.",
      },
      {
        title: "Precise placement",
        desc: "Move and resize the signature on the selected page before signing.",
      },
      {
        title: "Secure signing workflow",
        desc: "Place your signature and create the finished document in one simple flow.",
      },
    ],
    faqs: [
      {
        q: "Can I preserve PNG transparency?",
        a: "Yes. Uploaded PNG signatures are embedded with transparency preserved.",
      },
      {
        q: "Can I place signatures on different pages?",
        a: "Yes. Add, position, and resize signatures on the pages where they are needed.",
      },
    ],
  },
];

export function getTool(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function requireTool(slug: string): Tool {
  const tool = getTool(slug);
  if (!tool) {
    throw new Error(`Tool configuration for "${slug}" is missing.`);
  }

  return tool;
}
