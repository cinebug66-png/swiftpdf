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
export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;

export type SeoMetadata = RouteSeoMetadata;

export function getSeoMetadata(pathname: string): SeoMetadata {
  return (
    routeMetadata[pathname] ?? {
      path: pathname,
      title: `Page Not Found | ${SITE_NAME}`,
      description: "The requested SwiftPDF page could not be found.",
      type: "website",
    }
  );
}

export function getCanonicalUrl(path: string) {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export function getCanonicalPath(metadata: SeoMetadata) {
  return metadata.canonicalPath ?? metadata.path;
}

function getToolSlugFromPath(path: string) {
  const slug = path.replace(/^\//, "");

  if (slug === "extract-pdf-pages") return "extract-pages";
  if (slug === "delete-pdf-pages") return "delete-pages";
  if (slug === "reorder-pdf-pages") return "reorder-pdf";

  return slug;
}

export function getStructuredData(metadata: SeoMetadata) {
  const canonicalUrl = getCanonicalUrl(getCanonicalPath(metadata));
  const toolSeo = getToolSeoContentByPath(metadata.path);
  const tool = getTool(getToolSlugFromPath(metadata.path));
  const visibleFaqs = tool ? compactNeedToKnowItems : [];
  const isHomepage = metadata.path === "/";
  const webpageSchemaNames: Record<string, { breadcrumbName: string; dateModified: string }> = {
    "/about": {
      breadcrumbName: "About SwiftPDF",
      dateModified: "2026-07-10",
    },
    "/privacy-policy": {
      breadcrumbName: "Privacy Policy",
      dateModified: "2026-07-06",
    },
    "/terms-of-service": {
      breadcrumbName: "Terms of Service",
      dateModified: "2026-07-10",
    },
    "/terms": {
      breadcrumbName: "Terms of Service",
      dateModified: "2026-07-10",
    },
  };
  const webpageSchema = webpageSchemaNames[metadata.path];

  if (metadata.noindex) {
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
        },
        {
          "@type": "WebPage",
          "@id": `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: metadata.title,
          description: metadata.description,
          isPartOf: {
            "@id": `${SITE_URL}/#website`,
          },
          inLanguage: "en",
        },
      ],
    };
  }

  if (webpageSchema) {
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
        },
        {
          "@type": "WebPage",
          "@id": `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: metadata.title,
          description: metadata.description,
          isPartOf: {
            "@id": `${SITE_URL}/#website`,
          },
          inLanguage: "en",
          dateModified: webpageSchema.dateModified,
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
              name: webpageSchema.breadcrumbName,
              item: canonicalUrl,
            },
          ],
        },
      ],
    };
  }

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
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${canonicalUrl}#softwareapplication`,
        name: tool ? `${tool.name} by ${SITE_NAME}` : SITE_NAME,
        url: canonicalUrl,
        description: metadata.description,
        applicationCategory: isHomepage ? "ProductivityApplication" : "BusinessApplication",
        ...(!isHomepage ? { applicationSubCategory: "PDF tools" } : {}),
        operatingSystem: isHomepage ? "Web" : "Any",
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
