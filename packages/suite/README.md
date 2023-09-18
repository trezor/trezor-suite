# @trezor/suite

Shared logic and components for browser and desktop versions of Suite.

[Documentation](../../docs/packages/suite/index.md)

## storage

This folder contains implementation of Suite's IndexedDB storage. It builds on the general logic in [@trezor/suite-storage](../suite-storage).

When changes incompatible with the previus version are made in the database structure, it is necessary to apply a migration upon Suite upgrade. Update the [migrations](src/storage/migrations/index.ts) file and remember to bump the `VERSION` in [index.ts](src/storage/index.ts) and to update the [changelog](src/storage/CHANGELOG.md). Migrations apply automatically when Suite loads.

## e2e tests

[Documentation](../../docs/tests/e2e-suite-web.md)
