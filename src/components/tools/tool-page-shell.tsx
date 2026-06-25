import { memo, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/app-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleGauge,
  CloudOff,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { getToolSeoContent } from "@/lib/tool-seo-content";
import type { ToolSeoContent } from "@/lib/tool-seo-content";
import { getToolPath } from "@/lib/tool-routes";
import { tools, type Tool } from "@/lib/tools";

const TRUST_ITEMS = [
  { label: "Free to use", icon: UserRoundCheck },
  { label: "Browser-based", icon: CloudOff },
  { label: "No signup", icon: ShieldCheck },
  { label: "Fast processing", icon: CircleGauge },
] as const;

type ToolPageShellProps = {
  tool: Tool;
  children: React.ReactNode;
};

const TrustRow = memo(function TrustRow() {
  return (
    <section
      className="tool-shared-section border-y border-border/70 bg-card/35 py-5"
      data-shared-component="trust-badges"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-4 sm:grid-cols-4">
        {TRUST_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-3 text-xs font-medium shadow-soft sm:text-sm"
          >
            <item.icon className="h-4 w-4 text-primary" />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
});

const RelatedTools = memo(function RelatedTools({ items }: { items: Tool[] }) {
  if (items.length === 0) return null;

  return (
    <section className="tool-shared-section py-16 sm:py-24" data-shared-component="related-tools">
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
            to="/#tools"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="related-tools-grid grid grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.slug}
              to={getToolPath(item.slug)}
              className="tool-static-card flex min-w-0 max-w-full flex-col rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5"
            >
              <div
                className={`mb-3 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-soft`}
              >
                <item.icon className="h-4.5 w-4.5" />
              </div>
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0 text-sm font-semibold tracking-tight sm:text-base">
                  {item.name}
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              <div className="mt-1 min-w-0 text-xs leading-5 text-muted-foreground">
                {item.desc}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
});

const ToolSeoSection = memo(function ToolSeoSection({
  toolName,
  seo,
}: {
  toolName: string;
  seo: ToolSeoContent;
}) {
  return (
    <section className="tool-seo-section py-16 sm:py-24" data-shared-component="tool-seo-content">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
            About this tool
          </div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{seo.heading}</h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
            {seo.intro.map((paragraph) => (
              <p key={`${toolName}-intro-${paragraph}`}>{paragraph}</p>
            ))}
            {seo.note && (
              <p className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6">
                <span className="font-semibold text-foreground">Practical tip: </span>
                {seo.note}
              </p>
            )}
          </div>
        </article>

        <aside className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-card sm:p-8">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
            Why use {toolName}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{seo.why}</p>
          <ul className="mt-5 space-y-3">
            {seo.whyPoints.map((point) => (
              <li key={`${toolName}-reason-${point}`} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
});

const HowItWorksSection = memo(function HowItWorksSection({
  toolName,
  steps,
}: {
  toolName: string;
  steps: ToolSeoContent["steps"];
}) {
  return (
    <section
      className="tool-seo-section bg-muted/25 py-16 sm:py-24"
      data-shared-component="how-it-works"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 max-w-2xl">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            How it works
          </div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            How to use {toolName}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Complete the task in a few clear steps without leaving your browser.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, position) => (
            <div
              key={step.title}
              className="tool-static-card rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-soft">
                  {position + 1}
                </span>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </div>
              <h3 className="font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

const BenefitsSection = memo(function BenefitsSection({ tool }: { tool: Tool }) {
  return (
    <section className="tool-seo-section py-16 sm:py-24" data-shared-component="benefits">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-primary">
            Benefits
          </div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            A focused workflow for {tool.name.toLowerCase()}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {tool.benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="tool-static-card rounded-2xl border border-border bg-card p-6 shadow-card"
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
  );
});

const FAQAccordion = memo(function FAQAccordion({ faqs }: { faqs: ToolSeoContent["faqs"] }) {
  return (
    <section className="tool-seo-section bg-muted/25 py-16 sm:py-24" data-shared-component="faq">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-10 text-center">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-primary">FAQ</div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Common questions</h2>
        </div>
        <Accordion
          type="single"
          collapsible
          className="overflow-hidden rounded-3xl border border-border bg-card px-5 shadow-card sm:px-7"
        >
          {faqs.map((faq) => (
            <AccordionItem
              key={`faq-${faq.q}`}
              value={`faq-${faq.q}`}
              className="border-b border-border/70 last:border-0"
            >
              <AccordionTrigger className="py-5 text-left text-base font-medium">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="tool-faq-content max-w-2xl pb-5 leading-7 text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
});

export function ToolPageShell({ tool, children }: ToolPageShellProps) {
  const Icon = tool.icon;
  const seo = getToolSeoContent(tool.slug);
  const related = useMemo(
    () =>
      [...new Set(seo?.related ?? [])]
        .map((slug) => tools.find((item) => item.slug === slug && item.slug !== tool.slug))
        .filter((item): item is Tool => Boolean(item)),
    [seo?.related, tool.slug],
  );
  const faqs = seo?.faqs ?? tool.faqs;

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

        <TrustRow />

        {seo && (
          <>
            <ToolSeoSection toolName={tool.name} seo={seo} />
            <HowItWorksSection toolName={tool.name} steps={seo.steps} />
          </>
        )}

        <BenefitsSection tool={tool} />
        <FAQAccordion faqs={faqs} />

        <RelatedTools items={related} />
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
