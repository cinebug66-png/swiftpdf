import type { MouseEvent } from "react";
import {
  ArrowRight,
  Crop,
  FileQuestion,
  FileText,
  Home,
  Images,
  Layers,
  Minimize2,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/app-router";

const suggestedTools = [
  {
    label: "PDF to Word",
    description: "Turn PDFs into editable Word documents.",
    to: "/pdf-to-word",
    icon: FileText,
  },
  {
    label: "PDF to JPG",
    description: "Export PDF pages as sharp JPG images.",
    to: "/pdf-to-jpg",
    icon: Images,
  },
  {
    label: "Merge PDF",
    description: "Combine multiple PDF files into one.",
    to: "/merge-pdf",
    icon: Layers,
  },
  {
    label: "Compress PDF",
    description: "Reduce file size while keeping PDFs clear.",
    to: "/compress-pdf",
    icon: Minimize2,
  },
  {
    label: "Crop PDF",
    description: "Trim page edges and clean up margins.",
    to: "/crop-pdf",
    icon: Crop,
  },
];

const quickToolLinks = [
  { label: "Convert", to: "/pdf-to-word" },
  { label: "Compress", to: "/compress-pdf" },
  { label: "Merge", to: "/merge-pdf" },
  { label: "Organize", to: "/reorder-pdf-pages" },
];

export default function NotFoundPage() {
  function openToolsInstantly(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    window.history.pushState({}, "", "/#tools");
    window.dispatchEvent(new PopStateEvent("popstate"));

    window.setTimeout(() => {
      const target = document.getElementById("tools");
      if (!target) return;

      const root = document.documentElement;
      const body = document.body;
      const previousRootBehavior = root.style.scrollBehavior;
      const previousBodyBehavior = body.style.scrollBehavior;

      root.style.scrollBehavior = "auto";
      body.style.scrollBehavior = "auto";
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY,
        left: 0,
        behavior: "auto",
      });
      root.style.scrollBehavior = previousRootBehavior;
      body.style.scrollBehavior = previousBodyBehavior;
      target.focus({ preventScroll: true });
    }, 0);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="bg-gradient-mesh px-4 pt-28 pb-16 sm:pt-36 sm:pb-20">
        <section className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <FileQuestion className="h-3.5 w-3.5" aria-hidden="true" />
                  404
                </div>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  Page not found
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  This page may have moved, been removed, or the link may be incorrect.
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  You can return home or continue with a popular PDF tool.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button variant="hero" className="w-full sm:w-auto" asChild>
                    <Link to="/">
                      <Home className="h-4 w-4" aria-hidden="true" />
                      Back to Home
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto" asChild>
                    <a href="/#tools" onClick={openToolsInstantly}>
                      Explore PDF Tools
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </Button>
                </div>
              </div>

              <aside className="rounded-2xl border border-border bg-background p-5">
                <div className="text-sm font-semibold">Looking for a tool?</div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  SwiftPDF includes free tools to convert, compress, merge, split, sign, and
                  organize PDF files.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {quickToolLinks.map((tool) => (
                    <Link
                      key={tool.to}
                      to={tool.to}
                      className="rounded-xl border border-border px-3 py-2 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {tool.label}
                    </Link>
                  ))}
                </div>
              </aside>
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-base font-semibold">Popular PDF tools</h2>
                <p className="text-sm text-muted-foreground">Choose a tool and keep working.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {suggestedTools.map((tool) => {
                  const Icon = tool.icon;

                  return (
                    <Link
                      key={tool.to}
                      to={tool.to}
                      className="group flex min-w-0 items-start gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                          {tool.label}
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                          {tool.description}
                        </span>
                      </span>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
