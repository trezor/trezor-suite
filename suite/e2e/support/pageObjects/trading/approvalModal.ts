import { Locator, Page } from '@playwright/test';

import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

export type ApprovalLimitType = 'minimal' | 'infinite';

export class TradingApprovalModal {
    readonly modal: Locator;
    readonly heading: Locator;
    readonly continueButton: Locator;
    readonly accountValue: Locator;
    readonly providerValue: Locator;
    readonly limitSelector: Locator;
    readonly limitValue: Locator;
    // The limit dropdown renders in a portal outside the modal, so it is page-scoped.
    readonly limitOption = (type: ApprovalLimitType) =>
        this.page.getByTestId(`@modal/approve/${type}-option`);
    readonly feeAmountWithSymbol: Locator;

    constructor(private readonly page: Page) {
        this.modal = this.page.modal;
        this.heading = this.modal.getByTestId('@modal/header');
        this.continueButton = this.modal.getByTestId('@modal/approve/continue-button');
        this.accountValue = this.modal.getByTestId('@modal/approve/account-value');
        this.providerValue = this.modal.getByTestId('@modal/approve/provider-value');
        this.limitSelector = this.modal.getByTestId('@modal/approve/limit-selector');
        this.limitValue = this.modal.getByTestId('@modal/approve/limit-value');
        this.feeAmountWithSymbol = this.modal.getByTestId(
            '@trading/quote/maximum-fee-amount-with-symbol',
        );
    }

    @step()
    async selectLimit(type: ApprovalLimitType) {
        await expect(this.feeAmountWithSymbol).toBeVisible();
        await this.limitSelector.click();
        await this.limitOption(type).click();
        await expect(this.feeAmountWithSymbol).toBeHidden();
        await expect(this.feeAmountWithSymbol).toBeVisible();
    }
}
