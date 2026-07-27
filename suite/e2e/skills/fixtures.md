# Fixtures in Trezor Suite E2E Tests

> **When to use**: Whenever tests need shared setup, teardown, reusable resources, or configurable context. Fixtures are Playwright's killer feature — prefer them over hooks in every situation where both could work.
> **Prerequisites**: [./locators.md](locators.md) for locator strategies and Understanding of Playwright test framework basics.

## Decision Guide for New Fixtures

```
I need a new fixture in suite/e2e.

├── Is it a domain-specific page wrapper (Dashboard, Settings, Trading)?
│   └── YES → Add to TestFixtures in fixtures.ts
│       └── Depends on: page, device, other page objects
│       └── Scope: test (default)
│
├── Is it an expensive resource safe to share across all tests?
│   └── YES → Add to WorkerFixtures
│       └── Scope: worker
│       └── Cannot depend on page/context
│
├── Is it core environment setup (emulator, device, page)?
│   └── YES → Modify suiteBaseFixture.ts
│       └── Option fixtures for configuration
│       └── Auto fixtures for auto-run behavior
│
└── Is it adding methods to page object?
    └── YES → Modify enhancePage.ts
        └── Use module augmentation (declare module '@playwright/test')
        └── Applied automatically to all pages
        └── Note: Any additions should be considered carefully for not polluting the global Page interface
```

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Fixture Without Teardown for Resources

```typescript
// BAD: Creates mock, never stops it
tradingMock: async ({ page }, use) => {
    const mock = new TradingMock(page);
    await use(mock);
    // Missing: await mock.stop();
},
```

### ❌ Anti-Pattern 2: Not Declaring Fixture in Test Signature

```typescript
// BAD: Fixture created but test doesn't use it
test('example', async ({ page }) => {
    // dashboardPage is never requested, fixture doesn't run
    const dash = new DashboardPage(page, ...);  // Manual creation is wrong
});

Exception: Test needs to initialize page object manually for some reason (second tab, manual start).
```

### ❌ Anti-Pattern 3: Worker Fixture Depending on Page

```typescript
// BAD: Worker fixture cannot access page
wcSignClient: [
    async ({ page }, use) => {  // ❌ page is test-scoped
        const client = new WalletConnectSignClient();
        await client.init();
        await use(client);
    },
    { scope: 'worker' },
],
```
