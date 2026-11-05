import { expect as detoxExpect } from 'detox';

import { TradingFormActions } from './TradingFormActions';
import { wait, waitForVisible } from '../../support/utils';

class TradingSellActions extends TradingFormActions {
    constructor() {
        super('sell');
    }

    async waitForQuotesToLoad() {
        await waitForVisible(this.getElementById('send-amount-input'));
        await waitForVisible(this.getElementById('fiat-amount-input'));
    }

    async viewReceiveMethods() {
        await this.getElementById('receive-method-picker').tap();
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
        await this.expectSheetHeaderTitle('Receive method');
        await element(by.label('Close')).tap();
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
        await waitForVisible(this.getElementById('receive-method-picker'));
    }

    async expectValidSellForm() {
        await detoxExpect(element(by.text('Provider'))).toBeVisible();
        await detoxExpect(this.getElementById('continue-button')).toBeVisible();
    }
}

export const tradingSellActions = new TradingSellActions();
