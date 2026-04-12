import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Onboarding - create wallet', { tag: ['@T3W1'] }, () => {
    test.use({ setupEmulator: false });

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
        async ({
            page,
            device,
            onboardingPage,
            devicePrompt,
            analyticsSection,
            dashboardPage,
            assetsSection,
        }) => {
            await onboardingPage.optionallyDismissFwHashCheckError();
            await analyticsSection.continueButton.click();

            await test.step('Device onboarding', async () => {
                await onboardingPage.pairTHP();
                await analyticsSection.continueButton.click();
                await onboardingPage.firmware.continueThroughFirmware();
                await page.waitForTimeout(500);
                await onboardingPage.tutorial.skip();
            });

            // Create wallet with Shamir backup
            await onboardingPage.createWalletButton.click();
            await onboardingPage.selectSeedType('shamir-advanced');

            // Create backup with Shamir shares and threshold
            const shares = 3;
            const threshold = 2;

            await onboardingPage.backup.passThroughShamirBackup({
                shares,
                threshold,
                deviceConfirmations: 3,
            });

            // Set PIN
            await onboardingPage.pin.setPinButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();
            // method is used as a workaround to setup PIN with value 12
            await device.selectNumberOfWords(12);
            await device.selectNumberOfWords(12);
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();

            await test.step('Finish wallet creation', async () => {
                await onboardingPage.finalButton.click();
                await expect(onboardingPage.onboardingFeedbackBanner).toBeVisible();
                await onboardingPage.onboardingFeedbackBannerCTAButton.click();
                await dashboardPage.discoveryEmptyPrimaryButton.click();
                await assetsSection.enableNetworkViaActivateAssetsModal(['btc', 'eth']);

                await expect(onboardingPage.suiteLoadedIndicator).toBeVisible({ timeout: 30_000 });
                await expect(dashboardPage.walletReady).toBeVisible({ timeout: 30_000 });
                await expect(onboardingPage.onboardingFeedbackBanner).toBeHidden();
            });
        },
    );

    const backupType = 'Single-share Backup';

    test(
        `Success (${backupType})`,
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully create a wallet with single-share backup during the onboarding process.',
                category: TestCategory.Onboarding,
                priority: TestPriority.Critical,
            }),
        },
        async ({
            page,
            device,
            devicePrompt,
            onboardingPage,
            analyticsSection,
            dashboardPage,
            assetsSection,
        }) => {
            await analyticsSection.continueButton.click();

            await test.step('Device onboarding', async () => {
                await onboardingPage.pairTHP();
                await analyticsSection.continueButton.click();
                await onboardingPage.firmware.continueThroughFirmware();
                await page.waitForTimeout(500);
                await onboardingPage.tutorial.skip();
            });

            await test.step('Create a new wallet', async () => {
                await onboardingPage.createWalletButton.click();

                await expect(onboardingPage.walletBackupTypeCard).toBeVisible();
            });

            await test.step(`Select "${backupType}" type`, async () => {
                await onboardingPage.selectSeedType('shamir-single');
            });

            await test.step('Create a wallet backup', async () => {
                await onboardingPage.backup.passThroughShamirBackup({
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

            await test.step('Finish wallet creation', async () => {
                await onboardingPage.finalButton.click();
                await dashboardPage.discoveryEmptyPrimaryButton.click();
                await assetsSection.enableNetworkViaActivateAssetsModal(['btc', 'eth']);

                await expect(onboardingPage.suiteLoadedIndicator).toBeVisible({ timeout: 30_000 });
                await expect(dashboardPage.walletReady).toBeVisible({ timeout: 30_000 });
            });
        },
    );

    test.fixme('Cancel wallet creation on device', async () => {});
    test.fixme('Cancel wallet backup on device', async () => {});
    test.fixme('Skip wallet backup', async () => {});
    test.fixme('Skip wallet backup - cancel wallet creation on device', async () => {});
});
