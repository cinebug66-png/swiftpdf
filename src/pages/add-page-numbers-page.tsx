import { AddPageNumbersTool } from "@/components/tools/add-page-numbers-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("add-page-numbers");

export default function AddPageNumbersPage() {
  return (
    <ToolPageShell tool={tool}>
      <AddPageNumbersTool />
    </ToolPageShell>
  );
}
