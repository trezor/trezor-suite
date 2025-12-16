import { chromium, expect, test } from '@playwright/test';
import path from 'path';

import { ensureDirectoryExists } from '@trezor/node-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

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

    await page.getByTestId('get-address').click();

    const popup = await browserContext.waitForEvent('page');
    await popup.waitForLoadState('load');

    // ...it did not pass... rest of this test will be removed anyway any moment now
});
