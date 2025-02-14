import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLinkProxy, step } from '../common';

export class DevicePromptActions {
    readonly confirmOnDevicePrompt: Locator;
    readonly connectDevicePrompt: Locator;
    readonly modal: Locator;
    private readonly paginatedText: Locator;
    private readonly paginatedTextSeparator: Locator;
    readonly chunkedText: Locator;
    readonly outputValue: Locator;
    readonly outputValueOf = (
        section: 'default' | 'address' | 'data' | 'amount' | 'fee' | 'total',
    ) => this.page.getByTestId(`@modal/output-${section}`).getByTestId('@modal/output-value');
    readonly cryptoAmountOf = (section: 'amount' | 'fee' | 'total') =>
        this.page
            .getByTestId(`@modal/output-${section}`)
            .getByTestId('@modal/crypto-amount-with-symbol');
    readonly fiatAmountOf = (section: 'amount' | 'fee' | 'total') =>
        this.page.getByTestId(`@modal/output-${section}`).getByTestId('@modal/fiat-amount');
    readonly reviewAmount: Locator;
    readonly sellButton: Locator;

    constructor(private page: Page) {
        this.confirmOnDevicePrompt = page.getByTestId('@prompts/confirm-on-device');
        this.connectDevicePrompt = page.getByTestId('@connect-device-prompt');
        this.modal = page.getByTestId('@modal');
        this.paginatedText = page.locator("[data-testid-alt='@device-display/paginated-text']");
        this.paginatedTextSeparator = page.getByTestId('@device-display/paginated-text/separator');
        this.chunkedText = page.getByTestId('@device-display/chunked-text');
        this.outputValue = page.getByTestId('@modal/output-value');
        this.reviewAmount = page.getByTestId('@modal/transaction-review/amount');
        this.sellButton = page.getByTestId('@modal/send');
    }

    @step()
    async confirmOnDevicePromptIsShown() {
        await expect(
            this.confirmOnDevicePrompt,
            "'confirm on device' prompt should be visible",
        ).toBeVisible();
    }

    @step()
    async confirmOnDevicePromptIsHidden() {
        await expect(this.confirmOnDevicePrompt).toBeHidden();
    }

    @step()
    async connectDevicePromptIsShown() {
        await expect(this.connectDevicePrompt).toBeVisible();
    }

    @step()
    async waitForPromptAndConfirm() {
        await this.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLinkProxy.pressYes();
    }

    @step()
    private async getPaginatedTextSeparator(): Promise<string | false> {
        const isSeparatorVisible = await this.paginatedTextSeparator.isVisible();
        if (!isSeparatorVisible) {
            return false;
        }
        const separatorText = await this.paginatedTextSeparator.textContent();

        return typeof separatorText === 'string' ? separatorText : false;
    }

    @step()
    async combinedPaginatedText() {
        let textsArray = await this.paginatedText.allTextContents();
        const separatorText = await this.getPaginatedTextSeparator();
        if (separatorText) {
            textsArray = textsArray.map(text => text.replace(separatorText, ''));
        }
        const removeWhitespaces = (text: string) => text.replace(/\s+/g, '');

        return textsArray.map(removeWhitespaces).join('');
    }
}
