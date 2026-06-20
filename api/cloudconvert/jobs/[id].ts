import type { IncomingMessage, ServerResponse } from "node:http";

type VercelRequest = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>;
};

type VercelResponse = ServerResponse & {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => void;
  send: (body: string) => void;
};

function getCloudConvertApiKey() {
  return process.env.CLOUDCONVERT_API_KEY ?? process.env.VITE_CLOUDCONVERT_API_KEY;
}

function getJobId(req: VercelRequest) {
  const queryId = req.query?.id;
  if (typeof queryId === "string") return queryId;
  if (Array.isArray(queryId)) return queryId[0];

  const requestUrl = new URL(req.url ?? "", `https://${req.headers.host ?? "localhost"}`);
  return requestUrl.pathname.split("/").filter(Boolean).at(-1);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = getCloudConvertApiKey();
  if (!apiKey) {
    return res.status(500).json({
      message: "Missing CLOUDCONVERT_API_KEY. Add it to the Vercel project environment variables.",
    });
  }

  const jobId = getJobId(req);
  if (!jobId) {
    return res.status(400).json({ message: "CloudConvert job ID is required." });
  }

  try {
    const response = await fetch(
      `https://api.cloudconvert.com/v2/jobs/${encodeURIComponent(jobId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    return res.status(response.status).send(await response.text());
  } catch (error) {
    console.error("CloudConvert job lookup failed.", error);
    return res.status(500).json({ message: "CloudConvert proxy failed." });
  }
}
