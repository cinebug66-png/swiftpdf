import { useEffect } from "react";
import { getCanonicalUrl, getSeoMetadata, getStructuredData, SITE_NAME } from "@/lib/seo";

type SeoHeadProps = {
  pathname: string;
};

function setMeta(selector: string, attributes: Record<string, string>, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value));
    document.head.appendChild(element);
  }

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

function setStructuredData(data: object) {
  const id = "swiftpdf-structured-data";
  let element = document.head.querySelector<HTMLScriptElement>(`script#${id}`);

  if (!element) {
    element = document.createElement("script");
    element.id = id;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(data);
}

export function SeoHead({ pathname }: SeoHeadProps) {
  useEffect(() => {
    const metadata = getSeoMetadata(pathname);
    const canonicalUrl = getCanonicalUrl(metadata.path);
    const robots = metadata.noIndex ? "noindex, nofollow" : "index, follow";

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

    setMeta('meta[name="twitter:card"]', { name: "twitter:card" }, "summary");
    setMeta('meta[name="twitter:title"]', { name: "twitter:title" }, metadata.title);
    setMeta(
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      metadata.description,
    );

    setCanonical(canonicalUrl);
    setStructuredData(getStructuredData(metadata));
  }, [pathname]);

  return null;
}
