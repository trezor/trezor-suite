import { Locator, Page, expect } from '@playwright/test';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';

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
    readonly walletStakingButton: Locator;
    readonly stakeAddress: Locator;
    readonly walletExtraDropDown: Locator;
    readonly openTradingGlobalButton: Locator;
    readonly openSellGlobalButton: Locator;
    readonly openSwapSidebarButton: Locator;
    readonly tradingDropdownBuyButton: Locator;
    readonly tokenBuyButton: Locator;
    readonly tokenSellButton: Locator;
    readonly tokenRow = (tokenName: string): Locator =>
        this.page.getByTestId(`@token-row/${tokenName}`);
    readonly tokenRowMoreButton = (tokenName: string): Locator =>
        this.tokenRow(tokenName).getByTestId('@trading/tokens/more-button');
    readonly tokenRowSwapButton = (tokenName: string): Locator =>
        this.tokenRow(tokenName).getByTestId('@trading/tokens/swap-button');
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
    readonly sendFormHeader: Locator;
    readonly totalSent: Locator;
    readonly receiveButton: Locator;
    readonly verifyAddressButton: Locator;
    readonly copyAddressButton: Locator;
    readonly receiveAddress: Locator;
    readonly showNextAddressButton: Locator;
    readonly addressCopiedModal: Locator;
    readonly addressCopiedModalVerifyButton: Locator;
    readonly addressCopiedModalSkipButton: Locator;
    readonly stakingButton: Locator;
    readonly signAndVerifyButton: Locator;
    readonly stakingCardano: Locator;
    readonly transactionSummaryTitle: Locator;
    readonly transactionItem: Locator;
    readonly transactionAddress: Locator;
    readonly fiatAmount: Locator;
    readonly walletFilter = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@account-menu/filter/${symbol}`);
    readonly topPanelBalance: Locator;
    readonly topPanelBalanceWithSymbol: Locator;
    readonly addAccountButton: Locator;
    readonly addAccountConfirmButton: Locator;
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
    readonly usedAddressVerifyButton = (index: number) =>
        this.page.getByTestId(`@wallet/receive/used-address/${index}/verify-button`);
    readonly usedAddressCopyButton = (index: number) =>
        this.page.getByTestId(`@wallet/receive/used-address/${index}/copy-button`);

    constructor(private readonly page: Page) {
        this.transactionSearch = this.page.getByTestId('@wallet/accounts/search-icon');
        this.accountSearch = this.page.getByTestId('@account-menu/search-input');
        this.walletStakingButton = this.page.getByTestId('@wallet/menu/staking');
        this.stakeAddress = this.page.getByTestId('@cardano/staking/address');
        this.walletExtraDropDown = this.page.getByTestId('@wallet/menu/extra-dropdown');
        this.openTradingGlobalButton = this.page.getByTestId('@wallet/menu/wallet-trading-buy');
        this.openSellGlobalButton = this.page.getByTestId('@wallet/menu/wallet-trading-sell');
        this.openSwapSidebarButton = this.page.getByTestId('@suite/menu/wallet-trading-exchange');
        this.tradingDropdownBuyButton = this.page
            .getByRole('list')
            .getByTestId('@wallet/menu/wallet-trading-buy');
        this.tokenBuyButton = this.page.getByTestId('@trading/tokens/buy-button');
        this.tokenSellButton = this.page.getByTestId('@trading/tokens/sell-button');
        this.accountDetailsTabButton = this.page.getByTestId('@wallet/menu/wallet-details');
        this.accountDetails = this.page.getByTestId('@wallet/account-details');
        this.showPublicKeyButton = this.page.getByTestId('@wallets/details/show-xpub-button');
        this.copyPublicKeyButton = this.page.getByTestId('@metadata/copy-xpub-button');
        this.openSendFormButton = this.page.getByTestId('@wallet/menu/wallet-send');
        this.sendForm = this.page.getByTestId('@wallet/send/outputs-and-options');
        this.sendFormHeader = this.page.getByTestId('@wallet/send-header');
        this.totalSent = this.page.getByTestId('@wallet/send/total-sent');
        this.receiveButton = this.page.getByTestId('@wallet/menu/wallet-receive');
        this.verifyAddressButton = this.page.getByTestId('@wallet/receive/verify-address-button');
        this.copyAddressButton = this.page.getByTestId('@wallet/receive/copy-address-button');
        this.receiveAddress = this.page.getByTestId('@wallet/receive/address');
        this.showNextAddressButton = this.page.getByTestId(
            '@wallet/receive/show-next-address-button',
        );
        this.addressCopiedModal = this.page.getByTestId('@wallet/receive/address-copied-modal');
        this.addressCopiedModalVerifyButton = this.page.getByTestId(
            '@wallet/receive/address-copied-modal/verify-button',
        );
        this.addressCopiedModalSkipButton = this.page.getByTestId(
            '@wallet/receive/address-copied-modal/skip-button',
        );
        this.stakingButton = this.page.getByTestId('@wallet/menu/staking');
        this.signAndVerifyButton = this.page.getByTestId('@wallet/menu/wallet-sign-verify');
        this.stakingCardano = this.page.getByTestId('@wallet/cardano/staking');
        this.transactionSummaryTitle = this.page.getByTestId(
            '@wallet/transactions/summary-card/title',
        );
        this.transactionItem = this.page.getByTestId('@wallet/transaction-item');
        this.transactionAddress = this.page.getByTestId('@wallet/transaction/target-address');
        this.fiatAmount = this.page.getByTestId('@wallet/account/fiat-amount').first();
        this.topPanelBalance = this.page.getByTestId('@wallet/account/crypto-balance');
        this.topPanelBalanceWithSymbol = this.page.getByTestId(
            '@wallet/account/crypto-balance-with-symbol',
        );
        this.copyToCliboardToast = this.page.getByTestId('@toast/copy-to-clipboard');
        this.verifyAddressErrorToast = this.page.getByTestId('@toast/verify-address-error');
        this.addAccountButton = this.page.getByTestId('@account-menu/add-account');
        this.addAccountConfirmButton = this.page.getByTestId('@add-account');
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

        if (!params.symbol || !isTestnet(params.symbol)) {
            await expect(this.fiatAmount).toBeVisible({ timeout: 25_000 });
        }
    }

    @step()
    async filterTransactions(transaction: string) {
        await this.transactionSearch.click();
        await this.transactionSearch.fill(transaction, { force: true });
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
    getAccountsInTypeCount(type: string) {
        return this.page.getByTestId(new RegExp(`^@account-menu/[^/]+/${type}/\\d+$`)).count();
    }

    @step()
    getAccountsForCoinInTypeCount(type: string, symbol: NetworkSymbol) {
        return this.page.getByTestId(new RegExp(`^@account-menu/${symbol}/${type}/\\d+$`)).count();
    }

    @step()
    async openTrading(params: WalletParams = {}) {
        await this.openAccount(params);
        await this.openTradingGlobalButton.click();
    }

    @step()
    async openBuyTradingOfToken(symbol: NetworkSymbol, tokenName: string) {
        await this.openAccount({ symbol, subAccount: 'tokens' });
        await this.tokenRowMoreButton(tokenName).click();
        await this.tokenBuyButton.click();
    }

    @step()
    async openSellTradingOfToken(symbol: NetworkSymbol, tokenName: string) {
        await this.openAccount({ symbol, subAccount: 'tokens' });
        await this.tokenRowMoreButton(tokenName).click();
        await this.tokenSellButton.click();
    }

    @step()
    async openSwapTradingOfToken(symbol: NetworkSymbol, tokenName: string) {
        await this.openAccount({ symbol, subAccount: 'tokens' });
        await this.tokenRowSwapButton(tokenName).click();
    }

    @step()
    async openSwapTrading(params: WalletParams = {}) {
        await this.openAccount(params);
        await this.openSwapSidebarButton.click();
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
