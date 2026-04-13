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

        // Select backup type (no device interaction, just navigates to SecurityStep)
        await onboardingPage.createWalletButton.click();
        await onboardingPage.selectSeedType('shamir-advanced');

        // Start backup
        const shares = 3;
        const threshold = 2;
        await onboardingPage.backup.passThroughShamirBackup(shares, threshold, {
            deviceConfirmations: 4,
        });

        await onboardingPage.pin.setPinButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();

        await device.pressYes();
        await device.type('12');
        await device.type('12');
        await devicePrompt.confirmOnDevicePromptIsShown();
        await device.pressYes();
        await expect(onboardingPage.completeOnboardingButton).toBeVisible();
    });
});
