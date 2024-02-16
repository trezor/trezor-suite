import { Page } from '@playwright/test';

class WalletActions {
    async filterTransactions(window: Page, desiredTransaction: string) {
        const searchInput = window.getByTestId('@wallet/accounts/search-icon');
        await searchInput.click();
        await searchInput.fill(desiredTransaction, { force: true });
    }

    async clickAllAccountArrows(window: Page) {
        const accountArrows = await window.getByTestId('@account-menu/arrow').all();
        for (const arrow of accountArrows) {
            await arrow.click();
        }
    }
    async enableAllCardanoAccounts(window: Page) {
        const cardanoTypes = ['normal', 'legacy', 'ledger'];
        for (const type of cardanoTypes) {
            await window.getByTestId(`@account-menu/ada/${type}/0/label`).click();
            await window.getByTestId('@wallet/menu/wallet-staking').click();
            await window.getByText('Your stake address').waitFor({ state: 'visible' });
        }
    }
    // asserts
    async getAccountsCount(window: Page, network: string) {
        return await window.locator(`[data-test*="@account-menu/${network}"][tabindex]`).count();
    }
}

export const onWalletPage = new WalletActions();
