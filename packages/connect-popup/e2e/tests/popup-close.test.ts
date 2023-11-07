import { test, expect, Page } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { createDeferred, Deferred, addDashesToSpaces } from '@trezor/utils';
import {
    findElementByDataTest,
    waitAndClick,
    log,
    downloadLogs,
    checkHasLogs,
} from '../support/helpers';

const host = process.env.URL || 'http://localhost:8088/';
const url = `${host}?trust-issues=true`;

const WAIT_AFTER_TEST = 3000; // how long test should wait for more potential trezord requests

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
// let logPage: Page;
let popupClosedPromise: Promise<undefined> | undefined;

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
});

// todo: 2.0.27 version don't have localhost nor sldev whitelisted. So this can't be tested in CI. Possible workarounds:
// - host bridge that is used in this test on trezor.io domain, or
// - run it all locally in CI (./docker/docker-compose.connect.explorer.test.yml)
[/* '2.0.27', */ '2.0.31'].forEach(bridgeVersion => {
    test.beforeEach(async ({ page }) => {
        requests = [];
        responses = [];
        releasePromise = createDeferred();

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
            mnemonic:
                'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
            pin: '',
            passphrase_protection: false,
            label: 'My Trevor',
            needs_backup: false,
        });
        log('beforeEach', 'startBridge');
        await TrezorUserEnvLink.api.startBridge(bridgeVersion);

        await page.goto(`${url}#/method/verifyMessage`);
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

        [popup] = await Promise.all([
            page.waitForEvent('popup'),
            page.click("button[data-test='@submit-button']"),
        ]);

        await popup.waitForSelector("button[data-test='@analytics/continue-button']", {
            state: 'visible',
            timeout: 40000,
        });
        await popup.click("button[data-test='@analytics/continue-button']");

        popupClosedPromise = new Promise(resolve => {
            popup.on('close', () => resolve(undefined));
        });

        await popup.waitForLoadState('load');

        await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
        await popup.click('button.confirm');
        await popup.waitForSelector('.follow-device >> visible=true');
    });

    // Finish verify message in afterEach. This is here to prove that after the first
    // failed attempt it is possible to retry successfully without any weird bug/race condition/edge-case
    // we are validating here this commit https://github.com/trezor/connect/commit/fc60c3c03d6e689f3de2d518cc51f62e649a20e2
    test.afterEach(async ({ page, context }, testInfo) => {
        const logPage = await context.newPage();
        await logPage.goto(`${host}log.html`);

        const hasLogs = await checkHasLogs(logPage);
        if (hasLogs) {
            log('afterEach', 'downloading logs');
            await downloadLogs(
                logPage,
                `./test-results/log-${addDashesToSpaces(testInfo.title)}.txt`,
            );
        } else {
            log('afterEach', 'no logs');
        }

        // For tests including annotation `skip-after-flow` we don't want to run this.
        const skipAfterFlow = testInfo.annotations.find(
            annotation => annotation.type === 'skip-after-flow',
        );
        if (skipAfterFlow) return;

        await page.goto(`${url}#/method/verifyMessage`);
        await page.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });
        [popup] = await Promise.all([
            page.waitForEvent('popup'),
            page.click("button[data-test='@submit-button']"),
        ]);

        await popup.waitForLoadState('load');

        await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
        await popup.click('button.confirm');
        await popup.waitForSelector('.follow-device >> visible=true');
        await TrezorUserEnvLink.send({ type: 'emulator-press-yes' });
        await TrezorUserEnvLink.send({ type: 'emulator-press-yes' });
        await TrezorUserEnvLink.send({ type: 'emulator-press-yes' });
        await page.waitForSelector('text=Message verified');
    });

    test(`popup closed by user with bridge version ${bridgeVersion}`, async ({ page }) => {
        // user closed popup
        await popup.close();
        await popupClosedPromise;
        await page.waitForTimeout(WAIT_AFTER_TEST);

        if (bridgeVersion === '2.0.31') {
            expect(responses[12].url).toEqual('http://127.0.0.1:21325/post/2');
            await page.waitForSelector('text=Method_Interrupted');
        }
    });

    test(`device dialog canceled by user with bridge version ${bridgeVersion}`, async ({
        page,
    }) => {
        // user canceled dialog on device
        await TrezorUserEnvLink.send({ type: 'emulator-press-no' });
        await TrezorUserEnvLink.send({ type: 'emulator-press-yes' });

        await page.waitForTimeout(WAIT_AFTER_TEST);

        responses.forEach(response => {
            expect(response.status).toEqual(200);
            // no post endpoint is used
            expect(response.url).not.toContain('post');
        });

        await popup.click("button[data-test='@connect-ui/error-close-button']");
        await releasePromise!.promise;
        await popupClosedPromise;

        await page.waitForSelector('text=Failure_ActionCancelled');
    });

    test(`device disconnected during device interaction with bridge version ${bridgeVersion}`, async ({
        page,
    }) => {
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

        await popup.click("button[data-test='@connect-ui/error-close-button']");
        await releasePromise!.promise;
        await popupClosedPromise;

        await page.waitForSelector('text=device disconnected during action');

        await TrezorUserEnvLink.api.startEmu();
    });

    // todo: this one is somewhat flaky. tends to produce "RuntimeError - Emulator proces died" error
    test.skip(`trezor bridge ${bridgeVersion} was killed during action`, async ({ page }) => {
        // user canceled interaction on device
        await TrezorUserEnvLink.send({ type: 'bridge-stop' });
        await popupClosedPromise;

        await page.waitForSelector('text=Aborted');

        // todo: emulator stop should not be needed. this indicate some kind of bug
        await TrezorUserEnvLink.api.stopEmu();

        await TrezorUserEnvLink.api.startBridge();

        // todo: see previous comment, emulator should be already running
        await TrezorUserEnvLink.api.startEmu();
    });

    // reloading page might end with "closed device" error from here:
    // https://github.com/trezor/trezord-go/blob/106e5e9af3573ac2b27ebf2082bbee91650949bf/usb/libusb.go#L511
    // this was probably targeted by this (never merged) trezor-bridge PR https://github.com/trezor/trezord-go/pull/156
    test.skip(`client (connect-explorer) is reloaded by user while popup is active. bridge version ${bridgeVersion}`, async ({
        page,
    }) => {
        await page.reload();
        // todo: page reload closes popup, which is what we want, but it does not cancel interaction on device.
        await popupClosedPromise;
    });

    // just like the previous skipped test.
    // request: http://127.0.0.1:21325/call/3
    // response {"error":"closed device"}
    test(`popup is reloaded by user. bridge version ${bridgeVersion}`, async () => {
        await popup.reload();
        // after popup is reload, communication is lost, there is only infinite loader
        await popup.waitForSelector('div[data-test="@connect-ui/loader"]');
        // todo: there is no message into client about the fact that popup was unloaded
    });

    test('when user cancels permissions in popup it closes automatically', async ({ page }) => {
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

    test('when user cancels Export Bitcoin address dialog in popup it closes automatically', async ({
        page,
    }) => {
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

    test('popup should close and open new one when popup is in error state and user triggers new call', async ({
        page,
    }) => {
        // user canceled interaction on device
        await TrezorUserEnvLink.api.pressNo();
        await TrezorUserEnvLink.api.pressYes();

        // await page.pause();

        // Error page is displayed.
        await findElementByDataTest(popup, '@connect-ui/error');

        await waitAndClick(page, ['@submit-button']);

        // Currently open popup should be closed.
        await popupClosedPromise;

        // New popup should be opened. To handle the new request
        [popup] = await Promise.all([page.waitForEvent('popup')]);

        // We cancel the request since we already tested what we wanted.
        await waitAndClick(popup, ['@permissions/cancel-button']);
        // Wait for popup to close.
        await popupClosedPromise;
        await page.waitForSelector('text=Permissions not granted');
    });

    test('popup should be focused when a call is in progress and user triggers new call', async ({
        page,
    }) => {
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

        await popup.waitForSelector("button[data-test='@permissions/confirm-button']");

        await waitAndClick(popup, ['@permissions/confirm-button']);

        // Click in 3rd party to trigger new call. But instead of new call it should focus on open popup.
        await waitAndClick(page, ['@submit-button']);

        // Popup should keep its reference and state so we should be able to find confirm button for export-address.
        await waitAndClick(popup, ['@export-address/confirm-button']);

        // Confirm right address is displayed.
        await TrezorUserEnvLink.api.pressYes();

        // Popup should be closed now.
        await popupClosedPromise;
    });

    test('popup should close when third party is closed', async ({ page }) => {
        // We need to skip the after flow because this test closes 3rd party window and there is not window to continue with.
        test.info().annotations.push({ type: 'skip-after-flow' });
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

        await waitAndClick(popup, ['@permissions/confirm-button']);

        // Closing page with 3rd party so we make sure that popup is closed automatically.
        await page.close();
        // Wait for popup to close to consider the test successful.
        await popupClosedPromise;
    });
});
