import { expect as detoxExpect } from 'detox';

import { TradingFormActions } from './TradingFormActions';
import { wait, waitForElementByIdToBeVisible } from '../../support/utils';

class TradingBuyActions extends TradingFormActions {
    constructor() {
        super('buy');
    }

    async waitForQuotesToLoad() {
        await waitForElementByIdToBeVisible(this.getTestId('fiat-amount-input'), this.LONG_TIMEOUT);
        await waitForElementByIdToBeVisible(
            this.getTestId('crypto-amount-input'),
            this.LONG_TIMEOUT,
        );
    }

    async viewPaymentMethods() {
        await this.getElementById('payment-method-picker').tap();
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
        await this.expectSheetHeaderTitle('Payment method');
        await element(by.label('Close')).tap();
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
        await waitForElementByIdToBeVisible(
            this.getTestId('payment-method-picker'),
            this.SHORT_TIMEOUT,
        );
    }

    async expectValidBuyForm() {
        await detoxExpect(element(by.text('Payment method'))).toBeVisible();
        await detoxExpect(element(by.text('Provider'))).toBeVisible();
        await detoxExpect(this.getElementById('continue-button')).toBeVisible();
    }

    async closePaymentWebview() {
        await waitForElementByIdToBeVisible('@screen/TradingWebView', this.LONG_TIMEOUT);
        await element(by.id('@trading/webview/close')).tap();
        await waitForElementByIdToBeVisible('@screen/Trading', this.SHORT_TIMEOUT);
    }
}

export const tradingBuyActions = new TradingBuyActions();
