import { CompressPdfTool } from "@/components/tools/compress-pdf-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("compress-pdf");

export default function CompressPdfPage() {
  return (
    <ToolPageShell tool={tool}>
      <CompressPdfTool />
    </ToolPageShell>
  );
}
