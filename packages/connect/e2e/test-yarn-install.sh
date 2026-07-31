#!/usr/bin/env bash

# validate that installing connect package using yarn works

set -e

trap "cd .. && rm -rf connect-implementation" EXIT

npm --version
node --version
yarn --version

mkdir connect-implementation
cd connect-implementation
npm init -y
npm pkg set type=module
touch yarn.lock

echo "npmMinimalAgeGate: 0" > .yarnrc.yml

# install connect package
yarn add @trezor/connect@"$1"

# prepare a minimal consumer that actually exercises the public type surface,
# not just module existence: it resolves the default export's type and a named
# export, so it fails on a broken/empty .d.ts rather than only a missing module.
# Kept version-agnostic on purpose — this same script runs against both the
# ESM-only v10 (beta) and the older v9 (latest) default-export shapes.
{
    echo 'import TrezorConnect, { DEVICE } from "@trezor/connect";'
    echo 'const _connect: typeof TrezorConnect = TrezorConnect;'
    echo 'void _connect;'
    echo 'void DEVICE;'
} >index.ts

# Compile the way a real 3rd party would:
#   - no `--types` allowlist, so tsc auto-includes whatever @types are actually
#     installed (@types/node here) instead of us hand-feeding connect the ambient
#     types it needs — that masked whether the published package resolves on its own.
#   - `--skipLibCheck`, which every mainstream consumer setup (Next.js, Vite, CRA,
#     tsup, ...) turns on: we validate that a consumer can import AND use connect's
#     public type surface, not that every transitive dependency's shipped .d.ts is
#     internally pristine. (NodeNext .d.ts hygiene of deps belongs in a dedicated
#     `attw`/publint check, not here.)
# @trezor/connect is ESM-only since v10, so use NodeNext.
yarn add typescript@5.8.3 @types/node@22.13.10
yarn tsc ./index.ts --strict --skipLibCheck --esModuleInterop --target ES2024 --module NodeNext --moduleResolution NodeNext
