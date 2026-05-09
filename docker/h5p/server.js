import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 8080);
const publicDir = path.join(__dirname, "public");
const contentDir = process.env.H5P_CONTENT_DIR || path.join(__dirname, "content");
const h5pDistDir = path.join(__dirname, "node_modules", "h5p-standalone", "dist");
const xapiConfig = {
  ingestUrl: process.env.OLT_XAPI_PUBLIC_INGEST_URL || "",
  activityPrefix: process.env.OLT_XAPI_ACTIVITY_PREFIX || ""
};

app.disable("x-powered-by");

app.get("/healthz", (_req, res) => {
  res.type("text/plain").send("ok");
});

app.get("/api/config", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ xapi: xapiConfig });
});

app.get("/api/content", async (_req, res, next) => {
  try {
    await fs.mkdir(contentDir, { recursive: true });
    const entries = await fs.readdir(contentDir, { withFileTypes: true });
    const content = [];

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) {
        continue;
      }

      const root = path.join(contentDir, entry.name);
      const metadataPath = path.join(root, "h5p.json");
      const dataPath = path.join(root, "content", "content.json");

      try {
        const [metadataRaw] = await Promise.all([
          fs.readFile(metadataPath, "utf8"),
          fs.access(dataPath)
        ]);
        const metadata = JSON.parse(metadataRaw);

        content.push({
          id: entry.name,
          title: metadata.title || entry.name,
          path: `/content/${entry.name}`
        });
      } catch {
        // Ignore folders that are not extracted H5P content packages.
      }
    }

    content.sort((a, b) => a.title.localeCompare(b.title));
    res.json({ content });
  } catch (error) {
    next(error);
  }
});

app.use("/assets/h5p", express.static(h5pDistDir, { immutable: true, maxAge: "1d" }));
app.use("/content", express.static(contentDir));
app.use(express.static(publicDir));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`OLT quizzes dev host listening on port ${port}`);
  console.log(`Serving extracted quiz content from ${contentDir}`);
});
