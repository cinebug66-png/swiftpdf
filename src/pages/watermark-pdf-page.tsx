import { WatermarkPdfTool } from "@/components/tools/watermark-pdf-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("watermark-pdf");

export default function WatermarkPdfPage() {
  return (
    <ToolPageShell tool={tool}>
      <WatermarkPdfTool />
    </ToolPageShell>
  );
}
