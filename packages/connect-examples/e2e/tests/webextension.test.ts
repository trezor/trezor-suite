// eslint-disable-next-line @typescript-eslint/no-shadow
import { test, expect, chromium } from '@playwright/test';
import path from 'path';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { ensureDirectoryExists } from '@trezor/node-utils';

export const log = (...val: string[]) => {
    console.log(`[===]`, ...val);
};

let dir: string;
let browserContext: any = null;

test.beforeAll(async () => {
    dir = await ensureDirectoryExists('./e2e/screenshots/');
});

test.afterEach(async () => {
    if (browserContext) {
        // BrowserContext has to start fresh each test.
        // https://playwright.dev/docs/api/class-browsercontext#browser-context-close
        await browserContext.close();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
});

test.skip('Basic web extension MV2', async () => {
    log('connecting to emulator');
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

    const pathToExtension = path.join(__dirname, '..', '..', 'webextension-mv2', 'build');

    log('path to extension: ', pathToExtension);

    const userDataDir = '/tmp/test-user-data-dir';
    browserContext = await chromium.launchPersistentContext(userDataDir, {
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

    log('browser context created');

    const page = await browserContext.newPage();
    log('new page created');
    // https://github.com/microsoft/playwright/issues/5593#issuecomment-949813218
    await page.goto('chrome://inspect/#extensions');

    await page.screenshot({ path: `${dir}/web-extension-mv2-1.png` });

    const url = await page.evaluate(
        () =>
            (document.querySelector('#extensions-list div[class="url"]') as HTMLElement).innerText,
    );
    const [, , extensionId] = url.split('/');

    log('extensionId: ', extensionId);

    expect(extensionId).toBeTruthy();

    log(`going to: chrome-extension://${extensionId}/connect-manager.html`);
    await page.goto(`chrome-extension://${extensionId}/connect-manager.html`);

    await page.screenshot({ path: `${dir}/web-extension-mv2-2.png` });

    log('waiting for connect to be ready.');
    await page.waitForSelector("div[data-test='connect-loaded']", {
        state: 'visible',
        timeout: 60 * 1000,
    });

    await page.screenshot({ path: `${dir}/web-extension-mv2-3.png` });

    log('wait for get-address');
    await page.waitForSelector("button[data-test='get-address']");
    await page.click("button[data-test='get-address']");

    log('waiting for popup page');
    const popup = await browserContext.waitForEvent('page');
    log('waiting for popup load');
    await popup.waitForLoadState('load');
    log('waiting for popup analytics button');
    await popup.waitForSelector("button[data-test='@analytics/continue-button']", {
        state: 'visible',
        timeout: 40000,
    });
    await popup.click("button[data-test='@analytics/continue-button']");

    log('waiting for confirm button');
    await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
    await popup.click('button.confirm');

    log('waiting for export-address');
    await popup.waitForSelector('.export-address >> visible=true');
    await popup.locator('button.confirm >> visible=true').click();

    log('waiting for address in popup');
    await popup.waitForSelector('text=3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX');

    await Promise.all([
        popup.waitForEvent('close'),
        TrezorUserEnvLink.send({ type: 'emulator-press-yes' }),
    ]);

    log('waiting for address in explorer');
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

    const pathToExtension = path.join(__dirname, '..', '..', 'webextension-mv3', 'build');

    const userDataDir = '/tmp/test-user-data-dir';
    browserContext = await chromium.launchPersistentContext(userDataDir, {
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

    await page.goto(`chrome-extension://${extensionId}/connect-manager.html`);
    await page.screenshot({ path: `${dir}/web-extension-mv3-1.png` });

    await (await page.waitForSelector("button[data-test='get-address']")).click();

    const popup = await browserContext.waitForEvent('page');
    await popup.waitForLoadState('load');

    // There is not analytics button since this test is after the MV2 that already clicked it and the container is not pruned after.
    // await popup.waitForSelector("button[data-test='@analytics/continue-button']", {
    //     state: 'visible',
    //     timeout: 40000,
    // });
    // await popup.click("button[data-test='@analytics/continue-button']");

    await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
    await popup.click('button.confirm');

    await popup.waitForSelector('.export-address >> visible=true');
    await popup.locator('button.confirm >> visible=true').click();

    await popup.waitForSelector('text=3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX');

    await Promise.all([
        popup.waitForEvent('close'),
        TrezorUserEnvLink.send({ type: 'emulator-press-yes' }),
    ]);

    await browserContext.close();
});
