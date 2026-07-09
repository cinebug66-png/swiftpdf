import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Laptop,
  Mail,
  PanelsTopLeft,
  Phone,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { Link } from "@/lib/app-router";

const email = "support@swiftpdftools.in";

const approachCards = [
  {
    title: "Simple tools",
    description: "Each tool focuses on one document task with clear actions and fewer distractions.",
    icon: Sparkles,
  },
  {
    title: "Clean design",
    description: "SwiftPDF is built to feel calm, readable, and easy to use on busy workdays.",
    icon: PanelsTopLeft,
  },
  {
    title: "Browser-first processing",
    description: "Many tools process directly in your browser when that is practical for the task.",
    icon: ShieldCheck,
  },
  {
    title: "No signup required",
    description: "Core PDF tools are available without creating an account or profile.",
    icon: CheckCircle2,
  },
  {
    title: "Useful anywhere",
    description: "The interface is designed for everyday use on both phone and desktop screens.",
    icon: Phone,
  },
];

const quickLinks = [
  { label: "What SwiftPDF is", href: "#what-swiftpdf-is" },
  { label: "Why we built it", href: "#why-we-built-it" },
  { label: "Our approach", href: "#our-approach" },
  { label: "Privacy and file handling", href: "#privacy-and-file-handling" },
  { label: "Who SwiftPDF is for", href: "#who-swiftpdf-is-for" },
  { label: "What we are improving next", href: "#what-we-are-improving-next" },
  { label: "Contact", href: "#contact" },
];

const userGroups = [
  "Students",
  "Office users",
  "Small businesses",
  "Freelancers",
  "Teachers",
  "Everyday document work",
];

const improvements = [
  "Better mobile experience",
  "More accurate PDF to Excel",
  "OCR Beta",
  "Faster tools",
  "Clearer help content",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="overflow-hidden">
        <section className="border-b border-border bg-gradient-mesh pt-28 sm:pt-32">
          <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:pb-16 lg:pb-20">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                About
              </div>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Simple PDF tools for everyday work
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                SwiftPDF helps users convert, edit, organize, and manage PDF files quickly from a
                clean browser-based interface.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Last updated: 10 July 2026
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background py-8 sm:py-10">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-5">
            {approachCards.map((item) => {
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
                <nav aria-label="About page sections" className="mt-4">
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
              <section id="what-swiftpdf-is" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
                <SectionHeading icon={FileText} eyebrow="Overview" title="What SwiftPDF is" />
                <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
                  SwiftPDF is an online collection of PDF tools for converting, merging, splitting,
                  compressing, signing, protecting, unlocking, cropping, and organizing PDFs.
                </p>
              </section>

              <section id="why-we-built-it" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
                <SectionHeading icon={Wrench} eyebrow="Purpose" title="Why we built it" />
                <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
                  People often need fast PDF tools without installing heavy apps or creating
                  accounts. SwiftPDF is built to make common document work feel direct, lightweight,
                  and easy to understand.
                </p>
              </section>

              <section id="our-approach" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
                <SectionHeading icon={PanelsTopLeft} eyebrow="Principles" title="Our approach" />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {approachCards.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rounded-2xl border border-border bg-background p-4">
                        <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section id="privacy-and-file-handling" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
                <SectionHeading icon={ShieldCheck} eyebrow="Files" title="Privacy and file handling" />
                <div className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
                  <p>
                    Many tools process files directly in your browser. Some conversion or
                    optimization tools may use a secure processing provider when browser-only
                    processing is not practical.
                  </p>
                  <p>
                    We do not intentionally collect document content for analytics. For more detail,
                    read the{" "}
                    <Link className="font-medium text-primary hover:underline" to="/privacy-policy">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              </section>

              <section id="who-swiftpdf-is-for" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
                <SectionHeading icon={UsersRound} eyebrow="Audience" title="Who SwiftPDF is for" />
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {userGroups.map((group) => (
                    <div key={group} className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium">
                      {group}
                    </div>
                  ))}
                </div>
              </section>

              <section id="what-we-are-improving-next" className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
                <SectionHeading icon={Laptop} eyebrow="Roadmap" title="What we are improving next" />
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {improvements.map((item) => (
                    <li key={item} className="flex gap-3 rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section id="contact" className="scroll-mt-28 rounded-2xl border border-primary/20 bg-primary/10 p-5 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">Have feedback or found a bug?</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Tell us what did not work or what would make SwiftPDF easier to use.
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
