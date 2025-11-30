# @trezor/suite

Shared logic and components for browser and desktop versions of Suite.

[Documentation](../../docs/packages/suite/index.md)

## storage

This folder contains implementation of Suite's IndexedDB storage. It builds on the general logic in [@trezor/suite-storage](../suite-storage).

When changes incompatible with the previous version are made in the database structure, it is necessary to apply a migration upon Suite upgrade.
Follow the steps provided in the [migration documentation](../../suite/idb-migration-utils/MIGRATION.md) to create and implement a migration.

## e2e tests

Documentation

- [Suite Playwright E2E](./tests/e2e-playwright-suite.md)
- [Suite E2E in CI](./tests/e2e-ci.md)
- [Playwright contribution guide](./tests/e2e-playwright-contribution-guide.md)
- [GitHub Test Reporter](./tests/e2e-github-reporter.md)
