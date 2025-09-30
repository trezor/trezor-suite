import { expect as detoxExpect } from 'detox';

import { wait, waitForElementByIdToBeVisible, waitForElementByTextToBeVisible } from '../utils';

const LONG_TIMEOUT = 30000;
const SHORT_TIMEOUT = 5000;
const BOTTOM_SHEET_ANIMATION_DURATION = 1000;

class TradingBuyActions {
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
        await element(by.id('@screen/mainScrollView')).scrollTo('bottom');
    }

    async waitForQuotesToLoad() {
        await waitForElementByIdToBeVisible('@trading/buy/fiat-amount-input', LONG_TIMEOUT);
        await waitForElementByIdToBeVisible('@trading/buy/crypto-amount-input', LONG_TIMEOUT);
    }

    async selectAsset(asset: string) {
        await element(by.id('@trading/buy/asset-button')).tap();
        await this.expectSheetHeaderTitle('Assets');
        await wait(BOTTOM_SHEET_ANIMATION_DURATION);

        const searchCryptoElement = element(by.id('@trading/buy/assets-search-input'));

        await searchCryptoElement.replaceText(asset.slice(0, -1));
        await wait(BOTTOM_SHEET_ANIMATION_DURATION);
        await element(by.text(asset)).tap();
        await wait(BOTTOM_SHEET_ANIMATION_DURATION);

        await waitFor(element(by.id(`@trading/buy/asset-button/symbol`))).toHaveText(asset);
    }

    async selectFiatCurrency(fiatCurrency: string) {
        await element(by.id('@trading/buy/fiat-button')).tap();
        await this.expectSheetHeaderTitle('Currency');
        const searchFiatElement = element(by.id('@trading/buy/fiat-search-input'));

        await searchFiatElement.replaceText(fiatCurrency.slice(0, -1));

        await wait(BOTTOM_SHEET_ANIMATION_DURATION);
        await element(by.text(fiatCurrency)).tap();
        await wait(BOTTOM_SHEET_ANIMATION_DURATION);

        await waitFor(element(by.id(`@trading/buy/fiat-button/ticker`))).toHaveText(fiatCurrency);
    }

    async selectCountry(countrySearch: string, country: string) {
        await element(by.id('@trading/buy/country')).tap();
        await wait(BOTTOM_SHEET_ANIMATION_DURATION);
        await this.expectSheetHeaderTitle('Country of residence');

        const searchCountryElement = element(by.id('@trading/buy/country-search-input'));
        await searchCountryElement.replaceText(countrySearch);
        await element(by.text(country)).tap();
        await wait(BOTTOM_SHEET_ANIMATION_DURATION);
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
        const paymentMethodPickerId = '@trading/buy/payment-method-picker';

        await element(by.id(paymentMethodPickerId)).tap();
        await wait(BOTTOM_SHEET_ANIMATION_DURATION);
        await this.expectSheetHeaderTitle('Payment method');
        await element(by.label('Close')).tap();
        await wait(BOTTOM_SHEET_ANIMATION_DURATION);
        await waitForElementByIdToBeVisible(paymentMethodPickerId, SHORT_TIMEOUT);
    }

    async viewProviders() {
        const providerPickerId = '@trading/buy/provider-picker';

        await element(by.id(providerPickerId)).tap();
        await this.expectSheetHeaderTitle('Providers');
        await wait(BOTTOM_SHEET_ANIMATION_DURATION);
        await element(by.label('Close')).tap();
        await waitForElementByIdToBeVisible(providerPickerId, SHORT_TIMEOUT);
        await wait(BOTTOM_SHEET_ANIMATION_DURATION);
    }

    async setFiatAmount(amount: string) {
        const fiatAmountElement = element(by.id('@trading/buy/fiat-amount-input'));
        await fiatAmountElement.replaceText(amount);
        await fiatAmountElement.tapReturnKey();
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
        const bottomSheetScrollView = element(by.id('@bottom-sheet/scroll-view'));
        await bottomSheetScrollView.scrollTo('bottom', 0.5, 0.5);
        const confirmButton = element(by.id('@trading/buy/confirm-button'));
        await confirmButton.tap();
        await wait(BOTTOM_SHEET_ANIMATION_DURATION);
    }

    async closePaymentWebview() {
        await waitForElementByIdToBeVisible('@screen/TradingWebView', LONG_TIMEOUT);
        await element(by.id('@trading/webview/close')).tap();
        await waitForElementByIdToBeVisible('@screen/Trading', SHORT_TIMEOUT);
    }
}

export const tradingBuyActions = new TradingBuyActions();
