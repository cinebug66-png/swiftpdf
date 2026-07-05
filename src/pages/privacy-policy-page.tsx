import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Database,
  FileCheck2,
  FileLock2,
  Globe2,
  Mail,
  ServerCog,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";

const email = "support@swiftpdftools.in";

const trustItems = [
  {
    title: "Files remain yours",
    description: "SwiftPDF does not claim ownership of documents you upload or create.",
    icon: FileCheck2,
  },
  {
    title: "No account required",
    description: "Core tools can be used without creating an account or profile.",
    icon: UserRoundCheck,
  },
  {
    title: "Secure processing",
    description: "Files are handled only to complete the action you choose.",
    icon: ShieldCheck,
  },
  {
    title: "Transparent analytics",
    description: "Usage analytics help improve the site without intentionally collecting content.",
    icon: BarChart3,
  },
];

const quickLinks = [
  { label: "Files and documents", href: "#files-and-documents" },
  { label: "Information we collect", href: "#information-we-collect" },
  { label: "How we use information", href: "#how-we-use-information" },
  { label: "Browser-based processing", href: "#browser-based-processing" },
  { label: "Third-party processors", href: "#third-party-processors" },
  { label: "Analytics and cookies", href: "#analytics-and-cookies" },
  { label: "Data retention", href: "#data-retention" },
  { label: "User rights", href: "#user-rights" },
  { label: "Children's privacy", href: "#childrens-privacy" },
  { label: "Contact", href: "#contact" },
];

const policySections = [
  {
    id: "introduction",
    eyebrow: "Overview",
    title: "Introduction",
    icon: Globe2,
    content: [
      "SwiftPDF provides online PDF tools for converting, compressing, editing, protecting, signing, and organizing documents. This Privacy Policy explains how SwiftPDF handles files, usage data, analytics, browser storage, and related privacy choices when you use the website.",
      "We aim to keep this policy clear and practical so you can understand what happens when you choose a tool and upload or generate a file.",
    ],
  },
  {
    id: "files-and-documents",
    eyebrow: "Documents",
    title: "Files remain yours",
    icon: FileCheck2,
    content: [
      "You keep ownership of the files you upload, process, download, or create through SwiftPDF. SwiftPDF does not claim ownership of your documents, images, signatures, or generated files.",
      "You are responsible for making sure you have the rights and permission needed to upload and process any file you use with SwiftPDF.",
    ],
  },
  {
    id: "browser-based-processing",
    eyebrow: "Processing",
    title: "How files are processed",
    icon: FileLock2,
    content: [
      "Many tools process files directly in your browser. Some conversion or optimization tools may use a secure processing provider only to perform the selected action when browser-only processing is not practical.",
      "Files are processed only to provide the tool action you choose, such as converting a file, compressing a PDF, protecting a document, or preparing a download. We do not say that files are never uploaded because some tools require server or provider processing.",
    ],
  },
  {
    id: "information-we-collect",
    eyebrow: "Data",
    title: "Information we collect",
    icon: Database,
    content: [
      "SwiftPDF may collect basic usage information, including visited pages, tool actions such as upload clicks, conversion success, download clicks, browser and device information, and general performance information.",
      "If an error occurs, limited error logs may be collected to help diagnose and improve the service. We do not intentionally collect document content for analytics.",
    ],
  },
  {
    id: "how-we-use-information",
    eyebrow: "Use",
    title: "How we use information",
    icon: CheckCircle2,
    content: [
      "We use information to provide the selected PDF tool, keep the website working, understand which tools are useful, troubleshoot errors, improve performance, and protect the service from misuse.",
      "We do not use analytics information to read or inspect the contents of your documents.",
    ],
  },
  {
    id: "analytics-and-cookies",
    eyebrow: "Analytics",
    title: "Analytics, cookies, and local storage",
    icon: BarChart3,
    content: [
      "SwiftPDF uses Google Analytics to understand tool usage and improve the website. Analytics events may include safe metadata where implemented, but they do not intentionally send document content or full file names.",
      "Cookies may be used by Google Analytics. Local browser storage may be used for preferences or temporary state, including desktop theme preference and daily usage limits where those limits apply.",
      "You can clear cookies and local storage through your browser settings.",
    ],
  },
  {
    id: "third-party-processors",
    eyebrow: "Providers",
    title: "Third-party processors",
    icon: ServerCog,
    content: [
      "Some tools may rely on secure third-party processing providers. This project uses CloudConvert for certain conversion, compression, protection, and unlocking workflows where provider processing is required.",
      "Files sent to CloudConvert or another processing provider are used only to complete the requested conversion or processing action and are handled according to the provider's processing practices.",
    ],
  },
  {
    id: "data-retention",
    eyebrow: "Retention",
    title: "Data retention",
    icon: Database,
    content: [
      "Files processed directly in your browser stay on your device unless you choose a tool that requires provider processing.",
      "For server or provider processed files, files are retained only as long as needed to complete processing according to provider practices. SwiftPDF aims to avoid storing user documents longer than necessary.",
    ],
  },
  {
    id: "security",
    eyebrow: "Security",
    title: "Security",
    icon: ShieldCheck,
    content: [
      "SwiftPDF uses HTTPS connections and limits file handling to the selected tool action. Uploaded files are not made public by SwiftPDF.",
      "No online tool can remove every risk. If a file is illegal, extremely sensitive, or you are not comfortable processing it with an online service, you should avoid uploading it.",
    ],
  },
  {
    id: "user-rights",
    eyebrow: "Choices",
    title: "User choices and rights",
    icon: UserRoundCheck,
    content: [
      "You can stop using SwiftPDF at any time. You can also clear browser cookies, local storage, and site data from your browser settings.",
      "You may contact SwiftPDF with privacy questions. Where applicable, you may request information or deletion related to personal data that SwiftPDF controls.",
    ],
  },
  {
    id: "childrens-privacy",
    eyebrow: "Children",
    title: "Children's privacy",
    icon: UserRoundCheck,
    content: [
      "SwiftPDF is not designed to knowingly collect personal information from children. Users should use the service responsibly and with appropriate permission where required.",
    ],
  },
  {
    id: "changes-to-this-policy",
    eyebrow: "Updates",
    title: "Changes to this policy",
    icon: CheckCircle2,
    content: [
      "This Privacy Policy may be updated from time to time. When the policy changes, the updated date will be shown on this page.",
    ],
  },
  {
    id: "contact",
    eyebrow: "Contact",
    title: "Contact",
    icon: Mail,
    content: ["For privacy questions, contact SwiftPDF by email."],
  },
];

export default function PrivacyPolicyPage() {
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
                Privacy Policy
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Clear information about how SwiftPDF handles files, usage data, and privacy.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Last updated: 6 July 2026
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background py-8 sm:py-10">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-2xl border border-border bg-card p-5 shadow-soft"
                >
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-semibold tracking-tight">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
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
                <nav aria-label="Privacy policy sections" className="mt-4">
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
              {policySections.map((section) => {
                const Icon = section.icon;
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-28 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7"
                  >
                    <div className="flex gap-4">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                          {section.eyebrow}
                        </div>
                        <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                          {section.title}
                        </h2>
                      </div>
                    </div>
                    <div className="mt-5 space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
                      {section.content.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                      {section.id === "contact" ? (
                        <p>
                          Email:{" "}
                          <a
                            className="font-medium text-primary hover:underline"
                            href={`mailto:${email}`}
                          >
                            {email}
                          </a>
                        </p>
                      ) : null}
                    </div>
                  </section>
                );
              })}

              <section className="rounded-2xl border border-primary/20 bg-primary/10 p-5 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                      Questions about privacy?
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      We are happy to clarify how SwiftPDF handles files, analytics, and privacy.
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
