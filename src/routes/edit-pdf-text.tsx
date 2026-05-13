import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonToolCard, ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("edit-pdf-text");

export const Route = createFileRoute("/edit-pdf-text")({
  component: EditPdfTextRoute,
});

function EditPdfTextRoute() {
  return (
    <ToolPageShell tool={tool}>
      <ComingSoonToolCard
        title="Edit PDF Text is coming soon"
        description="This page keeps the route clean and consistent while the PDF text editor is being built."
      />
    </ToolPageShell>
  );
}
