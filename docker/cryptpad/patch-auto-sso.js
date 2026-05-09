const fs = require('node:fs');

const scriptTag = '<script src="/customize/olt-auto-sso.js"></script>';
const pages = [
  '/cryptpad/customize/www/register/index.html',
  '/cryptpad/customize/www/login/index.html',
];

for (const page of pages) {
  let html = fs.readFileSync(page, 'utf8');
  if (html.includes(scriptTag)) {
    continue;
  }

  if (html.includes('</body>')) {
    html = html.replace('</body>', `    ${scriptTag}\n</body>`);
  } else {
    html = `${html.trimEnd()}\n${scriptTag}\n`;
  }

  fs.writeFileSync(page, html);
  console.log(`OLT auto-SSO hook added to ${page}`);
}
