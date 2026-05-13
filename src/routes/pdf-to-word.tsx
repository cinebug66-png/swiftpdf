import { createFileRoute } from "@tanstack/react-router";
import { PdfToWordTool } from "@/components/tools/pdf-to-word-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("pdf-to-word");

export const Route = createFileRoute("/pdf-to-word")({
  head: () => ({
    meta: [
      { title: "PDF to Word - SwiftPDF" },
      {
        name: "description",
        content: "Convert PDF files into editable Word documents using the CloudConvert REST API.",
      },
    ],
  }),
  component: PdfToWordRoute,
});

function PdfToWordRoute() {
  return (
    <ToolPageShell tool={tool}>
      <PdfToWordTool />
    </ToolPageShell>
  );
}
