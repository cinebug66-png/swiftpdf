export default async function handler(req, res) {
  try {
    const apiKey = process.env.VITE_CLOUDCONVERT_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        message:
          "Missing VITE_CLOUDCONVERT_API_KEY. Add it to .env.local or Vercel environment variables.",
      });
      return;
    }

    const requestUrl = new URL(req.url, `https://${req.headers.host}`);
    const targetPath = requestUrl.pathname.replace(/^\/api\/cloudconvert/, "");
    const targetUrl = `https://api.cloudconvert.com/v2${targetPath}${requestUrl.search}`;
    const body =
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body ?? {});

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": req.headers["content-type"] ?? "application/json",
      },
      body,
    });

    res.status(response.status);
    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("content-type", contentType);
    }
    res.send(await response.text());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "CloudConvert proxy failed." });
  }
}
