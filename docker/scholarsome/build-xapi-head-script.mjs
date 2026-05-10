import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";

const scriptPath = new URL("./olt-xapi-forwarder.js", import.meta.url);
const themePath = new URL("./olt-theme.css", import.meta.url);
const forwarder = await readFile(scriptPath, "utf8");
const theme = await readFile(themePath, "utf8");

const config = {
  ingestUrl: process.env.OLT_XAPI_PUBLIC_INGEST_URL || "",
  activityPrefix: process.env.OLT_XAPI_ACTIVITY_PREFIX || ""
};

// We bundle three independent payloads into the SCHOLARSOME_HEAD_SCRIPTS_BASE64
// hook:
//   1. The OLT theme stylesheet, inlined so no extra static-asset mount is
//      required by the parent stack. Inter and Instrument Serif are pulled
//      from Google Fonts so the brand wordmark renders correctly without
//      shipping a font file.
//   2. The xAPI forwarder configuration (browser-visible, non-secret).
//   3. The xAPI forwarder itself.
const headScript = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap">
<style data-olt-theme="scholarsome">
${theme}
</style>
<script>
window.OLT_SCHOLARSOME_XAPI = ${JSON.stringify(config)};
</script>
<script>
${forwarder}
</script>`;

process.stdout.write(Buffer.from(headScript, "utf8").toString("base64"));
