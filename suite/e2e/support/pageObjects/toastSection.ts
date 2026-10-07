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
    readonly yieldDepositMessage: Locator;
    readonly yieldWithdrawMessage: Locator;
    readonly wrappedMessage: Locator;
    readonly wrappedSendAmount: Locator;
    readonly wrappedReceiveAmount: Locator;
    readonly txSentViewDetailsButton: Locator;
    readonly txDetailsConfirmed: Locator;
    readonly toast = (preset: ActivityPreset): Locator => this.page.getByTestId(`@toast/${preset}`);
    readonly toastCloseButton = (preset: ToastActivityPreset): Locator =>
        this.page.getByTestId(`@toast/${preset}/close`);

    constructor(private readonly page: Page) {
        this.approvedMessage = this.page.getByTestId('@toast/tx-approved/message');
        this.approvedAmount = this.page.getByTestId('@toast/tx-approved/amount');
        this.txSentMessage = this.page.getByTestId('@toast/tx-sent/message');
        this.txSentAmount = this.page.getByTestId('@toast/tx-sent/amount');
        this.yieldDeposit = this.page.getByTestId('@toast/tx-yield-deposit');
        this.yieldDepositMessage = this.page.getByTestId('@toast/tx-yield-deposit/message');
        this.yieldWithdrawMessage = this.page.getByTestId('@toast/tx-yield-withdraw/message');
        this.wrappedMessage = this.page.getByTestId('@toast/tx-wrap/message');
        this.wrappedSendAmount = this.page.getByTestId('@toast/tx-wrap/send-amount');
        this.wrappedReceiveAmount = this.page.getByTestId('@toast/tx-wrap/receive-amount');
        this.txSentViewDetailsButton = this.page.getByTestId('@toast/tx-sent/view-details');
        this.txDetailsConfirmed = this.page.getByTestId('@modal/tx-details/confirmed');
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
    async openTxSentDetailsAndWaitForConfirmation() {
        await this.toast('tx-sent').click();
        await this.txSentViewDetailsButton.hover();
        // Suite clears the send draft once the broadcast is processed. Opening the
        // detail before that races the navigation.
        await this.page.expectReduxObjectToEqual('wallet.send.drafts', {});
        await this.txSentViewDetailsButton.click();

        // Base confirms in about 5s. Fast-forward the clock so Suite keeps polling
        // until the detail shows confirmed.
        await expect(async () => {
            await this.page.clock.fastForward(30_000);

            await expect(this.txDetailsConfirmed).toHaveTranslation('TR_CONFIRMED_TX');
        }, 'expect Transaction to be confirmed').toPass({ timeout: 30_000 });
    }

    @step()
    async dismiss(preset: ToastActivityPreset) {
        await this.toastCloseButton(preset).click();
        await expect(this.toast(preset)).toBeHidden();
    }
}
