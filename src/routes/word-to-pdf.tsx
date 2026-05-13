import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonToolCard, ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("word-to-pdf");

export const Route = createFileRoute("/word-to-pdf")({
  component: WordToPdfRoute,
});

function WordToPdfRoute() {
  return (
    <ToolPageShell tool={tool}>
      <ComingSoonToolCard
        title="Word to PDF is coming soon"
        description="The route is live and styled to match the rest of SwiftPDF, while the actual conversion workflow is reserved for a future update."
      />
    </ToolPageShell>
  );
}
