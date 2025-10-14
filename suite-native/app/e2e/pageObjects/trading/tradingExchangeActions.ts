import { expect as detoxExpect } from 'detox';

import { wait, waitForElementByIdToBeVisible, waitForElementByTextToBeVisible } from '../../utils';

const LONG_TIMEOUT = 30000;
const SHORT_TIMEOUT = 5000;
const SEARCH_AND_ANIMATION_TIMEOUT = 1000;

class TradingExchangeActions {
    getSearchReceiveElement() {
        return element(by.label('Search tokens or address'));
    }

    getAmountEditingDoneButton() {
        return element(by.id('@trading/exchange/amount-editing-done-button'));
    }

    async expectSheetHeaderTitle(title: string) {
        await waitFor(element(by.text(title).withAncestor(by.id('@trading/sheet-header-title'))))
            .toBeVisible()
            .withTimeout(SHORT_TIMEOUT);
    }

    async waitForTradeDataToLoad() {
        await waitForElementByIdToBeVisible('@trading/exchange/form', LONG_TIMEOUT);
    }

    async scrollScreenToBottom() {
        await element(by.id('@screen/Trading')).swipe('up');
    }

    async waitForQuotesToLoad() {
        await waitForElementByIdToBeVisible('@trading/exchange/send-amount-input', LONG_TIMEOUT);
        await waitForElementByIdToBeVisible('@trading/exchange/receive-amount-input', LONG_TIMEOUT);
    }

    //TODO
    async selectReceiveAsset(asset: string) {
        await element(by.id('@trading/exchange/asset-button')).tap();
        await this.expectSheetHeaderTitle('Assets');
        await this.getSearchReceiveElement().tap();
        await this.getSearchReceiveElement().replaceText(asset.slice(0, -1));
        await wait(SEARCH_AND_ANIMATION_TIMEOUT);
        await element(by.text(asset)).tap();

        await detoxExpect(element(by.id('@trading/exchange/asset-button/symbol'))).toHaveText(
            asset,
        );
    }
    async selectBtcReceiveAccount(accountName: string, derivationPath: string) {
        await element(by.id('@trading/exchange/receive-account')).tap();
        await waitForElementByTextToBeVisible(accountName);
        await element(by.text(accountName)).tap();
        await waitForElementByTextToBeVisible(derivationPath);
        await element(by.text(derivationPath)).tap();

        await detoxExpect(
            element(by.id('@trading/exchange/receive-account/selected-account')),
        ).toHaveText(accountName);

        await this.expectReceiveAccountBalance('0 BTC');
    }

    async viewProviders() {
        await element(by.id('@trading/exchange/provider-picker')).tap();
        await this.expectSheetHeaderTitle('Providers');
        await element(by.label('Close')).tap();
        await waitForElementByIdToBeVisible('@trading/exchange/provider-picker', SHORT_TIMEOUT);
    }

    async expectReceiveAccountBalance(expectedValue: string) {
        await detoxExpect(
            element(by.id('@trading/exchange/receive-account-balance')),
        ).toBeVisible();
        await detoxExpect(
            element(by.id('@trading/exchange/receive-account-balance/value')),
        ).toHaveText(expectedValue);
    }

    async expectValidExchangeForm() {
        await detoxExpect(element(by.text('Rate'))).toBeVisible();
        await detoxExpect(element(by.text('Provider'))).toBeVisible();
        await detoxExpect(element(by.id('@trading/exchange/continue-button'))).toBeVisible();
    }

    async confirmExchangeForm() {
        await element(by.id('@trading/exchange/continue-button')).tap();
        const confirmButton = element(by.id('@trading/exchange/confirm-button'));
        const bottomSheetScrollView = element(by.id('@bottom-sheet/scroll-view'));
        await bottomSheetScrollView.scrollTo('bottom');
        await confirmButton.tap();
    }
}

export const tradingExchangeActions = new TradingExchangeActions();
