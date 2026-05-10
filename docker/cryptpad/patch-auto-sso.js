const fs = require('node:fs');
const path = require('node:path');

const scriptTag = '<script src="/customize/olt-auto-sso.js"></script>';
const xapiConfigPath = '/cryptpad/customize/olt-xapi-config.js';
const xapiConfigTag = '<script src="/customize/olt-xapi-config.js"></script>';
const xapiScriptTag = '<script src="/customize/olt-xapi.js"></script>';
const autoSsoPages = [
  '/cryptpad/customize/www/register/index.html',
  '/cryptpad/customize/www/login/index.html',
];
const wwwRoot = '/cryptpad/customize/www';
const sourceWwwRoot = '/cryptpad/www';
const xapiConfig = {
  ingestUrl: process.env.OLT_CRYPTPAD_XAPI_PUBLIC_INGEST_URL || '/ingest/xapi/statements',
  activityPrefix: process.env.OLT_XAPI_ACTIVITY_PREFIX || '',
};

const injectBeforeHeadEnd = (html, content) => {
  if (html.includes('</head>')) {
    return html.replace('</head>', `    ${content}\n</head>`);
  }

  return `${html.trimEnd()}\n${content}\n`;
};

const injectBeforeBodyEnd = (html, content) => {
  if (html.includes('</body>')) {
    return html.replace('</body>', `    ${content}\n</body>`);
  }

  return `${html.trimEnd()}\n${content}\n`;
};

const toScriptJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

fs.writeFileSync(
  xapiConfigPath,
  `window.OLT_XAPI_CONFIG = ${toScriptJson(xapiConfig)};\n`
);
console.log(`OLT xAPI config written to ${xapiConfigPath}`);

const findHtmlPages = (dir) => {
  const pages = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      pages.push(...findHtmlPages(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.html')) {
      pages.push(entryPath);
    }
  }

  return pages;
};

const patchAutoSso = (page) => {
  let html = fs.readFileSync(page, 'utf8');
  if (html.includes(scriptTag)) {
    return;
  }

  html = injectBeforeBodyEnd(html, scriptTag);

  fs.writeFileSync(page, html);
  console.log(`OLT auto-SSO hook added to ${page}`);
};

const patchXapi = (page) => {
  let html = fs.readFileSync(page, 'utf8');
  var nextHtml = html;

  if (nextHtml.includes('<script id="olt-xapi-config">')) {
    nextHtml = nextHtml.replace(
      /<script id="olt-xapi-config">[\s\S]*?<\/script>/,
      xapiConfigTag
    );
  } else if (!nextHtml.includes(xapiConfigTag)) {
    nextHtml = injectBeforeHeadEnd(nextHtml, xapiConfigTag);
  }

  if (!nextHtml.includes(xapiScriptTag)) {
    nextHtml = injectBeforeHeadEnd(nextHtml, xapiScriptTag);
  }

  if (nextHtml === html) {
    return;
  }

  fs.writeFileSync(page, nextHtml);
  console.log(`OLT xAPI hook added to ${page}`);
};

for (const page of autoSsoPages) {
  patchAutoSso(page);
}

if (fs.existsSync(sourceWwwRoot)) {
  for (const page of findHtmlPages(sourceWwwRoot)) {
    patchXapi(page);
  }
}

for (const page of findHtmlPages(wwwRoot)) {
  patchXapi(page);
}
