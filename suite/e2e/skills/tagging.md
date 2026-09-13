# Test Tagging and Playwright Project Selection

> **When to use**: When writing new E2E tests or editing old ones to ensure they run on the intended configurations (device models, platforms, execution contexts). Tags are how tests select which projects execute them.
> **Prerequisites**: [Suite base fixture](../support/testExtends/suiteBaseFixture.ts) for device setup and basic E2E test structure knowledge.

## Tag Categories

### Device Model Tags (Mandatory for device tests)

- `@T3W1`, `@T3T1`, `@T3B1`, `@T2T1`, `@T1B1` — specific hardware
- `@noDevice` — tests requiring no device (API/settings only)

**Default targeting strategy**: Use `['@T3W1', '@T3T1']` by default unless:

- Feature doesn't work on one model (exclude that model)
- Feature is model-specific (target only that model)

### Platform Tags (Mutually exclusive)

- `@webOnly` — browser environment only; excluded from desktop projects. **Required for tests using `page.route()`** (routing is experimental in Electron and doesn't work reliably on desktop).
- `@desktopOnly` — Electron app only; excluded from web projects. **Required for tests** that interact with native OS features (e.g., file dialogs, notifications).
- (omit both) → runs on all platforms

### Execution Context Tags

- `@nightlyOnly` — never runs on a PR, not even when the LLM test selector or an edited test file targets it. **Required for tests that break or mislead outside nightly**: nonce collisions when two runs overlap, old app versions that only the nightly setup provides. Runs in nightly, canary, and release.
- `@optional` — excluded from the full PR run; runs nightly, and on a PR only when the LLM test selector picks it or the PR edits its file. **Use for tests that are low priority and slow or cost real funds.** When the reason is not obvious from the test itself, state it in a one-line comment above the `describe`. Combine with a single platform (`@webOnly` or `@desktopOnly`) to conserve resources.
- `@specificFirmware` — **required when using `test.use({ firmwareVersion: '2.10' })`**. Excluded from canary FW projects to prevent mismatched firmware runs.
- `@group=manual` — excluded from all automated runs, reserved for manual test definitions
