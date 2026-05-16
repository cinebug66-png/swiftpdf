import { SplitPdfTool } from "@/components/tools/split-pdf-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("split-pdf");

export default function SplitPdfPage() {
  return (
    <ToolPageShell tool={tool}>
      <SplitPdfTool />
    </ToolPageShell>
  );
}
