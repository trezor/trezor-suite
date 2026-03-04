import { Locator, Page, expect } from '@playwright/test';

import { NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../common';

export type ExportType = 'pdf' | 'csv' | 'json';

type WalletParams = {
    symbol?: NetworkSymbol;
    type?: 'normal' | 'legacy' | 'segwit' | 'ledger';
    atIndex?: number;
    subAccount?: 'tokens' | 'staking';
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
    readonly balanceOfAccount = (params: WalletParams) =>
        this.accountButton(params).getByTestId(`@wallet/coin-balance/value-${params.symbol}`);
    readonly balanceOfAccountWithSymbol = (params: WalletParams) =>
        this.accountButton(params).getByTestId(
            `@wallet/coin-balance/value-${params.symbol}-with-symbol`,
        );
    readonly accountDetailsTabButton: Locator;
    readonly accountDetails: Locator;
    readonly showPublicKeyButton: Locator;
    readonly copyPublicKeyButton: Locator;
    readonly openSendFormButton: Locator;
    readonly sendForm: Locator;
    readonly totalSent: Locator;
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
    readonly showMoreButton: Locator;
    readonly topPanelBalance: Locator;
    readonly topPanelBalanceWithSymbol: Locator;
    readonly segwitGroupButton: Locator;
    readonly addAccountButton: Locator;
    readonly addAccountConfirmButton: Locator;
    readonly findMyAccountButton: Locator;
    readonly filterAccountsButton: Locator;
    readonly addAccountTypeSelectInput: Locator;
    readonly addAccountTypeSelectOption = (type: string) =>
        this.page.getByTestId(`@add-account-type/select/option/${type}`);
    readonly copyToCliboardToast: Locator;
    readonly verifyAddressErrorToast: Locator;
    readonly accountNotLoaded: Locator;
    readonly retryLoadingAccount: Locator;
    readonly emptyAccount: Locator;
    readonly buyButton: Locator;
    readonly sellButton: Locator;
    readonly swapButton: Locator;
    readonly overviewTabButton: Locator;
    readonly deviceConnectedStatus: Locator;
    readonly deviceDisconnectedStatus: Locator;
    readonly discoveryWarning: Locator;
    readonly usedAddress = (index: number) =>
        this.page.getByTestId(`@wallet/receive/used-address/${index}`);

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
        this.totalSent = this.page.getByTestId('@wallet/send/total-sent');
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
        this.showMoreButton = this.page.getByTestId('@wallet/receive/used-address/show-more');
        this.topPanelBalance = this.page.getByTestId('@wallet/account-top-panel/crypto-balance');
        this.topPanelBalanceWithSymbol = this.page.getByTestId(
            '@wallet/account-top-panel/crypto-balance-with-symbol',
        );
        this.copyToCliboardToast = this.page.getByTestId('@toast/copy-to-clipboard');
        this.verifyAddressErrorToast = this.page.getByTestId('@toast/verify-address-error');
        this.segwitGroupButton = this.page.getByTestId('@account-menu/segwit');
        this.addAccountButton = this.page.getByTestId('@account-menu/add-account');
        this.addAccountConfirmButton = this.page.getByTestId('@add-account');
        this.findMyAccountButton = this.page.getByTestId('@find-account');
        this.filterAccountsButton = this.page.getByTestId('@account-menu/filter-accounts');
        this.addAccountTypeSelectInput = this.page.getByTestId('@add-account-type/select/input');
        this.accountNotLoaded = this.page.getByTestId('@accounts/account-not-loaded');
        this.retryLoadingAccount = this.page.getByTestId(
            '@accounts/account-not-loaded/retry-button',
        );
        this.emptyAccount = this.page.getByTestId('@accounts/empty-account');
        this.buyButton = this.page.getByTestId('@accounts/empty-account/buy');
        this.sellButton = this.page.getByTestId('@trading/menu/wallet-trading-sell');
        this.swapButton = this.page.getByTestId('@trading/menu/wallet-trading-exchange');
        this.overviewTabButton = this.page.getByTestId('@wallet/menu/wallet-overview');
        this.deviceConnectedStatus = this.page
            .getByTestId('@menu/switch-device')
            .getByTestId('@deviceStatus-connected');
        this.deviceDisconnectedStatus = page
            .getByTestId('@menu/switch-device')
            .getByTestId('@deviceStatus-disconnected');
        this.discoveryWarning = this.page.getByTestId('@warning/trezorDiscovery');
    }

    accountButton = ({
        symbol = 'btc',
        type = 'normal',
        atIndex = 0,
        subAccount,
    }: WalletParams = {}): Locator =>
        this.page.getByTestId(
            `@account-menu/${symbol}/${type}/${atIndex}${subAccount ? `/${subAccount}` : ''}`,
        );

    accountLabel = ({ symbol = 'btc', type = 'normal', atIndex = 0 }: WalletParams = {}): Locator =>
        this.page.getByTestId(`@account-menu/${symbol}/${type}/${atIndex}/label`);

    @step()
    async openAccount(params: WalletParams = {}) {
        await this.accountButton(params).click();
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
    getAccountsInTypeGroupCount(type: string) {
        return this.page
            .getByTestId(`@account-menu/${type}/group`)
            .locator(':scope > *:not([data-testid="@account-menu/account-item-skeleton"])')
            .count();
    }

    @step()
    getAccountsForCoinInTypeGroupCount(type: string, symbol: NetworkSymbol) {
        return this.page
            .getByTestId(`@account-menu/${type}/group`)
            .locator(`> [data-testid^="@account-menu/${symbol}/${type}/"]`)
            .count();
    }

    @step()
    async openTrading(params: WalletParams = {}) {
        await this.openAccount(params);
        await this.openTradingGlobalButton.click();
    }

    @step()
    async openBuyTradingOfToken(symbol: NetworkSymbol, tokenName: string) {
        await this.openAccount({ symbol, subAccount: 'tokens' });
        await this.page.getByRole('row', { name: tokenName }).getByRole('button').first().click();
        await this.page.getByTestId('@trading/tokens/buy-button').click();
    }

    @step()
    async openSellTradingOfToken(symbol: NetworkSymbol, tokenName: string) {
        await this.openAccount({ symbol, subAccount: 'tokens' });
        await this.page.getByRole('row', { name: tokenName }).getByRole('button').first().click();
        await this.page.getByTestId('@trading/tokens/sell-button').click();
    }

    @step()
    async openSwapTradingOfToken(symbol: NetworkSymbol, tokenName: string) {
        await this.openAccount({ symbol, subAccount: 'tokens' });
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

    @step()
    async searchAccounts(query: string) {
        const input = this.accountSearch.first();
        await input.click();
        await input.fill(query);
    }

    @step()
    async clearAccountSearch() {
        const input = this.accountSearch.first();
        await input.clear();
    }

    @step()
    async getTokenBalance({
        symbol,
        atIndex,
        tokenName,
    }: {
        symbol: NetworkSymbol;
        atIndex: number;
        tokenName: string;
    }) {
        await this.openAccount({ symbol, atIndex });
        await this.page.getByTestId('@wallet/menu/wallet-tokens').click();
        const tokenCryptoAmount = this.page.getByTestId(`@token-row/${tokenName}/crypto-amount`);
        await expect(tokenCryptoAmount).toBeVisible();
        const text = await tokenCryptoAmount.innerText();

        return parseFloat(text);
    }
}
