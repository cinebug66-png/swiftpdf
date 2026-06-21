import {
  publicRoutes,
  routeMetadata,
  toolFeatureNames,
  type RouteSeoMetadata,
} from "@/lib/seo-routes";

export { publicRoutes, routeMetadata };

export const SITE_NAME = "SwiftPDF";
export const SITE_URL = (import.meta.env.VITE_SITE_URL?.trim() || "https://swiftpdf.in").replace(
  /\/+$/,
  "",
);

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
        "@id": `${SITE_URL}/#softwareapplication`,
        name: SITE_NAME,
        url: canonicalUrl,
        description: metadata.description,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "PDF tools",
        operatingSystem: "Any",
        browserRequirements: "Requires a modern web browser with JavaScript enabled.",
        featureList: toolFeatureNames,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };
}
