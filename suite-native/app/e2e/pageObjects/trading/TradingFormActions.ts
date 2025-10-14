import { expect as detoxExpect } from 'detox';

import { TradingActions } from './TradingActions';
import { wait, waitForElementByIdToBeVisible, waitForElementByTextToBeVisible } from '../../utils';

export abstract class TradingFormActions extends TradingActions {
    abstract waitForQuotesToLoad(): Promise<void>;

    getSearchReceiveCryptoElement() {
        return element(by.label('Search tokens or address'));
    }

    getSearchFiatElement() {
        return element(by.label('Search country or ticker'));
    }

    getSearchCountryElement() {
        return element(by.label('Search country'));
    }

    getFiatAmountElement() {
        return this.getElementById('fiat-amount-input');
    }

    getAmountEditingDoneButton() {
        return this.getElementById('amount-editing-done-button');
    }

    async waitForTradeDataToLoad() {
        await waitForElementByIdToBeVisible(this.getTestId('form'), this.LONG_TIMEOUT);
    }

    async expectSheetHeaderTitle(title: string) {
        await waitFor(element(by.text(title).withAncestor(by.id('@trading/sheet-header-title'))))
            .toBeVisible()
            .withTimeout(this.SHORT_TIMEOUT);
    }

    async scrollScreenToBottom() {
        await element(by.id('@screen/Trading')).swipe('up');
    }

    async selectFiatCurrency(fiatCurrency: string) {
        await this.getElementById('fiat-button').tap();
        await this.expectSheetHeaderTitle('Currency');
        await this.getSearchFiatElement().tap();
        await this.getSearchFiatElement().replaceText(fiatCurrency.slice(0, -1));
        await wait(this.SEARCH_AND_ANIMATION_TIMEOUT);
        await element(by.label(fiatCurrency)).tap();

        await detoxExpect(this.getElementById('fiat-button/ticker')).toHaveText(fiatCurrency);
    }

    async selectCountry(countrySearch: string, country: string) {
        await this.getElementById('country').tap();
        await this.expectSheetHeaderTitle('Country of residence');
        await this.getSearchCountryElement().tap();
        await this.getSearchCountryElement().replaceText(countrySearch);
        await wait(this.SEARCH_AND_ANIMATION_TIMEOUT);
        await element(by.text(country)).tap();

        await detoxExpect(this.getElementById('country/value')).toHaveText(country);
    }

    async selectBtcReceiveAccount(accountName: string, derivationPath: string) {
        await this.getElementById('receive-account').tap();
        await waitForElementByTextToBeVisible(accountName);
        await element(by.text(accountName)).tap();
        await waitForElementByTextToBeVisible(derivationPath);
        await element(by.text(derivationPath)).tap();

        await detoxExpect(this.getElementById('receive-account/selected-account')).toHaveText(
            accountName,
        );

        await this.expectReceiveAccountBalance('0 BTC');
    }

    async expectReceiveAccountBalance(expectedValue: string) {
        await detoxExpect(this.getElementById('receive-account-balance')).toBeVisible();
        await detoxExpect(this.getElementById('receive-account-balance/value')).toHaveText(
            expectedValue,
        );
    }

    async setFiatAmount(amount: string) {
        await this.getFiatAmountElement().tap();
        await this.getFiatAmountElement().replaceText(amount);
        await this.getFiatAmountElement().tapReturnKey();
        await this.waitForQuotesToLoad();
        await this.scrollScreenToBottom();
    }

    async viewProviders() {
        await this.getElementById('provider-picker').tap();
        await this.expectSheetHeaderTitle('Providers');
        await element(by.label('Close')).tap();
        await waitForElementByIdToBeVisible(this.getTestId('provider-picker'), this.SHORT_TIMEOUT);
    }

    async selectReceiveAsset(asset: string) {
        await this.getElementById('asset-receive-button').tap();
        await this.expectSheetHeaderTitle('Assets');
        await this.getSearchReceiveCryptoElement().tap();
        await this.getSearchReceiveCryptoElement().replaceText(asset.slice(0, -1));
        await wait(this.SEARCH_AND_ANIMATION_TIMEOUT);
        await element(by.text(asset)).tap();

        await detoxExpect(this.getElementById('asset-receive-button/symbol')).toHaveText(asset);
    }

    async confirmTradingForm() {
        await this.getElementById('continue-button').tap();
        const confirmButton = this.getElementById('confirm-button');
        const bottomSheetScrollView = element(by.id('@bottom-sheet/scroll-view'));
        await bottomSheetScrollView.scrollTo('bottom');
        await wait(200); // make sure the scroll is finished before tapping the button
        await confirmButton.tap();
    }
}
