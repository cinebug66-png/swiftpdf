import { FileText, Twitter, Github, Linkedin } from "lucide-react";

const cols = [
  {
    title: "Tools",
    links: ["PDF to Word", "Merge PDF", "Compress PDF", "Watermark PDF", "Split PDF"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Press"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Terms", "Security", "Contact"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-14">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
                <FileText className="w-4 h-4" />
              </span>
              <span className="text-lg">SwiftPDF</span>
            </a>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              The fastest way to convert and manage PDFs. Built with care.
            </p>
            <div className="mt-5 flex gap-2">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl glass grid place-items-center hover:shadow-soft transition-all"
                  aria-label="Social"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-sm font-semibold mb-4">{c.title}</div>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} SwiftPDF. All rights reserved.</div>
          <div>Made for students, freelancers and teams.</div>
        </div>
      </div>
    </footer>
  );
}
