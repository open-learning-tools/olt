# code-server local development

These files define the intended local-dev behavior for the OLT Code workspace when it is served at `http://code.localhost` behind `oauth2-proxy`.

## Auth mode

The parent stack should treat `oauth2-proxy-code` as the browser-facing authentication layer. code-server itself should run with `auth: none` inside the Docker network so users do not see a second password prompt after completing OLT SSO.

Use `config.yaml` as the mounted code-server config:

```yaml
volumes:
  - ./docker/code-server/config.yaml:/config/.config/code-server/config.yaml:ro
```

When this file is mounted, the parent service should not rely on `PASSWORD` or `SUDO_PASSWORD` for browser authentication. If sudo access is needed inside the container for local experiments, pass a local-only sudo value through `.env`; do not commit it.

## Workspace

`workspace/olt.code-workspace` opens the repository mount used by the current Compose service:

```yaml
volumes:
  - ./:/workspace/olt
  - ./docker/code-server/workspace/olt.code-workspace:/config/workspace/olt.code-workspace:ro
```

The workspace file intentionally points at `/workspace/olt`, not a host path, so it works consistently inside the container.

## Proxy expectations

Nginx should continue to forward websocket upgrade headers to `code-server:8443`; code-server depends on websockets for the editor UI and terminal.

The proxy-auth layer may forward identity headers such as:

- `X-Forwarded-User`
- `X-Forwarded-Email`
- `X-Forwarded-Access-Token`

code-server does not consume those headers by default. They are available for future extensions, audit wrappers, or workspace startup scripts.

## xAPI local-dev activity

Mount `hooks/30-olt-xapi-startup.sh` into the LinuxServer image's custom init
hook directory to emit a coarse startup activity to the central Ralph ingest
endpoint:

```yaml
environment:
  OLT_XAPI_INTERNAL_INGEST_URL: "http://lrs.localhost/ingest/xapi/statements"
  OLT_XAPI_PUBLIC_INGEST_URL: "http://lrs.localhost/ingest/xapi/statements"
  OLT_XAPI_ACTIVITY_PREFIX: "https://openlearningtools.example/activities"
volumes:
  - ./docker/code-server/hooks/30-olt-xapi-startup.sh:/custom-cont-init.d/30-olt-xapi-startup.sh:ro
```

The hook posts a single `initialized` xAPI statement when the container starts.
It uses `OLT_XAPI_INTERNAL_INGEST_URL` for server-side delivery and never embeds
LRS credentials or oauth2-proxy user data. Because code-server is protected by
oauth2-proxy, this is a practical local-dev service activity signal rather than
a per-user editor-open event.

Optional service identifiers:

- `OLT_XAPI_SERVICE_ID`, default `code-server`
- `OLT_XAPI_SERVICE_NAME`, default `OLT code-server local development`
- `OLT_CODE_SERVER_PUBLIC_URL`, default `http://code.localhost`
- `OLT_XAPI_INGEST_TIMEOUT_SECONDS`, default `3`

## Parent integration notes

The parent stack mounts these assets in `docker-compose.yml`. Keep
`code.localhost` protected by `oauth2-proxy-code` before exposing `auth: none`.
