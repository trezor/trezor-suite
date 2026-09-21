import { type Locator, type Page } from '@playwright/test';

import { type ActivityPreset, type ToastActivityPreset } from './activityPage';
import { step, toCompactAmountWithSymbol } from '../common';
import { expect } from '../testExtends/customMatchers';

type VerifyTxSentToastParams = {
    account: string;
    amount: string;
    tokenDecimals?: number;
};

export class ToastSection {
    readonly approvedMessage: Locator;
    readonly approvedAmount: Locator;
    readonly txSentMessage: Locator;
    readonly txSentAmount: Locator;
    readonly yieldDeposit: Locator;
    readonly toast = (preset: ActivityPreset): Locator => this.page.getByTestId(`@toast/${preset}`);
    readonly toastCloseButton = (preset: ToastActivityPreset): Locator =>
        this.page.getByTestId(`@toast/${preset}/close`);

    constructor(private readonly page: Page) {
        this.approvedMessage = this.page.getByTestId('@toast/tx-approved/message');
        this.approvedAmount = this.page.getByTestId('@toast/tx-approved/amount');
        this.txSentMessage = this.page.getByTestId('@toast/tx-sent/message');
        this.txSentAmount = this.page.getByTestId('@toast/tx-sent/amount');
        this.yieldDeposit = this.page.getByTestId('@toast/tx-yield-deposit');
    }

    @step()
    async verifyTxSentToast({ account, amount, tokenDecimals }: VerifyTxSentToastParams) {
        await expect(this.txSentMessage).toHaveTranslation('TOAST_TX_SENT', {
            values: { account },
        });
        await expect(this.txSentAmount).toHaveText(
            toCompactAmountWithSymbol(amount, { tokenDecimals }),
        );
    }

    @step()
    async dismiss(preset: ToastActivityPreset) {
        await this.toastCloseButton(preset).click();
        await expect(this.toast(preset)).toBeHidden();
    }
}
