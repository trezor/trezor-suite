import type { BackupType } from '@suite-common/suite-types';
import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

const testCases: {
    name: string;
    testCase: string;
    seedType: BackupType;
    backup: { shares?: number; threshold?: number; deviceConfirmations: number };
}[] = [
    {
        name: 'Success (Shamir backup)',
        testCase:
            'Verify that a user can successfully create a wallet during the onboarding process.',
        seedType: 'shamir-advanced',
        backup: { shares: 3, threshold: 2, deviceConfirmations: 3 },
    },
    {
        name: 'Success (Single-share Backup)',
        testCase:
            'Verify that a user can successfully create a wallet with single-share backup during the onboarding process.',
        seedType: 'shamir-single',
        backup: { deviceConfirmations: 3 },
    },
];

test.describe('Onboarding - create wallet', { tag: ['@T3W1'] }, () => {
    test.use({ setupEmulator: false });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    for (const { name, testCase, seedType, backup } of testCases) {
        test(
            name,
            {
                annotation: createTestAnnotation({
                    testCase,
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
                await test.step('Complete device onboarding', async () => {
                    await onboardingPage.optionallyDismissFwHashCheckError();
                    await analyticsSection.continueButton.click();
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

                await test.step(`Select backup type "${seedType}"`, async () => {
                    await onboardingPage.selectSeedType(seedType);
                });

                await test.step('Create a wallet backup', async () => {
                    await onboardingPage.backup.passThroughShamirBackup(backup);
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

                    await expect(onboardingPage.onboardingFeedbackBanner).toBeVisible();
                    await onboardingPage.onboardingFeedbackBannerCTAButton.click();

                    await dashboardPage.discoveryEmptyPrimaryButton.click();
                    await assetsSection.enableNetworkViaActivateAssetsModal(['btc', 'eth']);

                    await expect(onboardingPage.suiteLoadedIndicator).toBeVisible({
                        timeout: 30_000,
                    });
                    await expect(dashboardPage.walletReady).toBeVisible({ timeout: 30_000 });
                    await expect(onboardingPage.onboardingFeedbackBanner).toBeHidden();
                });
            },
        );
    }
});
