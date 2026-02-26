import type { Page } from '@playwright/test';

import { SwapHistoryItem } from '../fixtures/invity/swap/swap-history';

export class TradingStoreFixture {
    constructor(private page: Page) {}

    async insertSwapHistory(trades: SwapHistoryItem[]) {
        await this.page.evaluate(inputTrades => {
            const accounts = window.store.getState().wallet.accounts as Array<{
                key: string;
                symbol: string;
            }>;
            const accountKeyBySymbol = new Map(
                accounts.map(account => [account.symbol, account.key]),
            );

            for (const trade of inputTrades) {
                window.store.dispatch({
                    type: '@trading/saveTrade',
                    payload: {
                        tradeType: 'exchange',
                        key: trade.orderId,
                        date: trade.date,
                        sendAccountKey: accountKeyBySymbol.get(trade.sendSymbol)!,
                        data: trade.data,
                    },
                });
            }
        }, trades);
    }
}
