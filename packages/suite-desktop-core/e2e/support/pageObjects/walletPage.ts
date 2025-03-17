import { Locator, Page, expect } from '@playwright/test';

import { NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../common';

export type ExportType = 'pdf' | 'csv' | 'json';

type WalletParams = {
    symbol?: NetworkSymbol;
    type?: 'normal' | 'legacy' | 'segwit' | 'ledger';
    atIndex?: number;
    tokens?: boolean;
};

export class WalletPage {
    readonly transactionSearch: Locator;
    readonly accountSearch: Locator;
    readonly accountChevron: Locator;
    readonly walletStakingButton: Locator;
    readonly stakeAddress: Locator;
    readonly walletExtraDropDown: Locator;
    readonly openTradingGlobalButton: Locator;
    readonly openSwapGlobalButton: Locator;
    readonly tradingDropdownBuyButton: Locator;
    readonly balanceOfAccount = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@wallet/coin-balance/value-${symbol}`);
    readonly accountDetailsTabButton: Locator;
    readonly accountDetails: Locator;
    readonly showPublicKeyButton: Locator;
    readonly copyPublicKeyButton: Locator;
    readonly openSendFormButton: Locator;
    readonly sendForm: Locator;
    readonly receiveButton: Locator;
    readonly revealAddressButton: Locator;
    readonly copyAddressButton: Locator;
    readonly stakingButton: Locator;
    readonly signAndVerifyButton: Locator;
    readonly stakingCardano: Locator;
    readonly transactionSummaryTitle: Locator;
    readonly transactionItem: Locator;
    readonly transactionAddress: Locator;
    readonly fiatAmount: Locator;
    readonly walletFilter = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@account-menu/filter/${symbol}`);

    constructor(private readonly page: Page) {
        this.transactionSearch = this.page.getByTestId('@wallet/accounts/search-icon');
        this.accountSearch = this.page.getByTestId('@account-menu/search-input');
        this.accountChevron = this.page.getByTestId('@account-menu/arrow');
        this.walletStakingButton = this.page.getByTestId('@wallet/menu/staking');
        this.stakeAddress = this.page.getByTestId('@cardano/staking/address');
        this.walletExtraDropDown = this.page.getByTestId('@wallet/menu/extra-dropdown');
        this.openTradingGlobalButton = this.page.getByTestId('@wallet/menu/wallet-trading-buy');
        this.openSwapGlobalButton = this.page.getByTestId('@wallet/menu/wallet-trading-exchange');
        this.tradingDropdownBuyButton = this.page
            .getByRole('list')
            .getByTestId('@wallet/menu/wallet-trading-buy');
        this.accountDetailsTabButton = this.page.getByTestId('@wallet/menu/wallet-details');
        this.accountDetails = this.page.getByTestId('@wallet/account-details');
        this.showPublicKeyButton = this.page.getByTestId('@wallets/details/show-xpub-button');
        this.copyPublicKeyButton = this.page.getByTestId('@metadata/copy-xpub-button');
        this.openSendFormButton = this.page.getByTestId('@wallet/menu/wallet-send');
        this.sendForm = this.page.getByTestId('@wallet/send/outputs-and-options');
        this.receiveButton = this.page.getByTestId('@wallet/menu/wallet-receive');
        this.revealAddressButton = this.page.getByTestId('@wallet/receive/reveal-address-button');
        this.copyAddressButton = this.page.getByTestId('@metadata/copy-address-button');
        this.stakingButton = this.page.getByTestId('@wallet/menu/staking');
        this.signAndVerifyButton = this.page.getByTestId('@wallet/menu/wallet-sign-verify');
        this.stakingCardano = this.page.getByTestId('@wallet/cardano/staking');
        this.transactionSummaryTitle = this.page.getByTestId(
            '@wallet/transactions/summary-card/title',
        );
        this.transactionItem = this.page.getByTestId('@wallet/transaction-item');
        this.transactionAddress = this.page.getByTestId('@wallet/transaction/target-address');
        this.fiatAmount = this.page.getByTestId('@wallet/account-top-panel/fiat-amount');
    }

    accountButton = ({
        symbol = 'btc',
        type = 'normal',
        atIndex = 0,
        tokens = false,
    }: WalletParams = {}): Locator =>
        this.page.getByTestId(
            `@account-menu/${symbol}/${type}/${atIndex}${tokens ? '/tokens' : ''}`,
        );

    accountLabel = ({ symbol = 'btc', type = 'normal', atIndex = 0 }: WalletParams = {}): Locator =>
        this.page.getByTestId(`@account-menu/${symbol}/${type}/${atIndex}/label`);

    @step()
    async openAccount({
        symbol = 'btc',
        type = 'normal',
        atIndex = 0,
        tokens = false,
    }: WalletParams = {}) {
        await this.accountButton({ symbol, type, atIndex, tokens }).click();
        await expect(this.fiatAmount).toBeVisible();
    }

    @step()
    async filterTransactions(transaction: string) {
        await this.transactionSearch.click();
        await this.transactionSearch.fill(transaction, { force: true });
    }

    @step()
    async expandAllAccountsInMenu() {
        for (const chevron of await this.accountChevron.all()) {
            await chevron.click();
        }
    }

    @step()
    async checkStakesOfCardanoAccounts() {
        const cardanoAccounts = [
            { symbol: 'ada' },
            { symbol: 'ada', type: 'legacy' },
            { symbol: 'ada', type: 'ledger' },
        ] as WalletParams[];
        for (const account of cardanoAccounts) {
            await this.openAccount(account);
            await this.walletStakingButton.click();
            await expect(this.stakeAddress).toBeVisible();
        }
    }

    @step()
    async getAccountsCount(symbol: NetworkSymbol) {
        return await this.page
            .locator(`[data-testid*="@account-menu/${symbol}"][tabindex]`)
            .count();
    }

    @step()
    async openTrading(params: WalletParams = {}) {
        await this.openAccount(params);
        await this.openTradingGlobalButton.click();
    }

    @step()
    async openBuyTradingOfToken(symbol: NetworkSymbol, tokenName: string) {
        await this.openAccount({ symbol, tokens: true });
        await this.page.getByRole('row', { name: tokenName }).getByRole('button').first().click();
        await this.page.getByTestId('@trading/tokens/buy-button').click();
    }

    @step()
    async openSellTradingOfToken(symbol: NetworkSymbol, tokenName: string) {
        await this.openAccount({ symbol, tokens: true });
        await this.page.getByRole('row', { name: tokenName }).getByRole('button').first().click();
        await this.page.getByTestId('@trading/tokens/sell-button').click();
    }

    @step()
    async openSwapTradingOfToken(symbol: NetworkSymbol, tokenName: string) {
        await this.openAccount({ symbol, tokens: true });
        await this.page.getByRole('row', { name: tokenName }).getByRole('button').nth(1).click();
    }

    @step()
    async openSwapTrading(params: WalletParams = {}) {
        await this.openAccount(params);
        await this.openSwapGlobalButton.click();
    }

    @step()
    async exportTransactions(typeOfExport: ExportType) {
        await this.page.getByTestId('@wallet/accounts/export-transactions/dropdown').click();
        await this.page.getByTestId(`@wallet/accounts/export-transactions/${typeOfExport}`).click();
    }
}
