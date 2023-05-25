/* eslint-disable camelcase */

import { test, Page } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { BackendWebsocketServerMock } from '@trezor/e2e-utils';
import { fixtures } from '../../../e2e-utils/src/fixtures/blockbook-ltc-mimble-wimble';

const url = process.env.URL || 'http://localhost:8088/';

test.beforeAll(async () => {
    await TrezorUserEnvLink.connect();
});

const useMockedCoinInfo = (
    page: Page,
    {
        cointype,
        shortcut,
        blockchain_link,
    }: {
        cointype: 'bitcoin' | 'ethereum' | 'misc';
        shortcut: string;
        blockchain_link: { type: 'blockbook' | 'blockfrost'; url: string[] };
    },
) => {
    page.route('**/coins.json*', async route => {
        // Fetch original response.
        const response = await route.fetch();
        // Add a prefix to the title.
        const body = await response.json();

        const index = body[cointype].findIndex(
            (coin: any) => shortcut.toLocaleLowerCase() === coin.coin_shortcut.toLocaleLowerCase(),
        );
        body[cointype][index].blockchain_link = blockchain_link;

        return route.fulfill({
            response,
            json: body,
        });
    });
};

test('compose transaction', async ({ page }) => {
    page.on('websocket', ws => {
        console.log(`WebSocket opened: ${ws.url()}>`);
        ws.on('framesent', event => console.log('SENT', event.payload));
        ws.on('framereceived', event => console.log('RECV', event.payload));
        ws.on('close', () => console.log('WebSocket closed'));
    });

    const blockbook = await BackendWebsocketServerMock.create('blockbook');

    blockbook.setFixtures(fixtures);

    console.log('blockbook', blockbook);

    await useMockedCoinInfo(page, {
        shortcut: 'LTC',
        cointype: 'bitcoin',
        blockchain_link: {
            type: 'blockbook',
            url: [`http://localhost:${blockbook.options.port}`],
        },
    });
    await page.goto(`${url}#/method/composeTransaction`);
    await page.locator('[data-test="@select/coin/input"]').click();
    await page.locator('[data-test="@select/coin/option/ltc"]').click();

    await TrezorUserEnvLink.api.stopBridge();
    await TrezorUserEnvLink.api.stopEmu();
    await TrezorUserEnvLink.api.startEmu({
        wipe: true,
        save_screenshots: true,
    });
    await TrezorUserEnvLink.api.setupEmu({
        needs_backup: false,
        mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        passphrase_protection: false,
    });
    await TrezorUserEnvLink.api.startBridge();

    const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.click("button[data-test='@submit-button']"),
    ]);
    await popup.waitForLoadState('load');
    await popup.locator('[data-test="\\@analytics\\/continue-button"]').click();
    await popup.getByRole('button', { name: 'Allow once for this session' }).click();

    await popup.locator('#container').getByText('Legacy accounts').click();
    await popup.locator('button >> visible=true', { hasText: 'Account #1' }).click();
    await popup.locator('button >> visible=true', { hasText: 'Send' }).click();

    await TrezorUserEnvLink.api.pressYes();
    await TrezorUserEnvLink.api.pressYes();
    await TrezorUserEnvLink.api.pressYes();

    // ends with  error: "Input does not match scriptPubKey"
    // await page.pause();
});
