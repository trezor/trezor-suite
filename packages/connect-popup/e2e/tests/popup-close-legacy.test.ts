import { test, expect, Page } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { createDeferred, Deferred } from '@trezor/utils';
import { log } from '../support/helpers';

const BRIDGE_VERSION = '2.0.31';
const WAIT_AFTER_TEST = 3000; // how long test should wait for more potential trezord requests
const CONNECT_LEGACY_VERSION = '9.0.10';

// With this test we want to make sure that we are not breaking legacy 3rd party integrations with new popup behaviors.
// So we use old npm version of connect with the current version of popup.
const url =
    process.env.URL ||
    `https://suite.corp.sldev.cz/connect/npm-release/connect-${CONNECT_LEGACY_VERSION}/?trezor-connect-src=http://localhost:8088/`;

console.log('Test run with connect-explorer url: ', url);

interface Response {
    url: string;
    status: number;
    body: string;
}
// requests to bridge
let requests: any[] = [];
// responses from bridge
let responses: Response[] = [];

let releasePromise: Deferred<void> | undefined;
// popup window reference
let popup: Page;
let popupClosedPromise: Promise<undefined> | undefined;

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
});

test.beforeAll(async () => {
    log('beforeAll', 'start');
    await TrezorUserEnvLink.connect();
});

test.beforeEach(async ({ page }) => {
    requests = [];
    responses = [];
    releasePromise = createDeferred();
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
    await TrezorUserEnvLink.api.startBridge(BRIDGE_VERSION);
    log('beforeEach', 'go to: ', `${url}#/method/verifyMessage`);
    await page.goto(`${url}#/method/verifyMessage`);
    log('beforeEach', 'waitForSelector: ', "button[data-test='@submit-button']");
    await page.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });

    // Subscribe to 'request' and 'response' events.
    page.on('request', request => {
        // ignore other than bridge requests
        if (!request.url().startsWith('http://127.0.0.1:21325')) {
            return;
        }
        requests.push({ url: request.url() });
    });

    let requestIndex = 0;
    page.on('response', async response => {
        // ignore other than bridge requests
        if (!response.url().startsWith('http://127.0.0.1:21325')) {
            return;
        }
        if (response.url().endsWith('release/2')) {
            releasePromise!.resolve(undefined);
        }
        console.log(requestIndex, response.status(), response.url());
        requestIndex++;
        responses.push({
            url: response.url(),
            status: response.status(),
            body: await response.text(),
        });
    });

    log('beforeEach', 'waitForEvent: ', 'popup');
    [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click("button[data-test='@submit-button']"),
    ]);

    log('beforeEach', 'waitForLoadState: ', 'load');
    await popup.waitForSelector("button[data-test='@analytics/continue-button']", {
        state: 'visible',
        timeout: 40000,
    });
    log('beforeEach', 'click: ', "button[data-test='@analytics/continue-button']");
    await popup.click("button[data-test='@analytics/continue-button']");

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    log('beforeEach', 'waitForLoadState: ', 'load');
    await popup.waitForLoadState('load');

    // TODO: we ignore permissions since the legacy connect-explorer is now run as trustedHost.
    // log('beforeEach', 'waitForSelector: ', 'button.confirm');
    // await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
    // log('beforeEach', 'click: ', 'button.confirm');
    // await popup.click('button.confirm');
    log('beforeEach', 'waitForSelector: ', '.follow-device >> visible=true');
    await popup.waitForSelector('.follow-device >> visible=true');
});

// Finish verify message in afterEach. This is here to prove that after the first
// failed attempt it is possible to retry successfully without any weird bug/race condition/edge-case
// we are validating here this commit https://github.com/trezor/connect/commit/fc60c3c03d6e689f3de2d518cc51f62e649a20e2
test.afterEach(async ({ page }) => {
    log('afterEach', `goto: ${url}#/method/verifyMessage`);
    await page.goto(`${url}#/method/verifyMessage`);
    log('afterEach', 'waitForSelector: ', "button[data-test='@submit-button']");
    await page.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });
    log('afterEach', 'waitForEvent: ', 'popup');
    [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click("button[data-test='@submit-button']"),
    ]);

    log('afterEach', 'waitForLoadState: ', 'load');
    await popup.waitForLoadState('load');

    // await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
    // await popup.click('button.confirm');
    log('afterEach', 'waitForSelector: ', '.follow-device >> visible=true');
    await popup.waitForSelector('.follow-device >> visible=true');
    log('afterEach', 'click on yes');
    await TrezorUserEnvLink.send({ type: 'emulator-press-yes' });
    await TrezorUserEnvLink.send({ type: 'emulator-press-yes' });
    await TrezorUserEnvLink.send({ type: 'emulator-press-yes' });
    await page.waitForSelector('text=Message verified');
});

test(`popup closed by user with bridge version ${BRIDGE_VERSION}`, async ({ page }) => {
    log('start', test.info().title);
    log('waiting for popup close');
    // user closed popup
    await popup.close();
    log('waiting for popupClosePromise');
    await popupClosedPromise;
    log('waiting for timeout');
    await page.waitForTimeout(WAIT_AFTER_TEST);

    log('checking responses');
    expect(responses[12].url).toEqual('http://127.0.0.1:21325/post/2');
    await page.waitForSelector('text=Method_Interrupted');
});

test(`device dialog canceled by user with bridge version ${BRIDGE_VERSION}`, async ({ page }) => {
    log('start', test.info().title);

    log('user canceled dialog on device');
    // user canceled dialog on device
    await TrezorUserEnvLink.send({ type: 'emulator-press-no' });
    await TrezorUserEnvLink.send({ type: 'emulator-press-yes' });
    await page.waitForTimeout(WAIT_AFTER_TEST);

    responses.forEach(response => {
        expect(response.status).toEqual(200);
        // no post endpoint is used
        expect(response.url).not.toContain('post');
    });

    await releasePromise!.promise;
    // With legacy 3rd party, popup is closed automatically when device dialog is canceled.
    await popupClosedPromise;

    await page.waitForSelector('text=Failure_ActionCancelled');
});

test(`device disconnected during device interaction with bridge version ${BRIDGE_VERSION}`, async ({
    page,
}) => {
    log('start', test.info().title);

    log('user canceled interaction on device');
    // user canceled interaction on device
    await TrezorUserEnvLink.api.stopEmu();
    await page.waitForTimeout(WAIT_AFTER_TEST);

    responses.forEach(response => {
        expect(response.url).not.toContain('post');
    });

    // 'device disconnected during action' error
    expect(responses[12]).toMatchObject({
        url: 'http://127.0.0.1:21325/call/2',
        status: 400,
    });

    // With legacy 3rd party, popup is closed automatically when device dialog is canceled.
    await releasePromise!.promise;
    await popupClosedPromise;

    await page.waitForSelector('text=device disconnected during action');

    await TrezorUserEnvLink.api.startEmu();
});

test.skip(`popup is reloaded by user. bridge version ${BRIDGE_VERSION}`, async () => {
    log('start', test.info().title);
    log('reloading popup');

    await popup.reload();
    // after popup is reload, communication is lost, there is only infinite loader
    log('waiting for infinite loader');
    await popup.waitForSelector('div[data-test="@connect-ui/loader"]');
    // todo: there is no message into client about the fact that popup was unloaded
});

test.skip('when user cancels permissions in popup it closes automatically', async ({ page }) => {
    log('start', test.info().title);

    await TrezorUserEnvLink.api.pressYes();
    await TrezorUserEnvLink.api.pressYes();
    await TrezorUserEnvLink.api.pressYes();

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    await popupClosedPromise;

    await page.goto(`${url}#/method/getAddress`);
    await page.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });

    [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click("button[data-test='@submit-button']"),
    ]);

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    await popup.waitForLoadState('load');
    await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
    await popup.waitForSelector("button[data-test='@permissions/confirm-button']");
    // We are testing that when cancel permissions, popup is closed automatically.
    await popup.click("button[data-test='@permissions/cancel-button']");
    // Wait for popup to close.
    await popupClosedPromise;
});

test.skip('when user cancels Export Bitcoin address dialog in popup it closes automatically', async ({
    page,
}) => {
    log('start', test.info().title);

    await TrezorUserEnvLink.api.pressYes();
    await TrezorUserEnvLink.api.pressYes();
    await TrezorUserEnvLink.api.pressYes();

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve(undefined));
    });

    await popupClosedPromise;

    await page.goto(`${url}#/method/getAddress`);
    await page.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });
    [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click("button[data-test='@submit-button']"),
    ]);
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
