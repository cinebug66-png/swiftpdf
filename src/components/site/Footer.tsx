import { FileText } from "lucide-react";
import { Link } from "@/lib/app-router";

const columns = [
  {
    title: "Tools",
    links: [
      { label: "PDF to Word", to: "/pdf-to-word" },
      { label: "PDF to JPG", to: "/pdf-to-jpg" },
      { label: "PDF to PNG", to: "/pdf-to-png" },
      { label: "Compress PDF", to: "/compress-pdf" },
      { label: "Merge PDF", to: "/merge-pdf" },
      { label: "Split PDF", to: "/split-pdf" },
      { label: "Extract PDF Pages", to: "/extract-pages" },
      { label: "Sign PDF", to: "/sign-pdf" },
      { label: "Watermark PDF", to: "/watermark-pdf" },
      { label: "Delete PDF Pages", to: "/delete-pages" },
      { label: "Reorder PDF Pages", to: "/reorder-pdf" },
      { label: "Add Page Numbers", to: "/add-page-numbers" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms of Service", to: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer border-t border-border py-14">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
                <FileText className="h-4 w-4" />
              </span>
              <span className="text-lg">SwiftPDF</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Fast, secure, browser-based PDF tools. Convert, compress, merge, split and sign PDFs
              for free.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <div className="mb-4 text-sm font-semibold">{column.title}</div>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
          <div>© 2026 SwiftPDF. All rights reserved.</div>
          <div>Made for students, freelancers and teams.</div>
        </div>
      </div>
    </footer>
  );
}
