import { type Locator, type Page } from '@playwright/test';

import { type ActivityPreset, type ToastActivityPreset } from './activityPage';
import { step } from '../common';
import { expect } from '../testExtends/customMatchers';

export class ToastSection {
    readonly approved: Locator;
    readonly approvedAmount: Locator;
    readonly yieldDeposit: Locator;
    readonly toast = (preset: ActivityPreset): Locator => this.page.getByTestId(`@toast/${preset}`);
    readonly toastCloseButton = (preset: ToastActivityPreset): Locator =>
        this.page.getByTestId(`@toast/${preset}/close`);

    constructor(private readonly page: Page) {
        this.approved = this.page.getByTestId('@toast/tx-approved');
        this.approvedAmount = this.page.getByTestId('@toast/tx-approved/amount');
        this.yieldDeposit = this.page.getByTestId('@toast/tx-yield-deposit');
    }

    @step()
    async dismiss(preset: ToastActivityPreset) {
        await this.toastCloseButton(preset).click();
        await expect(this.toast(preset)).toBeHidden();
    }
}
