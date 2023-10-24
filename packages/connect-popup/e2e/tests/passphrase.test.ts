import { test, Page } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { findElementByDataTest, waitAndClick } from '../support/helpers';

const url = process.env.URL || 'http://localhost:8088/';
const bridgeVersion = '2.0.31';

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
});

// popup window reference
let popup: Page;

// Debug mode does not have to be enable since it is default in connect-explorer
test('input passphrase in popup and device accepts it', async ({ page }) => {
    await TrezorUserEnvLink.api.stopBridge();
    await TrezorUserEnvLink.api.stopEmu();
    await TrezorUserEnvLink.api.startEmu({
        wipe: true,
    });
    await TrezorUserEnvLink.api.setupEmu({
        mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        pin: '',
        passphrase_protection: true,
        label: 'My Trevor',
        needs_backup: false,
    });
    await TrezorUserEnvLink.api.startBridge(bridgeVersion);

    await page.goto(`${url}#/method/getAddress`);
    await findElementByDataTest(page, '@submit-button');

    [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click("button[data-test='@submit-button']"),
    ]);

    await findElementByDataTest(popup, '@analytics/continue-button', 40 * 1000);

    await waitAndClick(popup, ['@analytics/continue-button']);

    (await popup.waitForSelector("input[data-test='@passphrase/input']")).type('abc');

    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.api.pressYes();

    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.api.pressYes();

    // Confirm right address is displayed.
    await TrezorUserEnvLink.api.pressYes();
});

test('introduce passphrase in popup and device rejects it', async ({ page }) => {
    await TrezorUserEnvLink.api.stopBridge();
    await TrezorUserEnvLink.api.stopEmu();
    await TrezorUserEnvLink.api.startEmu({
        wipe: true,
    });
    await TrezorUserEnvLink.api.setupEmu({
        mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        pin: '',
        passphrase_protection: true,
        label: 'My Trevor',
        needs_backup: false,
    });
    await TrezorUserEnvLink.api.startBridge(bridgeVersion);

    await page.goto(`${url}#/method/getAddress`);
    await findElementByDataTest(page, '@submit-button');

    [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click("button[data-test='@submit-button']"),
    ]);

    await findElementByDataTest(popup, '@analytics/continue-button', 40 * 1000);

    await waitAndClick(popup, ['@analytics/continue-button']);

    (await popup.waitForSelector("input[data-test='@passphrase/input']")).type('abc');

    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.api.pressYes();

    // Cancel Passphrase is incorrect.
    await TrezorUserEnvLink.api.pressNo();

    await waitAndClick(popup, ['@connect-ui/error-close-button']);

    await page.waitForSelector('text=Failure_ActionCancelled');
});

test('introduce passphrase successfully next time should not ask for it', async ({ page }) => {
    await TrezorUserEnvLink.api.stopBridge();
    await TrezorUserEnvLink.api.stopEmu();
    await TrezorUserEnvLink.api.startEmu({
        wipe: true,
    });
    await TrezorUserEnvLink.api.setupEmu({
        mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        pin: '',
        passphrase_protection: true,
        label: 'My Trevor',
        needs_backup: false,
    });
    await TrezorUserEnvLink.api.startBridge(bridgeVersion);

    await page.goto(`${url}#/method/getAddress`);
    await findElementByDataTest(page, '@submit-button');

    [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click("button[data-test='@submit-button']"),
    ]);

    await findElementByDataTest(popup, '@analytics/continue-button', 40 * 1000);

    await waitAndClick(popup, ['@analytics/continue-button']);

    (await popup.waitForSelector("input[data-test='@passphrase/input']")).type('abc');

    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.api.pressYes();

    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.api.pressYes();

    // Confirm right address is displayed.
    await TrezorUserEnvLink.api.pressYes();

    // Wait for submit button
    await findElementByDataTest(page, '@submit-button');

    // todo: this is stinky. without this timeout submit button sometimes does not react, needs investigation
    await page.waitForTimeout(1000);

    // Click on submit button
    [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click("button[data-test='@submit-button']"),
    ]);

    // Popup should display address and ask user to confirm it without asking again for passphrase.
    await findElementByDataTest(popup, '@check-address-on-device');
});

test('introduce passphrase successfully reload 3rd party it should ask again for passphrase', async ({
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
        passphrase_protection: true,
        label: 'My Trevor',
        needs_backup: false,
    });
    await TrezorUserEnvLink.api.startBridge(bridgeVersion);

    await page.goto(`${url}#/method/getAddress`);
    await findElementByDataTest(page, '@submit-button');

    [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click("button[data-test='@submit-button']"),
    ]);

    await findElementByDataTest(popup, '@analytics/continue-button', 40 * 1000);

    await waitAndClick(popup, ['@analytics/continue-button']);

    (await popup.waitForSelector("input[data-test='@passphrase/input']")).type('abc');

    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.api.pressYes();

    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.api.pressYes();

    // Confirm right address is displayed.
    await TrezorUserEnvLink.api.pressYes();

    // Wait for success message before reloading page.
    await page.waitForSelector('text=success: true');

    // Reload page
    await page.reload();

    // Wait for submit button
    await findElementByDataTest(page, '@submit-button');

    // Click on submit button
    [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click("button[data-test='@submit-button']"),
    ]);

    // Popup should go to passphrase screen
    await popup.waitForSelector("input[data-test='@passphrase/input']");
});

test('passphrase mismatch', async ({ page }) => {
    await TrezorUserEnvLink.api.stopBridge();
    await TrezorUserEnvLink.api.stopEmu();
    await TrezorUserEnvLink.api.startEmu({
        wipe: true,
    });
    await TrezorUserEnvLink.api.setupEmu({
        mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        pin: '',
        passphrase_protection: true,
        label: 'My Trevor',
        needs_backup: false,
    });
    await TrezorUserEnvLink.api.startBridge(bridgeVersion);

    await page.goto(`${url}#/method/getAddress`);

    // this is a little hack.
    // connect-explorer does not allow setting commonParams. but we can inject!
    // send device.state for passphrase 'abc'
    await page.addScriptTag({
        content: `
          window.TrezorConnect.getAddress({
                path: "m/49'/0'/0'/0/0",
                device: {
                    instance: 1,
                    state: 'mjwfkJT4pnEoLCQu5tHMfjBmmggDNQxCz7@355C817510C0EABF2F147145:1',
                }
            }).then(res => console.log(res)).catch(err => console.log(err));
    `,
    });

    [popup] = await Promise.all([page.waitForEvent('popup')]);

    await waitAndClick(popup, ['@analytics/continue-button']);

    // use different passphrase (not corresponding to device.state)
    (await popup.waitForSelector("input[data-test='@passphrase/input']")).type('cba');
    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);
    // Accept to see Passphrase.
    await TrezorUserEnvLink.api.pressYes();
    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.api.pressYes();

    await waitAndClick(popup, ['@invalid-passphrase/try-again']);
    // Input right passphrase.
    (await popup.waitForSelector("input[data-test='@passphrase/input']")).type('abc');

    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.api.pressYes();

    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.api.pressYes();

    // Confirm right address is displayed.
    await TrezorUserEnvLink.api.pressYes();

    // Wait for element in connect-explorer before reloading it.
    await findElementByDataTest(page, '@submit-button');

    // Reload page to force to ask for passphrase again.
    await page.reload();

    // Testing what happens on 'use this passphrase button'.

    // this is a little hack.
    // connect-explorer does not allow setting commonParams. but we can inject!
    // send device.state for passphrase 'abc'
    await page.addScriptTag({
        content: `
          window.TrezorConnect.getAddress({
                path: "m/49'/0'/0'/0/0",
                device: {
                    instance: 1,
                    state: 'mjwfkJT4pnEoLCQu5tHMfjBmmggDNQxCz7@355C817510C0EABF2F147145:1',
                }
            }).then(res => console.log(res)).catch(err => console.log(err));
    `,
    });

    [popup] = await Promise.all([page.waitForEvent('popup')]);

    // Use different passphrase (not corresponding to device.state)
    (await popup.waitForSelector("input[data-test='@passphrase/input']")).type('cba');

    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.api.pressYes();
    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.api.pressYes();

    // It display mismatch error, and we accept to use this passphrase.
    await waitAndClick(popup, ['@invalid-passphrase/use-this-passphrase']);

    // Confirm right address is displayed.
    await TrezorUserEnvLink.api.pressYes();
});
