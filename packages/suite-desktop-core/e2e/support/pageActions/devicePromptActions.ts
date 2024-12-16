import { Locator, Page, expect } from '@playwright/test';

export class DevicePromptActions {
    private readonly confirmOnDevicePrompt: Locator;
    private readonly connectDevicePrompt: Locator;

    constructor(page: Page) {
        this.confirmOnDevicePrompt = page.getByTestId('@onboarding/confirm-on-device');
        this.connectDevicePrompt = page.getByTestId('@connect-device-prompt');
    }

    async confirmOnDevicePromptIsShown() {
        await expect(this.confirmOnDevicePrompt).toBeVisible();
    }

    async connectDevicePromptIsShown() {
        await expect(this.connectDevicePrompt).toBeVisible();
    }
}
