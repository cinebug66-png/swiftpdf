import {
  FileText,
  FileType2,
  Combine,
  Minimize2,
  PenLine,
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
    long: "Convert any PDF into an editable Word document using CloudConvert while keeping the existing SwiftPDF design intact.",
    cta: "Convert to Word",
    accept: ".pdf,application/pdf",
    benefits: [
      { title: "Editable DOCX output", desc: "Download a Word document you can continue editing right away." },
      { title: "CloudConvert powered", desc: "Uses the CloudConvert REST API directly from this Vite React project." },
      { title: "Simple browser flow", desc: "Upload, wait, and download without leaving the page." },
    ],
    faqs: [
      { q: "Will my formatting be preserved?", a: "CloudConvert is designed to preserve layout, fonts, tables, and images as closely as possible." },
      { q: "Do I need to install anything?", a: "No. The conversion runs from the browser using your CloudConvert API key." },
    ],
  },
  {
    slug: "word-to-pdf",
    icon: FileText,
    name: "Word to PDF",
    desc: "Pixel-perfect conversion",
    color: "from-indigo-500 to-violet-500",
    long: "Turn DOC and DOCX files into clean PDFs. This route is ready and reserved for a future release.",
    cta: "Convert to PDF",
    accept: ".doc,.docx",
    benefits: [
      { title: "Planned DOCX support", desc: "This page is already set up so the feature can be added later." },
      { title: "Consistent UI", desc: "The design matches the rest of the SwiftPDF tool pages." },
      { title: "Future-ready route", desc: "The public path is already in place for a smooth later launch." },
    ],
    faqs: [{ q: "Is Word to PDF live yet?", a: "Not yet. This page currently shows a clean coming-soon state." }],
  },
  {
    slug: "merge-pdf",
    icon: Combine,
    name: "Merge PDF",
    desc: "Combine multiple files",
    color: "from-sky-500 to-blue-500",
    long: "Combine multiple PDFs into one document directly in your browser while keeping the current SwiftPDF experience exactly the same.",
    cta: "Merge PDFs",
    accept: ".pdf,application/pdf",
    multiple: true,
    benefits: [
      { title: "Client-side merging", desc: "Your PDF files are merged directly in the browser with no backend upload required." },
      { title: "Multiple file support", desc: "Add several PDFs, remove individual files, and merge them in one flow." },
      { title: "Instant download", desc: "The final combined file downloads automatically as merged.pdf." },
    ],
    faqs: [
      { q: "Does merging happen on a server?", a: "No. Merge PDF runs client-side in your browser using pdf-lib." },
      { q: "What file types are supported?", a: "Upload PDF files only. If a file is invalid or corrupted, the page will show a friendly error." },
    ],
  },
  {
    slug: "compress-pdf",
    icon: Minimize2,
    name: "Compress PDF",
    desc: "Reduce size, keep quality",
    color: "from-cyan-500 to-sky-500",
    long: "Shrink PDF size with CloudConvert's optimization tools while keeping the current SwiftPDF interface and flow simple.",
    cta: "Compress PDF",
    accept: ".pdf,application/pdf",
    benefits: [
      { title: "Smaller files", desc: "Optimize PDFs for easier sharing and upload." },
      { title: "Size comparison", desc: "The page shows original and compressed file sizes when the result is ready." },
      { title: "CloudConvert REST API", desc: "Compression runs through CloudConvert using your VITE_CLOUDCONVERT_API_KEY." },
    ],
    faqs: [
      { q: "How much can I reduce?", a: "The result depends on the PDF, but the app shows the before and after size when possible." },
      { q: "Will the PDF still look good?", a: "The page uses CloudConvert's web optimization profile to keep the document readable while reducing size." },
    ],
  },
  {
    slug: "edit-pdf-text",
    icon: PenLine,
    name: "Edit PDF Text",
    desc: "Text editing coming soon",
    color: "from-violet-500 to-purple-500",
    long: "Edit text inside PDF documents with a clean workflow. This route is reserved for a future release.",
    cta: "Open Editor",
    accept: ".pdf,application/pdf",
    benefits: [
      { title: "Planned text editing", desc: "Inline PDF text tools are being prepared for a future update." },
      { title: "Route already live", desc: "The page is already available at its final public URL." },
      { title: "Same SwiftPDF design", desc: "The coming-soon screen fits seamlessly into the current site." },
    ],
    faqs: [{ q: "Can I edit PDF text today?", a: "Not yet. This route currently shows a clean coming-soon page." }],
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
