import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/app-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { Tool } from "@/lib/tools";

type ToolPageShellProps = {
  tool: Tool;
  children: React.ReactNode;
};

export function ToolPageShell({ tool, children }: ToolPageShellProps) {
  const Icon = tool.icon;

  return (
    <div className="tool-page-root min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="tool-page-main">
        <section className="tool-page-hero relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
          <div className="tool-page-hero-bg absolute inset-0 -z-10 bg-gradient-mesh" />
          <div className="tool-page-hero-bg absolute inset-0 -z-10 [background:var(--gradient-hero)]" />

          <div className="mx-auto max-w-5xl px-4">
            <div className="text-center animate-fade-up">
              <div className="tool-feature-pills mb-6 flex flex-wrap items-center justify-center gap-3">
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

            <div className="mt-12 animate-fade-up [animation-delay:120ms]">{children}</div>
          </div>
        </section>
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
