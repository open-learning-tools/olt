# OLT xAPI ingest bridge

This local-dev bridge gives every tool a single ingestion target while keeping
Ralph Basic Auth credentials out of browser code.

Use these service-facing endpoints:

- Browser/client code: `OLT_XAPI_PUBLIC_INGEST_URL`
- Container/server code: `OLT_XAPI_INTERNAL_INGEST_URL`

The bridge forwards valid JSON statement objects, or arrays of statement
objects, to Ralph at `RALPH_XAPI_STATEMENTS_URL`.
