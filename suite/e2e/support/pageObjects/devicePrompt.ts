import { Locator, Page, expect } from '@playwright/test';

import { step } from '../common';
import { DeviceFixture } from '../device';
import { DevicePromptHeaderSection } from './devicePromptHeaderSection';

export class DevicePrompt {
    readonly confirmOnDevicePrompt: Locator;
    readonly confirmOnDevicePromptSuccess: Locator;
    readonly connectDevicePrompt: Locator;
    readonly modal: Locator;
    readonly modalCloseButton: Locator;
    private readonly paginatedText: Locator;
    private readonly paginatedTextSeparator: Locator;
    readonly chunkedText: Locator;
    readonly outputValue: Locator;
    readonly outputValueOf = (
        section:
            | 'default'
            | 'address'
            | 'data'
            | 'amount'
            | 'fee'
            | 'total'
            | 'contract'
            | 'swap_intent'
            | 'recipient_name',
    ) => this.page.getByTestId(`@modal/output-${section}`).getByTestId('@modal/output-value');
    readonly cryptoAmountWithSymbolOf = (section: 'amount' | 'fee' | 'total') =>
        this.page
            .getByTestId(`@modal/output-${section}`)
            .getByTestId('@modal/crypto-amount-with-symbol');
    readonly cryptoAmountOf = (section: 'amount' | 'fee' | 'total') =>
        this.page.getByTestId(`@modal/output-${section}`).getByTestId('@modal/crypto-amount');
    readonly fiatAmountOf = (section: 'amount' | 'fee' | 'total') =>
        this.page.getByTestId(`@modal/output-${section}`).getByTestId('@modal/fiat-amount');
    readonly assetsSendCryptoAmount: Locator;
    readonly assetsReceiveCryptoAmount: Locator;
    readonly assetsReceiveAddress: Locator;
    readonly reviewAmount: Locator;
    readonly sendButton: Locator;
    readonly header: DevicePromptHeaderSection;
    readonly acquireDeviceButton: Locator;
    readonly closeButton: Locator;

    constructor(
        private page: Page,
        private device: DeviceFixture,
    ) {
        this.confirmOnDevicePrompt = page.getByTestId('@prompts/confirm-on-device');
        this.confirmOnDevicePromptSuccess = page.getByTestId('@prompts/confirm-on-device/success');
        this.connectDevicePrompt = page.getByTestId('@connect-device-prompt');
        this.modalCloseButton = page.modalCloseButton;
        this.modal = page.modal;
        this.paginatedText = page.locator("[data-testid-alt='@device-display/paginated-text']");
        this.paginatedTextSeparator = page.getByTestId('@device-display/paginated-text/separator');
        this.chunkedText = page.getByTestId('@device-display/chunked-text');
        this.outputValue = page.getByTestId('@modal/output-value');
        this.assetsSendCryptoAmount = page.getByTestId('@modal/assets/send/crypto');
        this.assetsReceiveCryptoAmount = page.getByTestId('@modal/assets/receive/crypto');
        this.assetsReceiveAddress = page.getByTestId('@modal/assets/receive/address');
        this.reviewAmount = page.getByTestId('@modal/transaction-review/amount');
        this.sendButton = page.getByTestId('@modal/send');
        this.header = new DevicePromptHeaderSection(page);
        this.acquireDeviceButton = this.page.getByTestId('@device-acquire');
        this.closeButton = this.page.getByTestId('@confirm-on-device/close-button');
    }

    @step()
    async confirmOnDevicePromptIsShown(params?: { timeout?: number }) {
        await expect(
            this.confirmOnDevicePrompt,
            "'confirm on device' prompt should be visible",
        ).toBeVisible({ timeout: params?.timeout });
    }

    @step()
    async confirmOnDeviceIsCompleted() {
        await this.confirmOnDevicePromptIsShown();
        await expect(this.confirmOnDevicePrompt).toContainText('Confirm on Trezor');
        await expect(this.confirmOnDevicePromptSuccess).toHaveText('Confirmed');
    }

    @step()
    async confirmOnDevicePromptIsHidden() {
        await expect(this.confirmOnDevicePrompt).toBeHidden();
    }

    @step()
    async connectDevicePromptIsShown(params?: { timeout?: number }) {
        await expect(this.connectDevicePrompt).toBeVisible({ timeout: params?.timeout });
    }

    @step()
    async waitForPromptAndConfirm() {
        await this.confirmOnDevicePromptIsShown();
        await this.device.pressYes();
    }

    @step()
    async allowConnectToTrezor() {
        await this.confirmOnDevicePromptIsShown({ timeout: 30_000 });
        await this.device.pressYes();
    }

    @step()
    async waitForPromptAndClick(): Promise<void> {
        await this.confirmOnDevicePromptIsShown();
        await this.device.tapCenter();
    }

    @step()
    async waitForFinalPromptAndConfirm() {
        await this.confirmOnDevicePromptIsShown();
        await this.device.pressYes();
        await this.confirmOnDeviceIsCompleted();
    }

    @step()
    async getAddressFromDisplay() {
        // may not work for multi page addresses
        await this.confirmOnDevicePromptIsShown();
        const addressRaw = (await this.device.getDisplayContent()).body;
        if (!addressRaw) {
            throw new Error('No address found on emulator display');
        }

        return addressRaw[0].join('').replace(/\n/g, '');
    }

    // This method confirms the Suite Sync device prompt and device provides necessary keys to suite.
    // E2E limitation is that keys cannot be stored and because of that another prompt is called.
    // This secondary device prompt for Suite Sync happens on first label change per wallet
    @step()
    async confirmSuiteSyncSetup() {
        await this.device.expectToContainOnDisplay('Sync');
        await this.confirmOnDevicePromptIsShown();
        await this.device.pressYes();
        // wait before closing the modal to prevent "Trezor Sync key retrieval failed" error
        await this.page.waitForTimeout(2_000);
    }

    @step()
    async compareAddressesOnDeviceAndSuite() {
        const addressFromSuite = await this.outputValueOf('address').innerText();
        const addressFromDevice = await this.getAddressFromDisplay();
        expect(addressFromSuite.replace(/\s/g, '')).toBe(addressFromDevice.replace(/\s/g, ''));
    }

    @step()
    private async getPaginatedTextSeparator(): Promise<string | false> {
        const isSeparatorVisible = await this.paginatedTextSeparator.isVisible();
        if (!isSeparatorVisible) {
            return false;
        }

        return await this.paginatedTextSeparator.innerText();
    }

    @step()
    async combinedPaginatedText() {
        let textsArray = await this.paginatedText.allInnerTexts();
        const separatorText = await this.getPaginatedTextSeparator();
        if (separatorText) {
            textsArray = textsArray.map(text => text.replace(separatorText, ''));
        }
        const removeWhitespaces = (text: string) => text.replace(/\s+/g, '');

        return textsArray.map(removeWhitespaces).join('');
    }

    @step()
    async closeModal() {
        await this.modalCloseButton.click();
        await expect(this.modal).toBeHidden();
    }
}
