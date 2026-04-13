import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Onboarding - create wallet', { tag: ['@desktopOnly', '@T3T1', '@smoke'] }, () => {
    test.use({
        setupEmulator: false,
        electronConf: { offlineMode: true },
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test(
        'Success (Shamir backup) offline',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully create a wallet during the offline onboarding process.',
                category: TestCategory.Onboarding,
                priority: TestPriority.Critical,
            }),
        },
        async ({ page, onboardingPage, devicePrompt, analyticsSection, device }) => {
            await expect(page.getByTestId('@suite/no-connection-banner')).toHaveTranslation(
                'TR_YOU_WERE_DISCONNECTED_DOT',
            );

            await analyticsSection.continueButton.click();
            await expect(page.getByTestId('@suite/no-connection-banner')).toHaveTranslation(
                'TR_YOU_WERE_DISCONNECTED_DOT',
            );
            await analyticsSection.continueButton.click();

            await test.step('Device onboarding steps', async () => {
                await onboardingPage.firmware.continueThroughFirmware();
                await onboardingPage.passThroughAuthenticityCheck();
                await page.waitForTimeout(500);
                await onboardingPage.tutorial.skip();
            });

            await test.step('Select backup type and create wallet with backup', async () => {
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
            });

            await test.step('Set PIN', async () => {
                await onboardingPage.pin.setPinButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
                await device.selectNumberOfWords(12);
                await device.selectNumberOfWords(12);

                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
            });

            await test.step('Complete onboarding and verify offline state', async () => {
                await onboardingPage.completeOnboardingButton.click();
                await expect(page.getByTestId('@suite/no-connection-banner')).toHaveTranslation(
                    'TR_YOU_WERE_DISCONNECTED_DOT',
                );
                await expect(
                    page.getByTestId('@exception/discovery-failed/description'),
                ).toBeVisible({ timeout: 30_000 });
            });
        },
    );
});
