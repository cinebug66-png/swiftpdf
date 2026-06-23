import type { Tool } from "./tools";

export type ToolPath =
  | "/pdf-to-word"
  | "/pdf-to-jpg"
  | "/compress-pdf"
  | "/merge-pdf"
  | "/split-pdf"
  | "/jpg-to-pdf"
  | "/word-to-pdf"
  | "/watermark-pdf"
  | "/rotate-pdf"
  | "/delete-pages"
  | "/reorder-pdf"
  | "/add-page-numbers"
  | "/protect-pdf"
  | "/unlock-pdf"
  | "/sign-pdf";

export function getToolPath(slug: Tool["slug"]): ToolPath {
  switch (slug) {
    case "pdf-to-word":
      return "/pdf-to-word";
    case "pdf-to-jpg":
      return "/pdf-to-jpg";
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
    case "watermark-pdf":
      return "/watermark-pdf";
    case "rotate-pdf":
      return "/rotate-pdf";
    case "delete-pages":
      return "/delete-pages";
    case "reorder-pdf":
      return "/reorder-pdf";
    case "add-page-numbers":
      return "/add-page-numbers";
    case "protect-pdf":
      return "/protect-pdf";
    case "unlock-pdf":
      return "/unlock-pdf";
    case "sign-pdf":
      return "/sign-pdf";
  }

  throw new Error(`No route path is mapped for tool slug "${slug}".`);
}
