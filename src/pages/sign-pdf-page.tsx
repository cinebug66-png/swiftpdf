import { SignPdfTool } from "@/components/tools/sign-pdf-tool";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { requireTool } from "@/lib/tools";

const tool = requireTool("sign-pdf");

export default function SignPdfPage() {
  return (
    <ToolPageShell tool={tool}>
      <SignPdfTool />
    </ToolPageShell>
  );
}
