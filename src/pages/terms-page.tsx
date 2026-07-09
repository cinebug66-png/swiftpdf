import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  FileLock2,
  Gavel,
  Mail,
  RotateCw,
  Scale,
  ServerCog,
  ShieldCheck,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Link } from "@/lib/app-router";

const email = "support@swiftpdftools.in";

const quickLinks = [
  { label: "Introduction", href: "#introduction" },
  { label: "Use of the service", href: "#use-of-the-service" },
  { label: "User responsibility", href: "#user-responsibility" },
  { label: "File processing", href: "#file-processing" },
  { label: "Prohibited use", href: "#prohibited-use" },
  { label: "Tool results and accuracy", href: "#tool-results-and-accuracy" },
  { label: "Third-party services", href: "#third-party-services" },
  { label: "Contact", href: "#contact" },
];

const trustItems = [
  {
    title: "Clear rules",
    description: "The terms are written to explain practical responsibilities in simple language.",
    icon: Gavel,
  },
  {
    title: "Your files stay yours",
    description: "Uploaded documents remain your property.",
    icon: FileCheck2,
  },
  {
    title: "Review outputs",
    description: "Conversions can vary, so users should check files before relying on them.",
    icon: CheckCircle2,
  },
  {
    title: "No account required",
    description: "Most SwiftPDF tools can be used without signup, though limits may apply.",
    icon: UserRoundCheck,
  },
];

const responsibilityItems = [
  "Have the rights needed to upload or process files.",
  "Check output files before using or sharing them.",
  "Do not upload illegal, harmful, or abusive content.",
  "Do not abuse, overload, or interfere with the service.",
];

const prohibitedItems = [
  "Process illegal content.",
  "Violate another person or organization's rights.",
  "Attempt to harm, overload, reverse engineer, or abuse the service.",
  "Upload malware or harmful files.",
];

const termsSections = [
  {
    id: "introduction",
    eyebrow: "Overview",
    title: "Introduction",
    icon: Gavel,
    content: [
      "By using SwiftPDF, you agree to these Terms of Service. These terms explain the basic rules for using the website and its PDF tools.",
      "This page is informational and written in clear language. It should be reviewed by a legal professional before serious business use.",
    ],
  },
  {
    id: "use-of-the-service",
    eyebrow: "Use",
    title: "Use of the service",
    icon: CheckCircle2,
    content: [
      "You may use SwiftPDF for lawful document tasks such as converting, compressing, merging, splitting, signing, protecting, unlocking, cropping, and organizing files.",
      "You should use the tools responsibly and only for files you are allowed to process.",
    ],
  },
  {
    id: "file-processing",
    eyebrow: "Files",
    title: "File processing",
    icon: FileLock2,
    content: [
      "Many tools work directly in the browser. Some tools may use secure processing providers when browser-only processing is not practical.",
      "Files are processed only for the selected action. Please review the Privacy Policy for more detail about file handling, analytics, and third-party processing.",
    ],
    privacyLink: true,
  },
  {
    id: "no-account-required",
    eyebrow: "Access",
    title: "No account required",
    icon: UserRoundCheck,
    content: [
      "SwiftPDF can be used without signup for most tools. Usage limits may apply to keep the service stable and available.",
    ],
  },
  {
    id: "tool-results-and-accuracy",
    eyebrow: "Accuracy",
    title: "Tool results and accuracy",
    icon: FileCheck2,
    content: [
      "SwiftPDF aims to provide useful output, but conversions may not always be perfect. Please review files before relying on them.",
      "PDF to Excel and OCR Beta results may need checking, especially with scanned files, complex layouts, or unusual table structures.",
    ],
  },
  {
    id: "third-party-services",
    eyebrow: "Providers",
    title: "Third-party services",
    icon: ServerCog,
    content: [
      "Some tools may rely on secure third-party providers when needed. This project uses CloudConvert for certain conversion, compression, protection, and unlocking workflows where provider processing is required.",
      "Provider processing is used to complete the action you selected and may be subject to the provider's own processing practices.",
    ],
  },
  {
    id: "intellectual-property",
    eyebrow: "Ownership",
    title: "Intellectual property",
    icon: ShieldCheck,
    content: [
      "SwiftPDF branding, design, website content, and interface elements belong to SwiftPDF. You may not copy or misuse them in a way that suggests your service is SwiftPDF.",
      "Uploaded documents remain your property. SwiftPDF does not claim ownership of files you upload, process, or download.",
    ],
  },
  {
    id: "availability",
    eyebrow: "Availability",
    title: "Availability",
    icon: RotateCw,
    content: [
      "SwiftPDF may change, pause, or remove features over time. The service may also have temporary errors, downtime, or limits.",
      "We do not guarantee uninterrupted availability.",
    ],
  },
  {
    id: "limitation-of-liability",
    eyebrow: "Responsibility",
    title: "Limitation of liability",
    icon: Scale,
    content: [
      "SwiftPDF is provided as-is. Users are responsible for checking outputs, keeping backups, and using the service appropriately.",
      "To the extent allowed by law, SwiftPDF is not responsible for losses caused by incorrect outputs, interrupted availability, or misuse of the service.",
    ],
  },
  {
    id: "changes-to-terms",
    eyebrow: "Updates",
    title: "Changes to terms",
    icon: CheckCircle2,
    content: [
      "These terms may be updated from time to time. When the terms change, the updated date will be shown on this page.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="overflow-hidden">
        <section className="border-b border-border bg-gradient-mesh pt-28 sm:pt-32">
          <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:pb-16 lg:pb-20">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Legal
              </div>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Terms of Service
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                These terms explain the rules for using SwiftPDF tools and services.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Last updated: 10 July 2026
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background py-8 sm:py-10">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-semibold tracking-tight">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bg-background py-10 sm:py-14 lg:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick links
                </h2>
                <nav aria-label="Terms of Service sections" className="mt-4">
                  <ul className="space-y-1">
                    {quickLinks.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <span>{link.label}</span>
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>

            <div className="min-w-0 space-y-5">
              {termsSections
                .filter((section) => ["introduction", "use-of-the-service"].includes(section.id))
                .map((section) => (
                  <TermsContentSection key={section.id} section={section} />
                ))}

              <section id="user-responsibility" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
                <SectionHeading icon={UserRoundCheck} eyebrow="Responsibility" title="User responsibility" />
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {responsibilityItems.map((item) => (
                    <li key={item} className="flex gap-3 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {termsSections
                .filter((section) => ["file-processing", "no-account-required"].includes(section.id))
                .map((section) => (
                  <TermsContentSection key={section.id} section={section} />
                ))}

              <section id="prohibited-use" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
                <SectionHeading icon={AlertTriangle} eyebrow="Rules" title="Prohibited use" />
                <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
                  Do not use SwiftPDF to:
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {prohibitedItems.map((item) => (
                    <li key={item} className="flex gap-3 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {termsSections
                .filter((section) =>
                  [
                    "tool-results-and-accuracy",
                    "third-party-services",
                    "intellectual-property",
                    "availability",
                    "limitation-of-liability",
                    "changes-to-terms",
                  ].includes(section.id),
                )
                .map((section) => (
                  <TermsContentSection key={section.id} section={section} />
                ))}

              <section id="contact" className="scroll-mt-28 rounded-2xl border border-primary/20 bg-primary/10 p-5 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">Questions about these terms?</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Contact SwiftPDF for questions about these Terms of Service.
                    </p>
                  </div>
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                  >
                    <Mail className="h-4 w-4" />
                    {email}
                  </a>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

type SectionHeadingProps = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
};

type TermsContentSectionProps = {
  section: (typeof termsSections)[number];
};

function TermsContentSection({ section }: TermsContentSectionProps) {
  const Icon = section.icon;

  return (
    <section
      id={section.id}
      className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7"
    >
      <div className="flex gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">{section.eyebrow}</div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{section.title}</h2>
        </div>
      </div>
      <div className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
        {section.content.map((paragraph) => (
          <p key={paragraph}>
            {paragraph}
            {"privacyLink" in section && section.privacyLink && paragraph.includes("Privacy Policy") ? (
              <>
                {" "}
                <Link className="font-medium text-primary hover:underline" to="/privacy-policy">
                  Open Privacy Policy
                </Link>
                .
              </>
            ) : null}
          </p>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ icon: Icon, eyebrow, title }: SectionHeadingProps) {
  return (
    <div className="flex gap-4">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</div>
        <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
      </div>
    </div>
  );
}
