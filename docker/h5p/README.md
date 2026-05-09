# OLT Quizzes Local Host

This folder contains a minimal local-dev host for quiz content. It serves:

- `/` as the local quiz player page
- `/healthz` as a plain health check
- `/api/config` as non-secret browser runtime configuration
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
    OLT_XAPI_PUBLIC_INGEST_URL: "http://lrs.localhost/ingest/xapi/statements"
    OLT_XAPI_ACTIVITY_PREFIX: "https://openlearningtools.example/activities"
  volumes:
    - ./docker/h5p/content:/app/content
  expose:
    - "8080"
  networks:
    - olt_network
```

`OLT_XAPI_PUBLIC_INGEST_URL` is exposed to the browser as the public xAPI
statement ingest URL. Do not use a URL that requires embedded secrets.
`OLT_XAPI_ACTIVITY_PREFIX` is used as the base IRI for H5P activity objects.
