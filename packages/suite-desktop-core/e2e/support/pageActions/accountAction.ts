import { Page } from '@playwright/test';

class AccountActions {
    async filterTransactions(window: Page, desiredTransaction: string) {
        const searchInput = window.getByTestId('@wallet/accounts/search-icon');
        await searchInput.click();
        await searchInput.fill(desiredTransaction, { force: true });
    }
}

export const onAccountPage = new AccountActions();
