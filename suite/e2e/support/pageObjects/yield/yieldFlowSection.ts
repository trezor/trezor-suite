import { type Locator, type Page } from '@playwright/test';

export class YieldFlowSection {
    // Approve step
    readonly approvedAmount: Locator;
    readonly amountLabel: Locator;
    readonly amountInput: Locator;
    readonly amountUnit: Locator;
    readonly summaryLabel: Locator;
    readonly summaryAmount: Locator;
    readonly approveButton: Locator;
    // Continue button of the shared allowance approve modal opened by the approve step
    readonly approveModalContinueButton: Locator;
    readonly pendingTransactionLabel: Locator;
    // Deposit step
    readonly depositButton: Locator;
    readonly depositedToast: Locator;
    // Withdraw step
    readonly withdrawButton: Locator;
    readonly withdrawnToast: Locator;
    // Flow-complete screen
    readonly flowCompleteHeading: Locator;
    readonly flowCompleteStatus: Locator;
    readonly flowCompleteApy: Locator;
    readonly flowCompleteTransferInputAmount: Locator;
    readonly flowCompleteTransferOutputAmount: Locator;
    readonly backToOverviewButton: Locator;

    constructor(private readonly page: Page) {
        this.approvedAmount = this.page.getByTestId('@yield/approve/approved-amount-with-symbol');
        this.amountLabel = this.page.getByTestId('@yield/form/amount-label');
        this.amountInput = this.page.getByTestId('@yield/form/amount-input');
        this.amountUnit = this.page.getByTestId('@yield/form/amount-unit');
        this.summaryLabel = this.page.getByTestId('@yield/form/summary-label');
        this.summaryAmount = this.page.getByTestId('@yield/form/summary-amount-with-symbol');
        this.approveButton = this.page.getByTestId('@yield/form/approve-button');
        this.approveModalContinueButton = this.page.getByTestId('@modal/approve/continue-button');
        this.pendingTransactionLabel = this.page.getByTestId('@pending-transaction/title');
        this.depositButton = this.page.getByTestId('@yield/form/deposit-button');
        this.depositedToast = this.page.getByTestId('@toast/tx-yield-deposit');
        this.withdrawButton = this.page.getByTestId('@yield/form/withdraw-button');
        this.withdrawnToast = this.page.getByTestId('@toast/tx-yield-withdraw');
        this.flowCompleteHeading = this.page.getByTestId('@yield/flow-complete/heading');
        this.flowCompleteStatus = this.page.getByTestId('@yield/flow-complete/status');
        this.flowCompleteApy = this.page.getByTestId('@earn/dashboard/apy-percentage');
        this.flowCompleteTransferInputAmount = this.page.getByTestId(
            '@yield/flow-complete/transfer/input-with-symbol',
        );
        this.flowCompleteTransferOutputAmount = this.page.getByTestId(
            '@yield/flow-complete/transfer/output-with-symbol',
        );
        this.backToOverviewButton = this.page.getByTestId(
            '@yield/flow-complete/back-to-overview-button',
        );
    }
}
