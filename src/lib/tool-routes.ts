import type { Tool } from "./tools";

export type ToolPath =
  | "/pdf-to-word"
  | "/compress-pdf"
  | "/merge-pdf"
  | "/split-pdf"
  | "/jpg-to-pdf"
  | "/word-to-pdf"
  | "/edit-pdf-text";

export function getToolPath(slug: Tool["slug"]): ToolPath {
  switch (slug) {
    case "pdf-to-word":
      return "/pdf-to-word";
    case "compress-pdf":
      return "/compress-pdf";
    case "merge-pdf":
      return "/merge-pdf";
    case "split-pdf":
      return "/split-pdf";
    case "jpg-to-pdf":
      return "/jpg-to-pdf";
    case "word-to-pdf":
      return "/word-to-pdf";
    case "edit-pdf-text":
      return "/edit-pdf-text";
  }

  throw new Error(`No route path is mapped for tool slug "${slug}".`);
}
