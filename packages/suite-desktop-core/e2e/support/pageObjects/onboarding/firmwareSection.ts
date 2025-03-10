import { Locator, Page, expect } from '@playwright/test';

import { step } from '../../common';

export class FirmwareSection {
    readonly continueButton: Locator;
    readonly skipButton: Locator;
    readonly skipConfirmButton: Locator;
    readonly installFirmwareButton: Locator;
    readonly onboardingLayout: Locator;

    constructor(private readonly page: Page) {
        this.continueButton = this.page.getByTestId('@firmware/continue-button');
        this.skipButton = this.page.getByTestId('@firmware/skip-button');
        this.skipConfirmButton = this.page.getByTestId('@onboarding/skip-button-confirm');
        this.installFirmwareButton = this.page.getByTestId('@firmware/install-button');
        this.onboardingLayout = this.page.getByTestId('@onboarding-layout/body');
    }

    @step()
    async skip() {
        await this.skipButton.click();
        await this.skipConfirmButton.click();
    }

    // This methods serves as watchdog for situation where new firmware is released to suite desktop and web
    // But is not yet available in our TrezorEnv that is used by the test CIs.
    @step()
    async continueThroughFirmware() {
        await expect(this.onboardingLayout).toBeVisible();
        const isInstallButtonVisible = await this.installFirmwareButton.isVisible();
        const isInstallTitleVisible = await this.page.getByText('Installing firmware').isVisible();
        if (isInstallButtonVisible || isInstallTitleVisible) {
            throw new Error(
                'New Firmware was released but it was not yet adopted by our test CIs. Please contact @testautomationhelp in #tech_qa.',
            );
        }
        await expect(this.page.getByText('Firmware ready')).toBeVisible();
        await this.continueButton.click();
    }
}
