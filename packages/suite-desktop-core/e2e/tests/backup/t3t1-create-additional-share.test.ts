import { MNEMONICS } from '@trezor/trezor-user-env-link';

import { TestCategory, TestPriority, TestStream } from '../../support/enums/testAnnotations';
import { test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Create additional share', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic: 'mnemonic_academic' },
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding({ enableViewOnly: true });
    });

    test(
        'Successfully added additional share',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that an additional share can be successfully created during the backup process.',
                category: TestCategory.Settings,
                priority: TestPriority.High,
                stream: TestStream.Foundation,
            }),
        },
        async ({ page, settingsPage, trezorUserEnvLink }) => {
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
        },
    );
});
