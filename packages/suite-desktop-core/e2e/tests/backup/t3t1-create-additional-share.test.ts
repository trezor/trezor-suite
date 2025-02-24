import { MNEMONICS } from '@trezor/trezor-user-env-link';

import { test } from '../../support/fixtures';

test.describe('Create additional share', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic: 'mnemonic_academic' },
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding({ enableViewOnly: true });
    });

    test('Successfuly added additional share', async ({
        page,
        settingsPage,
        trezorUserEnvLink,
    }) => {
        await settingsPage.navigateTo('device');
        await settingsPage.device.createMultiShareBackupButton.click();
        await settingsPage.device.proceedMultiShareBackupModal();

        // [device screen] check your backup?
        await trezorUserEnvLink.pressYes();

        // [device screen] select the number of words in your backup
        await trezorUserEnvLink.inputEmu('20');

        // [device screen] backup instructions
        await trezorUserEnvLink.pressYes();

        for (const word of MNEMONICS.mnemonic_academic.split(' ')) {
            // [device screen] enter next word
            await trezorUserEnvLink.inputEmu(word);
        }

        // [device screen] create additional backup?
        await page.waitForTimeout(1000); // without this timeout, backup on device simply disappears, it stinks TODO: https://github.com/trezor/trezor-suite/issues/17128
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.readAndConfirmShamirMnemonicEmu({ shares: 3, threshold: 2 });

        await settingsPage.device.multiShareBackupGotItButton.click();
    });
});
