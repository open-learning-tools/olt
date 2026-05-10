# LibreChat Local Development Assets

This folder contains LibreChat-specific local-dev assets for the OLT stack. Keep files here free of secrets; runtime secrets belong in the root `.env`.

## Files

- `librechat.yaml`: minimal custom config for the OLT AI Chat service. It enables only OpenID as the social login option, sets the OLT-branded `customWelcome`, and keeps the rest of the app close to LibreChat defaults.
- `xapi-forwarder.cjs`: optional local-dev preload that forwards successful LibreChat chat/session activity to the central xAPI ingest endpoint.
- `compose.xapi-forwarder.yml`: optional Compose overlay that mounts and enables the preload without baking secrets or custom code into the LibreChat image.
- `compose.olt-branding.yml`: optional Compose overlay that re-skins the LibreChat sub-service with OLT branding (cream + navy + turquoise) by setting `APP_TITLE`, `CUSTOM_FOOTER`, and `HELP_AND_FAQ_URL`, and by mounting the OLT logo and brand stylesheet into the container.
- `olt-logo.png`: OLT brand logo, available inside the container at `/app/client/public/assets/olt/olt-logo.png` when the branding overlay is active. Sourced from `open-learning-nexus/src/assets/olt-logo.png`.
- `olt-theme.css`: OLT brand stylesheet that remaps LibreChat's CSS variables to the OLT cream/navy/turquoise palette. Mounted at `/app/client/public/assets/olt/olt-theme.css` when the branding overlay is active. See "Branding limitations" below for why it is not yet auto-injected into the served frontend HTML in local-dev.

## Parent Compose Integration

The parent stack already provides the core runtime values:

- Public URL: `http://chat.localhost`
- Internal service port: `3080`
- MongoDB URI: `mongodb://mongodb:27017/${LIBRECHAT_MONGO_DB:-LibreChat}`
- Redis URI: `redis://redis:6379/1`
- OIDC issuer: `${OIDC_ISSUER_URL:-http://olt.localhost}`

The parent `librechat` service activates this YAML config with a bind mount:

```yaml
services:
  librechat:
    volumes:
      - ./docker/librechat/librechat.yaml:/app/librechat.yaml:ro
      - librechat_images:/app/client/public/images
      - librechat_uploads:/app/uploads
      - librechat_logs:/app/api/logs
```

LibreChat reads authentication settings from environment variables, not from `librechat.yaml`. Keep these in the root `.env`:

```dotenv
LIBRECHAT_MONGO_DB=LibreChat
LIBRECHAT_OIDC_CLIENT_ID=librechat-local
LIBRECHAT_OIDC_CLIENT_SECRET=replace-in-local-env
LIBRECHAT_OIDC_SCOPE=openid profile email
LIBRECHAT_JWT_SECRET=replace-in-local-env
LIBRECHAT_JWT_REFRESH_SECRET=replace-in-local-env
LIBRECHAT_CREDS_KEY=replace-in-local-env
LIBRECHAT_CREDS_IV=replace-in-local-env
LIBRECHAT_ALLOW_EMAIL_LOGIN=false
LIBRECHAT_ALLOW_REGISTRATION=false
LIBRECHAT_ENDPOINTS=openAI,agents
LIBRECHAT_PROVIDER_ENV_FILE=./.librechat-provider.env
```

The parent Compose service also loads `LIBRECHAT_PROVIDER_ENV_FILE` as an
optional `env_file` for local model provider keys. Keep `OPENAI_API_KEY` and
similar provider keys in an untracked local file instead of committing them to
this repo.

## xAPI Activity Forwarding

LibreChat does not expose a small config-only hook for local activity callbacks, so local-dev forwarding uses a Node preload mounted by the optional Compose overlay. The preload observes successful LibreChat backend responses and posts compact xAPI-like statements to the configured central ingest endpoint.

Expected environment values from the parent stack:

```dotenv
OLT_XAPI_INTERNAL_INGEST_URL=http://api:8000/xapi/ingest/
OLT_XAPI_PUBLIC_INGEST_URL=http://olt.localhost/xapi/ingest/
OLT_XAPI_ACTIVITY_PREFIX=http://olt.localhost/xapi/activities
```

Use the internal URL when it is available inside Docker. The public URL is only a fallback for local browser-facing configuration and manual tests.
LibreChat activity IDs are namespaced under `${OLT_XAPI_ACTIVITY_PREFIX}/librechat`.

Run LibreChat with forwarding enabled:

```bash
docker compose \
  --env-file .env \
  -f docker-compose.yml \
  -f docker/librechat/compose.xapi-forwarder.yml \
  up --build librechat mongodb redis xapi-ingest ralph nginx
```

Forwarded local-dev events include:

- successful OpenID callback sessions as `logged-in` events
- successful chat/message POSTs as `post` events
- successful conversation creates, updates, and deletes as conversation events

The forwarder sends no secrets. It includes only the request path, method, response status, conversation/message identifiers when available, and non-secret endpoint/model names when LibreChat exposes them on the request body.

Recommended additional LibreChat OpenID env vars for the parent service:

```dotenv
OPENID_CALLBACK_URL=/oauth/openid/callback
OPENID_BUTTON_LABEL=Open Learning Tools
OPENID_AUTO_REDIRECT=false
OPENID_USE_PKCE=true
OPENID_GENERATE_NONCE=true
OPENID_EMAIL_CLAIM=email
OPENID_USERNAME_CLAIM=preferred_username
OPENID_NAME_CLAIM=name
```

The Django OAuth client for AI Chat should use this redirect URI:

```txt
http://chat.localhost/oauth/openid/callback
```

## OLT Branding Overlay

The branding overlay (`compose.olt-branding.yml`) is independent of, and stacks
cleanly with, the xAPI overlay. To run LibreChat with both forwarding and OLT
branding enabled:

```bash
docker compose \
  --env-file .env \
  -f docker-compose.yml \
  -f docker/librechat/compose.xapi-forwarder.yml \
  -f docker/librechat/compose.olt-branding.yml \
  up --build librechat mongodb redis xapi-ingest ralph nginx
```

What the overlay changes today:

- **Browser tab title and topbar text**: `APP_TITLE=OLT AI Chat`.
- **Footer**: `CUSTOM_FOOTER` set to an OLT-branded line with a link back to
  `http://olt.localhost`.
- **Help button**: `HELP_AND_FAQ_URL` points back to the OLT wrapper.
- **Custom welcome**: Set in `librechat.yaml` `interface.customWelcome` and
  visible on the empty-conversation landing screen.
- **Brand assets in the container**: the OLT logo (`olt-logo.png`) and the OLT
  brand stylesheet (`olt-theme.css`) are mounted at
  `/app/client/public/assets/olt/` and available for any config or future
  injection step that wants to reference them by path.

### Branding limitations

Deeper visual theming (cream background, navy primary, turquoise accent,
hairline borders, 14px radii, OLT typography) is implemented in
`olt-theme.css` as CSS-variable overrides on top of LibreChat's own theme
tokens. To take effect in the served UI, that stylesheet has to be loaded by
LibreChat's built `index.html`. The upstream LibreChat docker image
(`ghcr.io/danny-avila/librechat-dev:latest`) ships a prebuilt React/Vite
bundle whose `index.html` does not reference any external user CSS, and it
exposes no runtime-only setting to add one. The two ways to wire it in:

1. **Patch `index.html` at container start.** This requires extending the
   LibreChat service's `command:` in the parent `docker-compose.yml` so that
   it `<link>`-injects `/assets/olt/olt-theme.css` into
   `/app/client/dist/index.html` before `npm run backend` runs. The parent
   compose file is outside this folder's scope, so this overlay cannot
   apply that patch on its own. When/if that change is made, no further
   work is needed in this folder.
2. **Build a custom LibreChat client image.** This is the intended upstream
   path (the `@librechat/client` package exposes `ThemeProvider` with an
   `IThemeRGB` prop and `REACT_APP_THEME_*` build-time env vars), but
   building a custom image is explicitly out of scope for this folder.

Until one of those is in place, the overlay still ships the user-visible
text branding (title, footer, welcome, help URL) and makes the OLT logo and
stylesheet available inside the container for the future injection step.

The overlay does **not** modify the LibreChat startup command, so the
existing `openidStrategy` patch in the parent `docker-compose.yml` keeps
applying. It also does not touch endpoints, auth, model specs, or the xAPI
forwarder.

## MongoDB Notes

LibreChat requires MongoDB. The parent stack's shared `mongodb` service is the expected local backend for AI Chat. If Docker Desktop is running on an Apple Silicon Mac and MongoDB 7 fails because of CPU instruction support, switch the parent MongoDB image to a compatible local image such as `mongo:4.4.18`.

## Verification

After the parent stack mounts this file and the Django OIDC client exists:

```bash
docker compose --env-file .env config
docker compose --env-file .env -f docker-compose.yml -f docker/librechat/compose.xapi-forwarder.yml config librechat
docker compose up --build librechat mongodb redis nginx
docker compose logs librechat
```

Then open `http://chat.localhost` and confirm the Open Learning Tools OpenID button appears or the login page redirects to the Django wrapper, depending on the selected `OPENID_AUTO_REDIRECT` setting.

With the xAPI overlay enabled, also confirm the LibreChat logs contain:

```txt
OLT xAPI forwarding enabled:
```
