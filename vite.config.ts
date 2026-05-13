import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv, type Connect, defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { proxyCloudConvertRequest } from "./src/lib/cloudconvert-proxy";

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

  return {
    plugins: [
      react(),
      tailwindcss(),
      tsconfigPaths(),
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
