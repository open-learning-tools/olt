# Open Learning Tools

Local development stack for OLT: a boilersync Django/React wrapper app plus self-hosted learning tools behind one local Nginx router.

## Hosts

Add these names to `/etc/hosts`:

```txt
127.0.0.1 olt.localhost auth.localhost cryptpad.localhost cryptpad-sandbox.localhost peertube.localhost scholarsome.localhost h5p.localhost code.localhost chat.localhost lrs.localhost
```

Most browsers already resolve `*.localhost`, but the hosts entry keeps CLI tools and older resolvers predictable.

## Start

Create local secrets from the example and start the stack:

```bash
cp .env.example .env
docker compose up -d --build
```

The Django API is built from this Multi workspace using `api-core` plus the generated `api/` package. Project Django settings live in `api/open_learning_tools_api/settings.py`; `api-core` is left as the shared runtime.

## Local URLs

- Wrapper: `http://olt.localhost`
- Admin / identity provider: `http://auth.localhost/admin/`
- Docs: `http://cryptpad.localhost`
- Videos: `http://peertube.localhost`
- Flashcards: `http://scholarsome.localhost`
- Quizzes: `http://h5p.localhost`
- Code: `http://code.localhost`
- AI Chat: `http://chat.localhost`
- LRS: `http://lrs.localhost`

## SSO

The Django backend enables `django-oauth-toolkit` OIDC at:

```txt
http://olt.localhost/.well-known/openid-configuration
http://olt.localhost/o/.well-known/jwks.json
```

On backend startup, local OAuth clients are bootstrapped for Videos, AI Chat, Docs proxy auth, Flashcards proxy auth, and Code proxy auth using values from `.env`. The Videos container also has a bootstrap helper that installs/configures its OpenID Connect plugin from those same values.

## Post-Start Configuration

Some services still need their own app-level setup after the containers are reachable:

- Videos: OIDC is bootstrapped automatically; complete the first-run profile/admin prompts when they appear.
- AI Chat: OIDC is configured through `.env`; model/provider keys are loaded from an untracked local provider env file, and `LIBRECHAT_ENDPOINTS` defaults to `openAI,agents`.
- Docs: protected by `oauth2-proxy` on `cryptpad.localhost` and configured with the local OIDC SSO plugin; `cryptpad-sandbox.localhost` remains reachable as the required sandbox origin.
- Flashcards and Code: protected by `oauth2-proxy`; deeper in-app user mapping can be added later.
- Quizzes: add real H5P content packages to the lightweight host.
- LRS: local-dev xAPI forwarding is wired through the ingest bridge described below.

## xAPI Endpoint

Ralph remains available directly with Basic Auth from `.env`:

```txt
http://lrs.localhost/xAPI/statements
```

Services should normally send statements through the local ingest bridge instead
of using Ralph credentials directly:

```txt
Browser/client code: http://lrs.localhost/ingest/xapi/statements
Container/server code: http://xapi-ingest:8090/xapi/statements
```

The bridge forwards to Ralph server-side, so sub-service browser code never
needs the LRS password. Compose passes these URLs to services as
`OLT_XAPI_PUBLIC_INGEST_URL`, `OLT_XAPI_INTERNAL_INGEST_URL`, and
`OLT_XAPI_ACTIVITY_PREFIX`.

Current local-dev coverage:

- Videos: PeerTube plugin emits server video upload/view events and browser
  playback events.
- Docs: CryptPad customization emits best-effort page/app visit events.
- Quizzes: H5P host forwards H5P xAPI statements from the H5P dispatcher.
- Flashcards: Nginx injects a browser route-visit forwarder for Scholarsome.
- Code: code-server emits a container startup activity through its init hook.
- AI Chat: LibreChat preload emits session/chat/conversation activity.

For local verification:

```bash
curl -u "$RALPH_LRS_USERNAME:$RALPH_LRS_PASSWORD" \
  http://lrs.localhost/xAPI/statements
```
