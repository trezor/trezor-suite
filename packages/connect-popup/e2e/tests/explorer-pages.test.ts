import { test, Page, BrowserContext, expect } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { getContexts, openPopup, log, setConnectSettings, waitAndClick } from '../support/helpers';

const url = process.env.URL || 'http://localhost:8088/';

const bridgeVersion = '2.0.31';
// popup window reference
let popup: Page;
let persistentContext: BrowserContext | undefined;

const isWebExtension = process.env.IS_WEBEXTENSION === 'true';

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
    log(`isWebExtension: ${isWebExtension}`);
    log(`url: ${url}`);
});

test.afterEach(async () => {
    if (persistentContext) {
        // BrowserContext has to start fresh each test.
        // https://playwright.dev/docs/api/class-browsercontext#browser-context-close
        await persistentContext.close();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
});

test('Connect explorer settings page initiate connect with provided connectSrc', async ({
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
    persistentContext = browserContext;

    await setConnectSettings(explorerPage, explorerUrl, {
        trustedHost: false,
        connectSrc: 'https://connect.trezor.io/9/',
    });

    log('opening explorer page');
    await explorerPage.goto(`${explorerUrl}#/method/getAddress`);
    log('waiting for explorer to load');
    await explorerPage.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });

    log('opening popup');
    [popup] = await openPopup(persistentContext, explorerPage, isWebExtension);

    const popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    console.log('popup.url()', popup.url());
    expect(popup.url() === 'https://connect.trezor.io/9/popup.html').toBeTruthy();

    await waitAndClick(popup, [
        '@analytics/continue-button',
        '@permissions/confirm-button',
        '@export-address/cancel-button',
    ]);

    // Wait for popup to close.
    await popupClosedPromise;

    await setConnectSettings(explorerPage, explorerUrl, {
        connectSrc: 'http://localhost:8088/',
    });

    log('opening explorer page');
    await explorerPage.goto(`${explorerUrl}#/method/getAddress`);
    log('waiting for explorer to load');
    await explorerPage.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });

    log('opening popup');
    [popup] = await openPopup(persistentContext, explorerPage, isWebExtension);
    console.log('popup.url()', popup.url());

    expect(popup.url() === 'http://localhost:8088/popup.html').toBeTruthy();
});
