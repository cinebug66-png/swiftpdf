import { CropPdfTool } from "@/components/tools/crop-pdf-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("crop-pdf");

export default function CropPdfPage() {
  return (
    <ToolPageShell tool={tool}>
      <CropPdfTool />
    </ToolPageShell>
  );
}
