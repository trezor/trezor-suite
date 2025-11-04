import { expect as detoxExpect } from 'detox';

import { TradingActions } from './TradingActions';
import { wait, waitForVisible } from '../../support/utils';

export abstract class TradingFormActions extends TradingActions {
    abstract waitForQuotesToLoad(): Promise<void>;

    getSearchReceiveCryptoElement() {
        return this.getElementById('receive-asset-sheet/header/search-input');
    }

    getSearchFiatElement() {
        return this.getElementById('fiat-search-input');
    }

    getSearchCountryElement() {
        return this.getElementById('country/search-input');
    }

    getFiatAmountElement() {
        return this.getElementById('fiat-amount-input');
    }

    getSendCryptoAmountElement() {
        return this.getElementById('send-amount-input');
    }

    async waitForTradeDataToLoad() {
        await waitForVisible(this.getElementById('form'));
    }

    async expectSheetHeaderTitle(title: string) {
        await waitForVisible(element(by.text(title).and(by.id('@trading/sheet-header-title'))));
    }

    async selectFiatCurrency(fiatCurrency: string) {
        await this.getElementById('fiat-button').tap();
        await this.expectSheetHeaderTitle('Currency');
        await this.getSearchFiatElement().replaceText(fiatCurrency.slice(0, -1));
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
        await element(by.text(fiatCurrency)).tap();

        await waitFor(this.getElementById('fiat-button/ticker'))
            .toHaveText(fiatCurrency)
            .withTimeout(this.SHORT_TIMEOUT);
    }

    async selectCountry(countrySearch: string, country: string) {
        await this.getElementById('country').tap();
        await this.expectSheetHeaderTitle('Country of residence');
        await this.getSearchCountryElement().replaceText(countrySearch);
        await element(by.text(country)).tap();
        await waitFor(this.getElementById('country/value'))
            .toHaveText(country)
            .withTimeout(this.SHORT_TIMEOUT);
    }

    async selectReceiveAccount(accountName: string, derivationPath?: string) {
        await this.getElementById('receive-account').tap();
        await waitForVisible(by.text(accountName));
        await element(by.text(accountName)).tap();
        if (derivationPath) {
            await waitForVisible(by.text(derivationPath));
            await element(by.text(derivationPath)).tap();
        }

        await detoxExpect(this.getElementById('receive-account/selected-account')).toHaveText(
            accountName,
        );
    }

    async selectBtcReceiveAccount(accountName: string, derivationPath: string) {
        await this.selectReceiveAccount(accountName, derivationPath);
        await this.expectReceiveAccountBalance('0 BTC');
    }

    async expectReceiveAccountBalance(expectedValue: string) {
        await detoxExpect(this.getElementById('receive-account-balance')).toBeVisible();
        await detoxExpect(this.getElementById('receive-account-balance/value')).toHaveText(
            expectedValue,
        );
    }

    async setFiatAmount(amount: string) {
        await this.getFiatAmountElement().replaceText(amount);
        await this.getFiatAmountElement().tapReturnKey();
        await this.waitForQuotesToLoad();
    }

    async setSendCryptoAmount(amount: string) {
        await this.getSendCryptoAmountElement().tap();
        await this.getSendCryptoAmountElement().replaceText(amount);
        await this.getSendCryptoAmountElement().tapReturnKey();
        await this.waitForQuotesToLoad();
    }

    async viewProviders() {
        await this.getElementById('provider-picker').tap();
        await this.expectSheetHeaderTitle('Providers');
        await element(by.label('Close')).tap();
        await waitForVisible(this.getElementById('provider-picker'));
    }

    async selectReceiveAsset(asset: string, network?: string) {
        await this.getElementById('asset-receive-button').tap();
        await this.expectSheetHeaderTitle('Assets');
        await this.getSearchReceiveCryptoElement().tap();
        await this.getSearchReceiveCryptoElement().replaceText(asset.slice(0, -1));
        if (network) {
            const networkFilterTab = element(
                by.text(network).withAncestor(by.id(this.getTestId('receive-asset-sheet/header'))),
            );
            await waitForVisible(networkFilterTab);
            await networkFilterTab.tap();
        }
        await waitForVisible(by.text(asset), { timeout: this.BOTTOM_SHEET_ANIMATION_DURATION });
        await element(by.text(asset)).tap();

        await waitFor(this.getElementById('asset-receive-button/symbol'))
            .toHaveText(asset)
            .withTimeout(this.SHORT_TIMEOUT);
    }

    async selectSendAsset(asset: string) {
        await this.getElementById('asset-send-button').tap();
        await this.expectSheetHeaderTitle('Your assets');

        await element(by.text(asset)).atIndex(0).tap();

        await detoxExpect(this.getElementById('asset-send-button/symbol')).toHaveText(asset);
    }

    async openLegalSheet() {
        await this.getElementById('continue-button').tap();
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
    }

    async confirmTradingForm() {
        await this.openLegalSheet();
        await element(by.id('@bottom-sheet/scroll-view')).scrollTo('bottom', 0.5, 0.5);
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
        await this.getElementById('confirm-button').tap();
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
    }

    async tapTradingSectionHeaderTab() {
        await this.getElementById('header-tab').tap();
    }

    async expectPortfolioTrackerInfoCard() {
        await detoxExpect(this.getElementById('portfolio-tracker-info')).toBeVisible();
    }
}
