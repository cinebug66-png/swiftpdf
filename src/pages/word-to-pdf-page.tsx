import { WordToPdfTool } from "@/components/tools/word-to-pdf-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("word-to-pdf");

export default function WordToPdfPage() {
  return (
    <ToolPageShell tool={tool}>
      <WordToPdfTool />
    </ToolPageShell>
  );
}
