import { Locator, Page } from '@playwright/test';

export class FirmwareActions {
    readonly continueButton: Locator;
    readonly skipButton: Locator;
    readonly skipConfirmButton: Locator;

    constructor(private readonly page: Page) {
        this.continueButton = this.page.getByTestId('@firmware/continue-button');
        this.skipButton = this.page.getByTestId('@firmware/skip-button');
        this.skipConfirmButton = this.page.getByTestId('@onboarding/skip-button-confirm');
    }

    async skip() {
        await this.skipButton.click();
        await this.skipConfirmButton.click();
    }
}
