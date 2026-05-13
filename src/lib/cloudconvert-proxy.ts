export const CLOUDCONVERT_API_BASE = "https://api.cloudconvert.com/v2";

export async function proxyCloudConvertRequest(
  request: Request,
  apiKey: string | undefined,
): Promise<Response> {
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        message: "Missing VITE_CLOUDCONVERT_API_KEY. Add it to .env.local or Vercel environment variables.",
      }),
      {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" },
      },
    );
  }

  const requestUrl = new URL(request.url);
  const targetPath = requestUrl.pathname.replace(/^\/api\/cloudconvert/, "");
  const targetUrl = `${CLOUDCONVERT_API_BASE}${targetPath}${requestUrl.search}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${apiKey}`);

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  } else {
    headers.set("content-type", "application/json");
  }

  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
  });

  const responseHeaders = new Headers();
  const responseContentType = response.headers.get("content-type");
  if (responseContentType) {
    responseHeaders.set("content-type", responseContentType);
  }

  return new Response(await response.text(), {
    status: response.status,
    headers: responseHeaders,
  });
}
