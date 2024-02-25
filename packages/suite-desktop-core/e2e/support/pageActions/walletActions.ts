import { Page } from '@playwright/test';

import { onDashboardPage } from './dashboardActions';

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
            await window.click(`[data-test="@settings/wallet/network/ada/${type}/0"]`);
        }
        await onDashboardPage.assertHasVisibleBalanceOnFirstAccount(window, 'ada');
        await window.click('[data-test="@wallet/menu/wallet-staking"]');
        await window.getByText('Your stake address');
    }
}

export const onWalletPage = new WalletActions();
