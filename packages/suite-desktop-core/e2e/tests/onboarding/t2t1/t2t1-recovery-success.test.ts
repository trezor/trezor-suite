import { test, expect } from '../../../support/fixtures';

test.describe('Onboarding - recover wallet T2T1', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { wipe: true, model: 'T2T1', version: '2.5.3' },
        setupEmulator: false,
    });
    test.beforeEach(async ({ analyticsPage, onboardingPage }) => {
        await onboardingPage.disableFirmwareHashCheck();

        analyticsPage.passThroughAnalytics();
    });

    test('Successfully recovers wallet from mnemonic', async ({
        onboardingPage,
        page,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        // Start wallet recovery process and confirm on device
        await onboardingPage.skipFirmware();
        await onboardingPage.recoverWalletButton.click();
        await onboardingPage.startRecoveryButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();

        await page.waitForTimeout(1000);
        await trezorUserEnvLink.pressYes();

        await devicePrompt.confirmOnDevicePromptIsShown();
        await page.waitForTimeout(1000);
        await trezorUserEnvLink.pressYes();

        await page.waitForTimeout(1000);
        await trezorUserEnvLink.selectNumOfWordsEmu(12);

        await page.waitForTimeout(1000);
        await trezorUserEnvLink.pressYes();

        // Input mnemonic
        await page.waitForTimeout(1000);
        for (let i = 0; i < 12; i++) {
            await trezorUserEnvLink.inputEmu('all');
        }

        // Confirm recovery success
        await page.waitForTimeout(1000);
        await trezorUserEnvLink.pressYes();

        // Finalize recovery, skip pin, and check success
        await onboardingPage.continueRecoveryButton.click();
        await onboardingPage.skipPin();
        await onboardingPage.continueCoinsButton.click();
        await expect(onboardingPage.finalTitle).toBeVisible();
        await expect(onboardingPage.finalTitle).toContainText('Setup complete!');
    });
});
