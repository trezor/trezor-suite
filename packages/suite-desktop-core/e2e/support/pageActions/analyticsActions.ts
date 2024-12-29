import { Locator, Page } from '@playwright/test';

import { step } from '../common';

export class AnalyticsActions {
    readonly heading: Locator;
    readonly continueButton: Locator;

    constructor(page: Page) {
        this.continueButton = page.getByTestId('@analytics/continue-button');
        this.heading = page.getByTestId('@analytics/consent/heading');
    }

    @step()
    async passThroughAnalytics() {
        await this.continueButton.click();
        await this.continueButton.click();
    }
}
