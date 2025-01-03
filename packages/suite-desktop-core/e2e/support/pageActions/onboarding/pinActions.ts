import { Locator, Page } from '@playwright/test';

import { step } from '../../common';

export class PinActions {
    readonly skipButton: Locator;
    readonly setPinButton: Locator;
    readonly skipConfirmButton: Locator;
    readonly continueButton: Locator;

    constructor(private readonly page: Page) {
        this.skipButton = this.page.getByTestId('@onboarding/skip-button');
        this.setPinButton = this.page.getByTestId('@onboarding/set-pin-button');
        this.skipConfirmButton = this.page.getByTestId('@onboarding/skip-button-confirm');
        this.continueButton = this.page.getByTestId('@onboarding/pin/continue-button');
    }

    @step()
    async skip() {
        await this.skipButton.click();
        await this.skipConfirmButton.click();
    }
}
