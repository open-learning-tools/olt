# Open Learning Tools

This workspace contains a generated Django API package, the shared API core runtime, reusable auth/UI packages, a React web app, and deployment tooling.

## Local Setup

Run:

```bash
./scripts/setup.sh
```

The setup script syncs the Multi workspace, prepares the Django runtime, and installs frontend packages when `with_frontend` is enabled.
It also scaffolds the full auth screen set from `auth-client` into `web/src/auth/` on first setup, skipping files that already exist.

Common entry points:

- `api`: generated Django app package for project-specific backend code
- `api-core`: shared Django runtime and settings skeleton
- `api-client`: local ignored Orval TypeScript client package; run `pnpm --filter open-learning-tools-api-client generate-client` after API schema changes
- `auth-client`: reusable django-allauth React client
- `ui`: shared React UI package
- `web`: React frontend
- `deploy`: deployment CLI and Terraform stack

To refresh the local auth scaffold later:

```bash
pnpm auth:overwrite
```

The web package proxies `/api` and `/_allauth` to `VITE_API_BASE_URL`, defaulting to `http://127.0.0.1:8000`, during Vite development. Its dev and build scripts first build the local generated `api-client` package so package exports resolve even when running web commands directly.

## Deployment

Use the `deploy` repo and the `openbase-deploy` CLI for AWS/Terraform/ECS deployment.

Deployment metadata is stored outside the repo:

```text
~/.openbase/deployments/<stack-name>/<environment>/deployment.toml
```

Initialize metadata for a new stack:

```bash
openbase-deploy init-stack open-learning-tools prod \
  --web-hostname app.example.com \
  --cdn-hostname assets.example.com \
  --cloudflare-zone-name example.com \
  --web-command "/app/.venv/bin/gunicorn config.asgi:application --log-file - -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000" \
  --worker-command "/app/.venv/bin/taskiq worker --log-level=INFO --max-threadpool-threads=2 config.taskiq_config:broker config.taskiq_tasks" \
  --deploy-command "/app/.venv/bin/python manage.py migrate" \
  --app-requirement git+https://github.com/gabemontague/open-learning-tools-api
```

Then deploy:

```bash
openbase-deploy build open-learning-tools prod --app-dir web
OPENBASE_DEPLOY_DB_PASSWORD='...' openbase-deploy apply open-learning-tools prod --auto-approve
CLOUDFLARE_API_TOKEN='...' openbase-deploy cloudflare-setup open-learning-tools prod
openbase-deploy deploy open-learning-tools prod
```

The deployment stack is always web + worker. The deploy one-off command is metadata, so Django migrations are a project choice rather than behavior hard-coded into `openbase-deploy`.
