import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import { MNEMONICS, Model } from '@trezor/trezor-user-env-link';

import { test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const testCases: Model[] = ['T2T1', 'T3T1'];

for (const model of testCases) {
    test.describe(
        'Create additional share',
        { tag: ['@group=device-management', '@specificModel'] },
        () => {
            test.beforeEach(async ({ onboardingPage }) => {
                await onboardingPage.completeOnboarding();
            });

            test.use({
                emulatorStartConf: { model, wipe: true },
                emulatorSetupConf: { mnemonic: 'mnemonic_academic' },
            });

            test(
                `${model} Successfully added additional share`,
                {
                    annotation: createTestAnnotation({
                        testCase:
                            'Verify that an additional share can be successfully created during the backup process.',
                        category: TestCategory.Settings,
                        priority: TestPriority.High,
                        stream: TestStream.Foundation,
                    }),
                },
                async ({ settingsPage, trezorUserEnvLink }) => {
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
                    await trezorUserEnvLink.pressYes();
                    await trezorUserEnvLink.readAndConfirmShamirMnemonicEmu({
                        shares: 3,
                        threshold: 2,
                    });

                    await settingsPage.device.multiShareBackupGotItButton.click();
                },
            );
        },
    );
}
