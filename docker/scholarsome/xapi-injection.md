# Scholarsome xAPI Local-Dev Forwarding & OLT Theme

Scholarsome runs behind `oauth2-proxy`, so local activity forwarding should use
browser-visible configuration and must not embed Ralph credentials or other
secrets. The parent stack should provide:

- `OLT_XAPI_INTERNAL_INGEST_URL`: server-side ingest URL, if a future
  server-side Scholarsome adapter is added.
- `OLT_XAPI_PUBLIC_INGEST_URL`: browser-visible ingest URL used by the local
  forwarder.
- `OLT_XAPI_ACTIVITY_PREFIX`: stable activity IRI prefix.

## Browser Forwarder

`olt-xapi-forwarder.js` emits minimal demo xAPI statements for:

- initial Scholarsome app visits
- client-side route changes, including common study/review/flashcard paths

The actor is an opaque browser-local account ID stored in `localStorage`. This
keeps the demo useful without exposing OAuth access tokens, email headers, or
Ralph Basic Auth credentials to the browser.

## OLT Theme

`olt-theme.css` reskins the Scholarsome chrome (Bootstrap 5 based) to match the
OLT wrapper landing page: cream background, navy primary, turquoise accent,
14px radius cards, pill buttons, Inter sans + Instrument Serif italic accent.
It overrides the public `--bs-*` custom properties (e.g. `--bs-body-bg`,
`--bs-primary`, `--bs-card-bg`, `--bs-border-radius`) and layers explicit
selectors for navbar, buttons, cards, modals, dropdowns, list groups,
pagination, tables, alerts, and Scholarsome's study-mode and flashcard
surfaces.

The theme is injected through the same head-script hook as the xAPI forwarder,
so no separate mount is required for the inline path.

## Current Image Head-Script Hook

The local Scholarsome environment already exposes `SCHOLARSOME_HEAD_SCRIPTS_BASE64`.
Use `build-xapi-head-script.mjs` to generate an inline, browser-visible payload
that includes the OLT theme `<style>` block plus the xAPI configuration and
forwarder, sourced from `olt-theme.css`, `OLT_XAPI_PUBLIC_INGEST_URL`,
`OLT_XAPI_ACTIVITY_PREFIX`, and `olt-xapi-forwarder.js`:

```sh
OLT_XAPI_PUBLIC_INGEST_URL="$OLT_XAPI_PUBLIC_INGEST_URL" \
OLT_XAPI_ACTIVITY_PREFIX="$OLT_XAPI_ACTIVITY_PREFIX" \
node docker/scholarsome/build-xapi-head-script.mjs
```

Set the command output as `SCHOLARSOME_HEAD_SCRIPTS_BASE64` for local
development. The generated payload intentionally references only public,
non-secret values.

```yaml
services:
  scholarsome:
    environment:
      OLT_XAPI_INTERNAL_INGEST_URL: "${OLT_XAPI_INTERNAL_INGEST_URL}"
      OLT_XAPI_PUBLIC_INGEST_URL: "${OLT_XAPI_PUBLIC_INGEST_URL}"
      OLT_XAPI_ACTIVITY_PREFIX: "${OLT_XAPI_ACTIVITY_PREFIX}"
      SCHOLARSOME_HEAD_SCRIPTS_BASE64: "${SCHOLARSOME_HEAD_SCRIPTS_BASE64}"
```

`xapi-head-snippet.template.html` is available if the parent stack prefers
mounted static assets instead of inline injection. Substitute the public xAPI
variables, serve `olt-xapi-forwarder.js` at `/olt-xapi-forwarder.js`, and serve
`olt-theme.css` at `/olt-theme.css`.

```sh
envsubst '$OLT_XAPI_PUBLIC_INGEST_URL $OLT_XAPI_ACTIVITY_PREFIX' \
  < docker/scholarsome/xapi-head-snippet.template.html \
  | base64 | tr -d '\n'
```

The template intentionally references only `OLT_XAPI_PUBLIC_INGEST_URL`,
`OLT_XAPI_ACTIVITY_PREFIX`, the mounted forwarder script path, and the mounted
theme stylesheet path.

## Proxy Injection Alternative

If the app image does not serve mounted static assets from the paths above,
inject the same snippet at the Nginx layer with dedicated static locations
and an HTML substitution filter:

```nginx
location = /olt-xapi-forwarder.js {
  alias /etc/nginx/scholarsome/olt-xapi-forwarder.js;
  add_header Cache-Control "no-store";
}

location = /olt-theme.css {
  alias /etc/nginx/scholarsome/olt-theme.css;
  add_header Cache-Control "no-store";
}

sub_filter_once on;
sub_filter '</head>' '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap"><link rel="stylesheet" href="/olt-theme.css"><script>window.OLT_SCHOLARSOME_XAPI={ingestUrl:"$olt_xapi_public_ingest_url",activityPrefix:"$olt_xapi_activity_prefix"};</script><script src="/olt-xapi-forwarder.js" defer></script></head>';
```

Keep these routes behind the existing `scholarsome.localhost` server block so
the instrumented and themed pages remain protected by `oauth2-proxy`.
