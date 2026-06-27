import type { Tool } from "@/lib/tools";
import type { SafeToolSeoContent } from "@/lib/safe-tool-seo-content";

type SafeToolSeoSectionProps = {
  tool: Tool;
  content: SafeToolSeoContent;
};

export function SafeToolSeoSection({ tool, content }: SafeToolSeoSectionProps) {
  void tool;
  void content;
  return null;
}
