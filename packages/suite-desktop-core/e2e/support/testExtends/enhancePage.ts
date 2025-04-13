import { Page, expect, test } from '@playwright/test';

declare module '@playwright/test' {
    interface Page {
        // Locators

        // Methods
        discoveryShouldFinish(): Promise<void>;
    }
}

// This function enhances the Page object with additional properties and methods
// These properties and methods have general use across the whole test suite.
// It is not specific to any particular test or feature.
export const enhancePage = (page: Page): Page => {
    // Locators

    // Methods
    page.discoveryShouldFinish = async function () {
        const discoveryBar = page.getByTestId('@wallet/discovery-progress-bar');
        await test.step('Wait for discovery to finish', async () => {
            await expect(discoveryBar, 'discovery bar should be visible').toBeVisible({
                timeout: 15_000,
            });
            await discoveryBar.waitFor({ state: 'detached', timeout: 120_000 });
        });
    };

    return page;
};
