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

## Skipping JavaScript checks in CI

The [changed-scopes action](../../.github/actions/changed-scopes/action.yml) is shared by
[code validation](../../.github/workflows/check-code-validation.yml) and
[PR web/desktop E2E](../../.github/workflows/test-suite-web-desktop-e2e-pr.yml).
It sorts changed files into three scopes:

- `rust`: Bluetooth server sources in `packages/transport-bluetooth`.
  Runs **Rust checks**: `cargo fmt`, `cargo clippy` and `cargo test`.
  The crate has no tests yet, so `cargo test` only verifies that the test build compiles and links.
- `docs`: Markdown files, `docs/**` and `.github/ISSUE_TEMPLATE/**`.
  Runs **Docs checks**: Prettier (`format:verify`) and the Markdown link check.
- `javascript`: everything else, except local development files
  that no CI job uses. Runs the JavaScript validation and the PR E2E builds and tests.

Mixed changes run every matching scope.
