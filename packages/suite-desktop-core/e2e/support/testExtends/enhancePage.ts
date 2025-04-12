import { Locator, Page, expect, test } from '@playwright/test';

// Add type declaration
declare module '@playwright/test' {
    interface Page {
        // Locators
        discoveryBar: Locator;
        // Methods
        discoveryShouldFinish(): Promise<void>;
    }
}

// This function enhances the Page object with additional properties and methods
// These properties and methods have general use across the whole test suite.
// It is not specific to any particular test or feature.
export const enhancePage = (page: Page): Page => {
    // Locators
    page.discoveryBar = page.locator('[data-test="@wallet/discovery-progress-bar"]');

    // Methods
    page.discoveryShouldFinish = async function () {
        await test.step('Wait for discovery to finish', async () => {
            await expect(this.discoveryBar, 'discovery bar should be visible').toBeVisible();
            await this.discoveryBar.waitFor({ state: 'detached', timeout: 120_000 });
        });
    };

    return page;
};
