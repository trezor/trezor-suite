import { expect as detoxExpect } from 'detox';

import { TradingFormActions } from './TradingFormActions';
import { waitForVisible } from '../../support/utils';
import { onTabBar } from '../tabBarActions';

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

    async openSwapForm() {
        await onTabBar.navigateToTrade();
        await this.tapTradingSectionHeaderTab();
        await this.waitForTradeDataToLoad();
    }
}

export const tradingExchangeActions = new TradingExchangeActions();
