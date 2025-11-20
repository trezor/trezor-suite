import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import { MNEMONICS } from '@trezor/trezor-user-env-link';

import { test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.use({ emulatorStartConf: { model: 'T3T1', wipe: true } });
test.describe(
    'Create additional share',
    { tag: ['@group=device-management', '@specificModel'] },
    () => {
        test.use({
            emulatorSetupConf: { mnemonic: 'mnemonic_academic' },
        });

        test.beforeEach(async ({ onboardingPage }) => {
            await onboardingPage.completeOnboarding();
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
                await page.waitForTimeout(100); // This wait fixes weird emu/tenv sync issues (https://github.com/trezor/trezor-suite/issues/23270)

                // [device screen] select the number of words in your backup
                await trezorUserEnvLink.inputEmu('20');
                await page.waitForTimeout(100); // This wait fixes weird emu/tenv sync issues (https://github.com/trezor/trezor-suite/issues/23270)

                // [device screen] backup instructions
                await trezorUserEnvLink.pressYes();
                await page.waitForTimeout(100); // This wait fixes weird emu/tenv sync issues (https://github.com/trezor/trezor-suite/issues/23270)

                for (const word of MNEMONICS.mnemonic_academic.split(' ')) {
                    // [device screen] enter next word
                    await trezorUserEnvLink.inputEmu(word);
                }

                // [device screen] create additional backup?
                await page.waitForTimeout(1000); // without this timeout, backup on device simply disappears, it stinks TODO: https://github.com/trezor/trezor-suite/issues/17128
                await trezorUserEnvLink.pressYes();
                await page.waitForTimeout(100); // This wait fixes weird emu/tenv sync issues (https://github.com/trezor/trezor-suite/issues/23270)
                await trezorUserEnvLink.readAndConfirmShamirMnemonicEmu({
                    shares: 3,
                    threshold: 2,
                });

                await settingsPage.device.multiShareBackupGotItButton.click();
            },
        );
    },
);
