#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Clone all repos
pushd "$ROOT_DIR"
multi sync
uv sync --all-packages --all-extras
popd

# Set up the Django API runtime.
pushd ${ROOT_DIR}/api-core
./scripts/setup
popd


pnpm install
pnpm --filter openbase-auth-client build
pnpm auth:generate
pnpm --filter open-learning-tools-api-client build
pnpm --filter openbase-ui build


echo "Setup complete! Please restart your IDE, then you can run your project with the VS Code run button."
