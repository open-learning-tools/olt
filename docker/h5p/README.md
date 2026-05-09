# OLT Quizzes Local Host

This folder contains a minimal local-dev host for quiz content. It serves:

- `/` as the local quiz player page
- `/healthz` as a plain health check
- `/api/content` as a JSON list of extracted content packages
- `/assets/h5p/*` from the pinned `h5p-standalone` npm package
- `/content/*` from `./content`

## Add Local Content

Put extracted content packages in `content/<name>`. Each package must include:

- `h5p.json`
- `content/content.json`

The page will list valid content folders automatically. Invalid folders are ignored.

## Docker Compose Integration

The parent Compose service should build this folder instead of creating a project at runtime:

```yaml
h5p:
  build:
    context: ./docker/h5p
  environment:
    NODE_ENV: "production"
    PORT: "8080"
  volumes:
    - ./docker/h5p/content:/app/content
  expose:
    - "8080"
  networks:
    - olt_network
```

