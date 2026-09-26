import { Locator, Page, expect } from '@playwright/test';

import { step } from '../../common';

export class FirmwareSection {
    readonly continueButton: Locator;
    readonly skipButton: Locator;
    readonly skipConfirmButton: Locator;
    readonly installFirmwareButton: Locator;
    readonly currentVersion: Locator;
    readonly offeredVersion: Locator;
    readonly offeredVersionTooltip: Locator;
    readonly onboardingLayout: Locator;

    constructor(private readonly page: Page) {
        this.continueButton = this.page.getByTestId('@firmware/continue-button');
        this.skipButton = this.page.getByTestId('@firmware/skip-button');
        this.skipConfirmButton = this.page.getByTestId('@onboarding/skip-button-confirm');
        this.installFirmwareButton = this.page.getByTestId('@firmware/install-button');
        this.currentVersion = this.page.getByTestId('@firmware/offer-version/current');
        this.offeredVersion = this.page.getByTestId('@firmware/offer-version/new');
        this.offeredVersionTooltip = this.page.getByTestId('@firmware/offer-version/new/tooltip');
        this.onboardingLayout = this.page.getByTestId('@onboarding-layout/body');
    }

    @step()
    async skip() {
        await this.skipButton.click();
        await this.skipConfirmButton.click();
    }

    @step()
    async continueThroughFirmware() {
        await expect(this.onboardingLayout).toBeVisible();
        // Test using this method do not care if we have current firmware or not
        // that is way we are using Promise.race to get through firmware check either way
        await Promise.race([this.continueButton.click(), this.skip()]);
    }

    @step()
    async expectFirmwareToBeReady() {
        await expect(this.onboardingLayout).toBeVisible();
        await expect(this.continueButton).toBeVisible();
        await expect(this.installFirmwareButton).toBeHidden();
        await expect(this.skipButton).toBeHidden();
    }

    @step()
    async expectFirmwareUpdateToBeOffered({
        currentVersion,
        offeredVersion,
        changelog,
    }: {
        currentVersion: string;
        offeredVersion: string;
        changelog: string;
    }) {
        await expect(this.onboardingLayout).toBeVisible();
        await expect(this.installFirmwareButton).toBeVisible();
        await expect(this.skipButton).toBeVisible();
        await expect(this.currentVersion).toContainText(currentVersion);
        await expect(this.offeredVersion).toContainText(offeredVersion);

        await this.offeredVersion.hover();
        await expect(this.offeredVersionTooltip).toContainText(offeredVersion);
        await expect(this.offeredVersionTooltip).toContainText(changelog);
    }
}
