# General Playwright contribution guide

## Page Actions

We use `page actions` pattern to encapsulate all UI elements and operations.
Example:

```typescript
export class WalletActions {
    private readonly window: Page;
    constructor(window: Page) {
        this.window = window;
    }

    async filterTransactions(desiredTransaction: string) {
        const searchInput = this.window.getByTestId('@wallet/accounts/search-icon');
        await searchInput.click();
        await searchInput.fill(desiredTransaction, { force: true });
    }

    async clickAllAccountArrows() {
        const accountArrows = await this.window.getByTestId('@account-menu/arrow').all();
        for (const arrow of accountArrows) {
            await arrow.click();
        }
    }
}
```

❌ Never pass `Page` instance as a method argument.
✅ Always create a construtor to pass the `Page` instance to the page action.

## Fixtures

To further improve test readability we want to use fixtures to inject our `page actions` into the tests.

Example:

```typescript
import { test as base } from '@playwright/test';
import { WalletActions } from './pageActions/walletActions';

const test = base.extend<{
    walletPage: WalletActions;
}>({
    walletPage: async ({ page }, use) => {
        const walletPage = new WalletActions(page);
        await use(walletPage);
    },
});

export { test };
```

✅ Correct way to use `page action` in the test:

```typescript
test('Wallet test', async ({ walletPage }) => {
    await walletPage.clickAllAccountArrows();
    ...
});
```

❌ Wrong way to use `page action` in the test:

```typescript
test('Wallet test', async ({ page }) => {
    const walletPage = new WalletActions(page);
    await walletPage.clickAllAccountArrows();
    ...
});
```
