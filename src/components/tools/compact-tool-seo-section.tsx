import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CloudOff,
  HelpCircle,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { Link } from "@/lib/app-router";
import { getToolPath } from "@/lib/tool-routes";
import {
  getCompactToolSeoContentOrFallback,
  type CompactToolSeoContent,
} from "@/lib/compact-tool-seo-content";
import { getTool, type Tool } from "@/lib/tools";

type CompactToolSeoSectionProps = {
  tool: Tool;
};

const trustItems = [
  { label: "Free to use", icon: CheckCircle2 },
  { label: "Browser-based", icon: CloudOff },
  { label: "No signup", icon: UserRoundCheck },
  { label: "Fast processing", icon: Clock3 },
];

export function CompactToolSeoSection({ tool }: CompactToolSeoSectionProps) {
  const content = getCompactToolSeoContentOrFallback(tool.slug, tool.name);
  const relatedTools = getRelatedTools(content, tool.slug);

  return (
    <section className="compact-tool-seo border-t border-border bg-background py-8 sm:py-11">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-5 flex min-w-0 flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Quick guide
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Everything you need for {tool.name}
            </h2>
          </div>
          <div className="text-xs text-muted-foreground">Short answers, no extra reading.</div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 truncate">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
              {content.title}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {content.shortNote}
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
            {content.steps.map((step, index) => (
              <div
                key={step}
                className="flex min-w-0 gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{step}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">
                    {getStepDescription(tool.name, index)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-2.5 sm:grid-cols-3">
            {content.faqs.slice(0, 3).map((faq) => (
              <article
                key={faq.question}
                className="min-w-0 rounded-xl border border-border bg-card p-3 text-sm"
              >
                <div className="flex items-start gap-2">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold leading-5 text-foreground">{faq.question}</h4>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {toShortAnswer(faq.answer)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Related tools
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {relatedTools.map((related) => (
                <Link
                  key={related.slug}
                  to={getToolPath(related.slug)}
                  className="group flex min-w-0 items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <related.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{related.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {related.desc}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getStepDescription(toolName: string, index: number) {
  if (index === 0) return `Choose the file you want to use with ${toolName}.`;
  if (index === 1) return "Review the available options before processing.";
  return "Save the finished file to your device.";
}

function toShortAnswer(answer: string) {
  const sentences = answer.match(/[^.!?]+[.!?]+/gu);
  return (sentences ? sentences.slice(0, 2).join(" ") : answer).trim();
}

function getRelatedTools(content: CompactToolSeoContent, currentSlug: string) {
  const tools = content.relatedTools
    .filter((slug) => slug !== currentSlug)
    .map((slug) => getTool(slug))
    .filter((tool): tool is Tool => Boolean(tool));

  return tools.slice(0, 3);
}
