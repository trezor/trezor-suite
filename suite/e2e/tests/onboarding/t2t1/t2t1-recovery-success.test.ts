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
            // Start wallet recovery process and confirm on device
            await onboardingPage.firmware.continueThroughFirmware();
            await onboardingPage.recoverWalletButton.click();
            await onboardingPage.startRecoveryButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();

            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.selectNumberOfWords(12);

            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();

            // Input mnemonic
            for (let i = 0; i < 12; i++) {
                await device.type('all');
            }

            // Confirm recovery success
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();

            // Finalize recovery, skip pin, and check success
            await onboardingPage.continueRecoveryButton.click();
            await onboardingPage.pin.skip();
            await onboardingPage.finalButton.click();
            await expect(onboardingPage.suiteLoadedIndicator).toBeVisible({ timeout: 30_000 });
        },
    );
});
