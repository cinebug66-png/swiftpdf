import { InfoPageShell } from "@/components/site/info-page-shell";

export default function AboutPage() {
  return (
    <InfoPageShell
      eyebrow="About SwiftPDF"
      title="PDF tools without the friction"
      description="SwiftPDF is a collection of simple, fast and privacy-friendly tools for everyday PDF work."
      sections={[
        {
          title: "What SwiftPDF is",
          content: (
            <p>
              SwiftPDF helps you convert, compress, merge, split, sign and edit PDF documents from a
              clean browser-based workspace.
            </p>
          ),
        },
        {
          title: "Built for real work",
          content: (
            <p>
              The tools are designed for students preparing assignments, freelancers managing client
              documents and teams handling everyday files.
            </p>
          ),
        },
        {
          title: "Simple, fast and privacy-friendly",
          content: (
            <p>
              Many tools run directly in your browser. When a conversion requires an external
              service, SwiftPDF uses a secure processing provider only to complete the tool you
              selected.
            </p>
          ),
        },
      ]}
    />
  );
}
