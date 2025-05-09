import { expect as detoxExpect } from 'detox';

import { sleep, waitForElementByIdToBeVisible, waitForElementByTextToBeVisible } from '../utils';

const LONG_TIMEOUT = 30000;
const SHORT_TIMEOUT = 5000;
const SEARCH_AND_ANIMATION_TIMEOUT = 1000;

class TradingBuyActions {
    getSearchCrytoElement() {
        return element(by.label('Search tokens or address'));
    }

    getSearchFiatElement() {
        return element(by.label('Search country or ticker'));
    }

    getSearchCountryElement() {
        return element(by.label('Search country'));
    }

    getFiatAmountElement() {
        return element(by.id('@trading/buy/fiat-amount-input'));
    }

    getAmountEditingDoneButton() {
        return element(by.id('@trading/buy/amount-editing-done-button'));
    }

    async expectSheetHeaderTitle(title: string) {
        await waitFor(element(by.text(title).withAncestor(by.id('@trading/sheet-header-title'))))
            .toBeVisible()
            .withTimeout(SHORT_TIMEOUT);
    }

    async waitForTradeDataToLoad() {
        await waitForElementByIdToBeVisible('@trading/buy/form', LONG_TIMEOUT);
    }

    async scrollScreenToBottom() {
        await element(by.id('@screen/Trading')).swipe('up', 'fast', 0.8);
    }

    async waitForQuotesToLoad() {
        await waitForElementByIdToBeVisible('@trading/buy/fiat-amount-input', LONG_TIMEOUT);
        await waitForElementByIdToBeVisible('@trading/buy/crypto-amount-input', LONG_TIMEOUT);
    }

    async selectAsset(asset: string) {
        await element(by.id('@trading/buy/asset-button')).tap();
        await this.expectSheetHeaderTitle('Assets');
        await this.getSearchCrytoElement().tap();
        await this.getSearchCrytoElement().replaceText(asset.slice(0, -1));
        await sleep(SEARCH_AND_ANIMATION_TIMEOUT);
        await element(by.text(asset)).tap();

        await detoxExpect(element(by.id('@trading/buy/asset-button/symbol'))).toHaveText(asset);
    }

    async selectFiatCurrency(fiatCurrency: string) {
        await element(by.id('@trading/buy/fiat-button')).tap();
        await this.expectSheetHeaderTitle('Currency');
        await this.getSearchFiatElement().tap();
        await this.getSearchFiatElement().replaceText(fiatCurrency.slice(0, -1));
        await sleep(SEARCH_AND_ANIMATION_TIMEOUT);
        await element(by.label(fiatCurrency)).tap();

        await detoxExpect(element(by.id('@trading/buy/fiat-button/ticker'))).toHaveText(
            fiatCurrency,
        );
    }

    async selectCountry(countrySearch: string, country: string) {
        await element(by.id('@trading/buy/country')).tap();
        await this.expectSheetHeaderTitle('Country of residence');
        await this.getSearchCountryElement().tap();
        await this.getSearchCountryElement().replaceText(countrySearch);
        await sleep(SEARCH_AND_ANIMATION_TIMEOUT);
        await element(by.text(country)).tap();

        await detoxExpect(element(by.id('@trading/buy/country/value'))).toHaveText(country);
    }

    async selectBtcReceiveAccount(accountName: string, derivationPath: string) {
        await element(by.id('@trading/buy/receive-account')).tap();
        await waitForElementByTextToBeVisible(accountName);
        await element(by.text(accountName)).tap();
        await waitForElementByTextToBeVisible(derivationPath);
        await element(by.text(derivationPath)).tap();

        await detoxExpect(
            element(by.id('@trading/buy/receive-account/selected-account')),
        ).toHaveText(accountName);

        await this.expectReceiveAccountBalance('0 BTC');
    }

    async viewPaymentMethods() {
        await element(by.id('@trading/buy/payment-method-picker')).tap();
        await this.expectSheetHeaderTitle('Payment method');
        await element(by.label('Close')).tap();
        await waitForElementByIdToBeVisible('@trading/buy/payment-method-picker', SHORT_TIMEOUT);
    }

    async viewProviders() {
        await element(by.id('@trading/buy/provider-picker')).tap();
        await this.expectSheetHeaderTitle('Provider');
        await element(by.label('Close')).tap();
        await waitForElementByIdToBeVisible('@trading/buy/provider-picker', SHORT_TIMEOUT);
    }

    async setFiatAmount(amount: string) {
        await this.getFiatAmountElement().tap();
        await this.getFiatAmountElement().replaceText(amount);
        await this.getAmountEditingDoneButton().tap();
        await this.waitForQuotesToLoad();
    }

    async expectReceiveAccountBalance(expectedValue: string) {
        await detoxExpect(element(by.id('@trading/buy/receive-account-balance'))).toBeVisible();
        await detoxExpect(element(by.id('@trading/buy/receive-account-balance/value'))).toHaveText(
            expectedValue,
        );
    }

    async expectValidBuyForm() {
        await detoxExpect(element(by.text('Payment method'))).toBeVisible();
        await detoxExpect(element(by.text('Provider'))).toBeVisible();
        await detoxExpect(element(by.id('@trading/buy/continue-button'))).toBeVisible();
    }

    async confirmBuyForm() {
        await element(by.id('@trading/buy/continue-button')).tap();
        await waitForElementByIdToBeVisible('@trading/buy/confirm-button');
        await element(by.id('@trading/buy/confirm-button')).tap();
    }

    async closePaymentWebview() {
        await waitForElementByIdToBeVisible('@screen/TradingWebView', LONG_TIMEOUT);
        await element(by.id('@trading/webview/close')).tap();
        await waitForElementByIdToBeVisible('@screen/Trading', SHORT_TIMEOUT);
    }
}

export const tradingBuyActions = new TradingBuyActions();
