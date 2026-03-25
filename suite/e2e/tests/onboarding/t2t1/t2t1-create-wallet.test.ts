import { expect, test } from '../../../support/fixtures';

test.describe('Onboarding - create wallet', { tag: ['@T2T1'] }, () => {
    test.use({
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test('Success (Shamir backup)', async ({
        device,
        analyticsSection,
        onboardingPage,
        devicePrompt,
    }) => {
        await analyticsSection.passThroughAnalytics();
        await onboardingPage.firmware.continueThroughFirmware();

        // Will be clicking on Shamir backup button
        await onboardingPage.createWalletButton.click();
        await onboardingPage.selectSeedType('shamir-advanced');
        await devicePrompt.confirmOnDevicePromptIsShown();
        await device.pressYes();

        await onboardingPage.createBackupButton.click();

        const shares = 3;
        const threshold = 2;
        await onboardingPage.backup.passThroughShamirBackup(shares, threshold);
        await onboardingPage.pin.setPinButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();

        await device.pressYes();
        await device.type('12');
        await device.type('12');
        await devicePrompt.confirmOnDevicePromptIsShown();
        await device.pressYes();
        await expect(onboardingPage.suiteLoadedIndicator).toBeVisible({ timeout: 30_000 });
    });
});
