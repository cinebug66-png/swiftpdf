import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonToolCard, ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("merge-pdf");

export const Route = createFileRoute("/merge-pdf")({
  component: MergePdfRoute,
});

function MergePdfRoute() {
  return (
    <ToolPageShell tool={tool}>
      <ComingSoonToolCard
        title="Merge PDF is coming soon"
        description="This route is ready, and the actual merge workflow can be added later without redesigning the site."
      />
    </ToolPageShell>
  );
}
