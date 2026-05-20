import {
  FileText,
  FileType2,
  Combine,
  Images,
  Minimize2,
  Scissors,
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
    long: "Convert any PDF into an editable Word document using CloudConvert while keeping the existing SwiftPDF design intact.",
    cta: "Convert to Word",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Editable DOCX output",
        desc: "Download a Word document you can continue editing right away.",
      },
      {
        title: "CloudConvert powered",
        desc: "Uses the CloudConvert REST API directly from this Vite React project.",
      },
      {
        title: "Simple browser flow",
        desc: "Upload, wait, and download without leaving the page.",
      },
    ],
    faqs: [
      {
        q: "Will my formatting be preserved?",
        a: "CloudConvert is designed to preserve layout, fonts, tables, and images as closely as possible.",
      },
      {
        q: "Do I need to install anything?",
        a: "No. The conversion runs from the browser using your CloudConvert API key.",
      },
    ],
  },
  {
    slug: "jpg-to-pdf",
    icon: Images,
    name: "JPG to PDF",
    desc: "Convert images into PDF",
    color: "from-blue-500 to-violet-500",
    long: "Convert JPG, PNG, and WEBP images into a single PDF directly in your browser while keeping the existing SwiftPDF experience exactly the same.",
    cta: "Convert to PDF",
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    multiple: true,
    benefits: [
      {
        title: "Multiple image support",
        desc: "Upload several JPG, PNG, or WEBP files and combine them into one PDF.",
      },
      {
        title: "Client-side conversion",
        desc: "Everything runs directly in your browser with jsPDF and no backend upload.",
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
        q: "Does JPG to PDF use a server?",
        a: "No. The conversion runs client-side in your browser using jsPDF.",
      },
    ],
  },
  {
    slug: "word-to-pdf",
    icon: FileText,
    name: "Word to PDF",
    desc: "Pixel-perfect conversion",
    color: "from-indigo-500 to-violet-500",
    long: "Turn DOC and DOCX files into clean PDFs with CloudConvert while keeping the existing SwiftPDF experience simple.",
    cta: "Convert to PDF",
    accept: ".doc,.docx",
    benefits: [
      {
        title: "DOC and DOCX support",
        desc: "Upload Word documents and convert them into shareable PDF files.",
      },
      { title: "Consistent UI", desc: "The design matches the rest of the SwiftPDF tool pages." },
      {
        title: "CloudConvert powered",
        desc: "Conversion runs through the same CloudConvert REST flow used by SwiftPDF.",
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
    long: "Combine multiple PDFs into one document directly in your browser while keeping the current SwiftPDF experience exactly the same.",
    cta: "Merge PDFs",
    accept: ".pdf,application/pdf",
    multiple: true,
    benefits: [
      {
        title: "Client-side merging",
        desc: "Your PDF files are merged directly in the browser with no backend upload required.",
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
        q: "Does merging happen on a server?",
        a: "No. Merge PDF runs client-side in your browser using pdf-lib.",
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
    long: "Split a PDF by selecting the exact pages you want to keep, directly in your browser with the same SwiftPDF experience.",
    cta: "Split PDF",
    accept: ".pdf,application/pdf",
    benefits: [
      {
        title: "Flexible page selection",
        desc: "Pick single pages, full ranges, or mixed selections like 1-3,5,7-9.",
      },
      {
        title: "Client-side processing",
        desc: "Your PDF is split directly in the browser with no backend upload required.",
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
      {
        title: "Size comparison",
        desc: "The page shows original and compressed file sizes when the result is ready.",
      },
      {
        title: "CloudConvert REST API",
        desc: "Compression runs through CloudConvert using your VITE_CLOUDCONVERT_API_KEY.",
      },
    ],
    faqs: [
      {
        q: "How much can I reduce?",
        a: "The result depends on the PDF, but the app shows the before and after size when possible.",
      },
      {
        q: "Will the PDF still look good?",
        a: "The page uses CloudConvert's web optimization profile to keep the document readable while reducing size.",
      },
    ],
  },
  {
    slug: "watermark-pdf",
    icon: Type,
    name: "Watermark PDF",
    desc: "Add text watermark",
    color: "from-indigo-500 to-sky-500",
    long: "Add a custom text watermark to every page of a PDF directly in your browser while keeping SwiftPDF fast and private.",
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
        title: "Client-side processing",
        desc: "Watermarks are applied in your browser with pdf-lib and no server upload.",
      },
    ],
    faqs: [
      {
        q: "Does Watermark PDF use a server?",
        a: "No. The watermark is applied client-side in your browser using pdf-lib.",
      },
      {
        q: "Can I change the watermark style?",
        a: "Yes. You can adjust the watermark text, opacity, font size, and rotation.",
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
