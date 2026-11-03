import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import { MNEMONICS, Model } from '@trezor/trezor-user-env-link';

import { test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Create additional share', { tag: ['@T2T1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test.use({
        deviceSetup: { mnemonic: 'mnemonic_academic' },
    });

    test(
        `Successfully added additional share`,
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that an additional share can be successfully created during the backup process.',
                category: TestCategory.Settings,
                priority: TestPriority.High,
                stream: TestStream.Growth,
            }),
        },
        async ({ settingsPage, device, devicePrompt }) => {
            await settingsPage.navigateTo('device');
            await settingsPage.deviceTab.createMultiShareBackupButton.click();
            await settingsPage.deviceTab.proceedMultiShareBackupModal();

            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.expectToContainOnDisplay(
                device.model === Model.T2T1
                    ? 'Check your backup?'
                    : "Let's do a wallet backup check.",
            );
            await device.pressYes();

            await device.expectToContainOnDisplay('Select the number of words in your backup.');
            await device.type('20');

            // [device screen] backup instructions
            await device.pressYes();
            for (const word of MNEMONICS.mnemonic_academic.split(' ')) {
                // [device screen] enter next word
                await device.type(word);
            }

            // [device screen] create additional backup?
            await device.expectToContainOnDisplay('Create additional backup?', {
                shouldRunOnCanary: true,
            });
            await device.pressYes();
            await device.readAndConfirmShamirMnemonic({
                shares: 3,
                threshold: 2,
            });

            await settingsPage.deviceTab.multiShareBackupGotItButton.click();
        },
    );
});
