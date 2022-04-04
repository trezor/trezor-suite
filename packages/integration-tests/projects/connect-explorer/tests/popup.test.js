/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

const { test } = require('@playwright/test');
const fs = require('fs');

const { Controller } = require('../../../websocket-client');
const fixtures = require('./fixtures');
const buildOverview = require('../support/buildOverview');

const url = process.env.URL || 'http://localhost:8088/';
const SCREENSHOTS_DIR = './projects/connect-explorer/screenshots';
const controller = new Controller({ url: 'ws://localhost:9001/' });
const emuScreenshots = {};

const log = (...val) => {
    console.log(`[===]`, ...val);
};

const ensureScreenshotsDir = () => {
    // todo: do this only on local. we need to keep files there in case of flakiness reruns
    if (fs.existsSync(SCREENSHOTS_DIR)) {
        // fs.rmSync(SCREENSHOTS_DIR, { recursive: true });
        // fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    } else {
        fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
};

const screenshotEmu = async path => {
    const { response } = await controller.send({
        type: 'emulator-get-screenshot',
    });
    emuScreenshots[path] = response;
};

test.beforeAll(async () => {
    await controller.connect();
    ensureScreenshotsDir();
});

test.afterAll(() => {
    buildOverview({ emuScreenshots });
});

let device = {};

fixtures.forEach(f => {
    test(f.url, async ({ page }, { retry }) => {
        log(f.url, 'start');

        // do complete setup if:
        // - fixture require different device than prev fixture, or
        // - fixture is retried
        if (JSON.stringify(device) !== JSON.stringify(f.device) || retry) {
            device = f.device;
            await controller.send({
                type: 'bridge-stop',
            });
            await controller.send({
                type: 'emulator-stop',
            });
            await controller.send({
                type: 'emulator-start',
                wipe: true,
                save_screenshots: true,
            });
            if (!f.device.wiped) {
                await controller.send({
                    type: 'emulator-setup',
                    ...f.device,
                });
                await controller.send({ type: 'emulator-allow-unsafe-paths' });
            }
            await controller.send({
                type: 'bridge-start',
            });
        }

        const screenshotsPath = `${SCREENSHOTS_DIR}/${f.url}`;

        if (!fs.existsSync(screenshotsPath)) {
            fs.mkdirSync(screenshotsPath);
        }

        await page.goto(`${url}#/method/${f.url}`);

        // screenshot request
        log(f.url, 'screenshot trezor-connect call params');

        const code = page.locator('[data-test="@code"]');
        await code.screenshot({ path: `${screenshotsPath}/1-request.png` });

        log(f.url, 'submitting in connect explorer');
        await page.waitForSelector("button[data-test='@submit-button']", { state: 'visible' });
        log(f.url, 'waiting for popup promise');
        const [popup] = await Promise.all([
            // It is important to call waitForEvent before click to set up waiting.
            page.waitForEvent('popup'),
            // Opens popup.
            page.click("button[data-test='@submit-button']"),
        ]);
        await popup.waitForLoadState('load');
        log(f.url, 'popup promise resolved');

        log(f.url, 'waiting for confirm permissions button');
        await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
        await popup.screenshot({
            path: `${screenshotsPath}/2-permissions.png`,
            fullPage: true,
        });
        await popup.click('button.confirm');

        let screenshotCount = 1;
        for (const v of f.views) {
            log(f.url, v.selector, 'expecting view');

            if (v.action === 'close') {
                popup.close();
            }

            if (v.selector) {
                const element = popup.locator(v.selector);
                await element.waitFor({ state: 'visible' });

                if (v.screenshot) {
                    const path = `${screenshotsPath}/3-${screenshotCount}-${v.screenshot.name}.png`;

                    await popup.screenshot({
                        path,
                        fullPage: true,
                    });
                    await screenshotEmu(path);

                    screenshotCount++;
                }
            }

            if (v.next) {
                const nextElement = popup.locator(v.next);
                await nextElement.waitFor();
                await nextElement.click();
            }

            log(f.url, v.selector, 'view finished');

            if (v.nextEmu) {
                await controller.send(v.nextEmu);
            }
        }

        log(f.url, 'all views finished');

        // screenshot response
        log(f.url, 'screenshot response');
        const response = page.locator('[data-test="@response"]');
        await response.screenshot({ path: `${screenshotsPath}/4-response.png` });
        log(f.url, 'method finished');
    });
});
