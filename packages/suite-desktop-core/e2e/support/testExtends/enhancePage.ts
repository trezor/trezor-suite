import { Locator, Page, expect, test } from '@playwright/test';
import { writeFileSync } from 'fs';
import { get } from 'lodash';
import { join } from 'path';

declare module '@playwright/test' {
    interface Page {
        // Locators

        // Methods
        discoveryShouldFinish(): Promise<void>;
        selectDropdownOptionWithRetry(dropdown: Locator, option: Locator): Promise<void>;
        getReduxObject(objectPath: string): Promise<any>;
        expectReduxObjectNotToBeEmpty(
            objectPath: string,
            options?: { timeout?: number },
        ): Promise<void>;
        expectReduxObjectToEqual(
            objectPath: string,
            expectedValue: any,
            options?: { timeout?: number },
        ): Promise<void>;
        runWithReduxDump<T>(
            action: () => Promise<T>,
            options?: { slice?: string; filePrefix?: string },
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
            await expect(async () => {
                await dropdown.scrollIntoViewIfNeeded();
                if (!(await option.isVisible())) {
                    await dropdown.click({ timeout: 2000 });
                }
                await expect(option).toBeVisible({ timeout: 2000 });
                await option.click({ timeout: 2000 });
            }).toPass({ timeout: 10_000 });
        });
    };

    page.getReduxObject = async (objectPath: string) => {
        const state = await page.evaluate(() => window.store.getState());

        return get(state, objectPath);
    };

    page.expectReduxObjectNotToBeEmpty = async function (
        objectPath: string,
        options = { timeout: 5000 },
    ) {
        await test.step('Expect Redux object not to be empty', async () => {
            await expect(async () => {
                const testedObject = await page.getReduxObject(objectPath);
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
                const testedObject = await page.getReduxObject(objectPath);
                expect(testedObject).toStrictEqual(expectedValue);
            }).toPass({ timeout: options.timeout });
        });
    };

    page.runWithReduxDump = async function <T>(
        action: () => Promise<T>,
        options?: { slice?: string; filePrefix?: string },
    ): Promise<void> {
        const slice = options?.slice ?? 'wallet';
        const prefix = options?.filePrefix ?? slice;
        const ts = new Date().toISOString().replace(/[:.]/g, '-');

        const beforeRaw = await page.getReduxObject(slice);
        const beforePath = join(process.cwd(), `${prefix}_before_${ts}.json`);
        writeFileSync(beforePath, JSON.stringify(beforeRaw, null, 2), 'utf-8');

        await action();

        const afterRaw = await page.getReduxObject(slice);
        const afterPath = join(process.cwd(), `${prefix}_after_${ts}.json`);
        writeFileSync(afterPath, JSON.stringify(afterRaw, null, 2), 'utf-8');

        throw new Error(`Redux dumps written to:
- ${beforePath}
- ${afterPath}
You can use a diff tool to compare the state before and after the action.
        `);
    };

    return page;
};
