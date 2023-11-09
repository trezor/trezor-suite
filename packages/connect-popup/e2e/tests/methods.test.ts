/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

import { test } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { fixtures } from './__fixtures__/methods';
import { buildOverview } from '../support/buildOverview';
import { ensureDirectoryExists } from '@trezor/node-utils';
import { getContexts, log, openPopup } from '../support/helpers';

const url = process.env.URL || 'http://localhost:8088/';

const emuScreenshots: Record<string, string> = {};

let device = {};
let context: any = null;

const isWebExtension = process.env.IS_WEBEXTENSION === 'true';

const screenshotEmu = async (path: string) => {
    const { response } = await TrezorUserEnvLink.send({
        type: 'emulator-get-screenshot',
    });
    emuScreenshots[path] = response;
};

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
});

test.afterEach(async () => {
    if (context) {
        // BrowserContext has to start fresh each test.
        // https://playwright.dev/docs/api/class-browsercontext#browser-context-close
        await context.close();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
});

test.afterAll(() => {
    buildOverview({ emuScreenshots });
});

// Some methods are not allowed in web extension because of isManagementRestricted
const methodsUrlToSkipInWebExtension = ['wipeDevice', 'recoverDevice'];
const filteredFixtures = fixtures.filter(f => {
    if (isWebExtension && methodsUrlToSkipInWebExtension.includes(f.url)) {
        return false;
    }
    return true;
});
filteredFixtures.forEach(f => {
    // @ts-expect-error
    test(f.title || f.url, async ({ page }, { retry }) => {
        log(f.url, 'start');

        // do complete setup if:
        // - fixture require different device than prev fixture, or
        // - fixture is retried
        if (JSON.stringify(device) !== JSON.stringify(f.device) || retry) {
            device = f.device;
            await TrezorUserEnvLink.api.stopBridge();
            await TrezorUserEnvLink.api.stopEmu();
            await TrezorUserEnvLink.api.startEmu({
                wipe: true,
                save_screenshots: true,
            });
            // @ts-expect-error
            if (!f.device.wiped) {
                // @ts-expect-error
                await TrezorUserEnvLink.api.setupEmu({
                    ...f.device,
                });
                await TrezorUserEnvLink.send({ type: 'emulator-allow-unsafe-paths' });
            }
            await TrezorUserEnvLink.api.startBridge();
        }

        const screenshotsPath = await ensureDirectoryExists(`./e2e/screenshots/${f.url}`);

        const { explorerPage, exploreUrl, browserContext } = await getContexts(
            page,
            url,
            isWebExtension,
        );
        context = browserContext;

        await explorerPage.goto(`${exploreUrl}#/method/${f.url}`);

        // screenshot request
        log(f.url, 'screenshot @trezor/connect call params');

        const code = explorerPage.locator('[data-test="@code"]');
        await code.screenshot({ path: `${screenshotsPath}/1-request.png` });

        log(f.url, 'submitting in connect explorer');
        await explorerPage.waitForSelector("button[data-test='@submit-button']", {
            state: 'visible',
        });
        log(f.url, 'waiting for popup promise');
        const [popup] = await openPopup(context, explorerPage, isWebExtension);
        await popup.waitForLoadState('load');
        log(f.url, 'popup promise resolved');

        log(f.url, 'waiting for confirm analytics');
        await popup.waitForSelector("button[data-test='@analytics/continue-button']", {
            state: 'visible',
            timeout: 40000,
        });
        await popup.click("button[data-test='@analytics/continue-button']");

        log(f.url, 'waiting for confirm permissions button');
        await popup.waitForSelector('button.confirm', { state: 'visible' });
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
                await element.first().waitFor({ state: 'visible' });

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
                // useful for debugging tests
                // await popup.pause();
                await nextElement.click();
            }

            log(f.url, v.selector, 'view finished');

            if (v.nextEmu) {
                // useful for debugging tests
                // await popup.pause();
                await TrezorUserEnvLink.send(v.nextEmu);
            }
        }

        log(f.url, 'all views finished');

        // screenshot response
        log(f.url, 'screenshot response');
        const response = explorerPage.locator('[data-test="@response"]');
        await response.screenshot({ path: `${screenshotsPath}/4-response.png` });
        log(f.url, 'method finished');
    });
});
