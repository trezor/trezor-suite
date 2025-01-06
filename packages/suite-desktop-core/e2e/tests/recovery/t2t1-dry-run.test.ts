import { MNEMONICS } from '@trezor/trezor-user-env-link';

import { test, expect } from '../../support/fixtures';

const pin = '1';

test.describe('Recovery T2T1 - dry run', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T2T1', wipe: true },
        emulatorSetupConf: { mnemonic: 'mnemonic_all', pin },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test('Standard recovery dry run', async ({
        settingsPage,
        recoveryPage,
        trezorUserEnvLink,
        trezorInput,
    }) => {
        await settingsPage.checkSeedButton.click();
        await recoveryPage.userUnderstandsCheckbox.click();
        await recoveryPage.startButton.click();
        await expect(settingsPage.modal).toBeVisible();
        await expect(settingsPage.modal).toContainText(
            'Enter the words directly on your Trezor device in the correct order.',
        );
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.inputEmu('1');
        await trezorUserEnvLink.selectNumOfWordsEmu(12);
        await trezorUserEnvLink.pressYes();
        await trezorInput.inputMnemonicT2T1(MNEMONICS.mnemonic_all);

        await trezorUserEnvLink.pressYes();
        await expect(recoveryPage.successTitle).toHaveText('Wallet backup checked successfully');
    });

    //TODO: #14987 Fix Recovery - dry run test for T2T1
    test.skip('Recovery with device reconnection', async () => {
        // Start dry recovery check process
        // First interrupt: Disconnect device and check that recovery process is paused
        // Reinitialize process on device reconnect
        // Now check that reconnecting device works and seed check procedure does reinitialize correctly
        // Another interrupt: Reload page
        // On app reload, recovery process should auto start if app detects initialized device in recovery mode
        // Communication established, now finish the seed check process
    });
});
