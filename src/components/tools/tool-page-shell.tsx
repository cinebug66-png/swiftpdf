import { Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { getToolPath } from "@/lib/tool-routes";
import { tools, type Tool } from "@/lib/tools";

type ToolPageShellProps = {
  tool: Tool;
  children: React.ReactNode;
};

export function ToolPageShell({ tool, children }: ToolPageShellProps) {
  const Icon = tool.icon;
  const related = tools.filter((item) => item.slug !== tool.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <Navbar />
      <main>
        <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
          <div className="absolute inset-0 -z-10 bg-gradient-mesh" />
          <div className="absolute inset-0 -z-10 [background:var(--gradient-hero)]" />
          <div className="pointer-events-none absolute -top-40 -left-32 h-[480px] w-[480px] rounded-full bg-primary/20 blur-3xl animate-blob" />
          <div className="pointer-events-none absolute top-20 -right-32 h-[520px] w-[520px] rounded-full bg-primary-glow/25 blur-3xl animate-blob [animation-delay:-6s]" />

          <div className="mx-auto max-w-5xl px-4">
            <div className="text-center animate-fade-up">
              <Link
                to="/"
                className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
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

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <div className="mb-3 text-xs font-medium uppercase tracking-wider text-primary">
                Why {tool.name}
              </div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Built for speed, designed for everyone
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
              {tool.benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
                >
                  <div
                    className={`mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-soft`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="font-semibold tracking-tight">{benefit.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{benefit.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-12 text-center">
              <div className="mb-3 text-xs font-medium uppercase tracking-wider text-primary">
                FAQ
              </div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Common questions
              </h2>
            </div>
            <Accordion type="single" collapsible className="rounded-2xl glass px-6 shadow-card">
              {tool.faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border-b last:border-0">
                  <AccordionTrigger className="py-5 text-left text-base font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">
                  Related tools
                </div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  You might also like
                </h2>
              </div>
              <Link
                to="/"
                hash="tools"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 sm:gap-6">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={getToolPath(item.slug)}
                  className="group relative rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
                >
                  <div
                    className={`mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-soft`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold tracking-tight">{item.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.desc}</div>
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
