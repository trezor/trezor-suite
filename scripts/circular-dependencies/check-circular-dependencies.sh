#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  rm -f ".madgerc"
}

trap cleanup EXIT

cat > ".madgerc" <<'JSON'
{
  "detectiveOptions": {
    "ts": {
      "skipTypeImports": true
    },
    "tsx": {
      "skipTypeImports": true
    }
  }
}
JSON

npx madge --circular --extensions ts,tsx --exclude "node_modules|lib|libDev" packages suite suite-native suite-common
