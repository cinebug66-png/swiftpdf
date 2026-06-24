import { ExtractPagesTool } from "@/components/tools/extract-pages-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("extract-pages");

export default function ExtractPagesPage() {
  return (
    <ToolPageShell tool={tool}>
      <ExtractPagesTool />
    </ToolPageShell>
  );
}
