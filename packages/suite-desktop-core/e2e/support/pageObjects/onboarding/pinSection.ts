import { Locator, Page } from '@playwright/test';

import { step } from '../../common';

export class PinSection {
    readonly skipButton: Locator;
    readonly setPinButton: Locator;
    readonly skipConfirmButton: Locator;

    constructor(private readonly page: Page) {
        this.skipButton = this.page.getByTestId('@onboarding/skip-button');
        this.setPinButton = this.page.getByTestId('@onboarding/set-pin-button');
        this.skipConfirmButton = this.page.getByTestId('@onboarding/skip-button-confirm');
    }

    @step()
    async skip() {
        await this.skipButton.click();
        await this.skipConfirmButton.click();
    }
}
