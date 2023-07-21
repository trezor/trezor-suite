import { test, chromium, Page } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const url = process.env.URL || 'http://localhost:8088/';

let popup: Page;

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
    await TrezorUserEnvLink.api.stopEmu();
    await TrezorUserEnvLink.api.stopBridge();
    await TrezorUserEnvLink.api.startEmu({ wipe: true });
    await TrezorUserEnvLink.api.setupEmu({ passphrase_protection: false });
    await TrezorUserEnvLink.api.startBridge();
});

const fixtures = [
    {
        description: `iframe and host same origins but with trust-issues=true -> show permissions`,
        queryString: '?trust-issues=true',
        expect: () => popup.waitForSelector("[data-test='@permissions/confirm-button']"),
    },
    {
        description: `iframe and host same origins but with trust-issues=false -> no permissions shown`,
        queryString: '?trust-issues=false',
        expect: () =>
            popup.waitForSelector('//p[contains(., "Follow instructions on your device")]', {
                state: 'visible',
                strict: false,
            }),
    },
];

fixtures.forEach(f => {
    test(f.description, async () => {
        const browserInstance = await chromium.launch();
        const page = await browserInstance.newPage();
        await page.goto(`${url}${f.queryString}#/method/verifyMessage`);

        [popup] = await Promise.all([
            page.waitForEvent('popup'),
            page.click("button[data-test='@submit-button']"),
        ]);

        await f.expect();
        await browserInstance.close();
    });
});
