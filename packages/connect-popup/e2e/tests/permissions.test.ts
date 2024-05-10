import { test, chromium, Page } from '@playwright/test';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { setConnectSettings } from '../support/helpers';

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
        description:
            'iframe and host same origins but with settings to trustedHost -> no permissions shown',
        queryString: '',
        setTrustedHost: true,
        expect: () =>
            popup.waitForSelector('//p[contains(., "Follow instructions on your device")]', {
                state: 'visible',
                strict: false,
            }),
    },
    {
        description:
            'iframe and host same origins but with settings to NOT trustedHost -> show permissions',
        queryString: '',
        setTrustedHost: false,
        expect: () => popup.waitForSelector("[data-test='@permissions/confirm-button']"),
    },
];

fixtures.forEach(f => {
    test(f.description, async () => {
        const browserInstance = await chromium.launch();
        const page = await browserInstance.newPage();
        await setConnectSettings(page, url, { trustedHost: f.setTrustedHost }, false);

        await page.click("a[data-test='@navbar-logo']");
        await page.click("a[href$='/methods/bitcoin/verifyMessage/']");
        await page.waitForSelector("div[data-test='@api-playground/collapsible-box']");

        [popup] = await Promise.all([
            page.waitForEvent('popup'),
            page.click("button[data-test='@submit-button']"),
        ]);

        await f.expect();
        await browserInstance.close();
    });
});
