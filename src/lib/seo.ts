import {
  publicRoutes,
  routeMetadata,
  toolFeatureNames,
  type RouteSeoMetadata,
} from "@/lib/seo-routes";
import { getToolSeoContentByPath } from "@/lib/tool-seo-content";
import { compactNeedToKnowItems } from "@/lib/compact-tool-seo-content";
import { getTool } from "@/lib/tools";

export { publicRoutes, routeMetadata };

export const SITE_NAME = "SwiftPDF";
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL?.trim() || "https://swiftpdftools.in"
).replace(/\/+$/, "");
export const BRAND_LOGO_URL = `${SITE_URL}/logo.png`;
export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;

export type SeoMetadata = RouteSeoMetadata & {
  noIndex?: boolean;
};

export function getSeoMetadata(pathname: string): SeoMetadata {
  return (
    routeMetadata[pathname] ?? {
      path: pathname,
      title: `Page Not Found | ${SITE_NAME}`,
      description: "The requested SwiftPDF page could not be found.",
      type: "website",
      noIndex: true,
    }
  );
}

export function getCanonicalUrl(path: string) {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export function getStructuredData(metadata: SeoMetadata) {
  const canonicalUrl = getCanonicalUrl(metadata.path);
  const toolSeo = getToolSeoContentByPath(metadata.path);
  const toolSlug = metadata.path.replace(/^\//, "");
  const tool = getTool(toolSlug === "extract-pdf-pages" ? "extract-pages" : toolSlug);
  const visibleFaqs = tool ? compactNeedToKnowItems : [];
  const organization = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: BRAND_LOGO_URL,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description: routeMetadata["/"].description,
        inLanguage: "en",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
      },
      ...(metadata.path === "/" ? [organization] : []),
      {
        "@type": "SoftwareApplication",
        "@id": `${canonicalUrl}#softwareapplication`,
        name: tool ? `${tool.name} by ${SITE_NAME}` : SITE_NAME,
        url: canonicalUrl,
        description: metadata.description,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "PDF tools",
        operatingSystem: "Any",
        browserRequirements: "Requires a modern web browser with JavaScript enabled.",
        featureList: toolSeo ? toolSeo.steps.map((step) => step.title) : toolFeatureNames,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      ...(toolSeo && tool
        ? [
            {
              "@type": "FAQPage",
              "@id": `${canonicalUrl}#faq`,
              mainEntity: visibleFaqs.map((faq) => ({
                "@type": "Question",
                name: faq.title,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.text,
                },
              })),
            },
            {
              "@type": "BreadcrumbList",
              "@id": `${canonicalUrl}#breadcrumb`,
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "SwiftPDF",
                  item: `${SITE_URL}/`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: tool.name,
                  item: canonicalUrl,
                },
              ],
            },
          ]
        : []),
    ],
  };
}
