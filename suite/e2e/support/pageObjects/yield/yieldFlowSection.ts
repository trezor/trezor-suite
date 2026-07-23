import { type Locator, type Page } from '@playwright/test';

export class YieldFlowSection {
    // Approve step
    readonly approvedAmount: Locator;
    readonly amountInput: Locator;
    readonly approveButton: Locator;
    // Continue button of the shared allowance approve modal opened by the approve step
    readonly approveModalContinueButton: Locator;
    readonly pendingTransactionLabel: Locator;
    // Deposit step
    readonly depositButton: Locator;
    // Flow-complete screen
    readonly flowCompleteHeading: Locator;
    readonly flowCompleteStatus: Locator;
    readonly flowCompleteApy: Locator;
    readonly flowCompleteTransferInputAmount: Locator;
    readonly flowCompleteTransferOutputAmount: Locator;

    constructor(private readonly page: Page) {
        this.approvedAmount = this.page.getByTestId('@yield/approve/approved-amount-with-symbol');
        this.amountInput = this.page.getByTestId('@yield/form/amount-input');
        this.approveButton = this.page.getByTestId('@yield/form/approve-button');
        this.approveModalContinueButton = this.page.getByTestId('@modal/approve/continue-button');
        this.pendingTransactionLabel = this.page.getByTestId('@pending-transaction/title');
        this.depositButton = this.page.getByTestId('@yield/form/deposit-button');
        this.flowCompleteHeading = this.page.getByTestId('@yield/flow-complete/heading');
        this.flowCompleteStatus = this.page.getByTestId('@yield/flow-complete/status');
        this.flowCompleteApy = this.page.getByTestId('@earn/dashboard/apy-percentage');
        this.flowCompleteTransferInputAmount = this.page.getByTestId(
            '@yield/flow-complete/transfer/input-with-symbol',
        );
        this.flowCompleteTransferOutputAmount = this.page.getByTestId(
            '@yield/flow-complete/transfer/output-with-symbol',
        );
    }
}
