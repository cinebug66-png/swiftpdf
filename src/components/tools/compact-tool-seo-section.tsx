import { CheckCircle2, Clock3, CloudOff, ShieldCheck, UserRoundCheck } from "lucide-react";
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
    <section className="compact-tool-seo border-t border-border bg-background py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm text-foreground shadow-soft"
            >
              <item.icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 truncate">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Quick guide
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {content.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {content.shortNote}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {content.steps.map((step, index) => (
              <div
                key={step}
                className="flex min-w-0 gap-3 rounded-xl border border-border bg-card p-4 shadow-soft"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
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

        <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-3 sm:grid-cols-3">
            {content.faqs.slice(0, 3).map((faq) => (
              <details
                key={faq.question}
                className="rounded-xl border border-border bg-card p-4 text-sm shadow-soft"
              >
                <summary className="cursor-pointer list-none font-semibold text-foreground">
                  {faq.question}
                </summary>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Related tools
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {relatedTools.map((related) => (
                <Link
                  key={related.slug}
                  to={getToolPath(related.slug)}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <span className="min-w-0 truncate font-medium">{related.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">Open</span>
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

function getRelatedTools(content: CompactToolSeoContent, currentSlug: string) {
  const tools = content.relatedTools
    .filter((slug) => slug !== currentSlug)
    .map((slug) => getTool(slug))
    .filter((tool): tool is Tool => Boolean(tool));

  return tools.slice(0, 3);
}
