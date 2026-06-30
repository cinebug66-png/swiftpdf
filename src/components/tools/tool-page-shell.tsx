import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/app-router";
import {
  trackChooseFileClick,
  trackConversionError,
  trackDownloadClick,
  trackFileUploaded,
  trackToolPageView,
} from "@/lib/analytics";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Tool } from "@/lib/tools";

type ToolPageShellProps = {
  tool: Tool;
  children: React.ReactNode;
};

export function ToolPageShell({ tool, children }: ToolPageShellProps) {
  const Icon = tool.icon;
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const toolInfo = { tool_name: tool.name, tool_slug: tool.slug };
    trackToolPageView(toolInfo);
  }, [tool.name, tool.slug]);

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;

    const toolInfo = { tool_name: tool.name, tool_slug: tool.slug };
    let lastActionAt = 0;
    let lastErrorAt = 0;
    let lastChooseFileAt = 0;

    const trackChooseFileOnce = () => {
      const now = Date.now();
      if (now - lastChooseFileAt < 500) return;
      lastChooseFileAt = now;
      trackChooseFileClick(toolInfo);
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const fileInput = target.closest('input[type="file"]');
      if (fileInput instanceof HTMLInputElement) {
        trackChooseFileOnce();
        return;
      }

      const fileLabel = target.closest("label");
      if (fileLabel?.querySelector('input[type="file"]')) {
        trackChooseFileOnce();
        return;
      }

      const downloadLink = target.closest("a[download]");
      if (downloadLink instanceof HTMLAnchorElement) {
        trackDownloadClick(toolInfo, getOutputType(tool.slug));
        return;
      }

      const action = target.closest("button, a");
      const text = action?.textContent?.toLowerCase() ?? "";
      if (isProcessingAction(text)) {
        lastActionAt = Date.now();
      }
    };

    const handleChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.type !== "file" || !target.files) return;
      trackFileUploaded(toolInfo, target.files);
    };

    const observer = new MutationObserver(() => {
      if (Date.now() - lastActionAt > 30_000 || Date.now() - lastErrorAt < 1_500) return;
      if (!root.querySelector('[class*="destructive"]')) return;

      lastErrorAt = Date.now();
      trackConversionError(toolInfo, "tool_error", "Tool action failed");
    });

    root.addEventListener("click", handleClick, true);
    root.addEventListener("change", handleChange, true);
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      root.removeEventListener("click", handleClick, true);
      root.removeEventListener("change", handleChange, true);
      observer.disconnect();
    };
  }, [tool.name, tool.slug]);

  return (
    <div className="tool-page-root min-h-screen bg-background text-foreground">
      <Navbar />
      <main ref={mainRef} className="tool-page-main">
        <section className="tool-page-hero relative overflow-hidden pt-28 pb-14 sm:pt-36 sm:pb-20">
          <div className="tool-page-hero-bg absolute inset-0 -z-10 bg-gradient-mesh" />
          <div className="tool-page-hero-bg absolute inset-0 -z-10 [background:var(--gradient-hero)]" />

          <div className="mx-auto max-w-5xl px-4">
            <div className="text-center animate-fade-up">
              <div className="tool-feature-pills mb-5 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to all tools
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-foreground/80">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Free / No signup / No watermark
                </div>
              </div>
              <div
                className={`mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${tool.color} text-white shadow-glow`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                {tool.name}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">{tool.long}</p>
            </div>

            <div className="mt-9 animate-fade-up [animation-delay:120ms] sm:mt-11">{children}</div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function getOutputType(slug: string) {
  if (slug.includes("jpg")) return slug === "jpg-to-pdf" ? "pdf" : "jpg";
  if (slug.includes("png")) return "png";
  if (slug.includes("word")) return slug === "word-to-pdf" ? "pdf" : "docx";
  return "pdf";
}

function isProcessingAction(text: string) {
  if (!text || text.includes("download") || text.includes("choose")) return false;
  return /\b(convert|compress|merge|split|extract|delete|rotate|protect|unlock|watermark|reorder|number|sign|apply|create)\b/u.test(
    text,
  );
}

type ComingSoonToolCardProps = {
  title: string;
  description: string;
};

export function ComingSoonToolCard({ title, description }: ComingSoonToolCardProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card sm:p-10">
      <div className="mx-auto mb-4 inline-flex rounded-full bg-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
        Coming soon
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {description}
      </p>
      <div className="mt-6">
        <Button variant="glass" size="lg" asChild>
          <Link to="/">Back to homepage</Link>
        </Button>
      </div>
    </div>
  );
}
