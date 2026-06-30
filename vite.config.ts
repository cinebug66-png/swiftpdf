import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv, type Connect, defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { proxyCloudConvertRequest } from "./src/lib/cloudconvert-proxy";
import { routeMetadata, toolFeatureNames } from "./src/lib/seo-routes";
import { getToolSeoContentByPath } from "./src/lib/tool-seo-content";
import { getTool } from "./src/lib/tools";

const DEFAULT_SITE_URL = "https://swiftpdftools.in";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function replaceMetaContent(html: string, selector: string, content: string) {
  const escapedContent = escapeHtml(content);
  const pattern = new RegExp(
    `(<meta\\s+${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+content=")[^"]*(")`,
  );
  return html.replace(pattern, `$1${escapedContent}$2`);
}

function createStructuredData(siteUrl: string, pathName: string, description: string) {
  const canonicalUrl = pathName === "/" ? `${siteUrl}/` : `${siteUrl}${pathName}`;
  const toolSeo = getToolSeoContentByPath(pathName);
  const tool = getTool(pathName.replace(/^\//, ""));
  const isHomepage = pathName === "/";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: "SwiftPDF",
        description: routeMetadata["/"].description,
        inLanguage: "en",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${canonicalUrl}#softwareapplication`,
        name: tool ? `${tool.name} by SwiftPDF` : "SwiftPDF",
        url: canonicalUrl,
        description,
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
              mainEntity: toolSeo.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.a,
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
                  item: `${siteUrl}/`,
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

function createSeoPagesPlugin(siteUrl: string) {
  return {
    name: "swiftpdf-seo-pages",
    async closeBundle() {
      const distDirectory = path.resolve(__dirname, "dist");
      const baseHtml = await readFile(path.join(distDirectory, "index.html"), "utf8");

      await Promise.all(
        Object.values(routeMetadata).map(async (metadata) => {
          const canonicalUrl = metadata.path === "/" ? `${siteUrl}/` : `${siteUrl}${metadata.path}`;
          let html = baseHtml
            .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`)
            .replace(
              /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
              `$1${escapeHtml(canonicalUrl)}$2`,
            )
            .replace(
              /(<script id="swiftpdf-structured-data" type="application\/ld\+json">)[\s\S]*?(<\/script>)/,
              `$1${JSON.stringify(
                createStructuredData(siteUrl, metadata.path, metadata.description),
              )}$2`,
            );

          html = replaceMetaContent(html, 'name="description"', metadata.description);
          html = replaceMetaContent(html, 'property="og:title"', metadata.title);
          html = replaceMetaContent(html, 'property="og:description"', metadata.description);
          html = replaceMetaContent(html, 'property="og:url"', canonicalUrl);
          html = replaceMetaContent(html, 'property="og:image"', `${siteUrl}/og-image.png`);
          html = replaceMetaContent(
            html,
            'property="og:image:secure_url"',
            `${siteUrl}/og-image.png`,
          );
          html = replaceMetaContent(html, 'name="twitter:title"', metadata.title);
          html = replaceMetaContent(html, 'name="twitter:description"', metadata.description);
          html = replaceMetaContent(html, 'name="twitter:image"', `${siteUrl}/og-image.png`);

          if (metadata.path === "/") {
            await writeFile(path.join(distDirectory, "index.html"), html);
            return;
          }

          const routeDirectory = path.join(distDirectory, metadata.path.slice(1));
          await mkdir(routeDirectory, { recursive: true });
          await writeFile(path.join(routeDirectory, "index.html"), html);
        }),
      );
    },
  };
}

function createCloudConvertMiddleware(apiKey: string | undefined) {
  return async (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
    if (!req.url?.startsWith("/api/cloudconvert")) {
      next();
      return;
    }

    const requestUrl = new URL(req.url, "http://localhost");
    const body =
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await new Promise<string>((resolve, reject) => {
            let data = "";
            req.on("data", (chunk) => {
              data += chunk;
            });
            req.on("end", () => resolve(data));
            req.on("error", reject);
          });

    const request = new Request(`http://localhost${requestUrl.pathname}${requestUrl.search}`, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body,
    });

    try {
      const response = await proxyCloudConvertRequest(request, apiKey);
      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ message: "CloudConvert proxy failed." }));
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const cloudConvertMiddleware = createCloudConvertMiddleware(env.VITE_CLOUDCONVERT_API_KEY);
  const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      tsconfigPaths(),
      createSeoPagesPlugin(siteUrl),
      {
        name: "cloudconvert-proxy",
        configureServer(server) {
          server.middlewares.use(cloudConvertMiddleware);
        },
        configurePreviewServer(server) {
          server.middlewares.use(cloudConvertMiddleware);
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      host: "0.0.0.0",
    },
    preview: {
      host: "0.0.0.0",
    },
  };
});
