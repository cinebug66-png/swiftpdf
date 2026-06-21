import { InfoPageShell } from "@/components/site/info-page-shell";

const email = "support@swiftpdf.in";

export default function PrivacyPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      description="This policy explains how files and related information are handled when you use SwiftPDF."
      sections={[
        {
          title: "Your files remain yours",
          content: (
            <p>
              SwiftPDF does not claim ownership of any document, image or other file you upload or
              create through the service.
            </p>
          ),
        },
        {
          title: "How files are processed",
          content: (
            <>
              <p>
                Some tools process files directly in your browser without sending the document to a
                SwiftPDF server.
              </p>
              <p>
                Some conversion and optimization tools may use a secure processing provider. Files
                sent for processing are used only to perform the tool you selected and are subject
                to the provider&apos;s processing practices.
              </p>
            </>
          ),
        },
        {
          title: "Permitted use",
          content: (
            <p>
              Do not upload files that are illegal, harmful, abusive or that you do not have the
              right to process.
            </p>
          ),
        },
        {
          title: "Contact",
          content: (
            <p>
              For privacy questions, email{" "}
              <a className="font-medium text-primary hover:underline" href={`mailto:${email}`}>
                {email}
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
