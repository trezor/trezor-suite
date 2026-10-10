# Tests

This chapter contains information about tests.

- [Suite Playwright E2E](../symlink/tests/e2e-playwright-suite.md)
- [Suite E2E in CI](../symlink/tests/e2e-ci.md)
- [Playwright contribution guide](../symlink/tests/e2e-playwright-contribution-guide.md)
- [GitHub Test Reporter](../symlink/tests/e2e-github-reporter.md)
- [regtest](./regtest.md)
- [@suite-native/test-utils](./suite-native-test-utils.md)
- [@suite-common/test-utils](./suite-common-test-utils.md)

See also general [code-style-guide/tests](../symlink/code-style-guide/tests.md) for more information about writing tests in Trezor Suite.

## Rust-only CI changes

The [required-checks action](../../.github/actions/required-checks/action.yml) is shared by
[code validation](../../.github/workflows/check-code-validation.yml) and
[PR web/desktop E2E](../../.github/workflows/test-suite-web-desktop-e2e-pr.yml).
Changes limited to `packages/transport-bluetooth/**/*.rs`, `packages/transport-bluetooth/Cargo.toml`
and `packages/transport-bluetooth/Cargo.lock` skip JavaScript validation, dependency installation,
and PR E2E builds and tests. Rust formatting runs independently, without installing JavaScript dependencies.

Any changed file outside that set keeps JavaScript checks enabled, including mixed Rust/JavaScript
changes and updates to the checked-in Bluetooth binaries. Other workflow triggers, including manual
Bluetooth binary builds, are unchanged. Jobs are skipped rather than filtering out the entire workflow,
so required checks can still report a result.
