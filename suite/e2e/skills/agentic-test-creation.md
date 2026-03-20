# Agentic E2E Test Creation Workflow

> **When to use**: When writing a new Playwright e2e test from a user story, feature description, or bug report.
> **Prerequisites**: Read all other skills in this directory before proceeding — this file only covers the workflow order and what to discover first. The rules for each area live in their dedicated skill.

---

## Step 1 — Find the right test folder

```
onboarding flow?        → tests/onboarding/
wallet / accounts?      → tests/wallet/
settings?               → tests/settings/
trading / buy / sell?   → tests/trading/
passphrase?             → tests/passphrase/
staking?                → tests/staking/
metadata / labels?      → tests/metadata/
general suite flow?     → tests/suite/
browser-only scenario?  → tests/browser/
none of the above?      → tests/<feature-name>/
```

Check for an **existing file** in that folder first — the test may belong there.

---

## Step 2 — Discover before writing

Do not write a single line of test code before completing all three of these:

**Page objects** — Read `support/pageObjects/` and map every user action in the story to an existing page object method or locator. Rules for when to extend vs create are in [page-objects.md](page-objects.md).

**Fixtures and mocks** — Check `support/fixtures.ts` and `support/mocks/` for what already exists. Rules for fixture scope and mock lifecycle are in [fixtures.md](fixtures.md).

**Tags** — Determine device models, platform constraint, and execution scope before writing the test signature. Rules are in [tagging.md](tagging.md).

---

## Step 3 — Test file structure

```typescript
import { expect, test } from '../../support/fixtures';

test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

test.describe('<feature> - <scenario>', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('<what the user can do>', async ({ dashboardPage, walletPage }) => {
        // Arrange → Act → Assert
    });
});
```

- Import `test` and `expect` from `../../support/fixtures`, never from `@playwright/test` directly.
- Test names describe user capability (`'User can send BTC'`), not implementation (`'send BTC test'`).
- One user story per `test()` block.

---

## Pre-submit checklist

- [ ] Existing page objects and fixtures were checked before creating new ones
- [ ] Test is in the correct folder under `tests/`
- [ ] Imports from `../../support/fixtures`, not `@playwright/test`
- [ ] Tags cover device models, platform, and execution scope → [tagging.md](tagging.md)
- [ ] Assertions use web-first assertions and translation keys → [assertions.md](assertions.md)
- [ ] No hardcoded `waitForTimeout` calls → [retries.md](retries.md)
- [ ] Locators are in page objects, not scattered in tests → [locators.md](locators.md)
- [ ] New page objects registered in `fixtures.ts` → [page-objects.md](page-objects.md)
- [ ] New mocks have `start()`/`stop()` lifecycle and fixture registration → [fixtures.md](fixtures.md)
