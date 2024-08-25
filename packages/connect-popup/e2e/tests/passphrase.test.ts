import { test, Page, BrowserContext } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import {
    findElementByDataTest,
    formatUrl,
    getContexts,
    log,
    openPopup,
    setConnectSettings,
    waitAndClick,
} from '../support/helpers';

const url = process.env.URL || 'http://localhost:8088/';
const bridgeVersion = '2.0.33';

const isWebExtension = process.env.IS_WEBEXTENSION === 'true';
const isCoreInPopup = process.env.CORE_IN_POPUP === 'true';
const skipCheck = isWebExtension || isCoreInPopup;
const connectSrc = process.env.TREZOR_CONNECT_SRC;

let context: any = null;
let browserContext: BrowserContext | undefined;
let explorerPage: Page;
let explorerUrl: string;

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
    log(`isWebExtension: ${isWebExtension}`);
    log(`connectSrc: ${connectSrc}`);
    log(`url: ${url}`);
});

test.beforeEach(async ({ page }) => {
    log('beforeEach', 'stopBridge');
    await TrezorUserEnvLink.stopBridge();
    log('beforeEach', 'stopEmu');
    await TrezorUserEnvLink.stopEmu();
    log('beforeEach', 'startEmu');
    await TrezorUserEnvLink.startEmu({
        wipe: true,
    });
    log('beforeEach', 'setupEmu');
    await TrezorUserEnvLink.setupEmu({
        mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        pin: '',
        passphrase_protection: true,
        label: 'My Trevor',
        needs_backup: false,
    });
    log('beforeEach', 'startBridge');
    await TrezorUserEnvLink.startBridge(bridgeVersion);

    log('beforeEach', 'getting contexts');
    const contexts = await getContexts(page, url, isWebExtension);
    browserContext = contexts.browserContext;
    explorerPage = contexts.explorerPage;
    explorerUrl = contexts.explorerUrl;
    context = browserContext;

    if (connectSrc) {
        log('beforeEach', 'applying connect settings');
        await setConnectSettings(explorerPage, explorerUrl, {
            trustedHost: false,
            connectSrc,
        });
    }
});

test.afterEach(async () => {
    log('afterEach', 'if context close it.');

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
test('input passphrase in popup and device accepts it', async () => {
    log(`test: ${test.info().title}`);

    log(`opening ${explorerUrl}#/method/getAddress`);
    await explorerPage.goto(formatUrl(explorerUrl, `methods/bitcoin/getAddress/index.html`));

    log('waiting for submit button');
    await waitAndClick(explorerPage, ['@api-playground/collapsible-box']);
    await findElementByDataTest(explorerPage, '@submit-button');

    log('opening popup');
    [popup] = await openPopup(context, explorerPage, isWebExtension);
    await popup.waitForLoadState('load');

    log('waiting for analytics continue button');
    await findElementByDataTest(popup, '@analytics/continue-button', 40 * 1000);

    if (isWebExtension) {
        // There is an issue in web extension, core takes time to load and accepting analytics too quickly can cause error
        await popup.waitForTimeout(1000);
    }
    log('clicking on analytics continue button');
    await waitAndClick(popup, ['@analytics/continue-button']);

    if (isWebExtension || isCoreInPopup) {
        log('waiting for device list');
        await popup.waitForSelector('.select-device-list button.list');
        await popup.click('.select-device-list button.list');
    }

    log('waiting for confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

    log('typing passphrase');
    (
        await popup.waitForSelector("input[data-testid='@passphrase/input']", { timeout: 40000 })
    ).type('abc');

    log('submitting passphrase');
    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    log('accepting to see passphrase');
    // Accept to see Passphrase.
    await TrezorUserEnvLink.pressYes();

    log('confirming passphrase is correct');
    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.pressYes();

    log('confirming right address is displayed');
    // Confirm right address is displayed.
    await TrezorUserEnvLink.pressYes();
});

test('introduce passphrase in popup and device rejects it', async () => {
    log(`test: ${test.info().title}`);

    await explorerPage.goto(formatUrl(explorerUrl, `methods/bitcoin/getAddress/index.html`));
    await waitAndClick(explorerPage, ['@api-playground/collapsible-box']);
    await findElementByDataTest(explorerPage, '@submit-button');

    [popup] = await openPopup(context, explorerPage, isWebExtension);
    await popup.waitForLoadState('load');

    await findElementByDataTest(popup, '@analytics/continue-button', 40 * 1000);

    if (isWebExtension) {
        // There is an issue in web extension, core takes time to load and accepting analytics too quickly can cause error
        await popup.waitForTimeout(1000);
    }
    await waitAndClick(popup, ['@analytics/continue-button']);

    if (isWebExtension || isCoreInPopup) {
        log('waiting for device list');
        await popup.waitForSelector('.select-device-list button.list');
        await popup.click('.select-device-list button.list');
    }

    log('waiting for confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

    (await popup.waitForSelector("input[data-testid='@passphrase/input']")).type('abc');

    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.pressYes();

    // Cancel Passphrase is incorrect.
    await TrezorUserEnvLink.pressNo();

    await waitAndClick(popup, ['@connect-ui/error-close-button']);

    await explorerPage.waitForSelector('text=Failure_ActionCancelled');
});

test('introduce passphrase successfully next time should not ask for it', async () => {
    test.skip(skipCheck, 'test does not apply for webextension');

    log(`test: ${test.info().title}`);

    await explorerPage.goto(formatUrl(explorerUrl, `methods/bitcoin/getAddress/index.html`));
    await waitAndClick(explorerPage, ['@api-playground/collapsible-box']);
    await findElementByDataTest(explorerPage, '@submit-button');

    [popup] = await openPopup(context, explorerPage, isWebExtension);

    await findElementByDataTest(popup, '@analytics/continue-button', 40 * 1000);

    await waitAndClick(popup, ['@analytics/continue-button']);

    log('waiting for confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

    (await popup.waitForSelector("input[data-testid='@passphrase/input']")).type('abc');

    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.pressYes();

    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.pressYes();

    // Confirm right address is displayed.
    await TrezorUserEnvLink.pressYes();

    // Wait for submit button
    await waitAndClick(explorerPage, ['@api-playground/collapsible-box']);
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

test('introduce passphrase successfully reload 3rd party it should ask again for passphrase', async () => {
    test.skip(skipCheck, 'test does not apply for webextension');

    log(`test: ${test.info().title}`);

    await explorerPage.goto(formatUrl(explorerUrl, `methods/bitcoin/getAddress/index.html`));
    await waitAndClick(explorerPage, ['@api-playground/collapsible-box']);
    await findElementByDataTest(explorerPage, '@submit-button');

    [popup] = await openPopup(context, explorerPage, isWebExtension);

    await findElementByDataTest(popup, '@analytics/continue-button', 40 * 1000);

    await waitAndClick(popup, ['@analytics/continue-button']);

    log('waiting and click confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

    (await popup.waitForSelector("input[data-testid='@passphrase/input']")).type('abc');

    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.pressYes();

    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.pressYes();

    // Confirm right address is displayed.
    await TrezorUserEnvLink.pressYes();

    // Wait for success message before reloading page.
    await explorerPage.waitForSelector('text=success: true');

    // Reload explorer page
    await explorerPage.reload();

    // Wait for submit button
    await waitAndClick(explorerPage, ['@api-playground/collapsible-box']);
    await findElementByDataTest(explorerPage, '@submit-button');

    // Click on submit button
    [popup] = await openPopup(context, explorerPage, isWebExtension);

    log('waiting and click confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

    // Popup should go to passphrase screen
    await popup.waitForSelector("input[data-testid='@passphrase/input']");
});

test('passphrase mismatch', async ({ page }) => {
    // This test uses addScriptTag so we cannot run it in web extension.
    test.skip(skipCheck);
    log(`test: ${test.info().title}`);

    log('start', test.info().title);
    log('got to: ', `${url}#/method/getAddress`);
    await explorerPage.goto(formatUrl(explorerUrl, `methods/bitcoin/getAddress/index.html`));

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
    (await popup.waitForSelector("input[data-testid='@passphrase/input']")).type('cba');
    log('submitting passphrase');
    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);
    // Accept to see Passphrase.
    await TrezorUserEnvLink.pressYes();
    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.pressYes();

    log('waiting and click for invalid passphrase try again button');
    await waitAndClick(popup, ['@invalid-passphrase/try-again']);

    log('typing passphrase');
    // Input right passphrase.
    (await popup.waitForSelector("input[data-testid='@passphrase/input']")).type('abc');

    log('submitting passphrase');
    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.pressYes();

    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.pressYes();

    // Confirm right address is displayed.
    await TrezorUserEnvLink.pressYes();

    // Wait for element in connect-explorer before reloading it.
    await waitAndClick(page, ['@api-playground/collapsible-box']);
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

    // Acquire device if not acquired
    try {
        log('handling if unacquired');
        await popup.waitForSelector('.explain.unacquired', {
            state: 'visible',
            timeout: 10000,
        });
        await popup.click('.explain.unacquired');
    } catch (error) {
        // May appear or not
    }

    log('waiting and click confirm permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button', '@export-address/confirm-button']);

    // Use different passphrase (not corresponding to device.state)
    (await popup.waitForSelector("input[data-testid='@passphrase/input']")).type('cba');

    await waitAndClick(popup, ['@passphrase/hidden/submit-button']);

    // Accept to see Passphrase.
    await TrezorUserEnvLink.pressYes();
    // Confirm Passphrase is correct.
    await TrezorUserEnvLink.pressYes();

    // It display mismatch error, and we accept to use this passphrase.
    await waitAndClick(popup, ['@invalid-passphrase/use-this-passphrase']);

    // Confirm right address is displayed.
    await TrezorUserEnvLink.pressYes();
});
