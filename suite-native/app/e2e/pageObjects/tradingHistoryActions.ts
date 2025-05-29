import { expect as detoxExpect } from 'detox';

class TradingHistoryActions {
    async openTradeHistory() {
        await element(by.id('@trading/history/button')).tap();
        await detoxExpect(element(by.id('@screen/TradingHistory'))).toBeVisible();
    }

    async openTradeDetail(anyTradeSpecificText: string) {
        // this is a bit stupid, but I have no better idea
        await element(by.text(anyTradeSpecificText)).atIndex(0).tap();
    }

    async assertTradeDetail(title: string, paid: string, receiveAccount: string) {
        await detoxExpect(element(by.text(title))).toBeVisible();
        await detoxExpect(element(by.id('@trading/history/detail/paid'))).toHaveText(paid);
        await detoxExpect(element(by.id('@trading/history/detail/receive-account'))).toHaveText(
            receiveAccount,
        );
        // currently we are unable to proceed payment in E2E
        // therefore state should be "waiting for payment"
        await detoxExpect(element(by.text('Waiting for your payment ...'))).toBeVisible();
    }
}

export const tradingHistoryActions = new TradingHistoryActions();
