import { RotatePdfTool } from "@/components/tools/rotate-pdf-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("rotate-pdf");

export default function RotatePdfPage() {
  return (
    <ToolPageShell tool={tool}>
      <RotatePdfTool />
    </ToolPageShell>
  );
}
