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
}

export const onWalletPage = new WalletActions();
