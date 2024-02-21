import { test, Page, BrowserContext } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { getContexts, openPopup, log, setConnectSettings } from '../support/helpers';

const url = process.env.URL || 'http://localhost:8088/';

const bridgeVersion = '2.0.31';
// popup window reference
let popup: Page;
let context: BrowserContext | undefined;

const isWebExtension = process.env.IS_WEBEXTENSION === 'true';
const connectSrc = process.env.TREZOR_CONNECT_SRC;

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
    log(`isWebExtension: ${isWebExtension}`);
    log(`connectSrc: ${connectSrc}`);
    log(`url: ${url}`);
});

test.afterEach(async () => {
    if (context) {
        // BrowserContext has to start fresh each test.
        // https://playwright.dev/docs/api/class-browsercontext#browser-context-close
        await context.close();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
});

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

    log('generating contexts');
    const { explorerPage, explorerUrl, browserContext } = await getContexts(
        page,
        url,
        isWebExtension,
    );
    context = browserContext;

    if (connectSrc) {
        await setConnectSettings(explorerPage, explorerUrl, {
            trustedHost: false,
            connectSrc,
        });
    }

    log('opening explorer page');
    await explorerPage.goto(`${explorerUrl}#/method/verifyMessage`);
    log('waiting for explorer to load');
    await explorerPage.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });

    log('opening popup');
    [popup] = await openPopup(context, explorerPage, isWebExtension);

    log('waiting for popup analytics to load');
    await popup.waitForSelector("button[data-test='@analytics/continue-button']", {
        state: 'visible',
        timeout: 40000,
    });
    log('clicking on analytics continue button');
    await popup.click("button[data-test='@analytics/continue-button']");

    log('waiting for permissions');
    await popup.waitForSelector("div[data-test='@permissions']");

    log('stopEmu');
    await TrezorUserEnvLink.api.stopEmu();
    log('waiting for popup error page');
    await popup.waitForSelector("div[data-test='@connect-ui/error']");
});
