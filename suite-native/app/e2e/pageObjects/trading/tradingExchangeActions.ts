import { expect as detoxExpect } from 'detox';

import { TradingFormActions } from './TradingFormActions';
import { waitForElementByIdToBeVisible } from '../../support/utils';
import { onTabBar } from '../tabBarActions';

class TradingExchangeActions extends TradingFormActions {
    constructor() {
        super('exchange');
    }

    async waitForQuotesToLoad() {
        await waitForElementByIdToBeVisible(this.getTestId('send-amount-input'), this.LONG_TIMEOUT);
        await waitForElementByIdToBeVisible(
            this.getTestId('receive-amount-input'),
            this.LONG_TIMEOUT,
        );
    }

    async expectValidExchangeForm() {
        await detoxExpect(element(by.text('Rate'))).toBeVisible();
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
