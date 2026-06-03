import { UnlockPdfTool } from "@/components/tools/unlock-pdf-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("unlock-pdf");

export default function UnlockPdfPage() {
  return (
    <ToolPageShell tool={tool}>
      <UnlockPdfTool />
    </ToolPageShell>
  );
}
