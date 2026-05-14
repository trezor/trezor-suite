import { Locator, Page } from '@playwright/test';

import { TradingSwapTransactionRow } from './swapTransactionRow';

export class TradingTransactionsSection {
    readonly menuButton: Locator;
    readonly heading: Locator;
    readonly count: Locator;
    readonly list: Locator;
    readonly allSwapRows: Locator;

    constructor(private page: Page) {
        this.menuButton = page.getByTestId('@trading/menu/wallet-trading-transactions');
        this.heading = page.getByTestId('@trading/transactions/heading');
        this.count = page.getByTestId('@trading/transactions/count');
        this.list = page.getByTestId('@trading/transactions/list');
        this.allSwapRows = this.list.locator(
            '[data-testid^="@trading/transactions/list/swap-transaction/"]',
        );
    }

    swapTransactionRow(orderId: string): TradingSwapTransactionRow {
        return new TradingSwapTransactionRow(this.page, orderId);
    }

    swapRowAt(index: number): Locator {
        return this.allSwapRows.nth(index);
    }
}
