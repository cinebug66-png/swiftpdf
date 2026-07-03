export const GA_MEASUREMENT_ID = "G-826TJ2VH9J";

export type PdfToolEventName =
  | "pdf_to_word"
  | "pdf_to_jpg"
  | "pdf_to_png"
  | "word_to_pdf"
  | "compress_pdf"
  | "merge_pdf"
  | "split_pdf"
  | "crop_pdf"
  | "jpg_to_pdf"
  | "rotate_pdf"
  | "watermark_pdf"
  | "unlock_pdf"
  | "protect_pdf"
  | "delete_pages"
  | "extract_pages"
  | "reorder_pdf"
  | "add_page_numbers"
  | "sign_pdf";

type AnalyticsValue = string | number | boolean;
type AnalyticsParams = Record<string, AnalyticsValue | null | undefined>;
type GtagCommand = "config" | "event" | "js";
type Gtag = (command: GtagCommand, targetOrEvent: string | Date, parameters?: object) => void;

type ToolAnalyticsInfo = {
  tool_name: string;
  tool_slug: string;
  input_type: string;
  output_type: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

const TOOL_INFO: Record<PdfToolEventName, ToolAnalyticsInfo> = {
  pdf_to_word: tool("PDF to Word", "pdf-to-word", "pdf", "docx"),
  pdf_to_jpg: tool("PDF to JPG", "pdf-to-jpg", "pdf", "jpg"),
  pdf_to_png: tool("PDF to PNG", "pdf-to-png", "pdf", "png"),
  word_to_pdf: tool("Word to PDF", "word-to-pdf", "docx", "pdf"),
  compress_pdf: tool("Compress PDF", "compress-pdf", "pdf", "pdf"),
  merge_pdf: tool("Merge PDF", "merge-pdf", "pdf", "pdf"),
  split_pdf: tool("Split PDF", "split-pdf", "pdf", "pdf"),
  crop_pdf: tool("Crop PDF", "crop-pdf", "pdf", "pdf"),
  jpg_to_pdf: tool("JPG to PDF", "jpg-to-pdf", "image", "pdf"),
  rotate_pdf: tool("Rotate PDF", "rotate-pdf", "pdf", "pdf"),
  watermark_pdf: tool("Watermark PDF", "watermark-pdf", "pdf", "pdf"),
  unlock_pdf: tool("Unlock PDF", "unlock-pdf", "pdf", "pdf"),
  protect_pdf: tool("Protect PDF", "protect-pdf", "pdf", "pdf"),
  delete_pages: tool("Delete PDF Pages", "delete-pages", "pdf", "pdf"),
  extract_pages: tool("Extract PDF Pages", "extract-pages", "pdf", "pdf"),
  reorder_pdf: tool("Reorder PDF Pages", "reorder-pdf", "pdf", "pdf"),
  add_page_numbers: tool("Add Page Numbers", "add-page-numbers", "pdf", "pdf"),
  sign_pdf: tool("Sign PDF", "sign-pdf", "pdf", "pdf"),
};

let lastTrackedPageLocation = "";

function tool(
  tool_name: string,
  tool_slug: string,
  input_type: string,
  output_type: string,
): ToolAnalyticsInfo {
  return { tool_name, tool_slug, input_type, output_type };
}

function getPageUrl() {
  return typeof window === "undefined" ? "" : window.location.href;
}

function cleanParams(parameters: AnalyticsParams) {
  return Object.fromEntries(
    Object.entries(parameters).filter(([, value]) => value !== undefined && value !== null),
  ) as Record<string, AnalyticsValue>;
}

function sendEvent(eventName: string, parameters: AnalyticsParams = {}) {
  try {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("event", eventName, cleanParams(parameters));
  } catch (error) {
    console.warn("Analytics event failed", error);
  }
}

function getToolInfo(toolName: string): ToolAnalyticsInfo | null {
  return TOOL_INFO[toolName as PdfToolEventName] ?? null;
}

function truncate(value: string, maxLength = 96) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}...` : normalized;
}

function legacyToolName(eventName: string) {
  return eventName
    .replace(/_(started|completed|download|zip_download)$/u, "")
    .replace(/^page_numbers/u, "add_page_numbers");
}

function trackMappedEvent(eventName: string, parameters: AnalyticsParams) {
  const toolInfo =
    getToolInfo(String(parameters.tool_name ?? "")) ?? getToolInfo(legacyToolName(eventName));
  if (!toolInfo) return;

  if (eventName.endsWith("_started")) {
    trackEvent("conversion_started", toolInfo);
    return;
  }

  if (eventName.endsWith("_completed")) {
    trackEvent("conversion_success", {
      ...toolInfo,
      processing_time_ms: parameters.processing_time_ms,
    });
    return;
  }

  if (eventName.endsWith("_download") || eventName.endsWith("_zip_download")) {
    trackEvent("download_click", {
      tool_name: toolInfo.tool_name,
      tool_slug: toolInfo.tool_slug,
      output_type: toolInfo.output_type,
    });
  }
}

export function trackEvent(eventName: string, parameters: AnalyticsParams = {}) {
  sendEvent(eventName, parameters);
}

export function trackAnalyticsEvent(eventName: string, parameters: AnalyticsParams = {}) {
  sendEvent(eventName, parameters);
  trackMappedEvent(eventName, parameters);
}

export function trackPageView(pathname: string, pageTitle: string) {
  if (typeof window === "undefined") return;

  const pageLocation = new URL(pathname, window.location.origin).href;
  if (pageLocation === lastTrackedPageLocation) return;

  lastTrackedPageLocation = pageLocation;
  sendEvent("page_view", {
    page_location: pageLocation,
    page_path: pathname,
    page_title: pageTitle,
  });
}

export function trackToolPageView(toolInfo: Pick<ToolAnalyticsInfo, "tool_name" | "tool_slug">) {
  trackEvent("tool_page_view", {
    ...toolInfo,
    page_url: getPageUrl(),
  });
}

export function trackChooseFileClick(toolInfo: Pick<ToolAnalyticsInfo, "tool_name" | "tool_slug">) {
  trackEvent("choose_file_click", {
    ...toolInfo,
    page_url: getPageUrl(),
  });
}

export function trackFileUploaded(
  toolInfo: Pick<ToolAnalyticsInfo, "tool_name" | "tool_slug">,
  files: FileList | File[],
) {
  const uploadedFiles = Array.from(files);
  if (uploadedFiles.length === 0) return;

  const totalBytes = uploadedFiles.reduce((sum, file) => sum + file.size, 0);
  const fileType = uploadedFiles.length === 1 ? getSafeFileType(uploadedFiles[0]) : "multiple";

  trackEvent("file_uploaded", {
    ...toolInfo,
    file_type: fileType,
    file_count: uploadedFiles.length,
    file_size_mb: Number((totalBytes / 1024 / 1024).toFixed(2)),
  });
}

export function trackConversionStarted(toolName: PdfToolEventName) {
  const toolInfo = TOOL_INFO[toolName];
  sendEvent(toolName, {
    tool_name: toolName,
    conversion_status: "started",
  });
  trackEvent("conversion_started", toolInfo);
}

export function trackConversionCompleted(toolName: PdfToolEventName) {
  const toolInfo = TOOL_INFO[toolName];
  sendEvent("conversion_completed", {
    tool_name: toolName,
  });
  trackEvent("conversion_success", toolInfo);
}

export function trackConversionError(
  toolInfo: Pick<ToolAnalyticsInfo, "tool_name" | "tool_slug">,
  errorType = "tool_error",
  message = "Tool action failed",
) {
  trackEvent("conversion_error", {
    ...toolInfo,
    error_type: truncate(errorType, 48),
    error_message_short: truncate(message),
  });
}

export function trackDownloadClick(
  toolInfo: Pick<ToolAnalyticsInfo, "tool_name" | "tool_slug">,
  outputType: string,
) {
  trackEvent("download_click", {
    ...toolInfo,
    output_type: outputType,
  });
}

function getSafeFileType(file: File) {
  if (file.type) return file.type.split(";")[0].toLowerCase();
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? `.${extension}` : "unknown";
}
