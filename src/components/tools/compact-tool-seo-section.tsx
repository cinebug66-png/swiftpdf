import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "@/lib/app-router";
import { getToolPath } from "@/lib/tool-routes";
import {
  compactNeedToKnowItems,
  getCompactToolSeoContentOrFallback,
  type CompactToolSeoContent,
} from "@/lib/compact-tool-seo-content";
import { getTool, type Tool } from "@/lib/tools";

type CompactToolSeoSectionProps = {
  tool: Tool;
};

const needToKnowIcons = [Sparkles, Download, ShieldCheck];

const guideMeta = [
  { label: "Free to use", icon: CheckCircle2 },
  { label: "Fast processing", icon: Clock3 },
];

export function CompactToolSeoSection({ tool }: CompactToolSeoSectionProps) {
  const content = getCompactToolSeoContentOrFallback(tool.slug, tool.name);
  const relatedTools = getRelatedTools(content, tool.slug);

  return (
    <section className="compact-tool-seo border-t border-border bg-muted/20 pt-12 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 lg:p-8">
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:items-start">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                Quick guide
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {content.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {content.shortNote}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {guideMeta.map((item) => (
                  <div
                    key={item.label}
                    className="inline-flex min-w-0 items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {content.steps.map((step, index) => (
                <div
                  key={step}
                  className="flex min-w-0 gap-3 rounded-xl border border-border/80 bg-background p-3.5"
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
        </div>

        <div className="mt-10 sm:mt-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Need to know
          </div>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">
            Helpful details before you convert
          </h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {compactNeedToKnowItems.map((item, index) => {
              const Icon = needToKnowIcons[index] ?? Sparkles;

              return (
              <div
                key={item.title}
                className="min-w-0 rounded-2xl border border-border/80 bg-card p-4"
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h4 className="mt-4 text-sm font-semibold leading-5 text-foreground">
                  {item.title}
                </h4>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.text}</p>
              </div>
              );
            })}
          </div>
        </div>

        <div className="related-tools-section mx-auto mt-14 max-w-5xl text-center sm:mt-16">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Related tools
          </div>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight">
            Continue with another PDF tool
          </h3>
          <div className="related-tools-mobile mt-5 md:hidden">
            {relatedTools.slice(0, 3).map((related) => (
              <Link
                key={related.slug}
                to={getToolPath(related.slug)}
                className="related-tools-mobile-row"
              >
                <span className="related-tools-mobile-icon">
                  <related.icon className="h-5 w-5" />
                </span>
                <span className="related-tools-mobile-copy">
                  <span className="related-tools-mobile-title">
                    {related.name}
                  </span>
                  <span className="related-tools-mobile-description">
                    {related.desc}
                  </span>
                </span>
                <ArrowRight className="related-tools-mobile-arrow h-4 w-4" />
              </Link>
            ))}
          </div>

          <div className="related-tools-desktop mt-5 hidden gap-4 md:grid md:grid-cols-3">
            {relatedTools.slice(0, 3).map((related) => (
              <Link
                key={related.slug}
                to={getToolPath(related.slug)}
                className="related-tool-card flex min-w-0 items-center gap-3 rounded-xl border border-border/80 bg-card p-4 text-left hover:border-primary/40 hover:bg-accent/70"
              >
                <span
                  className={`related-tool-icon grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${related.color} text-white`}
                >
                  <related.icon className="h-5 w-5" />
                </span>
                <span className="related-tool-copy min-w-0 flex-1">
                  <span className="related-tool-title block text-sm font-semibold leading-5 text-foreground">
                    {related.name}
                  </span>
                  <span className="related-tool-description mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {related.desc}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
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

function getRelatedTools(content: CompactToolSeoContent, currentSlug: string) {
  const tools = content.relatedTools
    .filter((slug) => slug !== currentSlug)
    .map((slug) => getTool(slug))
    .filter((tool): tool is Tool => Boolean(tool));

  return tools.slice(0, 3);
}
