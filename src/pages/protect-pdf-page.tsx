import { ProtectPdfTool } from "@/components/tools/protect-pdf-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("protect-pdf");

export default function ProtectPdfPage() {
  return (
    <ToolPageShell tool={tool}>
      <ProtectPdfTool />
    </ToolPageShell>
  );
}
