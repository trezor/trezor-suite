import { type Locator, type Page } from '@playwright/test';

export class YieldConsentModal {
    readonly modalContainer: Locator;
    readonly heading: Locator;
    readonly acknowledgeCheckbox: Locator;
    readonly confirmButton: Locator;

    constructor(private readonly page: Page) {
        this.modalContainer = this.page.getByTestId('@modal/earn-provider-consent');
        this.heading = this.modalContainer.getByTestId('@modal/header');
        this.acknowledgeCheckbox = this.modalContainer.getByTestId(
            '@staking/provider-acknowledge-checkbox',
        );
        this.confirmButton = this.modalContainer.getByTestId('@modal/staking/confirm-button');
    }
}
