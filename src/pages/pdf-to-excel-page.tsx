import { PdfToExcelTool } from "@/components/tools/pdf-to-excel-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("pdf-to-excel");

export default function PdfToExcelPage() {
  return (
    <ToolPageShell tool={tool}>
      <PdfToExcelTool />
    </ToolPageShell>
  );
}
