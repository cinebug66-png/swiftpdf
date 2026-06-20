import type { IncomingMessage, ServerResponse } from "node:http";

type VercelRequest = IncomingMessage & {
  body?: unknown;
};

type VercelResponse = ServerResponse & {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => void;
  send: (body: string) => void;
};

function getCloudConvertApiKey() {
  return process.env.CLOUDCONVERT_API_KEY ?? process.env.VITE_CLOUDCONVERT_API_KEY;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = getCloudConvertApiKey();
  if (!apiKey) {
    return res.status(500).json({
      message: "Missing CLOUDCONVERT_API_KEY. Add it to the Vercel project environment variables.",
    });
  }

  try {
    const response = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}),
    });

    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    return res.status(response.status).send(await response.text());
  } catch (error) {
    console.error("CloudConvert job creation failed.", error);
    return res.status(500).json({ message: "CloudConvert proxy failed." });
  }
}
