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

## Parent Integration Notes

The parent stack already carries the required runtime variables. Keep these notes in sync when changing Flashcards behavior:

- Root `.env` should keep generated local secrets; `.env.example` should stay non-sensitive.
- The persistent app data volume should stay mounted at `STORAGE_LOCAL_DIR`.

Do not let the app trust forwarded identity headers from direct container
traffic. They should only be treated as authenticated user context when the
request has passed through the Nginx `auth_request` path for
`scholarsome.localhost`.
