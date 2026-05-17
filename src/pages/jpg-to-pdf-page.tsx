import { JpgToPdfTool } from "@/components/tools/jpg-to-pdf-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("jpg-to-pdf");

export default function JpgToPdfPage() {
  return (
    <ToolPageShell tool={tool}>
      <JpgToPdfTool />
    </ToolPageShell>
  );
}
