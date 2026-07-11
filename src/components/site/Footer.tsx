import { Link } from "@/lib/app-router";

const columns = [
  {
    title: "Tools",
    links: [
      { label: "PDF to Word", to: "/pdf-to-word" },
      { label: "PDF to JPG", to: "/pdf-to-jpg" },
      { label: "Compress PDF", to: "/compress-pdf" },
      { label: "Merge PDF", to: "/merge-pdf" },
      { label: "Split PDF", to: "/split-pdf" },
      { label: "Extract PDF Pages", to: "/extract-pages" },
      { label: "Crop PDF", to: "/crop-pdf" },
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
      { label: "Terms of Service", to: "/terms-of-service" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-10">
          <div className="lg:col-span-2">
              <Link
                to="/"
                className="flex items-center gap-2.5 font-semibold tracking-tight"
                aria-label="SwiftPDF home"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-transparent">
                  <img
                    src="/brand/swiftpdf-icon.png"
                    alt=""
                    className="block h-10 w-10 object-contain"
                    width="40"
                    height="40"
                  />
                </span>
                <span className="text-lg leading-none">SwiftPDF</span>
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

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:mt-12 sm:pt-6">
          <div>© 2026 SwiftPDF. All rights reserved.</div>
          <div>Made for students, freelancers and teams.</div>
        </div>
      </div>
    </footer>
  );
}
