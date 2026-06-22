export const GA_MEASUREMENT_ID = "G-826TJ2VH9J";

export type PdfToolEventName =
  | "pdf_to_word"
  | "word_to_pdf"
  | "compress_pdf"
  | "merge_pdf"
  | "split_pdf"
  | "jpg_to_pdf"
  | "rotate_pdf"
  | "watermark_pdf"
  | "unlock_pdf"
  | "protect_pdf"
  | "delete_pages";

type GtagCommand = "config" | "event" | "js";
type Gtag = (command: GtagCommand, targetOrEvent: string | Date, parameters?: object) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let lastTrackedPageLocation = "";

function sendEvent(eventName: string, parameters: Record<string, string>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", eventName, parameters);
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

export function trackConversionStarted(toolName: PdfToolEventName) {
  sendEvent(toolName, {
    tool_name: toolName,
    conversion_status: "started",
  });
  sendEvent("conversion_started", {
    tool_name: toolName,
  });
}

export function trackConversionCompleted(toolName: PdfToolEventName) {
  sendEvent("conversion_completed", {
    tool_name: toolName,
  });
}
