import { expect as detoxExpect } from 'detox';

import { TradingActions } from './TradingActions';
import { scrollUntilVisible } from '../../support/utils';

class TradingHistoryActions extends TradingActions {
    constructor() {
        super('history');
    }

    async openTradeHistory() {
        const historyButton = this.getElementById('button');
        await scrollUntilVisible(historyButton);
        await historyButton.tap();
        await detoxExpect(element(by.id('@screen/TradingHistory'))).toBeVisible();
    }

    async openTradeDetail(anyTradeSpecificText: string) {
        // this is a bit stupid, but I have no better idea
        await element(by.text(anyTradeSpecificText)).atIndex(0).tap();
    }

    async assertTradeDetail(title: string, paid: string, receiveAccount: string) {
        await detoxExpect(element(by.text(title))).toBeVisible();
        await detoxExpect(this.getElementById('detail/paid')).toHaveText(paid);
        await detoxExpect(this.getElementById('detail/receive-account')).toHaveText(receiveAccount);
        // currently we are unable to proceed payment in E2E
        // therefore state should be "waiting for payment"
        await detoxExpect(element(by.text('Waiting for your payment ...'))).toBeVisible();
    }
}

export const tradingHistoryActions = new TradingHistoryActions();
