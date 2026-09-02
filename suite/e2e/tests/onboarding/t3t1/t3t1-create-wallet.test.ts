import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Onboarding - create wallet', { tag: ['@T3T1'] }, () => {
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
                stream: TestStream.Growth,
            }),
        },
        async ({ device, onboardingPage, devicePrompt, analyticsSection }) => {
            await test.step('Device onboarding steps', async () => {
                await analyticsSection.passThroughAnalytics();
                await onboardingPage.firmware.continueThroughFirmware();
                await onboardingPage.tutorial.skip();
            });

            await test.step('Select backup type and create wallet with backup', async () => {
                await onboardingPage.createWalletButton.click();
                await onboardingPage.selectSeedType('shamir-advanced');

                await onboardingPage.backup.passThroughShamirBackup({
                    shares: 3,
                    threshold: 2,
                    deviceConfirmations: 3,
                });
            });

            await test.step('Set PIN', async () => {
                await onboardingPage.pin.setPinButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
                await device.inputPin('12');
                await device.inputPin('12');
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
            });

            await test.step('Finish wallet creation', async () => {
                await onboardingPage.finalButton.click();
                await expect(onboardingPage.suiteLoadedIndicator).toBeVisible({ timeout: 30_000 });
            });
        },
    );
});
