import { PdfToJpgTool } from "@/components/tools/pdf-to-jpg-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("pdf-to-jpg");

export default function PdfToJpgPage() {
  return (
    <ToolPageShell tool={tool}>
      <PdfToJpgTool />
    </ToolPageShell>
  );
}
