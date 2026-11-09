import { Locator, Page } from '@playwright/test';

import { type ApprovalFlowStepType } from '@suite-common/trading';
import { type AllowanceLimitType } from '@suite-common/wallet-types';

import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

export class TradingApprovalStepsSection {
    readonly section: Locator;
    readonly approvalStep = (type: ApprovalFlowStepType) =>
        this.section.getByTestId(`@approval-step/${type}`);
    readonly approvalStepLabel = (type: ApprovalFlowStepType) =>
        this.section.getByTestId(`@approval-step/${type}/label`);
    readonly approveStep: Locator;
    readonly approvalRequiredBadge: Locator;
    readonly limitButton: Locator;
    readonly feeButton: Locator;
    readonly continueButton: Locator;
    readonly transactionId: Locator;
    readonly limitModal: Locator;
    readonly limitModalOption = (limitType: AllowanceLimitType) =>
        this.limitModal.getByTestId(`@approval-limit-modal/${limitType}`);

    constructor(private readonly page: Page) {
        this.section = this.page.getByTestId('@approval-steps');
        this.approveStep = this.approvalStep('approve');
        this.approvalRequiredBadge = this.approvalStep('swap').getByTestId(
            '@approval-step/required-badge',
        );
        this.limitButton = this.approveStep.getByTestId('@approval-step/limit');
        this.feeButton = this.approveStep.getByTestId('@approval-step/fee');
        this.continueButton = this.approveStep.getByTestId('@approval-step/continue');
        this.transactionId = this.approveStep.getByTestId('@approval-step/txid-value');
        this.limitModal = this.page.getByTestId('@approval-limit-modal');
    }

    @step()
    async selectLimit(limitType: AllowanceLimitType) {
        await this.limitButton.click();
        await this.limitModalOption(limitType).click();
        await expect(this.limitModal).toBeHidden();
    }
}
