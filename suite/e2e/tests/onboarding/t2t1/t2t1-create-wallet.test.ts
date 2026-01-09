import { expect, test } from '../../../support/fixtures';

test.describe('Onboarding - create wallet', { tag: ['@T2T1'] }, () => {
    test.use({
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test('Success (Shamir backup)', async ({
        analyticsSection,
        onboardingPage,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        await analyticsSection.passThroughAnalytics();
        await onboardingPage.firmware.continueThroughFirmware();

        // Will be clicking on Shamir backup button
        await onboardingPage.createWalletButton.click();
        await onboardingPage.selectSeedType('shamir-advanced');
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();

        await onboardingPage.createBackupButton.click();

        const shares = 3;
        const threshold = 2;
        await onboardingPage.backup.passThroughShamirBackup(shares, threshold);
        await onboardingPage.pin.setPinButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();

        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.inputEmu('12');
        await trezorUserEnvLink.inputEmu('12');
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();
        await expect(onboardingPage.onboardingExitButton).toBeVisible();
    });
});
