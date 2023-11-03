import { test as testPlaywright, expect as expectPlaywright } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { patchBinaries, launchSuite, waitForDataTestSelector } from '../support/common';

testPlaywright.describe.serial('Bridge', () => {
    testPlaywright.beforeAll(async () => {
        // todo: some problems with path in dev and production and tests. tldr tests are expecting
        // binaries somewhere where they are not, so I copy them to that place. Maybe I find a
        // better solution later
        // await patchBinaries();
        // We make sure that bridge from trezor-user-env is stopped.
        // So we properly test the electron app spawning bridge binary.
        await TrezorUserEnvLink.api.trezorUserEnvConnect();
        await TrezorUserEnvLink.api.stopBridge();
    });

    testPlaywright.afterAll(async () => {
        // When finish we make bridge from trezor-user-env to run so it is ready for the rest of the tests.
        await TrezorUserEnvLink.api.startBridge();
    });

    testPlaywright('Debugging local app @debug', async () => {
        const suite = await launchSuite();
        const title = await suite.window.title();
        await waitForDataTestSelector(suite.window, '@dashboard/graph', { timeout: 30000 });
        // expectPlaywright(title).toContain('Trezor Suite');
    });
});
