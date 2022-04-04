/* eslint-disable global-require */

const { chromium } = require('playwright');

const { Controller } = require('../../websocket-client');

const controller = new Controller();

(async () => {
    await controller.connect();
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
        mnemonic: 'alcohol woman abuse must during monitor noble actual mixed trade anger aisle',
        pin: '',
        passphrase_protection: false,
        label: 'My Trevor',
        needs_backup: false,
    });
    await controller.send({
        type: 'bridge-start',
    });

    const pathToExtension = require('path').join(
        __dirname,
        '..',
        '..',
        '..',
        'connect-examples',
        'webextension',
    );
    const userDataDir = '/tmp/test-user-data-dir';
    const browserContext = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
        ],
    });

    const backgroundPage = browserContext.backgroundPages()[0];

    [popup] = await Promise.all([
        browserContext.waitForEvent('page'),

        backgroundPage.evaluate(() => {
            chrome.tabs.query({ active: true }, tabs => {
                chrome.browserAction.onClicked.dispatch(tabs[0]);
            });
        }),
    ]);

    popupClosedPromise = new Promise(resolve => {
        popup.on('close', () => resolve());
    });

    await popup.waitForLoadState('load');

    await popup.waitForSelector('button.confirm', { state: 'visible', timeout: 40000 });
    await popup.click('button.confirm');

    await popup.waitForSelector('.export-address >> visible=true');
    const submitButton = popup.locator('button.confirm >> visible=true').click();
    await popup.waitForSelector('text=3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX');

    await Promise.all([
        popup.waitForEvent('close'),
        controller.send({ type: 'emulator-press-yes' }),
    ]);

    await browserContext.close();

    process.exit(0);
})();
