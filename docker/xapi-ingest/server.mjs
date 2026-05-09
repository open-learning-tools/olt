import http from "node:http";

const port = Number(process.env.PORT || 8090);
const ralphEndpoint = process.env.RALPH_XAPI_STATEMENTS_URL || "http://ralph:8100/xAPI/statements";
const username = process.env.RALPH_LRS_USERNAME || "";
const password = process.env.RALPH_LRS_PASSWORD || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.OLT_XAPI_CORS_ORIGIN || "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "content-type,authorization,x-olt-service,x-olt-user",
  "Access-Control-Max-Age": "86400"
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...corsHeaders
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function forwardStatements(body) {
  if (!username || !password) {
    throw new Error("Ralph credentials are not configured");
  }

  const response = await fetch(ralphEndpoint, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      "content-type": "application/json",
      "x-experience-api-version": "1.0.3"
    },
    body
  });

  const responseText = await response.text();
  if (!response.ok) {
    const error = new Error(`Ralph returned ${response.status}`);
    error.status = response.status;
    error.details = responseText;
    throw error;
  }

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return { response: responseText };
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/healthz") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method !== "POST" || url.pathname !== "/xapi/statements") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  try {
    const rawBody = await readBody(req);
    const payload = JSON.parse(rawBody);
    const statements = Array.isArray(payload) ? payload : [payload];

    if (statements.length === 0 || statements.some((statement) => !statement || typeof statement !== "object")) {
      sendJson(res, 400, { error: "Expected one xAPI statement object or an array of statement objects" });
      return;
    }

    const forwarded = await forwardStatements(JSON.stringify(Array.isArray(payload) ? statements : statements[0]));
    sendJson(res, 202, { ok: true, forwarded });
  } catch (error) {
    console.error(error);
    sendJson(res, error.status || 500, {
      error: "Unable to ingest xAPI statements",
      detail: error.message
    });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`OLT xAPI ingest bridge listening on port ${port}`);
  console.log(`Forwarding statements to ${ralphEndpoint}`);
});
