/* eslint-disable no-await-in-loop */

import { Page, test as testPlaywright } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { patchBinaries, launchSuite } from '../support/common';
import { sendToAddress, generateBlock, waitForCoinjoinBackend } from '../support/regtest';

const timeout = 1000 * 60 * 5;

const enableCoinjoinInSettings = async (window: Page) => {
    await window.click('[data-test="@suite/menu/settings"]');

    // enable debug
    for (let i = 0; i < 5; i++) {
        await window.click('[data-test="@settings/menu/title"]');
    }

    // go to debug menu
    await window.click('[data-test="@settings/menu/debug"]');

    // change regtest server source to localhost (actually not changing anything because it is default)
    await window.click('[data-test="@settings/coinjoin-server-select/input"]', { trial: true });
    await window.click('[data-test="@settings/coinjoin-server-select/input"]');
    await window.click('[data-test="@settings/coinjoin-server-select/option/localhost"]');
    await window.click('[data-test="@settings/debug/coinjoin-allow-no-tor"] >> role=button');

    // go to coins menu
    await window.click('[data-test="@settings/menu/wallet"]');
    await window.click('[data-test="@settings/wallet/network/btc"]'); // disable btc
    await window.click('[data-test="@settings/wallet/network/regtest"]'); // enable regtest

    // open advance settings for regtest
    await window.click('[data-test="@settings/wallet/network/regtest/advance"]');
    await window.click('[data-test="@settings/advance/button/save"]');
};

const startCoinjoin = async (window: Page) => {
    await window.click('role=button[name="Anonymize"]');

    await window.click('[data-test="@coinjoin/checkbox-2"] div >> nth=0');
    await window.click('[data-test="@coinjoin/checkbox-1"]');
    await window.click('role=button[name="Anonymize"]');
    await window.waitForSelector('[data-test="@prompts/confirm-on-device"]');
    await TrezorUserEnvLink.api.pressYes();
    await window.waitForSelector('[data-test="@prompts/confirm-on-device"]');
    await TrezorUserEnvLink.api.pressYes();
    await window.waitForSelector('[data-test="@prompts/confirm-on-device"]');
    await TrezorUserEnvLink.api.pressYes();
    // todo: better selector
    await window.waitForSelector('text=Collecting inputs');
};

const addCoinjoinAccount = async (window: Page) => {
    await window.click('[data-test="@suite/menu/wallet-index"]');
    await window.click('[data-test="@account-menu/add-account"]');
    await window.click('[data-test="@settings/wallet/network/regtest"]');
    await window.click('[data-test="@add-account-type/select/input"]', { trial: true });
    await window.click('[data-test="@add-account-type/select/input"]');
    await window.click('[data-test="@add-account-type/select/option/Bitcoin Regtest (PEA)"]');
    await window.click('[data-test="@add-account"]');

    await window.click('[data-test="@request-enable-tor-modal/skip-button"]');

    await window.waitForSelector('[data-test="@prompts/confirm-on-device"]', {
        timeout: 60 * 1000,
    });
    await TrezorUserEnvLink.api.pressYes();
};

const receiveCoins = async (window: Page) => {
    await sendToAddress({
        amount: '10',
        address: 'bcrt1p5jmepqf3mfakvlyxs07nc95qd0gd4uqtxy9hksd9s426xf202z5qpfz8dg',
    });
    // passphrase 'a'
    await sendToAddress({
        amount: '1',
        address: 'bcrt1pl3y9gf7xk2ryvmav5ar66ra0d2hk7lhh9mmusx3qvn0n09kmaghq6gq9fy',
    });
    await generateBlock();
    await window.waitForTimeout(500);
};

testPlaywright.describe('Coinjoin', () => {
    testPlaywright.beforeAll(async () => {
        testPlaywright.setTimeout(timeout * 10);
        // todo: some problems with path in dev and production and tests. tldr tests are expecting
        // binaries somewhere where they are not, so I copy them to that place. Maybe I find a
        // better solution later
        await patchBinaries();

        await TrezorUserEnvLink.api.trezorUserEnvConnect();
        await waitForCoinjoinBackend();
        await TrezorUserEnvLink.api.stopBridge();
        await TrezorUserEnvLink.api.startEmu({ wipe: true, version: '2-master' });
        await TrezorUserEnvLink.api.setupEmu({
            needs_backup: false,
            passphrase_protection: true,
            mnemonic: 'all all all all all all all all all all all all',
        });
    });

    testPlaywright('Prepare prerequisites for coinjoining', async () => {
        const suite = await launchSuite();

        for (let i = 0; i < 4; i++) {
            await receiveCoins(suite.window);
        }

        await suite.window.click('[data-test="@onboarding/continue-button"]');
        await suite.window.click('[data-test="@onboarding/exit-app-button"]');
        await suite.window.click('[data-test="@passphrase-type/standard"]');
        await suite.window.waitForSelector('[data-test="@dashboard/graph"]');

        await enableCoinjoinInSettings(suite.window);
        // add coinjoin account for standard wallet
        await addCoinjoinAccount(suite.window);

        // here is a bug, race condition. if I proceed with hidden wallet creation immediately before
        // discovery ends, hidden account will not be created. so I am waiting here to see something
        // i know renders only when discovery is finished
        await suite.window.waitForSelector('[data-test="@wallet/menu/wallet-receive"]');
        await suite.window.waitForTimeout(2000);

        // next passphrase
        await suite.window.click('[data-test="@menu/switch-device"]');
        await suite.window.click('[data-test="@switch-device/add-hidden-wallet-button"]');

        await suite.window.locator('[data-test="@passphrase/input"]').type('a');
        await suite.window.click('[data-test="@passphrase/hidden/submit-button"]');
        await suite.window.waitForSelector('[data-test="@prompts/confirm-on-device"]');
        await TrezorUserEnvLink.api.pressYes();
        await suite.window.waitForSelector('[data-test="@prompts/confirm-on-device"]');
        await TrezorUserEnvLink.api.pressYes();

        await suite.window.locator('[data-test="@passphrase/input"]').type('a');
        await suite.window.click('[data-test="@passphrase/confirm-checkbox"] div >> nth=0');
        await suite.window.click('[data-test="@passphrase/hidden/submit-button"]');
        await suite.window.waitForSelector('[data-test="@prompts/confirm-on-device"]');
        await TrezorUserEnvLink.api.pressYes();
        await suite.window.waitForSelector('[data-test="@prompts/confirm-on-device"]');
        await TrezorUserEnvLink.api.pressYes();

        // add coinjoin account fro passphrase 'a'
        await addCoinjoinAccount(suite.window);

        // start coinjoin in passphrase 'a'
        await startCoinjoin(suite.window);

        // start coinjoin in standard wallet
        await suite.window.click('[data-test="@menu/switch-device"]');
        await suite.window.click('[data-test="@switch-device/wallet-on-index/0"]');
        await suite.window.click('[data-test="@account-menu/regtest/coinjoin/0"]');
        await startCoinjoin(suite.window);

        // coinjoin rounds
        for (let i = 0; i < 2; i++) {
            await suite.window.waitForSelector(
                '[data-test="@modal"] >> text=Establishing connection...',
                { timeout },
            );

            await suite.window.waitForSelector('[data-test="@modal"] >> text=Registering outputs', {
                timeout,
            });
            await suite.window.waitForSelector(
                '[data-test="@modal"] >> text=Signing transactions',
                {
                    timeout,
                },
            );
        }

        await receiveCoins(suite.window);

        // use `await suite.window.pause()` to develop this test locally
        // await suite.window.pause();
    });
});
