import { Locator, Page } from '@playwright/test';

export class TradingTransactionRow {
    readonly root: Locator;
    /** Icon-only; the status message is its accessible name, not its text. */
    readonly status: Locator;
    readonly sendAmount: Locator;
    readonly receiveAmount: Locator;
    readonly date: Locator;

    constructor(page: Page, tradeOrderId: string) {
        this.root = page.getByTestId(`@trading/transactions/trade/${tradeOrderId}`);
        this.status = this.root.getByTestId('@trading/transactions/status');
        this.sendAmount = this.root.getByTestId('@trading/transactions/send/amount-with-symbol');
        this.receiveAmount = this.root.getByTestId(
            '@trading/transactions/receive/amount-with-symbol',
        );
        this.date = this.root.getByTestId('@trading/transactions/date');
    }
}
