import { test, Page, BrowserContext } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { addDashesToSpaces, createTimeoutPromise } from '@trezor/utils';
import {
    findElementByDataTest,
    waitAndClick,
    log,
    downloadLogs,
    checkHasLogs,
    openPopup,
    waitForPopup,
    getContexts,
    setConnectSettings,
    formatUrl,
} from '../support/helpers';

const url = process.env.URL || 'http://localhost:8088/';
const isWebExtension = process.env.IS_WEBEXTENSION === 'true';
const isCoreInPopup = process.env.CORE_IN_POPUP === 'true';
const skipCheck = isWebExtension || isCoreInPopup;
const connectSrc = process.env.TREZOR_CONNECT_SRC;

const WAIT_AFTER_TEST = 3000; // how long test should wait for more potential trezord requests

// popup window reference
let popup: Page;
// let logPage: Page;
let popupClosedPromise: Promise<undefined> | undefined;
let browserContext: BrowserContext | undefined;
let explorerPage: Page;
let explorerUrl: string;

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
    log(`isWebExtension: ${isWebExtension}`);
    log(`connectSrc: ${connectSrc}`);
    log(`url: ${url}`);
});

const setup = async ({ page, context }: { page: Page; context?: BrowserContext }) => {
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
        passphrase_protection: false,
        label: 'My Trevor',
        needs_backup: false,
    });
    log('beforeEach', 'startBridge');
    await TrezorUserEnvLink.startBridge();

    const contexts = await getContexts(page, url, isWebExtension);

    browserContext = contexts.browserContext || context;
    explorerPage = contexts.explorerPage;
    explorerUrl = contexts.explorerUrl;

    const logPage = await browserContext!.newPage();
    await logPage.goto(formatUrl(url, 'log.html'));

    await setConnectSettings(
        explorerPage,
        explorerUrl,
        {
            trustedHost: false,
            ...(connectSrc && { connectSrc }),
        },
        isWebExtension,
    );

    await waitAndClick(explorerPage, ['@navbar-logo']);
    await explorerPage.click("a[href$='/methods/bitcoin/verifyMessage/']");
    await waitAndClick(explorerPage, ['@api-playground/collapsible-box']);

    await explorerPage.waitForSelector("button[data-test='@submit-button']", {
        state: 'visible',
    });

    log('beforeEach', 'waiting for popup promise');
    [popup] = await openPopup(browserContext, explorerPage, isWebExtension);

    log('beforeEach', 'waiting for analytics confirm button');
    await popup.waitForSelector("button[data-test='@analytics/continue-button']", {
        state: 'visible',
        timeout: 40000,
    });
    log('beforeEach', 'clicking on analytics confirm button');
    await popup.click("button[data-test='@analytics/continue-button']");

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    log('beforeEach', 'waiting for popup load state');
    await popup.waitForLoadState('load');

    if (isWebExtension || isCoreInPopup) {
        log('beforeEach', 'waiting for select device');
        await popup.waitForSelector('.select-device-list button.list', { state: 'visible' });
        await popup.click('.select-device-list button.list');
    }

    log('beforeEach', 'waiting for permissions confirm button');
    await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
    log('beforeEach', 'clicking on permissions confirm button');
    await popup.click('button.confirm');
    log('beforeEach', 'waiting for selector .follow-device >> visible=true');
    await popup.waitForSelector('.follow-device >> visible=true');
};

test.afterEach(async ({ context: _context }, testInfo) => {
    if (testInfo.status === 'skipped') {
        // skip afterEach of skipped tests
        return;
    }
    log('afterEach', 'starting');
    const context = browserContext || _context;
    const logPage = context.pages().find(p => p.url().endsWith('log.html'));
    if (logPage) {
        await logPage.bringToFront();
        const hasLogs = await checkHasLogs(logPage);
        log(`hasLogs: ${hasLogs}`);
        if (hasLogs) {
            log('afterEach', 'downloading logs');
            await downloadLogs(
                logPage,
                `./test-results/log-${addDashesToSpaces(testInfo.title)}.txt`,
            );
        } else {
            log('afterEach', 'no logs');
        }
    }

    if (context) {
        // BrowserContext has to start fresh each test.
        // https://playwright.dev/docs/api/class-browsercontext#browser-context-close
        await context.close();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    await createTimeoutPromise(WAIT_AFTER_TEST);
});

test(`popup closed by user`, async ({ page, context }) => {
    log(`test: ${test.info().title}`);
    await setup({ page, context });

    log('simulating user closed popup');
    // user closed popup
    await popup.close({ runBeforeUnload: true });
    log('waiting for popup to be closed');
    await popupClosedPromise;
});

test(`device dialog canceled ON DEVICE by user`, async ({ page, context }) => {
    log(`test: ${test.info().title}`);
    await setup({ page, context });

    log('user canceled dialog on device');
    await TrezorUserEnvLink.send({ type: 'emulator-press-no' });
    await TrezorUserEnvLink.send({ type: 'emulator-press-yes' });

    await explorerPage.waitForTimeout(WAIT_AFTER_TEST);

    await popup.click("button[data-test='@connect-ui/error-close-button']");

    await popupClosedPromise;

    await explorerPage.waitForSelector('text=Failure_ActionCancelled');
});

test(`device disconnected during device interaction`, async ({ page, context }) => {
    log(`test: ${test.info().title}`);
    await setup({ page, context });

    log('user canceled interaction on device');
    await TrezorUserEnvLink.stopEmu();
    await explorerPage.waitForTimeout(WAIT_AFTER_TEST);

    try {
        log('waiting to click @connect-ui/error-close-button');
        await popup.click("button[data-test='@connect-ui/error-close-button']");
    } catch (error) {
        // Sometimes this crashes with error that the page is already closed.
    }

    log('waiting for popupClosedPromise to resolve');
    await popupClosedPromise;

    log('waiting for selector text=device disconnected during action');
    await explorerPage.waitForSelector('text=device disconnected during action');
});

test('when user cancels permissions in popup it closes automatically', async ({
    page,
    context,
}) => {
    log(`test: ${test.info().title}`);
    await setup({ page, context });

    await TrezorUserEnvLink.pressYes();
    await TrezorUserEnvLink.pressYes();
    await TrezorUserEnvLink.pressYes();

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    await popupClosedPromise;

    await explorerPage.goto(formatUrl(explorerUrl, `methods/bitcoin/getAddress/index.html`));
    await explorerPage.click("[data-test='@api-playground/collapsible-box']");
    await explorerPage.waitForSelector("button[data-test='@submit-button']", {
        state: 'visible',
    });

    log('waiting for popup open');
    [popup] = await openPopup(browserContext, explorerPage, isWebExtension);

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    await popup.waitForLoadState('load');

    if (isCoreInPopup) {
        await popup.waitForSelector('.select-device-list button.list', { state: 'visible' });
        await popup.click('.select-device-list button.list');
    }

    await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
    await popup.waitForSelector("button[data-test='@permissions/confirm-button']");
    // We are testing that when cancel permissions, popup is closed automatically.
    await popup.click("button[data-test='@permissions/cancel-button']");
    // Wait for popup to close.
    await popupClosedPromise;
});

test('device dialogue cancelled IN POPUP by user', async ({ page, context }) => {
    // TODO: this test should also work with webextension and for some reason it does not work in CI but it works locally.
    test.skip(skipCheck, 'todo: skip for now');
    log(`test: ${test.info().title}`);
    await setup({ page, context });

    await TrezorUserEnvLink.pressYes();
    await TrezorUserEnvLink.pressYes();
    await TrezorUserEnvLink.pressYes();

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    await popupClosedPromise;

    await explorerPage.goto(formatUrl(explorerUrl, `methods/bitcoin/getAddress/index.html`));
    await explorerPage.click("[data-test='@api-playground/collapsible-box']");
    await explorerPage.waitForSelector("button[data-test='@submit-button']", {
        state: 'visible',
    });

    log('waiting for popup open');
    [popup] = await openPopup(browserContext, explorerPage, isWebExtension);
    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    await popup.waitForLoadState('load');
    await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
    await popup.waitForSelector("button[data-test='@permissions/confirm-button']");
    await popup.click("button[data-test='@permissions/confirm-button']");
    await popup.waitForSelector("button[data-test='@export-address/cancel-button']");
    // We are testing that when cancel Export Bitcoin address, popup is closed automatically.
    await popup.click("button[data-test='@export-address/cancel-button']");
    // Wait for popup to close.
    await popupClosedPromise;
});

test('popup should close and open new one when popup is in error state and user triggers new call', async ({
    page,
    context,
}) => {
    // TODO: this test should also work with webextension and for some reason it does not work in CI but it works locally.
    test.skip(skipCheck, 'todo: skip for now');

    log(`test: ${test.info().title}`);
    await setup({ page, context });

    log('rejecting request in device by pressing no');
    await TrezorUserEnvLink.pressNo();
    await TrezorUserEnvLink.pressYes();

    log('waiting for error page is displayed');
    await findElementByDataTest(popup, '@connect-ui/error');

    await waitAndClick(explorerPage, ['@submit-button']);

    log('currently open popup should be closed');
    await popupClosedPromise;

    log('new popup should be opened. To handle the new request');
    [popup] = await waitForPopup(browserContext, explorerPage, isWebExtension);

    // We cancel the request since we already tested what we wanted.
    await waitAndClick(popup, ['@permissions/cancel-button']);

    // Wait for popup to close.
    await popupClosedPromise;
    await explorerPage.waitForSelector('text=Permissions not granted');
});

test('popup should be focused when a call is in progress and user triggers new call', async ({
    page,
    context,
}) => {
    // TODO: this test should also work with webextension and for some reason it does not work in CI but it works locally.
    test.skip(skipCheck, 'todo: skip for now');
    log(`test: ${test.info().title}`);
    await setup({ page, context });

    await TrezorUserEnvLink.pressYes();
    await TrezorUserEnvLink.pressYes();
    await TrezorUserEnvLink.pressYes();

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    await popupClosedPromise;

    await explorerPage.goto(formatUrl(explorerUrl, `methods/bitcoin/getAddress/index.html`));
    await explorerPage.click("[data-test='@api-playground/collapsible-box']");
    await explorerPage.waitForSelector("button[data-test='@submit-button']", {
        state: 'visible',
    });

    log('waiting for popup open');
    [popup] = await openPopup(browserContext, explorerPage, isWebExtension);

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    await popup.waitForSelector("button[data-test='@permissions/confirm-button']");

    await waitAndClick(popup, ['@permissions/confirm-button']);

    // Click in 3rd party to trigger new call. But instead of new call it should focus on open popup.
    await waitAndClick(explorerPage, ['@submit-button']);

    // Popup should keep its reference and state so we should be able to find confirm button for export-address.
    await waitAndClick(popup, ['@export-address/confirm-button']);

    // Confirm right address is displayed.
    await TrezorUserEnvLink.pressYes();

    // Popup should be closed now.
    await popupClosedPromise;
});

test('popup should close when third party is closed', async ({ page, context }) => {
    // This test should be skipped in webextension with service-worker, due to the fact that in that case
    // that serviceworker is persistent and does not necessarily has to be over if the page that initiated the call is closed.
    test.skip(skipCheck, 'test does not apply for webextension');

    log(`test: ${test.info().title}`);
    await setup({ page, context });

    // We need to skip the after flow because this test closes 3rd party window and there is not window to continue with.
    test.info().annotations.push({ type: 'skip-after-flow' });
    await TrezorUserEnvLink.pressYes();
    await TrezorUserEnvLink.pressYes();
    await TrezorUserEnvLink.pressYes();

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    await popupClosedPromise;

    await explorerPage.goto(formatUrl(explorerUrl, `methods/bitcoin/getAddress/index.html`));
    await explorerPage.click("[data-test='@api-playground/collapsible-box']");
    await explorerPage.waitForSelector("button[data-test='@submit-button']", {
        state: 'visible',
    });
    log('waiting for popup open');
    [popup] = await openPopup(browserContext, explorerPage, isWebExtension);

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    log('waiting for permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button']);

    log('Closing page with 3rd party so we make sure that popup is closed automatically.');
    await popup.close();
    log('Wait for popup to close to consider the test successful.');
    await popupClosedPromise;
});

test('popup should behave properly with subsequent calls', async ({ page, context }) => {
    test.skip(skipCheck);

    log(`test: ${test.info().title}`);
    await setup({ page, context });

    await TrezorUserEnvLink.pressYes();
    await TrezorUserEnvLink.pressYes();
    await TrezorUserEnvLink.pressYes();

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });
    await popupClosedPromise;

    await explorerPage.goto(formatUrl(explorerUrl, `test/index.html`));
    await waitAndClick(explorerPage, ['@testpage/init']);
    await waitAndClick(explorerPage, ['@testpage/subsequentCalls']);
    log('waiting for popup open');

    [popup] = await waitForPopup(browserContext, explorerPage, isWebExtension);

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });
    await popupClosedPromise;

    log('waiting for second popup open');
    [popup] = await waitForPopup(browserContext, explorerPage, isWebExtension);

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    log('waiting for permissions button');
    await waitAndClick(popup, ['@permissions/confirm-button']);

    log('waiting for confirm button');
    await popup.waitForSelector('button.confirm', { state: 'visible' });
    await popup.click('button.confirm');

    log('Wait for popup to close to consider the test successful.');
    await popupClosedPromise;
});
