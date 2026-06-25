import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/app-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { Tool } from "@/lib/tools";
import { SafeToolSeoSection } from "@/components/tools/safe-tool-seo-section";
import { getSafeToolSeoContent } from "@/lib/safe-tool-seo-content";

type ToolPageShellProps = {
  tool: Tool;
  children: React.ReactNode;
};

export function ToolPageShell({ tool, children }: ToolPageShellProps) {
  const Icon = tool.icon;
  const safeSeoContent = getSafeToolSeoContent(tool);

  return (
    <div className="tool-page-root min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="tool-page-hero relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
          <div className="absolute inset-0 -z-10 bg-gradient-mesh" />
          <div className="absolute inset-0 -z-10 [background:var(--gradient-hero)]" />
          <div className="tool-page-hero-blob pointer-events-none absolute -top-40 -left-32 h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl animate-blob" />
          <div className="tool-page-hero-blob pointer-events-none absolute top-20 -right-32 h-[520px] w-[520px] rounded-full bg-primary-glow/25 blur-3xl animate-blob [animation-delay:-6s]" />

          <div className="mx-auto max-w-5xl px-4">
            <div className="text-center animate-fade-up">
              <Link
                to="/"
                className="mb-6 mr-5 inline-flex items-center gap-1.5 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to all tools
              </Link>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-foreground/80">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Free · No signup · No watermark
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

            <div className="mt-12 animate-fade-up [animation-delay:120ms]">{children}</div>
          </div>
        </section>
        <SafeToolSeoSection tool={tool} content={safeSeoContent} />
      </main>
      <Footer />
    </div>
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
