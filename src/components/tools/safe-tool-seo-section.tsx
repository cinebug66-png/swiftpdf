import { CheckCircle2 } from "lucide-react";
import { Link } from "@/lib/app-router";
import { getToolPath } from "@/lib/tool-routes";
import { tools, type Tool } from "@/lib/tools";
import { SAFE_SEO_TRUST_ITEMS, type SafeToolSeoContent } from "@/lib/safe-tool-seo-content";

type SafeToolSeoSectionProps = {
  tool: Tool;
  content: SafeToolSeoContent;
};

export function SafeToolSeoSection({ tool, content }: SafeToolSeoSectionProps) {
  const relatedTools = content.relatedToolSlugs
    .map((slug) => tools.find((candidate) => candidate.slug === slug))
    .filter((candidate): candidate is Tool => Boolean(candidate));

  return (
    <div className="border-t border-border bg-background" data-safe-tool-seo={tool.slug}>
      <section
        className="border-b border-border py-6"
        aria-label={`${tool.name} trust information`}
      >
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-4 lg:grid-cols-4">
          {SAFE_SEO_TRUST_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm font-medium shadow-sm"
            >
              <item.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 sm:py-20" aria-labelledby={`${tool.slug}-steps-heading`}>
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              How it works
            </p>
            <h2
              id={`${tool.slug}-steps-heading`}
              className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              How to use {tool.name}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.steps.map((step, position) => (
              <article
                key={step.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                    {position + 1}
                  </span>
                  <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-y border-border bg-muted/20 py-14 sm:py-20"
        aria-labelledby={`${tool.slug}-benefits-heading`}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Benefits</p>
            <h2
              id={`${tool.slug}-benefits-heading`}
              className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Useful features for converting PDF pages
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {content.benefits.map((benefit) => (
              <article
                key={benefit.id}
                className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
              >
                <benefit.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-semibold sm:text-base">{benefit.title}</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20" aria-labelledby={`${tool.slug}-description-heading`}>
        <div className="mx-auto max-w-4xl px-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Helpful guide
          </p>
          <h2
            id={`${tool.slug}-description-heading`}
            className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {content.description.heading}
          </h2>
          <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
            {content.description.paragraphs.map((paragraph) => (
              <p key={paragraph.id}>{paragraph.text}</p>
            ))}
          </div>
          <h3 className="mt-8 font-semibold">Practical tips</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {content.description.tips.map((tip) => (
              <li
                key={tip.id}
                className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground"
              >
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{tip.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="border-y border-border bg-muted/20 py-14 sm:py-20"
        aria-labelledby={`${tool.slug}-faq-heading`}
      >
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">FAQ</p>
          <h2
            id={`${tool.slug}-faq-heading`}
            className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Common questions about {tool.name}
          </h2>
          <div className="mt-7 space-y-3">
            {content.faqs.map((faq) => (
              <details
                key={faq.id}
                className="rounded-xl border border-border bg-card px-4 py-1 shadow-sm"
              >
                <summary className="cursor-pointer py-4 font-medium">{faq.question}</summary>
                <p className="border-t border-border py-4 text-sm leading-6 text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20" aria-labelledby={`${tool.slug}-related-heading`}>
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Related tools
          </p>
          <h2
            id={`${tool.slug}-related-heading`}
            className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Continue working with your PDF
          </h2>
          <div className="mt-7 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
            {relatedTools.map((relatedTool) => (
              <Link
                key={relatedTool.slug}
                to={getToolPath(relatedTool.slug)}
                className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/30"
              >
                <relatedTool.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="mt-3 font-semibold">{relatedTool.name}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{relatedTool.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
