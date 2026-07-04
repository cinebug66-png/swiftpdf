import { useLayoutEffect } from "react";
import {
  getCanonicalPath,
  getCanonicalUrl,
  getSeoMetadata,
  getStructuredData,
  OG_IMAGE_URL,
  SITE_NAME,
} from "@/lib/seo";

type SeoHeadProps = {
  pathname: string;
};

function setMeta(selector: string, attributes: Record<string, string>, content: string) {
  const elements = Array.from(document.head.querySelectorAll<HTMLMetaElement>(selector));
  let element = elements.shift() ?? null;

  elements.forEach((duplicate) => duplicate.remove());

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value));
  element.setAttribute("content", content);
}

function setCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function setStructuredData(pathname: string, data: object) {
  const id = "swiftpdf-structured-data";
  const existingElements = Array.from(
    document.head.querySelectorAll<HTMLScriptElement>(
      `script#${id}, script[data-swiftpdf-structured-data="true"]`,
    ),
  );
  let element = existingElements.shift() ?? null;

  existingElements.forEach((duplicate) => duplicate.remove());

  if (!element) {
    element = document.createElement("script");
    element.id = id;
    element.type = "application/ld+json";
    element.dataset.swiftpdfStructuredData = "true";
    document.head.appendChild(element);
  }

  element.id = id;
  element.type = "application/ld+json";
  element.dataset.swiftpdfStructuredData = "true";
  element.dataset.route = pathname;

  const serializedData = JSON.stringify(data);
  if (element.textContent !== serializedData) {
    element.textContent = serializedData;
  }
}

export function SeoHead({ pathname }: SeoHeadProps) {
  useLayoutEffect(() => {
    const metadata = getSeoMetadata(pathname);
    const canonicalUrl = getCanonicalUrl(getCanonicalPath(metadata));
    const robots = "index,follow";

    document.title = metadata.title;
    document.documentElement.lang = "en";

    setMeta('meta[name="description"]', { name: "description" }, metadata.description);
    setMeta('meta[name="robots"]', { name: "robots" }, robots);
    setMeta('meta[name="googlebot"]', { name: "googlebot" }, robots);

    setMeta('meta[property="og:title"]', { property: "og:title" }, metadata.title);
    setMeta(
      'meta[property="og:description"]',
      { property: "og:description" },
      metadata.description,
    );
    setMeta('meta[property="og:type"]', { property: "og:type" }, metadata.type ?? "website");
    setMeta('meta[property="og:url"]', { property: "og:url" }, canonicalUrl);
    setMeta('meta[property="og:site_name"]', { property: "og:site_name" }, SITE_NAME);
    setMeta('meta[property="og:locale"]', { property: "og:locale" }, "en_US");
    setMeta('meta[property="og:image"]', { property: "og:image" }, OG_IMAGE_URL);
    setMeta(
      'meta[property="og:image:secure_url"]',
      { property: "og:image:secure_url" },
      OG_IMAGE_URL,
    );
    setMeta('meta[property="og:image:type"]', { property: "og:image:type" }, "image/png");
    setMeta('meta[property="og:image:width"]', { property: "og:image:width" }, "1200");
    setMeta('meta[property="og:image:height"]', { property: "og:image:height" }, "630");
    setMeta(
      'meta[property="og:image:alt"]',
      { property: "og:image:alt" },
      "SwiftPDF - Free online PDF tools",
    );

    setMeta('meta[name="twitter:card"]', { name: "twitter:card" }, "summary_large_image");
    setMeta('meta[name="twitter:title"]', { name: "twitter:title" }, metadata.title);
    setMeta(
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      metadata.description,
    );
    setMeta('meta[name="twitter:image"]', { name: "twitter:image" }, OG_IMAGE_URL);
    setMeta(
      'meta[name="twitter:image:alt"]',
      { name: "twitter:image:alt" },
      "SwiftPDF - Free online PDF tools",
    );

    setCanonical(canonicalUrl);
    setStructuredData(metadata.path, getStructuredData(metadata));
  }, [pathname]);

  return null;
}
