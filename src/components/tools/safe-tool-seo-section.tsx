import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/app-router";
import { getToolPath } from "@/lib/tool-routes";
import { tools, type Tool } from "@/lib/tools";
import { SAFE_SEO_TRUST_ITEMS, type SafeToolSeoContent } from "@/lib/safe-tool-seo-content";

type SafeToolSeoSectionProps = {
  tool: Tool;
  content: SafeToolSeoContent;
};

export function SafeToolSeoSection({ tool, content }: SafeToolSeoSectionProps) {
  const compactSteps = content.steps.slice(0, 3);
  const compactFaqs = content.faqs.slice(0, 4);
  const relatedTools = content.relatedToolSlugs
    .map((slug) => tools.find((candidate) => candidate.slug === slug))
    .slice(0, 4)
    .filter((candidate): candidate is Tool => Boolean(candidate));

  return (
    <div className="safe-tool-seo border-t border-border" data-safe-tool-seo={tool.slug}>
      <section className="safe-seo-trust py-5" aria-label={`${tool.name} trust information`}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 lg:grid-cols-4">
          {SAFE_SEO_TRUST_ITEMS.map((item) => (
            <article key={item.id} className="safe-seo-trust-card">
              <span className="safe-seo-icon">
                <item.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 text-sm font-semibold">{item.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="safe-seo-section" aria-labelledby={`${tool.slug}-steps-heading`}>
        <div className="safe-seo-container">
          <SectionHeading
            eyebrow="How it works"
            title={`How to use ${tool.name}`}
            id={`${tool.slug}-steps-heading`}
          />
          <div className="safe-seo-steps-grid">
            {compactSteps.map((step, position) => (
              <article key={step.id} className="safe-seo-card safe-seo-step-card">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <span className="safe-seo-step-number">{position + 1}</span>
                  <span className="safe-seo-icon safe-seo-icon-large">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="text-base font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="safe-faq-section safe-seo-section safe-seo-band"
        aria-labelledby={`${tool.slug}-faq-heading`}
      >
        <div className="mx-auto max-w-4xl px-4">
          <SectionHeading
            eyebrow="FAQ"
            title={`Common questions about ${tool.name}`}
            id={`${tool.slug}-faq-heading`}
          />
          <div className="faq-static-list">
            {compactFaqs.map((faq) => (
              <div key={faq.question} className="faq-static-item">
                <h3>{faq.question}</h3>
                <p>{getShortFaqAnswer(faq.answer)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="related-tools safe-seo-section" aria-labelledby={`${tool.slug}-related-heading`}>
        <div className="safe-seo-container">
          <SectionHeading
            eyebrow="Related tools"
            title="Continue working with your PDF"
            id={`${tool.slug}-related-heading`}
          />
          <div className="safe-seo-related-grid">
            {relatedTools.map((relatedTool) => (
              <Link
                key={relatedTool.slug}
                to={getToolPath(relatedTool.slug)}
                className="safe-seo-related-card"
              >
                <span className="safe-seo-icon">
                  <relatedTool.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold tracking-tight">{relatedTool.name}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                    {relatedTool.desc}
                  </span>
                </span>
                <ArrowRight className="safe-seo-related-arrow h-4 w-4 shrink-0" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function getShortFaqAnswer(answer: string) {
  const sentences = answer
    .replace(/\s+/g, " ")
    .trim()
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  const shortAnswer = (sentences ?? [answer]).slice(0, 2).join(" ").trim();

  return shortAnswer.length > 180
    ? `${shortAnswer.slice(0, 180).replace(/\s+\S*$/, "")}.`
    : shortAnswer;
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  id: string;
};

function SectionHeading({ eyebrow, title, id }: SectionHeadingProps) {
  return (
    <div className="safe-seo-heading">
      <p className="safe-seo-eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}
