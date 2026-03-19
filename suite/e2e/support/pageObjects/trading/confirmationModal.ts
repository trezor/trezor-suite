import { Locator, Page } from '@playwright/test';

import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';
import { DevicePrompt } from '../devicePrompt';

export class TradingConfirmationModal {
    readonly modal: Locator;
    readonly section: Locator;
    readonly account: Locator;
    readonly accountDropdown: Locator;
    readonly cryptoAmount: Locator;
    readonly fiatAmount: Locator;
    readonly provider: Locator;
    readonly address: Locator;
    readonly paymentMethod: Locator;
    readonly paymentId: Locator;
    readonly exchangeType: Locator;
    readonly transactionId: Locator;
    readonly copyTransactionIdButton: Locator;
    readonly finishButton: Locator;
    readonly confirmAndSendButton: Locator;

    constructor(
        private readonly page: Page,
        private readonly devicePrompt: DevicePrompt,
    ) {
        this.modal = this.page.modal;
        this.section = this.page.getByTestId('@trading/selected-offer');
        this.account = this.page.getByTestId('@trading/form/verify/account');
        this.accountDropdown = this.page.getByTestId('@trading/verify-options/account/input');
        this.cryptoAmount = this.page.getByTestId('@trading/form/info/crypto-amount');
        this.fiatAmount = this.page.getByTestId('@trading/form/info/fiat-amount');
        this.provider = this.page.getByTestId('@trading/form/info/provider');
        this.address = this.page.getByTestId('@trading/form/verify/address');
        this.paymentMethod = this.page.getByTestId('@trading/form/info/payment-method');
        this.paymentId = this.page.getByTestId('@trading/form/verify/extra-id');
        this.exchangeType = this.page.getByTestId('@trading/offer/info/exchange-type');
        this.transactionId = this.page.getByTestId('@trading/transaction-id');
        this.copyTransactionIdButton = this.page
            .getByTestId('@trading/form/info')
            .getByRole('button', { name: 'Copy' });
        this.finishButton = this.page.getByTestId('@trading/offer/continue-transaction-button');
        this.confirmAndSendButton = this.page.getByTestId(
            '@trading/offer/confirm-on-trezor-and-send',
        );
    }

    @step()
    async initiateSendConfirmation(options?: { confirmAlsoToken: boolean }) {
        await this.openConfirmAndSendModal();
        await this.devicePrompt.compareAddressesOnDeviceAndSuite();
        await this.devicePrompt.waitForPromptAndConfirm();
        await this.devicePrompt.waitForPromptAndConfirm();

        if (options?.confirmAlsoToken) {
            await this.devicePrompt.waitForPromptAndConfirm();
        }

        await this.devicePrompt.waitForFinalPromptAndConfirm();
        // Note: We intentionally skip clicking the sell button in tests to prevent actual cryptocurrency transactions.
        // In a real scenario, the user would complete the transaction by clicking this button.
        await expect(this.devicePrompt.sendButton).toBeEnabled();
    }

    @step()
    async openConfirmAndSendModal() {
        await this.confirmAndSendButton.click({ timeout: 30_000 });
        await expect(this.modal).toBeVisible();
        await expect(this.devicePrompt.sendButton).toBeDisabled();
    }
}
