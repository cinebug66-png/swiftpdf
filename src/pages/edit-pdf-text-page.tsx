import { ComingSoonToolCard, ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("edit-pdf-text");

export default function EditPdfTextPage() {
  return (
    <ToolPageShell tool={tool}>
      <ComingSoonToolCard
        title="Edit PDF Text is coming soon"
        description="This page keeps the route clean and consistent while the PDF text editor is being built."
      />
    </ToolPageShell>
  );
}
