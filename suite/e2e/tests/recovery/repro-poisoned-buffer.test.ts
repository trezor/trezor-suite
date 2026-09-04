/**
 * THROWAWAY REPRO — DO NOT MERGE
 *
 * Deterministic reproduction of the "Recovery after partial recovery" web flakiness.
 *
 * The natural failure is a race on page.reload(): the unloading page's teardown fires
 * abort → post(Cancel) → release?beacon=1, and when the Cancel lands while the session
 * is still alive, the device's Failure("Cancelled") response is never read and stays
 * queued in the device buffer. After reload, connect acquires, sends its own Cancel,
 * reads one Failure — and then GetFeatures consumes the stale second Failure instead
 * of Features. Connect gives up, suite ends with an unacquired device, the recovery
 * modal never reappears.
 *
 * This test forces the losing side of the race by replaying the exact teardown
 * sequence (abort + orphaned Cancel) via the bridge HTTP API just before the reload,
 * so the failure reproduces on every run instead of ~10% of them.
 */
import { MNEMONICS } from '@trezor/trezor-user-env-link';

import { BRIDGE_URL } from '../../support/bridge';
import { expect, test } from '../../support/fixtures';

const pin = '1';

// trezor protocol v1: magic 3f2323, message type 20 (Cancel), zero-length payload
const CANCEL_MESSAGE = JSON.stringify({ protocol: 'v1', data: '3f2323001400000000' });
const BRIDGE_HEADERS = {
    Origin: 'https://wallet.trezor.io',
    'Content-Type': 'text/plain;charset=UTF-8',
};

test.describe('REPRO Recovery T2T1 - poisoned device buffer', { tag: ['@T2T1'] }, () => {
    test.use({
        deviceSetup: { mnemonic: 'mnemonic_all', pin },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test('Recovery after partial recovery with forced teardown race', async ({
        page,
        request,
        device,
        settingsPage,
        recoveryModal,
        trezorInput,
    }) => {
        await test.step('Initiate recovery dry run in settings', async () => {
            await settingsPage.checkSeedButton.click();
            await recoveryModal.userUnderstandsCheckbox.click();
            await recoveryModal.startButton.click();
            await recoveryModal.verifyDryCheckPrompt();
        });

        await test.step('Partially complete the dry run on emulator', async () => {
            await device.pressYes();
            await device.type('1');
            await device.selectNumberOfWords(12);
            await device.pressYes();
            await device.type('all');
        });

        await test.step('Plant an orphaned Failure in the device buffer', async () => {
            const enumerateResponse = await request.post(`${BRIDGE_URL}/enumerate`, {
                headers: BRIDGE_HEADERS,
            });
            expect(enumerateResponse.ok()).toBe(true);
            const devices = await enumerateResponse.json();
            const session = devices[0]?.session;
            expect(session, 'suite should hold an active bridge session').toBeTruthy();

            // 1. Kill suite's in-flight RecoveryDevice call — same as the unload abort.
            const abortResponse = await request.post(`${BRIDGE_URL}/abort/${session}`, {
                headers: BRIDGE_HEADERS,
            });
            expect(abortResponse.ok()).toBe(true);

            // 2. Post Cancel on the still-live session and never read the reply.
            //    The device answers Failure("Cancelled") into a buffer nobody drains —
            //    the exact poisoned state the lost unload race leaves behind.
            const postResponse = await request.post(`${BRIDGE_URL}/post/${session}`, {
                headers: BRIDGE_HEADERS,
                data: CANCEL_MESSAGE,
            });
            expect(postResponse.ok()).toBe(true);
        });

        await test.step('Reload suite and check recovery dry run is reinitialized', async () => {
            await page.reload();
            // EXPECTED REPRO FAILURE: connect's post-reload GetFeatures reads the stale
            // Failure, the device stays unacquired, and this prompt never appears.
            await expect(
                recoveryModal.header,
                'REPRO CONFIRMED — this failure is the expected reproduction of the flaky ' +
                    '"Recovery after partial recovery" web run: the orphaned Cancel response ' +
                    'poisoned the device buffer, post-reload GetFeatures consumed the stale ' +
                    'Failure("Cancelled") instead of Features, connect gave up and the device ' +
                    'stayed unacquired, so the recovery modal never reappeared.',
            ).toHaveText('Check wallet backup', { timeout: 30_000 });
            await recoveryModal.verifyDryCheckPrompt();
        });

        await test.step('Complete the dry run on emulator', async () => {
            await device.selectNumberOfWords(12);
            await device.pressYes();
            await trezorInput.inputMnemonicT2T1(MNEMONICS.mnemonic_all);
            await device.pressYes();
            await expect(recoveryModal.successTitle).toHaveText(
                'Wallet backup checked successfully',
            );
        });
    });
});
