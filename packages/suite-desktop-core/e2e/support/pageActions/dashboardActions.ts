import { Page } from '@playwright/test';

import { waitForDataTestSelector } from '../common';

class DashboardActions {
    async passThroughInitialRun(window: Page) {
        await waitForDataTestSelector(window, '@welcome/title');
        await window.getByTestId('@analytics/continue-button').click();
        await window.getByTestId('@onboarding/exit-app-button').click();
    }

    async discoveryShouldFinish(window: Page) {
        const discoveryBarSelector = '@wallet/discovery-progress-bar';
        await waitForDataTestSelector(window, discoveryBarSelector, {
            state: 'attached',
            timeout: 10_000,
        });
        await waitForDataTestSelector(window, discoveryBarSelector, {
            state: 'detached',
            timeout: 120_000,
        });
        await waitForDataTestSelector(window, '@dashboard/graph', { timeout: 30000 });
    }

    // asserts
    async getRegtestValue(window: Page) {
        return (
            (await waitForDataTestSelector(window, '@wallet/coin-balance/value-regtest')) ?? true
        );
    }
}

export const onDashboardPage = new DashboardActions();
