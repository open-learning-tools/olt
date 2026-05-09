# Scholarsome Local Development

This folder contains OLT-specific local development notes for the Flashcards service.
The parent Compose file does not mount these docs; it uses the runtime values directly.

## Current Parent Integration

The parent stack currently runs the app behind:

- Public URL: `http://scholarsome.localhost`
- Internal service URL: `http://scholarsome:3000`
- Reverse proxy auth: `oauth2-proxy` with Django/OIDC as the upstream identity provider
- Database URL currently passed by the parent stack: `mysql://scholarsome:...@scholarsome-db:3306/scholarsome`
- Database service: `scholarsome-db` using MariaDB, matching the upstream Docker example.

## Files

- `env.local.example`: non-secret local development env template for the
  Scholarsome container.
- `proxy-headers.md`: identity and proxy headers the service receives after
  `oauth2-proxy` and Nginx authorize a request.
- `olt-xapi-forwarder.js`: browser-side local-dev xAPI route visit forwarder.
- `build-xapi-head-script.mjs`: helper that renders a base64 head-script payload
  from the public xAPI env vars and the forwarder.
- `xapi-head-snippet.template.html`: non-secret head-script snippet template for
  configuring the browser forwarder.
- `xapi-injection.md`: mount and proxy-injection notes for wiring the forwarder
  into the parent stack.

## Parent Integration Notes

The parent stack already carries the required runtime variables. Keep these notes in sync when changing Flashcards behavior:

- Root `.env` should keep generated local secrets; `.env.example` should stay non-sensitive.
- The persistent app data volume should stay mounted at `STORAGE_LOCAL_DIR`.
- xAPI forwarding should use `OLT_XAPI_PUBLIC_INGEST_URL` in browser-visible
  code and reserve `OLT_XAPI_INTERNAL_INGEST_URL` for future server-side
  adapters.
- `OLT_XAPI_ACTIVITY_PREFIX` should be used as the stable base IRI for
  Scholarsome activity objects.

Do not let the app trust forwarded identity headers from direct container
traffic. They should only be treated as authenticated user context when the
request has passed through the Nginx `auth_request` path for
`scholarsome.localhost`.
