import { Page, test as testPlaywright } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { launchSuite } from '../support/common';
import { sendToAddress, generateBlock, waitForCoinjoinBackend } from '../support/regtest';

/**
 * Few notes on coinjoin e2e test
 *
 * Coinjoin runs long and is full of randomness. In order to make this test useful it should:
 *
 * - do a basic setup to start coinjoin on 2 passphrases
 * - once conjoin is started, wait for a very limited sequence of UI elements to appear withing a decent timeout (basic timeout)
 *
 * This should ensure that it:
 * - is not that much flaky (if code works, test should too)
 * - is not prone to changes due to ongoing rapid development (those few anchors shouldn't change that often)
 */

// basic timeout for coinjoin test (waiting for round phases to change etc), 5 minutes should be enough
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
    await window.click('[data-test="@settings/debug/coinjoin/regtest/server-select/input"]', {
        trial: true,
    });
    await window.click('[data-test="@settings/debug/coinjoin/regtest/server-select/input"]');
    await window.click(
        '[data-test="@settings/debug/coinjoin/regtest/server-select/option/localhost"]',
    );
    await window.click('[data-test="@settings/debug/coinjoin/allow-no-tor"] >> role=button');

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

    await window.click('[data-test="@coinjoin/checkbox"] div >> nth=0');
    await window.click('role=button[name="Anonymize"]');
    await window.waitForSelector('[data-test="@prompts/confirm-on-device"]');
    await TrezorUserEnvLink.api.pressYes();
    await window.waitForSelector('[data-test="@prompts/confirm-on-device"]');
    await TrezorUserEnvLink.api.pressYes();

    await window.waitForSelector('text=Collecting inputs');
};

const addCoinjoinAccount = async (window: Page) => {
    await window.click('[data-test="@suite/menu/wallet-index"]');
    await window.click('[data-test="@account-menu/add-account"]');
    await window.click('[data-test="@settings/wallet/network/regtest"]');
    await window.click('[data-test="@add-account-type/select/input"]', { trial: true });
    await window.click('[data-test="@add-account-type/select/input"]');
    await window.click('[data-test="@add-account-type/select/option/Bitcoin Regtest"]');
    await window.click('[data-test="@add-account"]');

    await window.screenshot({ path: './test-results/1.png', fullPage: true, type: 'png' });
    await window.click('[data-test="@request-enable-tor-modal/skip-button"]');
    await window.screenshot({ path: './test-results/2.png', fullPage: true, type: 'png' });
    await window.waitForSelector('[data-test="@prompts/confirm-on-device"]', {
        timeout: 60 * 1000,
    });
    // todo: this is weird it looks like device sometimes is not ready to accept pressYes, although modal
    // is already visible
    await window.waitForTimeout(5000);
    await TrezorUserEnvLink.api.pressYes();
};

const receiveCoins = async () => {
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
};

const passThroughInitialRun = async (window: Page) => {
    await window.click('[data-test="@analytics/continue-button"]');
    await window.click('[data-test="@onboarding/exit-app-button"]');
    await window.click('[data-test="@passphrase-type/standard"]');
    await window.waitForSelector('[data-test="@dashboard/graph"]');
};

testPlaywright.describe('Coinjoin', () => {
    testPlaywright.beforeAll(async () => {
        testPlaywright.setTimeout(timeout * 10);

        await TrezorUserEnvLink.api.trezorUserEnvConnect();
        await waitForCoinjoinBackend();
        await TrezorUserEnvLink.api.stopBridge();
        await TrezorUserEnvLink.api.startEmu({ wipe: true, version: '2-main' });
        await TrezorUserEnvLink.api.setupEmu({
            needs_backup: false,
            passphrase_protection: true,
            mnemonic: 'all all all all all all all all all all all all',
        });

        setInterval(() => {
            receiveCoins();
        }, 1000 * 60);
    });

    testPlaywright('Prepare prerequisites for coinjoining', async () => {
        const suite = await launchSuite();

        // get some initial money for both accounts
        for (let i = 0; i < 4; i++) {
            await receiveCoins();
        }

        await passThroughInitialRun(suite.window);

        await enableCoinjoinInSettings(suite.window);

        // add coinjoin account for standard wallet
        await addCoinjoinAccount(suite.window);

        // here is a bug, race condition. if I proceed with hidden wallet creation immediately before
        // discovery ends, hidden account will not be created. so I am waiting here to see something
        // i know renders only when discovery is finished
        // https://github.com/trezor/trezor-suite/issues/6748
        // todo: anonymize should be added to wrapped methods in TrezorConnectActions
        await suite.window.waitForSelector('[data-test="@wallet/menu/wallet-receive"]');
        await suite.window.waitForTimeout(5000);

        // enable passphrase 'a'
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

        // switch to standard wallet
        await suite.window.click('[data-test="@menu/switch-device"]');
        await suite.window.click('[data-test="@switch-device/wallet-on-index/0"]');
        await suite.window.click('[data-test="@account-menu/regtest/coinjoin/0"]');

        // start coinjoin in standard wallet
        await startCoinjoin(suite.window);

        // coinjoin rounds
        // we are checking only 1 round in detail (depends on setup. now only 1 round is default)
        const rounds = 1;
        for (let i = 0; i < rounds; i++) {
            await suite.window.waitForSelector(
                // todo: add proper data test selector
                '[data-test="@modal"] >> text=Establishing connection...',
                { timeout },
            );

            // todo: add proper data test selector
            await suite.window.waitForSelector('[data-test="@modal"] >> text=Registering outputs', {
                timeout,
            });

            // todo: add proper data test selector
            await suite.window.waitForSelector(
                '[data-test="@modal"] >> text=Signing transactions',
                {
                    timeout,
                },
            );

            await generateBlock();
        }

        // use `await suite.window.pause()` to develop this test locally
        // await suite.window.pause();
    });
});
