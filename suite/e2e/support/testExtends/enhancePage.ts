import { Locator, Page, expect, test } from '@playwright/test';
import { writeFileSync } from 'fs';
import { get, isMatch, set } from 'lodash';
import { join } from 'path';

import {
    DeviceStateMock,
    ExpectDeviceStateOptions,
    MockBluetoothOptions,
} from './mocks/deviceStateMock';

declare module '@playwright/test' {
    interface Page {
        // Locators
        modal: Locator;
        modalHeader: Locator;
        modalCloseButton: Locator;

        // External Mocks
        /**
         * Mocks a Bluetooth device context by synchronizing the Device Manager and Bluetooth Manager state.
         * @see {@link DeviceStateMock.mockBluetooth} for detailed description.
         */
        mockDeviceBluetoothState(options?: MockBluetoothOptions): Promise<void>;
        expectDeviceState(expected: ExpectDeviceStateOptions): Promise<void>;
        // Methods
        discoveryShouldFinish(): Promise<void>;
        /**
         * Ensure that the Redux store is exposed, which is not instant in Playwright Electron.
         * On Desktop this must be called before using the store further.
         * On Web this is no-op (resolves instantly).
         */
        ensureStoreOnDesktop(): Promise<void>;
        expectReduxObjectNotToBeEmpty(
            objectPath: string,
            options?: { timeout?: number },
        ): Promise<void>;
        expectReduxObjectToEqual(
            objectPath: string,
            expectedValue: any,
            options?: { timeout?: number },
        ): Promise<void>;
        expectReduxSubtreeToContain(
            rootPath: string,
            nestedPath: string,
            expectedValue: unknown,
            options?: { timeout?: number },
        ): Promise<void>;
        getReduxObject(objectPath?: string): Promise<any>;
        resetMousePosition(): Promise<void>;
        runWithReduxDump<T>(
            action: () => Promise<T>,
            options?: { slice?: string; filePrefix?: string },
        ): Promise<void>;
        selectDropdownOptionWithRetry(dropdown: Locator, option: Locator): Promise<void>;
    }
}

// This function enhances the Page object with additional properties and methods
// These properties and methods have general use across the whole test suite.
// It is not specific to any particular test or feature.
export const enhancePage = (page: Page): Page => {
    const deviceStateMock = new DeviceStateMock(page);

    // Locators
    page.modal = page.getByTestId('@modal');
    page.modalHeader = page.getByTestId('@modal/header');
    page.modalCloseButton = page.getByTestId('@modal/close-button');

    // External Mocks
    page.mockDeviceBluetoothState = options => deviceStateMock.mockBluetooth(options);
    page.expectDeviceState = expected => deviceStateMock.expectDeviceState(expected);

    // High-Level Helpers
    page.discoveryShouldFinish = async function () {
        const discoveryBar = page.getByTestId('@wallet/discovery-progress-bar');
        await test.step('Wait for discovery to finish', async () => {
            await expect(async () => {
                if (await discoveryBar.isVisible()) {
                    await discoveryBar.waitFor({ state: 'detached', timeout: 120_000 });
                }
                await expect(discoveryBar).toBeHidden();
            }).toPass({ timeout: 120_000 });
        });
    };

    // Low-Level Infrastructure (Redux utils, Retry mechanisms, etc.)

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

    page.ensureStoreOnDesktop = async () => {
        await expect(async () => {
            const store = await page.evaluate(() => window.store);
            expect(store).toBeDefined();
        }).toPass({ timeout: 5000 });
    };

    page.getReduxObject = async (objectPath?: string) => {
        const state = await page.evaluate(() => window.store.getState());

        if (!objectPath) {
            return state;
        }

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
                expect(testedObject).not.toEqual([]);
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

    page.expectReduxSubtreeToContain = async function (
        rootPath: string,
        nestedPath: string,
        expectedValue: unknown,
        options = { timeout: 5000 },
    ) {
        await test.step('Expect Redux subtree to contain', async () => {
            await expect(async () => {
                const root = await page.getReduxObject(rootPath);
                const needle: Record<string, unknown> = {};
                set(needle, nestedPath, expectedValue);

                const found = (function walk(node: unknown): boolean {
                    if (!node || typeof node !== 'object') return false;
                    if (isMatch(node, needle)) return true;

                    return Object.values(node as Record<string, unknown>).some(walk);
                })(root);

                const errorMessage = `Expected Redux subtree "${rootPath}" to contain ${JSON.stringify(needle, null, 2)}`;
                expect(found, errorMessage).toBe(true);
            }).toPass({ timeout: options.timeout });
        });
    };

    page.runWithReduxDump = async function <T>(
        action: () => Promise<T>,
        options?: { slice?: string; filePrefix?: string },
    ): Promise<void> {
        const prefix = options?.filePrefix ?? options?.slice ?? 'redux_dump';
        const ts = new Date().toISOString().replace(/[:.]/g, '-');

        const beforeRaw = await page.getReduxObject(options?.slice);
        const beforePath = join(process.cwd(), `${prefix}_before_${ts}.json`);
        writeFileSync(beforePath, JSON.stringify(beforeRaw, null, 2), 'utf-8');

        await action();

        const afterRaw = await page.getReduxObject(options?.slice);
        const afterPath = join(process.cwd(), `${prefix}_after_${ts}.json`);
        writeFileSync(afterPath, JSON.stringify(afterRaw, null, 2), 'utf-8');

        throw new Error(`Redux dumps written to:
- ${beforePath}
- ${afterPath}
You can use a diff tool to compare the state before and after the action.
        `);
    };

    page.resetMousePosition = async function () {
        await page.mouse.move(0, 0); // reset mouse position to avoid hover issues
    };

    return page;
};
