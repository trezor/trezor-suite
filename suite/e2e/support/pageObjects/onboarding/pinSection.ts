import { Locator, Page } from '@playwright/test';

import { step } from '../../common';

export class PinSection {
    readonly skipButton: Locator;
    readonly setPinButton: Locator;
    readonly skipConfirmButton: Locator;
    readonly pinButton = (pinNumber: number): Locator =>
        this.page.getByTestId(`@pin/input/${pinNumber}`);
    readonly tryAgainButton: Locator;
    readonly pinMismatch: Locator;

    constructor(private readonly page: Page) {
        this.skipButton = this.page.getByTestId('@onboarding/skip-button');
        this.setPinButton = this.page.getByTestId('@onboarding/set-pin-button');
        this.skipConfirmButton = this.page.getByTestId('@onboarding/skip-button-confirm');
        this.tryAgainButton = this.page.getByTestId('@pin-mismatch/try-again-button');
        this.pinMismatch = this.page.getByTestId('@pin-mismatch');
    }

    @step()
    async skip() {
        await this.skipButton.click();
        await this.skipConfirmButton.click();
    }
}
