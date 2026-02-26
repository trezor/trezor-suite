import { Locator, Page } from '@playwright/test';

export class TradingSwapTransactionRow {
    readonly root: Locator;
    readonly provider: Locator;
    readonly orderId: Locator;
    readonly status: Locator;
    readonly sendAmount: Locator;
    readonly receiveAmount: Locator;
    readonly date: Locator;
    readonly viewDetailsButton: Locator;

    constructor(page: Page, tradeOrderId: string) {
        this.root = page.getByTestId(`@trading/transactions/list/swap-transaction/${tradeOrderId}`);
        this.provider = this.root.getByTestId('@trading/offers/quote/provider');
        this.orderId = this.root.getByTestId('@trading/transaction-id');
        this.status = this.root.getByTestId('@trading/transactions/status');
        this.sendAmount = this.root.getByTestId('@trading/transactions/send/amount-with-symbol');
        this.receiveAmount = this.root.getByTestId(
            '@trading/transactions/receive/amount-with-symbol',
        );
        this.date = this.root.getByTestId('@trading/transactions/date');
        this.viewDetailsButton = this.root.getByTestId('@trading/transactions/view-details-button');
    }
}
