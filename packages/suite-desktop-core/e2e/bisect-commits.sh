#!/usr/bin/env bash
set -euo pipefail

# --- usage ---
if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <last_good_commit> <desktop|web> <test_file>"
  echo "Example: $0 abc123 desktop general/wallet-discovery.test.ts"
  exit 1
fi

LAST_GOOD_COMMIT="$1"
TARGET="$2" # desktop or web
TEST_FILE="$3"


# --- create runner script for git bisect ---
RUNNER="$(mktemp)"
chmod +x "$RUNNER"

cat >"$RUNNER" <<EOF
#!/usr/bin/env bash
set -euo pipefail

wait_for_web_server() {
  echo "⏳ Waiting for web server to be ready..."
  for i in {1..30}; do
    if curl -sSf http://localhost:8000 >/dev/null; then
      return 0
    fi
    sleep 5
  done
  return 1
}

TARGET="$TARGET"
TEST_FILE="$TEST_FILE"

echo "[bisect] Building at commit \$(git rev-parse --short HEAD)"

if [ "\$TARGET" = "desktop" ]; then
  yarn install
  yarn workspace @trezor/suite-desktop build:ui
  yarn workspace @trezor/suite-desktop build:app

  yarn workspace @trezor/suite-desktop-core test:e2e:desktop "\$TEST_FILE"
  RESULT=\$?

elif [ "\$TARGET" = "web" ]; then
  yarn install

  yarn suite:dev & SERVER_PID=\$!

  wait_for_web_server || { kill "\$SERVER_PID" || true; exit 125; }

  yarn workspace @trezor/suite-desktop-core test:e2e:web "\$TEST_FILE"
  RESULT=\$?

  kill "\$SERVER_PID" || true
  wait "\$SERVER_PID" 2>/dev/null || true

else
  echo "Unknown TARGET: \$TARGET" >&2
  exit 125
fi

if [ \$RESULT -eq 0 ]; then
  echo "[bisect] Test passed (good)"
  exit 0
else
  echo "[bisect] Test failed (bad)"
  exit 1
fi
EOF

# --- run the bisect ---
git bisect start HEAD "$LAST_GOOD_COMMIT"
git bisect run "$RUNNER"

git bisect reset
rm "$RUNNER"