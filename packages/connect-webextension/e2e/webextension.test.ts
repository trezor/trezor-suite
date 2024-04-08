// eslint-disable-next-line @typescript-eslint/no-shadow
import { test, expect, chromium } from '@playwright/test';
import path from 'path';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { ensureDirectoryExists } from '@trezor/node-utils';

export const log = (...val: string[]) => {
    console.log(`[===]`, ...val);
};

let dir: string;
test.beforeAll(async () => {
    dir = await ensureDirectoryExists('./screenshots/web-extension');
});

test('Basic web extension MV2', async () => {
    await TrezorUserEnvLink.connect();
    await TrezorUserEnvLink.send({
        type: 'bridge-stop',
    });
    await TrezorUserEnvLink.send({
        type: 'emulator-stop',
    });
    await TrezorUserEnvLink.send({
        type: 'emulator-start',
        wipe: true,
    });
    await TrezorUserEnvLink.send({
        type: 'emulator-setup',
        mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        pin: '',
        passphrase_protection: false,
        label: 'My Trevor',
        needs_backup: false,
    });
    await TrezorUserEnvLink.send({
        type: 'bridge-start',
    });

    const pathToExtension = path.join(
        __dirname,
        '..',
        '..',
        'connect-examples',
        'webextension-mv2',
        'build',
    );

    const userDataDir = '/tmp/test-user-data-dir';
    const browserContext = await chromium.launchPersistentContext(userDataDir, {
        // https://playwright.dev/docs/chrome-extensions#headless-mode
        // By default, Chrome's headless mode in Playwright does not support Chrome extensions.
        // To overcome this limitation, you can run Chrome's persistent context with a new headless mode.
        // using `--headless=new`
        headless: false,
        args: [
            process.env.HEADLESS === 'true' ? `--headless=new` : '', // the new headless arg for chrome v109+. Use '--headless=chrome' as arg for browsers v94-108.
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
        ],
    });

    const page = await browserContext.newPage();

    // https://github.com/microsoft/playwright/issues/5593#issuecomment-949813218
    await page.goto('chrome://inspect/#extensions');

    await page.screenshot({ path: `${dir}/web-extension-mv2-in-inspect-extensions.png` });

    const url = await page.evaluate(
        () =>
            (document.querySelector('#extensions-list div[class="url"]') as HTMLElement).innerText,
    );
    const [, , extensionId] = url.split('/');

    expect(extensionId).toBeTruthy();

    log('extensionId:', extensionId);

    await page.goto(`chrome-extension://${extensionId}/connect-manager.html`);

    await page.screenshot({ path: `${dir}/web-extension-mv2-in-connect-manager.png` });

    // Wait for connect to be ready.
    await page.waitForSelector("div[data-test='connect-loaded']");

    log('connect loaded');

    await page.waitForSelector("button[data-test='get-address']");
    await page.click("button[data-test='get-address']");

    const popup = await browserContext.waitForEvent('page');
    await popup.waitForLoadState('load');

    await popup.waitForTimeout(1000);
    await popup.screenshot({ path: `${dir}/web-extension-mv2-waiting-for-analytics-button.png` });
    log('waiting for analytics button');

    await popup.waitForSelector("button[data-test='@analytics/continue-button']", {
        state: 'visible',
        timeout: 40000,
    });
    await popup.click("button[data-test='@analytics/continue-button']");

    log('after analytics button');

    await popup.screenshot({ path: `${dir}/web-extension-mv2-waiting-for-confirm-button.png` });

    log('waiting for button confirm');
    await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
    await popup.click('button.confirm');

    await popup.screenshot({ path: `${dir}/web-extension-mv2-waiting-address-visible.png` });
    log('waiting for address visible');
    await popup.waitForSelector('.export-address >> visible=true');
    await popup.locator('button.confirm >> visible=true').click();
    await popup.screenshot({ path: `${dir}/web-extension-mv2-checking-address.png` });

    await popup.waitForSelector('text=3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX');

    await Promise.all([
        popup.waitForEvent('close'),
        TrezorUserEnvLink.send({ type: 'emulator-press-yes' }),
    ]);

    await page.waitForSelector('text=3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX');

    await browserContext.close();
});

test('Basic web extension MV3', async () => {
    await TrezorUserEnvLink.connect();
    await TrezorUserEnvLink.send({
        type: 'bridge-stop',
    });
    await TrezorUserEnvLink.send({
        type: 'emulator-stop',
    });
    await TrezorUserEnvLink.send({
        type: 'emulator-start',
        wipe: true,
    });
    await TrezorUserEnvLink.send({
        type: 'emulator-setup',
        mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        pin: '',
        passphrase_protection: false,
        label: 'My Trevor',
        needs_backup: false,
    });
    await TrezorUserEnvLink.send({
        type: 'bridge-start',
    });

    const pathToExtension = path.join(
        __dirname,
        '..',
        '..',
        'connect-examples',
        'webextension-mv3',
        'build',
    );

    const userDataDir = '/tmp/test-user-data-dir';
    const browserContext = await chromium.launchPersistentContext(userDataDir, {
        // https://playwright.dev/docs/chrome-extensions#headless-mode
        // By default, Chrome's headless mode in Playwright does not support Chrome extensions.
        // To overcome this limitation, you can run Chrome's persistent context with a new headless mode.
        // using `--headless=new`
        headless: false,
        args: [
            process.env.HEADLESS === 'true' ? `--headless=new` : '', // the new headless arg for chrome v109+. Use '--headless=chrome' as arg for browsers v94-108.
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
        ],
    });
    const page = await browserContext.newPage();

    // https://playwright.dev/docs/chrome-extensions#testing
    // It looks like the only way to get extension ID from a MV3 web extension in playwright is having serviceworker loaded.
    let [background] = browserContext.serviceWorkers();
    if (!background) background = await browserContext.waitForEvent('serviceworker');

    const extensionId = background.url().split('/')[2];
    expect(extensionId).toBeTruthy();

    log('extensionId:', extensionId);

    await page.goto(`chrome-extension://${extensionId}/connect-manager.html`);
    await page.screenshot({ path: `${dir}/web-extension-mv3-in-connect-manager.png` });

    log('clicking on get-address button');
    await (await page.waitForSelector("button[data-test='get-address']")).click();
    log('waiting for popup page');

    const popup = await browserContext.waitForEvent('page');
    await popup.waitForLoadState('load');
    log('popup page loaded');

    // There is not analytics button since this test is after the MV2 that already clicked it and the container is not pruned after.
    // await popup.waitForSelector("button[data-test='@analytics/continue-button']", {
    //     state: 'visible',
    //     timeout: 40000,
    // });
    // await popup.click("button[data-test='@analytics/continue-button']");

    await popup.waitForTimeout(1000);

    await popup.screenshot({
        path: `${dir}/web-extension-mv3-popup-waiting-for-confirm-button.png`,
    });
    log('waiting for button.confirm');
    await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
    await popup.click('button.confirm');

    log('waiting for address to be visible in popup');
    await popup.waitForSelector('.export-address >> visible=true');
    await popup.locator('button.confirm >> visible=true').click();

    await popup.waitForSelector('text=3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX');

    await Promise.all([
        popup.waitForEvent('close'),
        TrezorUserEnvLink.send({ type: 'emulator-press-yes' }),
    ]);

    await browserContext.close();
});
