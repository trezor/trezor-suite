import { Locator, Page, expect, test } from '@playwright/test';

declare module '@playwright/test' {
    interface Page {
        // Locators

        // Methods
        discoveryShouldFinish(): Promise<void>;
        selectDropdownOptionWithRetry(dropdown: Locator, option: Locator): Promise<void>;
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

    //Retry mechanism for settings dropdowns which tend to be flaky in automation
    page.selectDropdownOptionWithRetry = async function (dropdown: Locator, option: Locator) {
        await test.step('Select dropdown option with RETRY', async () => {
            await dropdown.scrollIntoViewIfNeeded();
            await expect(async () => {
                if (!(await option.isVisible())) {
                    await dropdown.click({ timeout: 2000 });
                }
                await expect(option).toBeVisible({ timeout: 2000 });
                await option.click({ timeout: 2000 });
            }).toPass({ timeout: 10_000 });
        });
    };

    return page;
};
