# Scholarsome Proxy Headers

Requests to `http://scholarsome.localhost` are authenticated by Nginx through
`oauth2-proxy` before they reach the Scholarsome container.

## Headers Forwarded To Scholarsome

Nginx forwards the standard reverse proxy context:

- `Host`: original request host, expected to be `scholarsome.localhost`
- `X-Real-IP`: direct client IP as seen by Nginx
- `X-Forwarded-For`: client/proxy chain
- `X-Forwarded-Proto`: original request scheme, expected to be `http` locally

After a successful `oauth2-proxy` auth check, Nginx also forwards identity
context:

- `X-Forwarded-User`: value from `X-Auth-Request-User`
- `X-Forwarded-Email`: value from `X-Auth-Request-Email`
- `X-Forwarded-Access-Token`: value from `X-Auth-Request-Access-Token`

WebSocket upgrade headers are also preserved:

- `Upgrade`
- `Connection`

## Trust Boundary

Treat these headers as trusted only when requests enter through the parent Nginx
server block for `scholarsome.localhost`. They are not proof of authentication
if a developer bypasses Nginx and sends traffic directly to the container.

## Future App Integration

If Scholarsome is extended to consume proxy identity directly, prefer a small
adapter that maps these headers into the app's existing user/session model. Do
not create local accounts from headers without validating that the request came
through the trusted reverse proxy path.

The local xAPI browser forwarder does not read these headers because they are
only forwarded from Nginx to the upstream container, not exposed to client-side
JavaScript. Use opaque client-visible actors for demo route statements unless a
trusted server-side adapter is added.
