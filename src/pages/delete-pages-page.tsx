import { DeletePagesTool } from "@/components/tools/delete-pages-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("delete-pages");

export default function DeletePagesPage() {
  return (
    <ToolPageShell tool={tool}>
      <DeletePagesTool />
    </ToolPageShell>
  );
}
