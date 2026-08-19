#!/usr/bin/env bash
# repo grep excluding build artifacts / generated code
grep -rn --include='*.ts' --include='*.tsx' \
  --exclude-dir=node_modules --exclude-dir=libDev --exclude-dir=lib \
  --exclude-dir=dist --exclude-dir=build --exclude-dir=coverage \
  --exclude-dir=playwright-report --exclude-dir=test-results --exclude-dir=.next \
  --exclude-dir=e2e --exclude='*.d.ts' \
  "$@"
