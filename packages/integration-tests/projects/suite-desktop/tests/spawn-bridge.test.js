/* eslint-disable @typescript-eslint/no-var-requires, no-await-in-loop, no-async-promise-executor */
const { _electron: electron } = require('playwright');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { test, expect } = require('@playwright/test');
const { Controller } = require('../../../websocket-client');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test.beforeAll(async () => {
    // todo: wait for trezor-user-env. to be part of trezor-user-env-link package
    await new Promise(async resolve => {
        for (let i = 0; i < 60; i++) {
            await delay(1000);

            try {
                const res = await fetch('http://localhost:9002');
                if (res.ok) {
                    resolve();
                }
            } catch (err) {
                console.log('waiting for trezor-user-env...');
            }
        }
        resolve();
    });

    // todo: some problems with path in dev and production and tests. tldr tests are expecting
    // binaries somewhere where they are not, so I copy them to that place. Maybe I find a
    // better solution later
    if (!fs.existsSync('/trezor-suite/node_modules/electron/dist/resources/bin/')) {
        fs.mkdirSync('/trezor-suite/node_modules/electron/dist/resources/bin/');
    }
    if (!fs.existsSync('/trezor-suite/node_modules/electron/dist/resources/bin/bridge/')) {
        fs.mkdirSync('/trezor-suite/node_modules/electron/dist/resources/bin/bridge/');
    }
    fs.copyFileSync(
        path.join(__dirname, '../../../..', 'suite-data/files/bin/bridge/linux-x64/trezord'),
        path.join('/trezor-suite/node_modules/electron/dist/resources/bin/bridge/trezord'),
    );
});

const getTestElement = async (window, dataTest) => {
    const selector = `[data-test="${dataTest}"]`;
    const el = await window.locator(selector);
    if (!el) {
        // todo: normally I would retry here. Is there built in retryability in playwright?
        throw new Error(`element: ${selector} does not exist`);
    }
    await expect(el).toBeVisible();
    return el;
};

test('App spawns bundled bridge and stops it after app quit', async ({ request }) => {
    // Launch Electron app.
    const electronApp = await electron.launch({
        cwd: '../suite-desktop',
        args: ['./dist/app.js', '--log-level=DEBUG', '--bridge-test'],
    });
    const window = await electronApp.firstWindow();
    const title = await window.title();
    expect(title).toBe('Trezor Suite');

    const controller = new Controller();
    await controller.connect();
    await controller.send({
        type: 'emulator-start',
    });

    await getTestElement(window, '@welcome/title');
    await window.screenshot({ path: './projects/suite-desktop/screenshots/intro.png' });

    // bridge is running
    const bridgeRes1 = await request.get('http://127.0.0.1:21325/status/');
    await expect(bridgeRes1).toBeOK();

    await getTestElement(window, '@onboarding/continue-button');
    await window.screenshot({ path: './projects/suite-desktop/screenshots/analytics.png' });

    await electronApp.close();

    // bridge is not running
    try {
        await request.get('http://127.0.0.1:21325/status/');
        throw new Error('should have thrown!');
    } catch (err) {
        // ok
    }
});
