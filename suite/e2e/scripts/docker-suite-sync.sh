#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="../../docker/docker-compose.suite-ci-e2e.yml"
IMAGE="ghcr.io/trezor/suite-sync:main"
SERVICES=(quota-db suite-sync)

LOCAL_ID=$(docker images -q "$IMAGE" 2>/dev/null || echo "")

docker pull "$IMAGE"

NEW_ID=$(docker images -q "$IMAGE")
echo "📦 Local image ID:  ${LOCAL_ID:-none}"
echo "📦 Remote image ID: $NEW_ID"

if [ "$LOCAL_ID" != "$NEW_ID" ]; then
    echo "⬇️  Newer image detected. Removing existing containers..."
    docker compose -f "$COMPOSE_FILE" rm -f -s "${SERVICES[@]}"
fi

docker compose -f "$COMPOSE_FILE" up "${SERVICES[@]}"
