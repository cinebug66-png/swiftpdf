import { tools, type Tool } from "./tools";

let pending: File[] | null = null;

export function setPendingFiles(files: File[]) {
  pending = files;
}

export function consumePendingFiles(accept: string, multiple?: boolean): File[] | null {
  if (!pending || pending.length === 0) return null;
  const accepted = pending.filter((file) => fileMatchesAccept(file, accept));
  pending = null;
  if (accepted.length === 0) return null;
  return multiple ? accepted : [accepted[0]];
}

export function peekPending(): File[] | null {
  return pending;
}

export function clearPending() {
  pending = null;
}

function fileMatchesAccept(file: File, accept: string): boolean {
  const tokens = accept.split(",").map((token) => token.trim().toLowerCase());
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return tokens.some((token) => {
    if (!token) return false;
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

export function suggestToolsFor(file: File): Tool[] {
  const name = file.name.toLowerCase();
  const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
  const isWord = /\.(docx?|odt)$/.test(name) || /word|officedocument/.test(file.type);
  const isImage = /\.(jpe?g|png|webp)$/.test(name) || /^image\/(jpeg|png|webp)$/.test(file.type);

  const order: string[] = isPdf
    ? ["compress-pdf", "pdf-to-word", "merge-pdf", "split-pdf"]
    : isWord
      ? ["word-to-pdf"]
      : isImage
        ? ["jpg-to-pdf"]
        : [];

  return order
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is Tool => Boolean(tool))
    .slice(0, 3);
}
