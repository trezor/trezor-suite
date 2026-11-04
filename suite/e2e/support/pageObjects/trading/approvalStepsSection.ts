import { Locator, Page } from '@playwright/test';

export class TradingApprovalStepsSection {
    readonly section: Locator;
    readonly approveStep: Locator;
    readonly continueButton: Locator;
    readonly transactionId: Locator;

    constructor(private readonly page: Page) {
        this.section = this.page.getByTestId('@approval-steps');
        this.approveStep = this.section.getByTestId('@approval-step/approve');
        this.continueButton = this.approveStep.getByTestId('@approval-step/continue');
        this.transactionId = this.approveStep.getByTestId('@approval-step/txid-value');
    }
}
