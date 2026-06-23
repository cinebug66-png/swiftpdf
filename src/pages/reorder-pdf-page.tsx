import { ReorderPdfTool } from "@/components/tools/reorder-pdf-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("reorder-pdf");

export default function ReorderPdfPage() {
  return (
    <ToolPageShell tool={tool}>
      <ReorderPdfTool />
    </ToolPageShell>
  );
}
