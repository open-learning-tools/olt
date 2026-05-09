# CryptPad Local-Dev Assets

This folder contains the CryptPad configuration assets mounted by the OLT local Docker stack.

## Files

- `config/config.js`: local server config for `http://cryptpad.localhost` with a separate sandbox origin at `http://cryptpad-sandbox.localhost`.
- `config/sso.js`: local OIDC SSO config that reads the Docs client credentials from container environment variables.
- `customize/application_config.js`: minimal browser-side customization with no secrets.
- `customize/olt-xapi.js`: lightweight browser-side xAPI visit instrumentation for Docs wrapper pages.
- `plugins/sso/`: CryptPad's official SSO plugin, vendored at tag `0.1.0` for compatibility with the `version-2024.12.0` image.
- `nginx/cryptpad-server.conf`: reference Nginx server block that forwards normal HTTP traffic to port `3000` and websocket traffic to port `3003`.

## Parent Compose Integration

The parent `cryptpad` service mounts these files and exposes the websocket port:

```yaml
environment:
  CPAD_MAIN_DOMAIN: "http://cryptpad.localhost"
  CPAD_SANDBOX_DOMAIN: "http://cryptpad-sandbox.localhost"
  CPAD_CONF: "/cryptpad/config/config.js"
  CRYPTPAD_OIDC_ISSUER: "${OIDC_ISSUER_URL:-http://olt.localhost}"
  CRYPTPAD_OAUTH_CLIENT_ID: "${CRYPTPAD_OAUTH_CLIENT_ID}"
  CRYPTPAD_OAUTH_CLIENT_SECRET: "${CRYPTPAD_OAUTH_CLIENT_SECRET}"
  OLT_XAPI_PUBLIC_INGEST_URL: "${OLT_XAPI_PUBLIC_INGEST_URL:-}"
  OLT_XAPI_ACTIVITY_PREFIX: "${OLT_XAPI_ACTIVITY_PREFIX:-}"
volumes:
  - ./docker/cryptpad/config/config.js:/cryptpad/config/config.js:ro
  - ./docker/cryptpad/config/sso.js:/cryptpad/config/sso.js:ro
  - ./docker/cryptpad/plugins/sso:/cryptpad/lib/plugins/sso:ro
  - ./docker/cryptpad/customize:/cryptpad/customize
  - cryptpad_blob:/cryptpad/blob
  - cryptpad_block:/cryptpad/block
  - cryptpad_data:/cryptpad/data
  - cryptpad_datastore:/cryptpad/datastore
expose:
  - "3000"
  - "3003"
```

At container startup, `patch-auto-sso.js` injects the public xAPI config and
`/customize/olt-xapi.js` into generated CryptPad HTML pages. If either xAPI env
value is blank, the browser hook is a no-op. The hook posts anonymous demo visit
statements to the configured ingest URL without credentials and does not include
document URL fragments.

Do not also mount a named volume at `/cryptpad/config` or `/cryptpad/customize`; it can mask the checked-in local config. The SSO plugin generates browser assets under `customize/www/`, which is intentionally gitignored.

## Parent Nginx Integration

The parent Nginx config includes a websocket upstream:

```nginx
upstream cryptpad_websocket_backend {
  server cryptpad:3003;
}
```

The active parent Nginx config protects the main Docs origin with the
Django-backed `oauth2-proxy-cryptpad` auth check and leaves the sandbox origin
open for the app's isolated iframe/static runtime:

- `cryptpad.localhost`: auth-gated, routes `/` to `cryptpad:3000` and `/cryptpad_websocket` to `cryptpad:3003`
- `cryptpad-sandbox.localhost`: no auth gate, routes `/` to `cryptpad:3000` and `/cryptpad_websocket` to `cryptpad:3003`

## Hosts Entry

Add the sandbox hostname alongside the existing Docs hostname:

```txt
127.0.0.1 cryptpad.localhost cryptpad-sandbox.localhost
```

## Secrets

Do not commit CryptPad admin keys or a real `AppConfig.loginSalt` in this folder. If you need a stable login salt for local accounts, create a private local override before creating users.
