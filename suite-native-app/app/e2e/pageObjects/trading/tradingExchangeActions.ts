import { expect as detoxExpect } from 'detox';

import { TradingFormActions } from './TradingFormActions';
import { waitForVisible } from '../../support/utils';

class TradingExchangeActions extends TradingFormActions {
    constructor() {
        super('exchange');
    }

    async waitForQuotesToLoad() {
        await waitForVisible(this.getElementById('send-amount-input'));
        await waitForVisible(this.getElementById('receive-amount-input'));
    }

    async expectValidExchangeForm() {
        await detoxExpect(element(by.text('Provider'))).toBeVisible();
        await detoxExpect(this.getElementById('continue-button')).toBeVisible();
    }
}

export const tradingExchangeActions = new TradingExchangeActions();
