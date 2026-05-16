import { MergePdfTool } from "@/components/tools/merge-pdf-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("merge-pdf");

export default function MergePdfPage() {
  return (
    <ToolPageShell tool={tool}>
      <MergePdfTool />
    </ToolPageShell>
  );
}
