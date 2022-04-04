/* eslint-disable @typescript-eslint/no-var-requires */
const { _electron: electron } = require('playwright');
const { test, expect } = require('@playwright/test');
const { Controller } = require('../../../websocket-client');

let window;
let electronApp;

test.beforeAll(async () => {
    // Launch Electron app.
    electronApp = await electron.launch({
        cwd: '../suite-desktop',
        args: ['./dist/app.js'],
    });
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

test('The first test', async () => {
    window = await electronApp.firstWindow();
    const title = await window.title();
    expect(title).toBe('Trezor Suite');

    const controller = new Controller();
    await controller.connect();
    // todo: this shouldn't be needed. desktop should run its own bridge on localhost?
    await controller.send({ type: 'bridge-start' });

    await getTestElement(window, '@welcome/title');
    await window.screenshot({ path: './projects/suite-desktop/screenshots/intro.png' });

    await controller.send({
        type: 'emulator-start',
    });

    await getTestElement(window, '@onboarding/continue-button');
    await window.screenshot({ path: './projects/suite-desktop/screenshots/analytics.png' });
});

test.afterAll(async () => {
    // Exit app.
    await electronApp.close();
});
