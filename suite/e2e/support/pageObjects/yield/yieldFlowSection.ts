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
    readonly withdrawButton: Locator;
    readonly redeemButton: Locator;
    readonly unitToggleButton: Locator;
    readonly maxButton: Locator;
    readonly maxWithdrawInfoBanner: Locator;
    readonly withdrawnToast: Locator;
    // Claim step
    readonly claimHeading: Locator;
    readonly claimButton: Locator;
    readonly claimRewardAmount: Locator;
    readonly claimRewardFiatAmount: Locator;
    readonly claimedToast: Locator;
    readonly claimedToastMessage: Locator;
    // Flow-complete screen
    readonly flowCompleteHeading: Locator;
    readonly flowCompleteStatus: Locator;
    readonly flowCompleteApy: Locator;
    readonly flowCompleteTransferInputAmount: Locator;
    readonly flowCompleteTransferOutputAmount: Locator;
    readonly flowCompleteRewardAmount: Locator;
    readonly flowCompleteRewardFiatAmount: Locator;
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
        this.redeemButton = this.page.getByTestId('@yield/form/redeem-button');
        this.unitToggleButton = this.page.getByTestId('@yield/form/unit-toggle-button');
        this.maxButton = this.page.getByTestId('@yield/form/max-button');
        this.maxWithdrawInfoBanner = this.page.getByTestId('@yield/form/max-withdraw-info');
        this.withdrawnToast = this.page.getByTestId('@toast/tx-yield-withdraw');
        this.claimHeading = this.page.getByTestId('@yield/claim/heading');
        this.claimButton = this.page.getByTestId('@yield/claim/claim-button');
        this.claimRewardAmount = this.page
            .getByTestId('@yield/claim/rewards-list')
            .getByTestId('@yield/rewards/reward-amount-with-symbol');
        this.claimRewardFiatAmount = this.page
            .getByTestId('@yield/claim/rewards-list')
            .getByTestId('@yield/rewards/reward-fiat-amount');
        this.claimedToast = this.page.getByTestId('@toast/tx-yield-claim');
        this.claimedToastMessage = this.page.getByTestId('@toast/tx-yield-claim/message');
        this.flowCompleteHeading = this.page.getByTestId('@yield/flow-complete/heading');
        this.flowCompleteStatus = this.page.getByTestId('@yield/flow-complete/status');
        this.flowCompleteApy = this.page.getByTestId('@earn/dashboard/apy-percentage');
        this.flowCompleteTransferInputAmount = this.page.getByTestId(
            '@yield/flow-complete/transfer/input-with-symbol',
        );
        this.flowCompleteTransferOutputAmount = this.page.getByTestId(
            '@yield/flow-complete/transfer/output-with-symbol',
        );
        this.flowCompleteRewardAmount = this.page
            .getByTestId('@yield/flow-complete/rewards-list')
            .getByTestId('@yield/rewards/reward-amount-with-symbol');
        this.flowCompleteRewardFiatAmount = this.page
            .getByTestId('@yield/flow-complete/rewards-list')
            .getByTestId('@yield/rewards/reward-fiat-amount');
        this.backToOverviewButton = this.page.getByTestId(
            '@yield/flow-complete/back-to-overview-button',
        );
    }

    // Token symbol shown in the claim review modal's "Reward tokens" step.
    claimReviewRewardToken(tokenAddress: string): Locator {
        return this.page
            .getByTestId(`@modal/output-reward-${tokenAddress}`)
            .getByTestId('@modal/output-value');
    }
}
