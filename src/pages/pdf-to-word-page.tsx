import { PdfToWordTool } from "@/components/tools/pdf-to-word-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("pdf-to-word");

export default function PdfToWordPage() {
  return (
    <ToolPageShell tool={tool}>
      <PdfToWordTool />
    </ToolPageShell>
  );
}
