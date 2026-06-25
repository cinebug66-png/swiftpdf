import {
  CheckCircle2,
  CircleGauge,
  CloudOff,
  Download,
  FileImage,
  Gauge,
  Image,
  MonitorDown,
  ShieldCheck,
  Upload,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";

type SafeSeoStep = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

type SafeSeoBenefit = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

type SafeSeoFaq = {
  id: string;
  question: string;
  answer: string;
};

export type SafeToolSeoContent = {
  steps: SafeSeoStep[];
  benefits: SafeSeoBenefit[];
  description: {
    heading: string;
    paragraphs: { id: string; text: string }[];
    tips: { id: string; text: string }[];
  };
  faqs: SafeSeoFaq[];
  relatedToolSlugs: string[];
};

export const SAFE_SEO_TRUST_ITEMS = [
  { id: "free", label: "Free to use", icon: UserRoundCheck },
  { id: "browser", label: "Browser-based", icon: CloudOff },
  { id: "signup", label: "No signup", icon: ShieldCheck },
  { id: "speed", label: "Fast processing", icon: CircleGauge },
] as const;

export const PDF_TO_JPG_SAFE_SEO: SafeToolSeoContent = {
  steps: [
    {
      id: "upload",
      title: "Upload your PDF",
      description: "Choose a single PDF containing the pages you want to export.",
      icon: Upload,
    },
    {
      id: "quality",
      title: "Choose image quality",
      description: "Select the balance of image clarity and download size that fits your task.",
      icon: Gauge,
    },
    {
      id: "convert",
      title: "Convert PDF pages",
      description: "SwiftPDF renders each page as an ordered JPG image in your browser.",
      icon: FileImage,
    },
    {
      id: "download",
      title: "Download JPG files",
      description: "Save individual pages or collect every converted image in one ZIP file.",
      icon: Download,
    },
  ],
  benefits: [
    {
      id: "private",
      title: "Private browser processing",
      description:
        "The PDF is rendered locally and does not need to be sent to a conversion server.",
      icon: ShieldCheck,
    },
    {
      id: "complete",
      title: "Every page exported",
      description: "Multi-page PDFs become a clearly numbered set of JPG files in page order.",
      icon: Image,
    },
    {
      id: "quality",
      title: "Adjustable output",
      description:
        "Choose high quality for detailed pages or a smaller setting for faster sharing.",
      icon: MonitorDown,
    },
    {
      id: "simple",
      title: "No software installation",
      description: "Use the converter from a modern browser on desktop, tablet, or mobile.",
      icon: CheckCircle2,
    },
  ],
  description: {
    heading: "When converting PDF pages to JPG is useful",
    paragraphs: [
      {
        id: "use-cases",
        text: "PDF is designed for complete documents, while JPG is easier to use when a page needs to behave like a regular image. Converting a PDF to JPG can help when you need a document preview for a website, a page image for a presentation, or a visual that can be shared in an app that does not handle PDF attachments well.",
      },
      {
        id: "page-order",
        text: "SwiftPDF converts every page separately, so a multi-page document becomes an ordered image set instead of one unusually tall picture. Page numbers are included in the filenames to keep the result organized. You can preview the converted pages before downloading them, save only the images you need, or create a ZIP when the full document should stay together.",
      },
      {
        id: "quality",
        text: "The quality setting affects both clarity and file size. High quality is a good choice for pages containing small text, diagrams, or details that may be enlarged. Medium quality suits most screen viewing and routine sharing. A smaller setting can be practical for quick previews, messaging, or places where upload limits matter.",
      },
      {
        id: "format-choice",
        text: "JPG uses lossy compression, so it is usually smaller than PNG for photographs and visually complex pages. If the source mainly contains sharp diagrams, interface screenshots, or fine line art, PDF to PNG may preserve edges more precisely. Keep the original PDF whenever selectable text, links, forms, or print-ready document structure are still important.",
      },
    ],
    tips: [
      {
        id: "quality",
        text: "Use high quality when recipients may zoom into text, signatures, charts, or technical details.",
      },
      {
        id: "sharing",
        text: "Use a smaller setting for thumbnails, messaging, and quick web previews.",
      },
      {
        id: "archive",
        text: "Keep the source PDF as the master copy because JPG pages do not retain searchable text or links.",
      },
    ],
  },
  faqs: [
    {
      id: "upload",
      question: "Is my PDF uploaded to a server?",
      answer:
        "No. PDF.js renders the document pages locally in your browser, so the conversion does not require a remote conversion service.",
    },
    {
      id: "quality",
      question: "Which JPG quality setting should I choose?",
      answer:
        "Choose High for detailed text and graphics, Medium for a practical balance, or Low when smaller downloads are more important than maximum clarity.",
    },
    {
      id: "one-page",
      question: "Can I download only one converted page?",
      answer:
        "Yes. Each page preview has its own JPG download control, while the ZIP option packages every converted page together.",
    },
    {
      id: "multipage",
      question: "Does PDF to JPG support multi-page documents?",
      answer:
        "Yes. Every page is converted and assigned an ordered filename so the image sequence remains easy to understand.",
    },
    {
      id: "png",
      question: "Should I use JPG or PNG for PDF pages?",
      answer:
        "JPG is often smaller for photos and general sharing. PNG can be better for sharp diagrams, screenshots, and line art where lossless output matters.",
    },
  ],
  relatedToolSlugs: ["pdf-to-png", "jpg-to-pdf", "extract-pages", "compress-pdf"],
};
