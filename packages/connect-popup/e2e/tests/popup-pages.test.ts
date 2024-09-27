import { test, Page, BrowserContext, expect } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import {
    getContexts,
    openPopup,
    log,
    setConnectSettings,
    formatUrl,
    waitAndClick,
} from '../support/helpers';

import fs from 'fs';

const url = process.env.URL || 'http://localhost:8088/';

const bridgeVersion = '2.0.33';
// popup window reference
let popup: Page;
let persistentContext: BrowserContext | undefined;

const isWebExtension = process.env.IS_WEBEXTENSION === 'true';
const connectSrc = process.env.TREZOR_CONNECT_SRC;

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
    log(`isWebExtension: ${isWebExtension}`);
    log(`connectSrc: ${connectSrc}`);
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

// Debug mode does not have to be enable since it is default in connect-explorer
test('popup should display error page when device disconnected and debug mode', async ({
    page,
}) => {
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
    await TrezorUserEnvLink.startBridge(bridgeVersion);

    log('generating contexts');
    const { explorerPage, explorerUrl, browserContext } = await getContexts(
        page,
        url,
        isWebExtension,
    );
    persistentContext = browserContext;

    if (connectSrc) {
        await setConnectSettings(explorerPage, explorerUrl, {
            trustedHost: false,
            connectSrc,
        });
    }

    log('opening explorer page');
    await explorerPage.goto(formatUrl(explorerUrl, `methods/bitcoin/verifyMessage/`));

    log('waiting for explorer to load');
    await waitAndClick(page, ['@api-playground/collapsible-box']);
    await page.waitForSelector("div[data-testid='@api-playground/collapsible-box']");
    await explorerPage.waitForSelector("button[data-testid='@submit-button']", {
        state: 'visible',
    });

    log('opening popup');
    [popup] = await openPopup(persistentContext, explorerPage, isWebExtension);

    log('waiting for popup analytics to load');
    await popup.waitForSelector("button[data-testid='@analytics/continue-button']", {
        state: 'visible',
        timeout: 40000,
    });
    log('clicking on analytics continue button');
    await popup.click("button[data-testid='@analytics/continue-button']");

    log('waiting for permissions');
    await popup.waitForSelector("div[data-testid='@permissions']");

    log('stopEmu');
    await TrezorUserEnvLink.stopEmu();
    log('waiting for popup error page');
    await popup.waitForSelector("div[data-testid='@connect-ui/error']");
});

test('log page should contain logs from shared worker', async ({ page, context }) => {
    const errorLogs: any[] = [];
    page.on('console', message => {
        if (message.type() === 'error') {
            errorLogs.push(message.text());
        }
    });
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
    await TrezorUserEnvLink.startBridge(bridgeVersion);

    log('generating contexts');
    const { explorerPage, explorerUrl, browserContext } = await getContexts(
        page,
        url,
        isWebExtension,
    );
    persistentContext = browserContext || context;

    if (connectSrc) {
        await setConnectSettings(explorerPage, explorerUrl, {
            trustedHost: false,
            connectSrc,
        });
    }

    const verifyMessageUrl = formatUrl(explorerUrl, `methods/bitcoin/verifyMessage/`);
    await explorerPage.goto(verifyMessageUrl);

    log('opening popup');
    [popup] = await openPopup(persistentContext, explorerPage, isWebExtension);

    await popup.waitForLoadState('load');
    log(`loaded: ${verifyMessageUrl}`);
    // Open new tab to go to log.html
    const logsPage = await persistentContext.newPage();

    const logsUrl = `${url.split('?')[0]}log.html`;
    log(`go to: ${logsUrl}`);
    await logsPage.goto(logsUrl);
    await logsPage.waitForLoadState('load');
    log(`loaded: ${logsUrl}`);

    log('waiting for download-button to be visible');
    await logsPage.waitForSelector("button[data-testid='@log-container/download-button']", {
        state: 'visible',
        timeout: 40 * 1000,
    });

    log('clicking download button and waiting for download to start');
    const [download] = await Promise.all([
        logsPage.waitForEvent('download'), // wait for download to start
        logsPage.click("button[data-testid='@log-container/download-button']"),
    ]);

    log('download started');

    const downloadPath = '/tmp/trezor-connect-test-log.txt';
    log(`saving to: ${downloadPath}`);
    await download.saveAs(downloadPath);

    log('checking if file exists');
    fs.existsSync(downloadPath);
    log('file exists');

    log('reading file');
    const data = fs.readFileSync(downloadPath, 'utf8');
    log('file read');

    // It should be parsable JSON
    const parsedData = JSON.parse(data);

    expect(parsedData.length).toBeGreaterThan(0);
    await download.delete();

    // We want to shout out when there is an error in console, specifically when there is an error
    // when postMessage is not able to serialize the message, because of circular reference or other.
    expect(errorLogs.length).toBe(0);
});
