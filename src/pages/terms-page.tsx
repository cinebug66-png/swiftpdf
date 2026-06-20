import { InfoPageShell } from "@/components/site/info-page-shell";

const email = "support@swiftpdf.in";

export default function TermsPage() {
  return (
    <InfoPageShell
      eyebrow="Legal"
      title="Terms of Service"
      description="These terms describe the basic rules for using SwiftPDF and its PDF tools."
      sections={[
        {
          title: "Acceptance of terms",
          content: <p>By using SwiftPDF, you agree to these Terms of Service.</p>,
        },
        {
          title: "Description of service",
          content: (
            <p>
              SwiftPDF provides browser-based tools for converting, compressing, merging, splitting,
              signing and otherwise working with PDF and related document formats.
            </p>
          ),
        },
        {
          title: "User responsibility",
          content: (
            <p>
              You are responsible for the files you process, the accuracy of your instructions and
              ensuring that your use of the service complies with applicable laws and third-party
              rights.
            </p>
          ),
        },
        {
          title: "File processing disclaimer",
          content: (
            <p>
              Results can vary depending on the source file, browser and external processing
              provider. You should review every output and keep an independent backup of important
              documents.
            </p>
          ),
        },
        {
          title: "No warranty",
          content: (
            <p>
              SwiftPDF is provided on an “as is” and “as available” basis without warranties of
              uninterrupted operation, accuracy or fitness for a particular purpose.
            </p>
          ),
        },
        {
          title: "Limitation of liability",
          content: (
            <p>
              To the fullest extent permitted by law, SwiftPDF is not liable for lost files, lost
              data, business interruption or indirect damages arising from use of the service.
            </p>
          ),
        },
        {
          title: "Changes to these terms",
          content: (
            <p>
              These terms may be updated as SwiftPDF changes. Continued use after an update means
              you accept the revised terms.
            </p>
          ),
        },
        {
          title: "Contact",
          content: (
            <p>
              Questions about these terms can be sent to{" "}
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
