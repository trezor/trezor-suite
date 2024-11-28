import { Locator, Page, expect } from '@playwright/test';

import { NetworkSymbol } from '@suite-common/wallet-config';

export class WalletActions {
    private readonly window: Page;
    readonly walletMenuButton: Locator;
    readonly searchInput: Locator;
    readonly accountChevron: Locator;
    readonly cardanoAccountLabels: { [key: string]: Locator };
    readonly walletStakingButton: Locator;
    readonly stakeAddress: Locator;

    constructor(window: Page) {
        this.window = window;
        this.walletMenuButton = this.window.getByTestId('@suite/menu/wallet-index');
        this.searchInput = this.window.getByTestId('@wallet/accounts/search-icon');
        this.accountChevron = this.window.getByTestId('@account-menu/arrow');
        this.cardanoAccountLabels = {
            normal: this.window.getByTestId('@account-menu/ada/normal/0/label'),
            legacy: this.window.getByTestId('@account-menu/ada/legacy/0/label'),
            ledger: this.window.getByTestId('@account-menu/ada/ledger/0/label'),
        };
        this.walletStakingButton = this.window.getByTestId('@wallet/menu/staking');
        this.stakeAddress = this.window.getByTestId('@cardano/staking/address');
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

    async getAccountsCount(network: NetworkSymbol) {
        return await this.window
            .locator(`[data-testid*="@account-menu/${network}"][tabindex]`)
            .count();
    }
}
