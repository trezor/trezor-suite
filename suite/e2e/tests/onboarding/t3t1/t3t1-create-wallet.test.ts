import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Onboarding - create wallet', { tag: ['@T3T1', '@smoke'] }, () => {
    test.use({
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test(
        'Success (Shamir backup)',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully create a wallet during the onboarding process.',
                category: TestCategory.Onboarding,
                priority: TestPriority.Critical,
            }),
        },
        async ({ page, device, onboardingPage, devicePrompt, analyticsSection }) => {
            await analyticsSection.passThroughAnalytics();

            // Device onboarding steps
            await onboardingPage.firmware.continueThroughFirmware();
            await onboardingPage.passThroughAuthenticityCheck();
            await page.waitForTimeout(500);
            await onboardingPage.tutorial.skip();

            // Select backup type (no device interaction, just navigates to SecurityStep)
            await onboardingPage.createWalletButton.click();
            await onboardingPage.selectSeedType('shamir-advanced');

            // SecurityStep: check backup seed cards, create wallet + backup on device, continue
            // In the new atomic flow, wallet creation and backup happen together
            const shares = 3;
            const threshold = 2;
            await onboardingPage.backup.passThroughShamirBackup(shares, threshold, {
                deviceConfirmations: 3,
            });

            // Set PIN
            await onboardingPage.pin.setPinButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();
            await device.selectNumberOfWords(12);
            await device.selectNumberOfWords(12);

            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();
        },
    );
});
