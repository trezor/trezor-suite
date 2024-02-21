/* eslint no-await-in-loop: 0 */

import { test, expect, Page } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const connectUrl = process.env.URL
    ? process.env.URL.replace('connect-explorer', 'connect')
    : 'https://connect.trezor.io/9/';

const url = `https://unchained-capital.github.io/caravan?trezor-connect-src=${connectUrl}`;

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
});

const handleAnalyticsConfirm = async (popup: Page) => {
    await popup.waitForSelector("button[data-test-id='@analytics/continue-button']", {
        state: 'visible',
        timeout: 40000,
    });
    await popup.click("button[data-test-id='@analytics/continue-button']");
};

/**
 * Returns a connect popup page
 * @param {Page} page - an instance of playwright's page object
 * @returns {Object}
 */
const getConnectPopup = async (page: Page) => {
    const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.locator('button', { hasText: 'Start Test' }).click(),
    ]);
    await popup.waitForLoadState('load');

    return popup;
};

/**
 * Clicks on "Don't ask again" input and confirms it
 * @param {Page} popup - an instance of playwright's page object
 */
const handleDontAskAgain = async (popup: Page) => {
    const confirmBtn = 'button.confirm';
    await popup.waitForSelector(confirmBtn, { state: 'visible', timeout: 40000 });
    await popup.locator('text="Don\'t ask me again"').first().click();
    await popup.click(confirmBtn);
};

/**
 * Waits and verifies that the test finished correctly
 * @param {Page} popup - an instance of playwright's page object
 */
const assertSuccess = async (page: Page) => {
    const testResult = await page.waitForSelector('h5[class*="TestRun-success"]', {
        state: 'visible',
        timeout: 30000,
    });
    expect(testResult).toBeTruthy();
};

/**
 * Handles the export public type unchained test
 * @param {Page} page - an instance of playwright's page object
 * @param {number} iteration
 */
const exportPublicKey = async (page: Page, iteration: number) => {
    const confirmBtn = 'button.confirm';
    // withe the exception of the first iteration, continue to the next test
    if (iteration !== 0) await page.locator('button:has-text("Next")').click();
    const popup = await getConnectPopup(page);
    // click on "Don't ask again" in the first iteration
    if (iteration === 0) {
        await handleAnalyticsConfirm(popup);
        await handleDontAskAgain(popup);
    }
    await popup.waitForSelector(confirmBtn, { state: 'visible' });
    await popup.click(confirmBtn);
    await assertSuccess(page);
};

/**
 * Handles the sign type unchained test
 * @param {Page} page - an instance of playwright's page object
 * @param {number} iteration
 */
const signTransaction = async (page: Page, iteration: number) => {
    await page.locator('button:has-text("Next")').click();
    const popup = await getConnectPopup(page);
    if (iteration === 0) await handleDontAskAgain(popup);

    await popup.waitForSelector('//p[contains(., "Check recipient")]', {
        state: 'visible',
        timeout: 40000,
        strict: false,
    });
    let confirmOnTrezorScreenStilVisible = true;
    while (confirmOnTrezorScreenStilVisible) {
        try {
            await popup.waitForSelector('//p[contains(., "Check recipient")]', {
                state: 'visible',
                timeout: 501,
                strict: false,
            });
            await TrezorUserEnvLink.send({ type: 'emulator-press-yes' });
            await popup.waitForTimeout(501);
        } catch (err) {
            confirmOnTrezorScreenStilVisible = false;
        }
    }

    await popup.waitForSelector('//p[contains(., "Follow instructions on your device")]', {
        state: 'visible',
        timeout: 501,
        strict: false,
    });
    await TrezorUserEnvLink.send({ type: 'emulator-press-yes' });
    await assertSuccess(page);
};

test.beforeEach(async () => {
    await TrezorUserEnvLink.api.stopBridge();
    await TrezorUserEnvLink.api.stopEmu();
    await TrezorUserEnvLink.api.startEmu({
        wipe: true,
    });
    await TrezorUserEnvLink.api.setupEmu({
        mnemonic:
            'merge alley lucky axis penalty manage latin gasp virus captain wheel deal chase fragile chapter boss zero dirt stadium tooth physical valve kid plunge',
        pin: '',
        passphrase_protection: false,
        label: 'My Trevor',
        needs_backup: false,
    });
    await TrezorUserEnvLink.api.startBridge();
});

/**
 * Test case:
 * 1. navigate to the unchained test url
 * 2. select Trezor
 * 3. detect its model version
 * 4. execute all 19 tests
 */
test('Verify unchained test suite', async ({ browser }) => {
    test.setTimeout(1000 * 60 * 3);

    const context = await browser.newContext({
        userAgent:
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    const keystoreInput = '#keystore-select';
    await page.goto(url);
    await page.getByRole('link', { name: 'tested' }).click();
    await page.locator(keystoreInput).click();
    // select trezor
    await page.locator('[data-value="trezor"]').click();
    // detect the model version
    await page.locator('button', { hasText: 'Detect' }).click();
    await expect(page.locator('input[name="version"]')).not.toHaveText('Version');
    // start the suite
    await page.locator('button', { hasText: 'Begin Test Suite' }).click();

    // tests without a Trezor interaction
    for (let i = 0; i < 13; i++) {
        await exportPublicKey(page, i);
    }
    // tests with interactions
    for (let i = 0; i < 6; i++) {
        await signTransaction(page, i);
    }
    //
    // Assert
    //
    await page.waitForSelector('text=19 SUCCESS');
    // expect(successfullTests).toContain('');

    await page.close();
    await context.close();
});
