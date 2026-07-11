import { ArrowRight, FileQuestion, Home } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/app-router";

const suggestedTools = [
  { label: "PDF to Word", to: "/pdf-to-word" },
  { label: "PDF to JPG", to: "/pdf-to-jpg" },
  { label: "Merge PDF", to: "/merge-pdf" },
  { label: "Compress PDF", to: "/compress-pdf" },
  { label: "Crop PDF", to: "/crop-pdf" },
];

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="bg-gradient-mesh px-4 pt-32 pb-20 sm:pt-40">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-soft">
            <FileQuestion className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            404
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Page not found
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            The page you&apos;re looking for may have moved, been removed, or the link may be
            incorrect.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="hero" asChild>
              <Link to="/">
                <Home className="h-4 w-4" aria-hidden="true" />
                Back to Home
              </Link>
            </Button>
            <Button variant="glass" asChild>
              <Link to="/#tools">
                Explore PDF Tools
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-card/90 p-4 text-left shadow-soft backdrop-blur sm:p-5">
            <div className="mb-3 text-sm font-semibold">Popular PDF tools</div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {suggestedTools.map((tool) => (
                <Link
                  key={tool.to}
                  to={tool.to}
                  className="flex min-h-11 items-center justify-between rounded-xl border border-border bg-background/70 px-3 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <span>{tool.label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
