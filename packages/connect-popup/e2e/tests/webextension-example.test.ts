// eslint-disable-next-line @typescript-eslint/no-shadow
import { test, expect, chromium } from '@playwright/test';
import path from 'path';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { ensureDirectoryExists } from '@trezor/node-utils';

let dir: string;
test.beforeAll(async () => {
    dir = await ensureDirectoryExists('./screenshots/web-extension');
});

test.beforeEach(async () => {
    await TrezorUserEnvLink.connect();
    await TrezorUserEnvLink.stopBridge();
    await TrezorUserEnvLink.stopEmu();
    await TrezorUserEnvLink.startEmu({
        wipe: true,
    });
    await TrezorUserEnvLink.setupEmu({
        mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        pin: '',
        passphrase_protection: false,
        label: 'My Trevor',
        needs_backup: false,
    });
    await TrezorUserEnvLink.startBridge();
});

const getBrowserContext = async (pathToExtension: string) => {
    const userDataDir = `/tmp/test-user-data-dir/${new Date().getTime()}`;
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

    return browserContext;
};

test('Basic web extension MV2', async () => {
    const pathToExtension = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'connect-examples',
        'webextension-mv2',
        'build',
    );
    const browserContext = await getBrowserContext(pathToExtension);
    const page = await browserContext.newPage();

    // https://github.com/microsoft/playwright/issues/5593#issuecomment-949813218
    await page.goto('chrome://inspect/#extensions');

    await page.screenshot({ path: `${dir}/web-extension-mv2-1.png` });

    const url = await page.evaluate(
        () =>
            (document.querySelector('#extensions-list div[class="url"]') as HTMLElement).innerText,
    );
    const [, , extensionId] = url.split('/');

    expect(extensionId).toBeTruthy();

    await page.goto(`chrome-extension://${extensionId}/connect-manager.html`);

    // Wait for connect to be ready.
    await page.waitForSelector("div[data-testid='connect-loaded']");

    await page.waitForSelector("button[data-testid='get-address']");
    await page.click("button[data-testid='get-address']");

    const popup = await browserContext.waitForEvent('page');
    await popup.waitForLoadState('load');
    await popup.waitForSelector("button[data-testid='@analytics/continue-button']", {
        state: 'visible',
        timeout: 40000,
    });
    await popup.click("button[data-testid='@analytics/continue-button']");

    await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
    await popup.click('button.confirm');

    await popup.waitForSelector('.export-address >> visible=true');
    await popup.locator('button.confirm >> visible=true').click();

    await popup.waitForSelector('text=3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX');

    await Promise.all([popup.waitForEvent('close'), TrezorUserEnvLink.pressYes()]);

    await page.waitForSelector('text=3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX');

    await browserContext.close();
});

test('Basic web extension MV3', async () => {
    const pathToExtension = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'connect-examples',
        'webextension-mv3',
        'build',
    );
    const browserContext = await getBrowserContext(pathToExtension);
    const page = await browserContext.newPage();

    // https://playwright.dev/docs/chrome-extensions#testing
    // It looks like the only way to get extension ID from a MV3 web extension in playwright is having serviceworker loaded.
    let [background] = browserContext.serviceWorkers();
    if (!background) background = await browserContext.waitForEvent('serviceworker');

    const extensionId = background.url().split('/')[2];
    expect(extensionId).toBeTruthy();

    await page.goto(`chrome-extension://${extensionId}/connect-manager.html`);
    await page.screenshot({ path: `${dir}/web-extension-mv3-1.png` });

    await (await page.waitForSelector("button[data-testid='get-address']")).click();

    const popup = await browserContext.waitForEvent('page');
    await popup.waitForLoadState('load');

    await popup.waitForSelector("button[data-testid='@analytics/continue-button']", {
        state: 'visible',
        timeout: 40000,
    });
    await popup.click("button[data-testid='@analytics/continue-button']");

    await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
    await popup.click('button.confirm');

    await popup.waitForSelector('.export-address >> visible=true');
    await popup.locator('button.confirm >> visible=true').click();

    await popup.waitForSelector('text=3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX');

    await Promise.all([popup.waitForEvent('close'), TrezorUserEnvLink.pressYes()]);

    await browserContext.close();
});
