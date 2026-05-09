import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";

const scriptPath = new URL("./olt-xapi-forwarder.js", import.meta.url);
const forwarder = await readFile(scriptPath, "utf8");

const config = {
  ingestUrl: process.env.OLT_XAPI_PUBLIC_INGEST_URL || "",
  activityPrefix: process.env.OLT_XAPI_ACTIVITY_PREFIX || ""
};

const headScript = `<script>
window.OLT_SCHOLARSOME_XAPI = ${JSON.stringify(config)};
</script>
<script>
${forwarder}
</script>`;

process.stdout.write(Buffer.from(headScript, "utf8").toString("base64"));
