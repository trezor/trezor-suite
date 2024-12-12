import { Locator, Page, expect } from '@playwright/test';

import { NetworkSymbol } from '@suite-common/wallet-config';

export class WalletActions {
    private readonly page: Page;
    readonly walletMenuButton: Locator;
    readonly searchInput: Locator;
    readonly accountChevron: Locator;
    readonly cardanoAccountLabels: { [key: string]: Locator };
    readonly walletStakingButton: Locator;
    readonly stakeAddress: Locator;

    constructor(page: Page) {
        this.page = page;
        this.walletMenuButton = this.page.getByTestId('@suite/menu/wallet-index');
        this.searchInput = this.page.getByTestId('@wallet/accounts/search-icon');
        this.accountChevron = this.page.getByTestId('@account-menu/arrow');
        this.cardanoAccountLabels = {
            normal: this.page.getByTestId('@account-menu/ada/normal/0/label'),
            legacy: this.page.getByTestId('@account-menu/ada/legacy/0/label'),
            ledger: this.page.getByTestId('@account-menu/ada/ledger/0/label'),
        };
        this.walletStakingButton = this.page.getByTestId('@wallet/menu/staking');
        this.stakeAddress = this.page.getByTestId('@cardano/staking/address');
    }

    async filterTransactions(transaction: string) {
        await this.searchInput.click();
        await this.searchInput.fill(transaction, { force: true });
    }

    async expandAllAccountsInMenu() {
        for (const chevron of await this.accountChevron.all()) {
            await chevron.click();
        }
    }

    async checkStakesOfCardanoAccounts() {
        for (const type in this.cardanoAccountLabels) {
            await this.cardanoAccountLabels[type].click();
            await this.walletStakingButton.click();
            await expect(this.stakeAddress).toBeVisible();
        }
    }

    async getAccountsCount(symbol: NetworkSymbol) {
        return await this.page
            .locator(`[data-testid*="@account-menu/${symbol}"][tabindex]`)
            .count();
    }
}
