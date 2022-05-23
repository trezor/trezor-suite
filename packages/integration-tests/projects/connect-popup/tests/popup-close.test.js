const { test, expect } = require('@playwright/test');
const { Controller } = require('../../../websocket-client');
const { createDeferred } = require('@trezor/utils');

const url = process.env.URL || 'http://localhost:8088/';
const controller = new Controller();

const WAIT_AFTER_TEST = 3000; // how long test should wait for more potential trezord requests

// requests to bridge
let requests = [];
// responses from bridge
let responses = [];

let releasePromise;
// popup window reference
let popup;
let popupClosedPromise;

test.beforeAll(async () => {
    await controller.connect();
});

// todo: 2.0.27 version don't have localhost nor sldev whitelisted. So this can't be tested in CI. Possible workarounds:
// - host bridge that is used in this test on trezor.io domain, or
// - run it all locally in CI (./docker/docker-compose.connect.explorer.test.yml)
[/* '2.0.27', */ '2.0.31'].forEach(bridgeVersion => {
    test.beforeEach(async ({ page }) => {
        requests = [];
        responses = [];
        releasePromise = createDeferred();

        await controller.send({
            type: 'bridge-stop',
        });
        await controller.send({
            type: 'emulator-stop',
        });
        await controller.send({
            type: 'emulator-start',
            wipe: true,
        });
        await controller.send({
            type: 'emulator-setup',
            mnemonic:
                'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
            pin: '',
            passphrase_protection: false,
            label: 'My Trevor',
            needs_backup: false,
        });
        await controller.send({
            type: 'bridge-start',
            version: bridgeVersion,
        });

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

        page.on('response', async response => {
            // ignore other than bridge requests
            if (!response.url().startsWith('http://127.0.0.1:21325')) {
                return;
            }
            if (response.url().endsWith('release/2')) {
                releasePromise.resolve();
            }
            console.log(response.status(), response.url());
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

        popupClosedPromise = new Promise(resolve => {
            popup.on('close', () => resolve());
        });

        await popup.waitForLoadState('load');

        await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
        await popup.click('button.confirm');
        await popup.waitForSelector('.follow-device >> visible=true');
    });

    // Finish verify message in afterEach. This is here to prove that after the first
    // failed attempt it is possible to retry successfully without any weird bug/race condition/edge-case
    // we are validating here this commit https://github.com/trezor/connect/commit/fc60c3c03d6e689f3de2d518cc51f62e649a20e2
    test.afterEach(async ({ page }) => {
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
        await controller.send({ type: 'emulator-press-yes' });
        await controller.send({ type: 'emulator-press-yes' });
        await controller.send({ type: 'emulator-press-yes' });
        await page.waitForSelector('text=Message verified');
    });

    test(`popup closed by user with bridge version ${bridgeVersion}`, async ({ page }) => {
        // user closed popup
        await popup.close();
        await popupClosedPromise;
        await page.waitForTimeout(WAIT_AFTER_TEST);

        if (bridgeVersion === '2.0.31') {
            expect(responses[12].url).toEqual('http://127.0.0.1:21325/post/2');
            await page.waitForSelector('text=Failure_ActionCancelled');
        }
    });

    test(`device dialog canceled by user with bridge version ${bridgeVersion}`, async ({
        page,
    }) => {
        // user canceled dialog on device
        await controller.send({ type: 'emulator-press-no' });
        await releasePromise.promise;
        await popupClosedPromise;
        await page.waitForTimeout(WAIT_AFTER_TEST);

        responses.forEach(response => {
            expect(response.status).toEqual(200);
            // no post endpoint is used
            expect(response.url).not.toContain('post');
        });

        await page.waitForSelector('text=Failure_ActionCancelled');
    });

    test(`device disconnected during device interaction with bridge version ${bridgeVersion}`, async ({
        page,
    }) => {
        // user canceled interaction on device
        await controller.send({ type: 'emulator-stop' });
        await releasePromise.promise;
        await popupClosedPromise;
        await page.waitForTimeout(WAIT_AFTER_TEST);

        responses.forEach(response => {
            expect(response.url).not.toContain('post');
        });

        // 'device disconnected during action' error
        expect(responses[12]).toMatchObject({
            url: 'http://127.0.0.1:21325/call/2',
            status: 400,
        });

        await page.waitForSelector('text=device disconnected during action');

        await controller.send({
            type: 'emulator-start',
        });
    });

    // todo: this one is somewhat flaky. tends to produce "RuntimeError - Emulator proces died" error
    test.skip(`trezor bridge ${bridgeVersion} was killed during action`, async ({ page }) => {
        // user canceled interaction on device
        await controller.send({ type: 'bridge-stop' });
        await popupClosedPromise;

        await page.waitForSelector('text=Aborted');

        // todo: emulator stop should not be needed. this indicate some kind of bug
        await controller.send({
            type: 'emulator-stop',
        });

        await controller.send({
            type: 'bridge-start',
        });

        // todo: see previous comment, emulator should be already running
        await controller.send({
            type: 'emulator-start',
        });
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
    test.skip(`popup is reloaded by user. bridge version ${bridgeVersion}`, async ({ page }) => {
        await popup.reload();
        // after popup is reload, communication is lost, there is only infinite loader
        await popup.waitForSelector('.loader');
        // todo: there is no message into client about the fact that popup was unloaded
    });
});
