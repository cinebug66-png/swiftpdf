import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
const clientAssetsDir = path.join(distDir, "client", "assets");

async function pickLargestFile(prefix, extension) {
  const entries = await readdir(clientAssetsDir);
  const matches = entries.filter(
    (entry) => entry.startsWith(prefix) && entry.endsWith(extension),
  );

  if (matches.length === 0) {
    throw new Error(`Could not find ${prefix}*${extension} inside dist/client/assets.`);
  }

  let largestMatch = matches[0];
  let largestSize = 0;

  for (const match of matches) {
    const filePath = path.join(clientAssetsDir, match);
    const fileStat = await stat(filePath);
    if (fileStat.size > largestSize) {
      largestSize = fileStat.size;
      largestMatch = match;
    }
  }

  return largestMatch;
}

const mainScript = await pickLargestFile("index-", ".js");
const mainStyles = await pickLargestFile("styles-", ".css");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SwiftPDF</title>
    <link rel="stylesheet" href="./client/assets/${mainStyles}" />
  </head>
  <body>
    <script type="module" src="./client/assets/${mainScript}"></script>
  </body>
</html>
`;

await writeFile(path.join(distDir, "index.html"), html, "utf8");
console.log(`Created dist/index.html using ${mainScript} and ${mainStyles}`);
