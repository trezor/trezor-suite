import { MNEMONICS } from '@trezor/trezor-user-env-link';

import { test, expect } from '../../support/fixtures';

const pin = '1';

test.describe('Recovery T1B1 - dry run', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T1B1', version: '1-latest', wipe: true },
        emulatorSetupConf: { mnemonic: MNEMONICS.mnemonic_all, pin },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo();
        await settingsPage.deviceTabButton.click();
    });

    test('Standard recovery dry run', async ({
        settingsPage,
        recoveryPage,
        trezorInput,
        trezorUserEnvLink,
    }) => {
        await settingsPage.checkSeedButton.click();
        await recoveryPage.initDryCheck('basic', 12);
        await trezorInput.enterPinOnBlindMatrix(pin);
        await trezorInput.inputMnemonicT1B1(MNEMONICS.mnemonic_all);
        await trezorUserEnvLink.pressYes();
        await expect(recoveryPage.successTitle).toHaveText('Wallet backup checked successfully');
    });
});
