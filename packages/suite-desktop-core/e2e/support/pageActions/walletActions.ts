import { Page } from '@playwright/test';

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
    async enableAllCardanoAccounts() {
        const cardanoTypes = ['normal', 'legacy', 'ledger'];
        for (const type of cardanoTypes) {
            await this.window.getByTestId(`@account-menu/ada/${type}/0/label`).click();
            await this.window.getByTestId('@wallet/menu/wallet-staking').click();
            await this.window.getByText('Your stake address').waitFor({ state: 'visible' });
        }
    }
    // asserts
    async getAccountsCount(network: string) {
        return await this.window
            .locator(`[data-testid*="@account-menu/${network}"][tabindex]`)
            .count();
    }
}
