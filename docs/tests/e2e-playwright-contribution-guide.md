# General Playwright contribution guide

## Page Actions

We use `page actions` pattern to encapsulate all UI elements and operations.
Furthermore, every method in the page object class should have `step` decorator. This decorator wraps the method into playwright `test.step()`. This vastly improves readability of test report.

Example:

```typescript
import { step } from '../common';

export class WalletActions {
    readonly searchInput: Locator;
    readonly accountChevron: Locator;

    constructor(private readonly page: Page) {
        this.searchInput = this.window.getByTestId('@wallet/accounts/search-icon');
        this.accountChevron = this.window.getByTestId('@account-menu/arrow');
    }

    @step()
    async filterTransactions(transaction: string) {
        await this.searchInput.click();
        await this.searchInput.fill(transaction, { force: true });
    }

    @step()
    async expandAllAccountsInMenu() {
        for (const chevron of await this.accountChevron.all()) {
            await chevron.click();
        }
    }
```

❌ Never pass `Page` instance as a method argument.

✅ Always create a construtor to pass the `Page` instance to the page action.

✅ Always add an descriptor `@step()` before every `Page` object method.

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

## Locators

We want our locators to be defined as page object properties to further improve provide reusability, centralized maintenance, and improved readability.

Example:

```typescript
export class SuiteGuide {
    private readonly window: Page;
    readonly guideButton: Locator;
    readonly guidePanel: Locator;
    readonly bugLocationDropdown: Locator;
    readonly bugLocationDropdownInput: Locator;
    readonly bugLocationDropdownOption = (location: FeedbackCategory) =>
        this.window.getByTestId(`@guide/feedback/suggestion-dropdown/select/option/${location}`);

    constructor(window: Page) {
        this.window = window;
        this.guideButton = this.window.getByTestId('@guide/button-open');
        this.guidePanel = this.window.getByTestId('@guide/panel');
        this.bugLocationDropdown = this.window.getByTestId('@guide/feedback/suggestion-dropdown');
        this.bugLocationDropdownInput = this.window.getByTestId(
            '@guide/feedback/suggestion-dropdown/select/input',
        );
    }

    @step()
    async openPanel() {
        await this.guideButton.click();
        await expect(this.guidePanel).toBeVisible();
    }

    @step()
    async selectBugLocation(location: FeedbackCategory) {
        await this.bugLocationDropdown.click();
        await this.bugLocationDropdownOption(location).click();
        await expect(this.bugLocationDropdownInput).toHaveText(capitalizeFirstLetter(location));
    }
```

Locators should mainly rely on testIds `this.window.getByTestId('@guide/panel')` that we add to our product as html attributes `data-testid="@guide/panel"`.
Alternatively you can use user facing locators `page.getByRole('button', { name: 'Submit' }).`but testIds are our strong preference.

Adhere to consistent and clear naming. End the locator name with info of what kind of element it is `dashboardMenuButton, discoveryHeader, discoveryBar, bugLocationDropdown`.

There is vast documentation on how to work with Locators on [PlayWraith webpages](https://playwright.dev/docs/locators)

❌ Never use XPath or CSS locator. They are fragile and break often.

```typescript
await page
    .locator('#tsf > div:nth-child(2) > div.A8SBwf > div.RNNXgb > div > div.a4bIc > input')
    .click();

await page.locator('//*[@id="tsf"]/div[2]/div[1]/div[1]/div/div[2]/input').click();
```
