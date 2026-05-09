#!/usr/bin/env sh
set -eu

# LinuxServer custom-cont-init.d hook for local-dev code-server activity.
# This intentionally emits a coarse service startup event only; browser user
# identity remains owned by oauth2-proxy and is not available inside code-server.

INGEST_URL="${OLT_XAPI_INTERNAL_INGEST_URL:-}"
ACTIVITY_PREFIX="${OLT_XAPI_ACTIVITY_PREFIX:-}"
PUBLIC_URL="${OLT_XAPI_PUBLIC_INGEST_URL:-}"
SERVICE_NAME="${OLT_XAPI_SERVICE_NAME:-OLT code-server local development}"
SERVICE_HOME="${OLT_CODE_SERVER_PUBLIC_URL:-http://code.localhost}"
SERVICE_ID="${OLT_XAPI_SERVICE_ID:-code-server}"

if [ -z "$INGEST_URL" ]; then
  echo "OLT xAPI startup hook skipped: OLT_XAPI_INTERNAL_INGEST_URL is not set"
  exit 0
fi

if [ -z "$ACTIVITY_PREFIX" ]; then
  ACTIVITY_PREFIX="https://openlearningtools.local/activities"
fi

json_escape() {
  printf '%s' "$1" | sed \
    -e 's/\\/\\\\/g' \
    -e 's/"/\\"/g' \
    -e 's/	/\\t/g'
}

ACTIVITY_PREFIX="$(printf '%s' "$ACTIVITY_PREFIX" | sed 's:/*$::')"
TIMESTAMP="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
HOSTNAME_VALUE="${HOSTNAME:-code-server}"
ACTIVITY_ID="${ACTIVITY_PREFIX}/code-server/${SERVICE_ID}/startup"
SESSION_ID="$(printf '%s-%s' "$HOSTNAME_VALUE" "$TIMESTAMP" | sed 's/[^A-Za-z0-9_.:-]/-/g')"

PAYLOAD="$(cat <<EOF
{
  "actor": {
    "objectType": "Agent",
    "account": {
      "homePage": "$(json_escape "$SERVICE_HOME")",
      "name": "$(json_escape "$SERVICE_ID")"
    }
  },
  "verb": {
    "id": "http://adlnet.gov/expapi/verbs/initialized",
    "display": {
      "en-US": "initialized"
    }
  },
  "object": {
    "id": "$(json_escape "$ACTIVITY_ID")",
    "definition": {
      "name": {
        "en-US": "$(json_escape "$SERVICE_NAME")"
      },
      "description": {
        "en-US": "Local development code-server container started behind oauth2-proxy."
      },
      "type": "https://w3id.org/xapi/acrossx/activities/webpage"
    }
  },
  "context": {
    "platform": "code-server",
    "extensions": {
      "https://openlearningtools.local/xapi/extensions/service": "$(json_escape "$SERVICE_ID")",
      "https://openlearningtools.local/xapi/extensions/public-ingest-url-configured": $(if [ -n "$PUBLIC_URL" ]; then printf 'true'; else printf 'false'; fi),
      "https://openlearningtools.local/xapi/extensions/container-hostname": "$(json_escape "$HOSTNAME_VALUE")",
      "https://openlearningtools.local/xapi/extensions/local-session": "$(json_escape "$SESSION_ID")"
    }
  },
  "timestamp": "$(json_escape "$TIMESTAMP")"
}
EOF
)"

if command -v curl >/dev/null 2>&1; then
  if printf '%s' "$PAYLOAD" | curl --fail --silent --show-error \
    --max-time "${OLT_XAPI_INGEST_TIMEOUT_SECONDS:-3}" \
    --request POST \
    --header "Content-Type: application/json" \
    --data-binary @- \
    "$INGEST_URL" >/dev/null; then
    echo "OLT xAPI startup hook emitted code-server initialized statement"
  else
    echo "OLT xAPI startup hook warning: failed to emit startup statement"
  fi
else
  echo "OLT xAPI startup hook skipped: curl is not available"
fi

exit 0
