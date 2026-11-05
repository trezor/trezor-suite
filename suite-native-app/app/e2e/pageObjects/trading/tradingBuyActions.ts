import { expect as detoxExpect } from 'detox';

import { TradingFormActions } from './TradingFormActions';
import { wait, waitForVisible } from '../../support/utils';

class TradingBuyActions extends TradingFormActions {
    constructor() {
        super('buy');
    }

    async waitForQuotesToLoad() {
        await waitForVisible(this.getElementById('fiat-amount-input'));
        await waitForVisible(this.getElementById('crypto-amount-input'));
    }

    async viewPaymentMethods() {
        await this.getElementById('payment-method-picker').tap();
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
        await this.expectSheetHeaderTitle('Payment method');
        await element(by.label('Close')).tap();
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
        await waitForVisible(this.getElementById('payment-method-picker'));
    }

    async expectValidBuyForm() {
        await detoxExpect(element(by.text('Payment method'))).toBeVisible();
        await detoxExpect(element(by.text('Provider'))).toBeVisible();
        await detoxExpect(this.getElementById('continue-button')).toBeVisible();
    }
}

export const tradingBuyActions = new TradingBuyActions();
