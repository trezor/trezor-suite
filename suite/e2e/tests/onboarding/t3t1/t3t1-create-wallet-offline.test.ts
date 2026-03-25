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

            await test.step('Create wallet with Shamir backup', async () => {
                await onboardingPage.createWalletButton.click();
                await onboardingPage.selectSeedType('shamir-advanced');
            });

            await test.step('Accept ToS and confirm wallet creation', async () => {
                // Accept ToS
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();

                // Confirm wallet created
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
                await onboardingPage.createBackupButton.click();
            });

            await test.step('Create backup with Shamir shares and threshold', async () => {
                const shares = 3;
                const threshold = 2;
                await onboardingPage.backup.passThroughShamirBackup(shares, threshold);
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

            await test.step('Verify offline state after onboarding completes', async () => {
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
