import { Locator, Page } from '@playwright/test';

import { step } from '../common';

export class AnalyticsSection {
    readonly heading: Locator;
    readonly continueButton: Locator;
    readonly toggleSwitch: Locator;

    constructor(private readonly page: Page) {
        this.continueButton = page.getByTestId('@analytics/continue-button');
        this.heading = page.getByTestId('@analytics/consent/heading');
        this.toggleSwitch = page.getByTestId('@analytics/toggle-switch');
    }

    @step()
    async waitForAnalytics(params: Record<string, string>) {
        const request = await this.page.waitForRequest(req => {
            const url = new URL(req.url());
            if (url.hostname !== 'data.trezor.io') return false;

            return Object.entries(params).every(
                ([key, value]) => url.searchParams.get(key) === value,
            );
        });

        return Object.fromEntries(new URL(request.url()).searchParams);
    }

    @step()
    async passThroughAnalytics() {
        await this.continueButton.click();
        await this.continueButton.click();
    }
}
