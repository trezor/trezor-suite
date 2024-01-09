import { test, Page } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import {
    findElementByDataTest,
    getContexts,
    log,
    openPopup,
    waitAndClick,
} from '../support/helpers';

const url = process.env.URL || 'http://localhost:8088/';
const bridgeVersion = '2.0.31';

const isWebExtension = process.env.IS_WEBEXTENSION === 'true';

let context: any = null;

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
});

test.beforeEach(async () => {
    log('beforeEach url', url);
    log('beforeEach isWebExtension', `${isWebExtension}`);
    log('beforeEach', 'stopBridge');
    await TrezorUserEnvLink.api.stopBridge();
    log('beforeEach', 'stopEmu');
    await TrezorUserEnvLink.api.stopEmu();
    log('beforeEach', 'startEmu');
    await TrezorUserEnvLink.api.startEmu({
        wipe: true,
    });
    log('beforeEach', 'setupEmu');
    await TrezorUserEnvLink.api.setupEmu({
        mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        pin: '',
        passphrase_protection: true,
        label: 'My Trevor',
        needs_backup: false,
    });
    log('beforeEach', 'startBridge');
    await TrezorUserEnvLink.api.startBridge(bridgeVersion);
});

test.afterEach(async () => {
    if (context) {
        // BrowserContext has to start fresh each test.
        // https://playwright.dev/docs/api/class-browsercontext#browser-context-close
        await context.close();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
});

// popup window reference
let popup: Page;

// Debug mode does not have to be enable since it is default in connect-explorer
test('input passphrase in popup and device accepts it', async ({ page }) => {
    log('start', test.info().title);
    log('url', url);
    const { explorerPage, exploreUrl, browserContext } = await getContexts(
        page,
        url,
        isWebExtension,
    );
    context = browserContext;

    log(`opening ${exploreUrl}#/method/getAddress`);
    await explorerPage.goto(`${exploreUrl}#/method/getAddress`);

    log('waiting for submit button');
    await findElementByDataTest(explorerPage, '@submit-button');

    log('opening popup');
    [popup] = await openPopup(context, explorerPage, isWebExtension);

    log('waiting for analytics continue button');
    await findElementByDataTest(popup, '@analytics/continue-button', 40 * 1000);

    log('clicking on analytics continue button');
    await waitAndClick(popup, ['@analytics/continue-button']);

    log('waiting for confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

    log('typing passphrase');
    (await popup.waitForSelector("input[data-test='@passphrase/input']", { timeout: 40000 })).type(
        'abc',
    );

    log('submitting passphrase');
    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    log('accepting to see passphrase');
    // Accept to see Passphrase.
    await TrezorUserEnvLink.api.pressYes();

    log('confirming passphrase is correct');
    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.api.pressYes();

    log('confirming right address is displayed');
    // Confirm right address is displayed.
    await TrezorUserEnvLink.api.pressYes();
});

test('introduce passphrase in popup and device rejects it', async ({ page }) => {
    log('start', test.info().title);

    const { explorerPage, exploreUrl, browserContext } = await getContexts(
        page,
        url,
        isWebExtension,
    );
    context = browserContext;

    await explorerPage.goto(`${exploreUrl}#/method/getAddress`);
    await findElementByDataTest(explorerPage, '@submit-button');

    [popup] = await openPopup(context, explorerPage, isWebExtension);

    await findElementByDataTest(popup, '@analytics/continue-button', 40 * 1000);

    await waitAndClick(popup, ['@analytics/continue-button']);

    log('waiting for confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

    (await popup.waitForSelector("input[data-test='@passphrase/input']")).type('abc');

    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.api.pressYes();

    // Cancel Passphrase is incorrect.
    await TrezorUserEnvLink.api.pressNo();

    await waitAndClick(popup, ['@connect-ui/error-close-button']);

    await explorerPage.waitForSelector('text=Failure_ActionCancelled');
});

test('introduce passphrase successfully next time should not ask for it', async ({ page }) => {
    log('start', test.info().title);

    const { explorerPage, exploreUrl, browserContext } = await getContexts(
        page,
        url,
        isWebExtension,
    );
    context = browserContext;

    await explorerPage.goto(`${exploreUrl}#/method/getAddress`);
    await findElementByDataTest(explorerPage, '@submit-button');

    [popup] = await openPopup(context, explorerPage, isWebExtension);

    await findElementByDataTest(popup, '@analytics/continue-button', 40 * 1000);

    await waitAndClick(popup, ['@analytics/continue-button']);

    log('waiting for confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

    (await popup.waitForSelector("input[data-test='@passphrase/input']")).type('abc');

    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.api.pressYes();

    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.api.pressYes();

    // Confirm right address is displayed.
    await TrezorUserEnvLink.api.pressYes();

    // Wait for submit button
    await findElementByDataTest(explorerPage, '@submit-button');

    // todo: this is stinky. without this timeout submit button sometimes does not react, needs investigation
    await explorerPage.waitForTimeout(1000);

    // Click on submit button
    [popup] = await openPopup(context, explorerPage, isWebExtension);

    log('waiting for confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

    // Popup should display address and ask user to confirm it without asking again for passphrase.
    await findElementByDataTest(popup, '@check-address-on-device');
});

test('introduce passphrase successfully reload 3rd party it should ask again for passphrase', async ({
    page,
}) => {
    log('start', test.info().title);

    const { explorerPage, exploreUrl, browserContext } = await getContexts(
        page,
        url,
        isWebExtension,
    );
    context = browserContext;

    await explorerPage.goto(`${exploreUrl}#/method/getAddress`);
    await findElementByDataTest(explorerPage, '@submit-button');

    [popup] = await openPopup(context, explorerPage, isWebExtension);

    await findElementByDataTest(popup, '@analytics/continue-button', 40 * 1000);

    await waitAndClick(popup, ['@analytics/continue-button']);

    log('waiting and click confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

    (await popup.waitForSelector("input[data-test='@passphrase/input']")).type('abc');

    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.api.pressYes();

    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.api.pressYes();

    // Confirm right address is displayed.
    await TrezorUserEnvLink.api.pressYes();

    // Wait for success message before reloading page.
    await explorerPage.waitForSelector('text=success: true');

    // Reload explorer page
    await explorerPage.reload();

    // Wait for submit button
    await findElementByDataTest(explorerPage, '@submit-button');

    // Click on submit button
    [popup] = await openPopup(context, explorerPage, isWebExtension);

    log('waiting and click confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

    // Popup should go to passphrase screen
    await popup.waitForSelector("input[data-test='@passphrase/input']");
});

test('passphrase mismatch', async ({ page }) => {
    log('start', test.info().title);

    if (isWebExtension) {
        // This test uses addScriptTag so we cannot run it in web extension.
        test.skip();
    }

    log('start', test.info().title);
    log('got to: ', `${url}#/method/getAddress`);
    await page.goto(`${url}#/method/getAddress`);

    log('Trigger getAddress call');
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

    log('waiting for popup');
    [popup] = await Promise.all([page.waitForEvent('popup')]);

    log('waiting and click confirm analytics button');
    await waitAndClick(popup, ['@analytics/continue-button']);

    log('waiting and click confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

    log('typing passphrase');
    // use different passphrase (not corresponding to device.state)
    (await popup.waitForSelector("input[data-test='@passphrase/input']")).type('cba');
    log('submitting passphrase');
    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);
    // Accept to see Passphrase.
    await TrezorUserEnvLink.api.pressYes();
    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.api.pressYes();

    log('waiting and click for invalid passphrase try again button');
    await waitAndClick(popup, ['@invalid-passphrase/try-again']);

    log('waiting and click confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button']);

    log('typing passphrase');
    // Input right passphrase.
    (await popup.waitForSelector("input[data-test='@passphrase/input']")).type('abc');

    log('submitting passphrase');
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

    log('waiting and click confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

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
