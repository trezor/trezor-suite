// eslint-disable-next-line @typescript-eslint/no-shadow
import { test, expect } from '@playwright/test';
import path from 'path';
import { chromium } from 'playwright';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { ensureDirectoryExists } from '@trezor/node-utils';

const delay = (time: number) =>
    new Promise(resolve => {
        setTimeout(resolve, time);
    });

let dir: string;
test.beforeAll(async () => {
    dir = await ensureDirectoryExists('./screenshots/web-extension');
});

test('Basic web extension functionality', async () => {
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
    await delay(1000);
    const page = await browserContext.newPage();

    // https://github.com/microsoft/playwright/issues/5593#issuecomment-949813218
    await page.goto('chrome://inspect/#extensions');

    await page.screenshot({ path: `${dir}/web-extension-1.png` });

    const url = await page.evaluate(
        () =>
            (document.querySelector('#extensions-list div[class="url"]') as HTMLElement).innerText,
    );
    const [, , extensionId] = url.split('/');

    expect(extensionId).toBeTruthy();

    await page.goto(url);

    await page.evaluate(() => {
        chrome.tabs.query({ active: true }, tabs => {
            chrome.browserAction.onClicked.dispatch(tabs[0]);
        });
    });

    const popup = await browserContext.waitForEvent('page');
    await popup.waitForLoadState('load');
    await popup.waitForSelector("button[data-test='@analytics/continue-button']", {
        state: 'visible',
        timeout: 40000,
    });
    await popup.click("button[data-test='@analytics/continue-button']");

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
