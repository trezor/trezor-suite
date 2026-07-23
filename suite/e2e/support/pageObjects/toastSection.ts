import { type Locator, type Page } from '@playwright/test';

export class ToastSection {
    readonly approved: Locator;
    readonly approvedAmount: Locator;
    readonly yieldDeposit: Locator;

    constructor(private readonly page: Page) {
        this.approved = this.page.getByTestId('@toast/tx-approved');
        this.approvedAmount = this.page.getByTestId('@toast/tx-approved/amount');
        this.yieldDeposit = this.page.getByTestId('@toast/tx-yield-deposit');
    }
}
