import { PdfToPngTool } from "@/components/tools/pdf-to-png-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("pdf-to-png");

export default function PdfToPngPage() {
  return (
    <ToolPageShell tool={tool}>
      <PdfToPngTool />
    </ToolPageShell>
  );
}
