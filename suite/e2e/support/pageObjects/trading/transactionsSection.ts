import { Locator, Page } from '@playwright/test';

import { TradingTransactionRow } from './transactionRow';

type TradingTransactionsTab = 'all' | 'exchange' | 'buy' | 'sell';

export class TradingTransactionsSection {
    readonly menuButton: Locator;
    readonly heading: Locator;
    readonly list: Locator;
    readonly rows: Locator;
    readonly rowDates: Locator;
    readonly emptyState: Locator;
    readonly backToTradeFormButton: Locator;
    readonly typeEmptyState: Locator;
    readonly showAllTradesButton: Locator;
    readonly tab: (tradeType: TradingTransactionsTab) => Locator;

    constructor(private page: Page) {
        this.menuButton = page.getByTestId('@trading/menu/wallet-trading-transactions');
        this.heading = page.getByTestId('@trading/page-header/title');
        this.list = page.getByTestId('@trading/transactions/list');
        this.rows = this.list.locator('[data-testid^="@trading/transactions/trade/"]');
        this.rowDates = this.list.getByTestId('@trading/transactions/date');
        this.emptyState = page.getByTestId('@trading/transactions/empty-state');
        this.backToTradeFormButton = page.getByTestId(
            '@trading/transactions/empty-state/back-button',
        );
        this.typeEmptyState = page.getByTestId('@trading/transactions/type-empty-state');
        this.showAllTradesButton = page.getByTestId('@trading/transactions/show-all-trades');
        this.tab = tradeType => page.getByTestId(`@trading/transactions/tab/${tradeType}`);
    }

    transactionRow(orderId: string): TradingTransactionRow {
        return new TradingTransactionRow(this.page, orderId);
    }
}
