import { Locator, Page, expect, test } from '@playwright/test';
import { get } from 'lodash';

declare module '@playwright/test' {
    interface Page {
        // Locators

        // Methods
        discoveryShouldFinish(): Promise<void>;
        selectDropdownOptionWithRetry(dropdown: Locator, option: Locator): Promise<void>;
        expectReduxObjectNotToBeEmpty(
            objectPath: string,
            options?: { timeout?: number },
        ): Promise<void>;
        expectReduxObjectToEqual(
            objectPath: string,
            expectedValue: any,
            options?: { timeout?: number },
        ): Promise<void>;
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

    page.expectReduxObjectNotToBeEmpty = async function (
        objectPath: string,
        options = { timeout: 5000 },
    ) {
        await test.step('Expect Redux object not to be empty', async () => {
            await expect(async () => {
                const state = await page.evaluate(() => window.store.getState());
                const testedObject = get(state, objectPath);
                expect(testedObject).toBeDefined();
                expect(testedObject).not.toBeNull();
                expect(testedObject).not.toEqual({});
            }).toPass({ timeout: options.timeout });
        });
    };

    page.expectReduxObjectToEqual = async function (
        objectPath: string,
        expectedValue: any,
        options = { timeout: 5000 },
    ) {
        await test.step('Expect Redux object to equal', async () => {
            await expect(async () => {
                const state = await page.evaluate(() => window.store.getState());
                const testedObject = get(state, objectPath);
                expect(testedObject).toStrictEqual(expectedValue);
            }).toPass({ timeout: options.timeout });
        });
    };

    return page;
};
