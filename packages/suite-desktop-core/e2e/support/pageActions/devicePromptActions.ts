import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { step } from '../common';

export class DevicePromptActions {
    readonly confirmOnDevicePrompt: Locator;
    private readonly connectDevicePrompt: Locator;
    readonly modal: Locator;
    private readonly paginatedText: Locator;
    private readonly paginatedTextSeparator: Locator;

    constructor(page: Page) {
        this.confirmOnDevicePrompt = page.getByTestId('@prompts/confirm-on-device');
        this.connectDevicePrompt = page.getByTestId('@connect-device-prompt');
        this.modal = page.getByTestId('@modal');
        this.paginatedText = page.locator("[data-testid-alt='@device-display/paginated-text']");
        this.paginatedTextSeparator = page.getByTestId('@device-display/paginated-text/separator');
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
        await TrezorUserEnvLink.pressYes();
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
