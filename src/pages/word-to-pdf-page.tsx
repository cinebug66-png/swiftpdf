import { ComingSoonToolCard, ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("word-to-pdf");

export default function WordToPdfPage() {
  return (
    <ToolPageShell tool={tool}>
      <ComingSoonToolCard
        title="Word to PDF is coming soon"
        description="The route is live and styled to match the rest of SwiftPDF, while the actual conversion workflow is reserved for a future update."
      />
    </ToolPageShell>
  );
}
