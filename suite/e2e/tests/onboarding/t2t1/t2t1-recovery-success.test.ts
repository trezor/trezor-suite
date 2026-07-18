import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Onboarding - recover wallet T2T1', { tag: ['@T2T1'] }, () => {
    test.use({
        setupEmulator: false,
    });

    test.beforeEach(async ({ analyticsSection, onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
        await analyticsSection.passThroughAnalytics();
    });

    test(
        'Successfully recovers wallet from mnemonic',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully recover a wallet from a mnemonic during the onboarding process.',
                category: TestCategory.Onboarding,
                priority: TestPriority.Critical,
            }),
        },
        async ({ onboardingPage, device, devicePrompt }) => {
            await test.step('Start wallet recovery process and confirm on device', async () => {
                await onboardingPage.firmware.continueThroughFirmware();
                await onboardingPage.recoverWalletButton.click();
                await onboardingPage.startRecoveryButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();

                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.selectNumberOfWords(12);

                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
            });

            await test.step('Input mnemonic', async () => {
                for (let i = 0; i < 12; i++) {
                    await device.type('all');
                }
            });

            await test.step('Confirm recovery success', async () => {
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
            });

            await test.step('Finalize recovery, skip pin, and check success', async () => {
                await onboardingPage.continueRecoveryButton.click();
                await onboardingPage.pin.skip();
                await onboardingPage.finalButton.click();
                await expect(onboardingPage.suiteLoadedIndicator).toBeVisible({ timeout: 30_000 });
            });
        },
    );
});
