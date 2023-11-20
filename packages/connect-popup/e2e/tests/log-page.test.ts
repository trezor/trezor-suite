import { test, Page, expect } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import fs from 'fs';
import { log } from '../support/helpers';

const url = process.env.URL || 'http://localhost:8088/';
const bridgeVersion = '2.0.31';

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
});

// popup window reference
let popup: Page;

test('log page should contain logs from shared worker', async ({ page, context }) => {
    const errorLogs: any[] = [];
    page.on('console', message => {
        if (message.type() === 'error') {
            errorLogs.push(message.text());
        }
    });
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

    log(`go to: ${url}#/method/verifyMessage`);
    await page.goto(`${url}#/method/verifyMessage`);
    [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click("button[data-test='@submit-button']"),
    ]);
    await popup.waitForLoadState('load');
    log(`loaded: ${url}#/method/verifyMessage`);
    // Open new tab to go to log.html
    const logsPage = await context.newPage();

    log(`go to: ${url}log.html`);
    await logsPage.goto(`${url}log.html`);
    await logsPage.waitForLoadState('load');
    log(`loaded: ${url}log.html`);

    log('waiting for download-button to be visible');
    await logsPage.waitForSelector("button[data-test='@log-container/download-button']", {
        state: 'visible',
        timeout: 40 * 1000,
    });

    log('clicking download button and waiting for download to start');
    const [download] = await Promise.all([
        logsPage.waitForEvent('download'), // wait for download to start
        logsPage.click("button[data-test='@log-container/download-button']"),
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
