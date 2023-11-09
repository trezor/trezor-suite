import { test, Page } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const url = process.env.URL || 'http://localhost:8088/';

const bridgeVersion = '2.0.31';

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
});

// popup window reference
let popup: Page;

// Debug mode does not have to be enable since it is default in connect-explorer
test('popup should display error page when device disconnected and debug mode', async ({
    page,
}) => {
    await TrezorUserEnvLink.api.stopBridge();
    await TrezorUserEnvLink.api.stopEmu();
    await TrezorUserEnvLink.api.startEmu({
        wipe: true,
    });
    await TrezorUserEnvLink.api.setupEmu({
        mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        pin: '',
        passphrase_protection: false,
        label: 'My Trevor',
        needs_backup: false,
    });
    await TrezorUserEnvLink.api.startBridge(bridgeVersion);

    await page.goto(`${url}#/method/verifyMessage`);
    await page.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });
    [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click("button[data-test='@submit-button']"),
    ]);

    await popup.waitForSelector("button[data-test='@analytics/continue-button']", {
        state: 'visible',
        timeout: 40000,
    });
    await popup.click("button[data-test='@analytics/continue-button']");

    await popup.waitForSelector("div[data-test='@permissions']");

    await TrezorUserEnvLink.api.stopEmu();

    await popup.waitForSelector("div[data-test='@connect-ui/error']");
});
