import { InfoPageShell } from "@/components/site/info-page-shell";

const email = "support@swiftpdftools.in";

export default function ContactPage() {
  return (
    <InfoPageShell
      eyebrow="Contact"
      title="We would like to hear from you"
      description="Questions, feedback and clear bug reports all help make SwiftPDF better."
      sections={[
        {
          title: "Support",
          content: (
            <p>
              Email us at{" "}
              <a className="font-medium text-primary hover:underline" href={`mailto:${email}`}>
                {email}
              </a>{" "}
              for help using SwiftPDF.
            </p>
          ),
        },
        {
          title: "Share feedback",
          content: (
            <p>
              Tell us which tools are useful, what feels confusing or what would make your PDF
              workflow faster.
            </p>
          ),
        },
        {
          title: "Report a bug",
          content: (
            <p>
              Please include the tool name, your browser or device and the steps that caused the
              problem. Do not attach confidential files unless they are necessary for support.
            </p>
          ),
        },
      ]}
    />
  );
}
