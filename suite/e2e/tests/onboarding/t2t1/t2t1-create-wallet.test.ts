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
        await test.step('Device onboarding steps', async () => {
            await analyticsSection.passThroughAnalytics();
            await onboardingPage.firmware.continueThroughFirmware();
        });

        await test.step('Select backup type and create wallet with backup', async () => {
            await onboardingPage.createWalletButton.click();
            await onboardingPage.selectSeedType('shamir-advanced');

            await onboardingPage.backup.passThroughShamirBackup({
                shares: 3,
                threshold: 2,
                deviceConfirmations: 4,
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
    });
});
