import { ArrowRight, CheckCircle2, Clock3, CloudOff, HelpCircle, UserRoundCheck } from "lucide-react";
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
    <section className="compact-tool-seo border-t border-border bg-background py-8 sm:py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 lg:max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                Quick guide
              </div>
              <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                Everything you need for {tool.name}
              </h2>
              <h3 className="mt-3 text-base font-semibold tracking-tight">{content.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{content.shortNote}</p>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[360px] lg:grid-cols-2">
              {trustItems.map((item) => (
                <div
                  key={item.label}
                  className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {content.steps.map((step, index) => (
              <div
                key={step}
                className="flex min-w-0 gap-3 rounded-xl border border-border bg-background p-3"
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

        <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">FAQ</div>
              <h3 className="text-lg font-semibold tracking-tight">Common questions</h3>
            </div>
          </div>
          <div className="divide-y divide-border">
            {content.faqs.slice(0, 3).map((faq) => (
              <div key={faq.question} className="min-w-0 py-3 first:pt-0 last:pb-0">
                <h4 className="text-sm font-semibold leading-5 text-foreground">{faq.question}</h4>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {toShortAnswer(faq.answer)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-4xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Related tools
          </div>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">Try another PDF tool</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {relatedTools.map((related) => (
              <Link
                key={related.slug}
                to={getToolPath(related.slug)}
                className="group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${related.color} text-white shadow-soft`}
                >
                  <related.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {related.name}
                  </span>
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
  return (sentences ? sentences.slice(0, 1).join(" ") : answer).trim();
}

function getRelatedTools(content: CompactToolSeoContent, currentSlug: string) {
  const tools = content.relatedTools
    .filter((slug) => slug !== currentSlug)
    .map((slug) => getTool(slug))
    .filter((tool): tool is Tool => Boolean(tool));

  return tools.slice(0, 3);
}
