/* eslint-disable no-await-in-loop */

import { Page, test as testPlaywright } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { patchBinaries, launchSuite } from '../support/common';
import { sendToAddress, generateBlock, waitForCoinjoinBackend } from '../support/regtest';

const enableCoinjoinInSettings = async (window: Page) => {
    await window.click('[data-test="@suite/menu/settings"]');

    // enable debug
    for (let i = 0; i < 5; i++) {
        await window.click('[data-test="@settings/menu/title"]');
    }

    // go to debug menu
    await window.click('[data-test="@settings/menu/debug"]');

    // change regtest server source to localhost
    await window.click('[data-test="@settings/coinjoin-server-select/input"]', { trial: true });
    await window.click('[data-test="@settings/coinjoin-server-select/input"]');
    await window.click('[data-test="@settings/coinjoin-server-select/option/localhost"]');

    // go to coins menu
    await window.click('[data-test="@settings/menu/wallet"]');
    await window.click('[data-test="@settings/wallet/network/btc"]'); // disable btc
    await window.click('[data-test="@settings/wallet/network/regtest"]'); // enable regtest

    // open advance settings for regtest
    await window.click('[data-test="@settings/wallet/network/regtest/advance"]');
    await window.click('[data-test="@settings/advance/button/save"]');
};

testPlaywright.describe('Coinjoin', () => {
    testPlaywright.beforeAll(async () => {
        // todo: some problems with path in dev and production and tests. tldr tests are expecting
        // binaries somewhere where they are not, so I copy them to that place. Maybe I find a
        // better solution later
        await patchBinaries();

        await TrezorUserEnvLink.api.trezorUserEnvConnect();
        await waitForCoinjoinBackend();
        await TrezorUserEnvLink.api.stopBridge();
        await TrezorUserEnvLink.api.startEmu({ wipe: true });
        await TrezorUserEnvLink.api.setupEmu({
            needs_backup: false,
            mnemonic: 'all all all all all all all all all all all all',
        });
    });

    testPlaywright('Prepare prerequisites for coinjoining', async () => {
        for (let i = 0; i < 10; i++) {
            await sendToAddress({
                amount: '1',
                address: 'bcrt1qkvwu9g3k2pdxewfqr7syz89r3gj557l374sg5v',
            });
            await generateBlock();
        }

        const suite = await launchSuite();

        await suite.window.click('[data-test="@onboarding/continue-button"]');
        await suite.window.click('[data-test="@onboarding/exit-app-button"]');

        await suite.window.waitForSelector('[data-test="@dashboard/graph"]');

        await enableCoinjoinInSettings(suite.window);

        await suite.window.click('[data-test="@suite/menu/wallet-index"]');

        await suite.window.click('[data-test="@account-menu/add-account"]');
        await suite.window.click('[data-test="@settings/wallet/network/regtest"]');

        await suite.window.click('[data-test="@add-account-type/select/input"]', { trial: true });
        await suite.window.click('[data-test="@add-account-type/select/input"]');
        await suite.window.click(
            '[data-test="@add-account-type/select/option/Bitcoin Regtest (PEA)"]',
        );

        await suite.window.click('[data-test="@add-account"]');
    });
});
