import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { step } from '../common';

export class DevicePromptActions {
    readonly confirmOnDevicePrompt: Locator;
    private readonly connectDevicePrompt: Locator;
    readonly modal: Locator;

    constructor(page: Page) {
        this.confirmOnDevicePrompt = page.getByTestId('@prompts/confirm-on-device');
        this.connectDevicePrompt = page.getByTestId('@connect-device-prompt');
        this.modal = page.getByTestId('@modal');
    }

    @step()
    async confirmOnDevicePromptIsShown() {
        await expect(this.confirmOnDevicePrompt).toBeVisible();
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
}
