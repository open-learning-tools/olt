#!/usr/bin/env sh
set -eu

# OLT branding hook for code-server.
#
# Copies the OLT-branded VS Code workbench settings into the user-data
# directory used by code-server (see config.yaml: user-data-dir: /config/data)
# so that workbench.colorCustomizations apply on every container start.
#
# The source file is mounted read-only at the path below by docker-compose.
# We copy rather than symlink so that the user can still tweak settings
# inside code-server without write-protection errors; a fresh container
# will always reset the OLT defaults.

SRC="${OLT_CODE_SERVER_BRANDED_SETTINGS:-/olt/code-server/user-settings/settings.json}"
DEST_DIR="${OLT_CODE_SERVER_USER_DIR:-/config/data/User}"
DEST="${DEST_DIR}/settings.json"

if [ ! -f "$SRC" ]; then
  echo "OLT branding hook skipped: source settings not found at $SRC"
  exit 0
fi

mkdir -p "$DEST_DIR"

# Always overwrite with the canonical OLT-branded settings. The container is
# stateless from a branding perspective; per-user tweaks should live in the
# workspace settings file (olt.code-workspace) instead.
cp "$SRC" "$DEST"

# Match the linuxserver/code-server abc user/group ownership when possible.
PUID_VALUE="${PUID:-1000}"
PGID_VALUE="${PGID:-1000}"
chown "${PUID_VALUE}:${PGID_VALUE}" "$DEST" 2>/dev/null || true
chmod 0644 "$DEST" 2>/dev/null || true

echo "OLT branding hook installed workbench colorCustomizations at $DEST"

exit 0
