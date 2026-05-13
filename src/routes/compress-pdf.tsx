import { createFileRoute } from "@tanstack/react-router";
import { CompressPdfTool } from "@/components/tools/compress-pdf-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("compress-pdf");

export const Route = createFileRoute("/compress-pdf")({
  head: () => ({
    meta: [
      { title: "Compress PDF - SwiftPDF" },
      {
        name: "description",
        content: "Compress and optimize PDF files using the CloudConvert REST API.",
      },
    ],
  }),
  component: CompressPdfRoute,
});

function CompressPdfRoute() {
  return (
    <ToolPageShell tool={tool}>
      <CompressPdfTool />
    </ToolPageShell>
  );
}
