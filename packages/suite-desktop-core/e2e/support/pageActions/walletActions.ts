import { Locator, Page, expect } from '@playwright/test';

import { NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../common';

type WalletParams = { symbol?: NetworkSymbol; atIndex?: number };

export class WalletActions {
    readonly transactionSearch: Locator;
    readonly accountSearch: Locator;
    readonly accountChevron: Locator;
    readonly cardanoAccountLabels: { [key: string]: Locator };
    readonly walletStakingButton: Locator;
    readonly stakeAddress: Locator;
    readonly walletExtraDropDown: Locator;
    readonly coinMarketBuyButton: Locator;
    readonly coinExchangeButton: Locator;
    readonly coinMarketDropdownBuyButton: Locator;
    readonly balanceOfAccount = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@wallet/coin-balance/value-${symbol}`);
    readonly accountDetailsTabButton: Locator;
    readonly accountDetails: Locator;
    readonly showPublicKeyButton: Locator;
    readonly copyPublicKeyButton: Locator;
    readonly sendButton: Locator;
    readonly sendForm: Locator;
    readonly receiveButton: Locator;
    readonly revealAddressButton: Locator;
    readonly copyAddressButton: Locator;
    readonly stakingButton: Locator;
    readonly stakingCardano: Locator;

    constructor(private readonly page: Page) {
        this.transactionSearch = this.page.getByTestId('@wallet/accounts/search-icon');
        this.accountSearch = this.page.getByTestId('@account-menu/search-input');
        this.accountChevron = this.page.getByTestId('@account-menu/arrow');
        this.cardanoAccountLabels = {
            normal: this.page.getByTestId('@account-menu/ada/normal/0/label'),
            legacy: this.page.getByTestId('@account-menu/ada/legacy/0/label'),
            ledger: this.page.getByTestId('@account-menu/ada/ledger/0/label'),
        };
        this.walletStakingButton = this.page.getByTestId('@wallet/menu/staking');
        this.stakeAddress = this.page.getByTestId('@cardano/staking/address');
        this.walletExtraDropDown = this.page.getByTestId('@wallet/menu/extra-dropdown');
        this.coinMarketBuyButton = this.page.getByTestId('@wallet/menu/wallet-coinmarket-buy');
        this.coinExchangeButton = this.page.getByTestId('@wallet/menu/wallet-coinmarket-exchange');
        this.coinMarketDropdownBuyButton = this.page
            .getByRole('list')
            .getByTestId('@wallet/menu/wallet-coinmarket-buy');
        this.accountDetailsTabButton = this.page.getByTestId('@wallet/menu/wallet-details');
        this.accountDetails = this.page.getByTestId('@wallet/account-details');
        this.showPublicKeyButton = this.page.getByTestId('@wallets/details/show-xpub-button');
        this.copyPublicKeyButton = this.page.getByRole('button', { name: 'Copy public key' });
        this.sendButton = this.page.getByTestId('@wallet/menu/wallet-send');
        this.sendForm = this.page.getByTestId('@wallet/send/outputs-and-options');
        this.receiveButton = this.page.getByTestId('@wallet/menu/wallet-receive');
        this.revealAddressButton = this.page.getByTestId('@wallet/receive/reveal-address-button');
        this.copyAddressButton = this.page.getByTestId('@metadata/copy-address-button');
        this.stakingButton = this.page.getByTestId('@wallet/menu/staking');
        this.stakingCardano = this.page.getByTestId('@wallet/cardano/staking');
    }

    accountButton = ({ symbol = 'btc', atIndex = 0 }: WalletParams = {}): Locator =>
        this.page.getByTestId(`@account-menu/${symbol}/normal/${atIndex}`);

    accountLabel = ({ symbol = 'btc', atIndex = 0 }: WalletParams = {}): Locator =>
        this.page.getByTestId(`@account-menu/${symbol}/normal/${atIndex}/label`);

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
        for (const type in this.cardanoAccountLabels) {
            await this.cardanoAccountLabels[type].click();
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
    async openCoinMarket(params: WalletParams = {}) {
        await this.accountButton(params).click();
        //TODO: #16073 We cannot set resolution for Electron. on CI button is hidden under dropdown due to a breakpoint
        const isBuyButtonHidden = !(await this.coinMarketBuyButton.isVisible());
        if (isBuyButtonHidden) {
            await this.walletExtraDropDown.click();
            await this.coinMarketDropdownBuyButton.click();
        } else {
            await this.coinMarketBuyButton.click();
        }
    }

    @step()
    async openExchangeMarket(params: WalletParams = {}) {
        await this.accountButton(params).click();
        await this.coinExchangeButton.click();
    }
}
