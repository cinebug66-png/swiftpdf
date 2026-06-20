import { ArrowLeft, FileText } from "lucide-react";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Link } from "@/lib/app-router";

export type InfoSection = {
  title: string;
  content: React.ReactNode;
};

type InfoPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: InfoSection[];
};

export function InfoPageShell({ eyebrow, title, description, sections }: InfoPageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <Navbar />
      <main>
        <section className="relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-40">
          <div className="absolute inset-0 -z-10 bg-gradient-mesh" />
          <div className="absolute inset-0 -z-10 [background:var(--gradient-hero)]" />
          <div className="pointer-events-none absolute -left-32 -top-40 h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl animate-blob" />
          <div className="pointer-events-none absolute -right-32 top-20 h-[520px] w-[520px] rounded-full bg-primary-glow/25 blur-3xl animate-blob [animation-delay:-6s]" />

          <div className="mx-auto max-w-4xl px-4">
            <div className="text-center animate-fade-up">
              <Link
                to="/"
                className="mb-6 inline-flex items-center gap-1.5 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to SwiftPDF
              </Link>
              <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <FileText className="h-6 w-6" />
              </div>
              <div className="mb-3 text-xs font-medium uppercase tracking-wider text-primary">
                {eyebrow}
              </div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {description}
              </p>
            </div>

            <div className="mt-12 rounded-3xl glass p-6 shadow-card animate-fade-up [animation-delay:120ms] sm:p-10">
              <div className="space-y-9">
                {sections.map((section) => (
                  <section key={section.title}>
                    <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                      {section.title}
                    </h2>
                    <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
                      {section.content}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
