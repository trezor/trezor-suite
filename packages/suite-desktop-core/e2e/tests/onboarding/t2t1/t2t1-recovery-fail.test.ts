import { test } from '../../../support/fixtures';

test.describe('Onboarding - recover wallet T2T1', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { wipe: true, model: 'T2T1' },
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableFirmwareHashCheck();
    });

    test('Device disconnected during recovery offers retry', async ({
        page,
        onboardingPage,
        analyticsSection,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        await analyticsSection.passThroughAnalytics();
        await onboardingPage.firmware.continueButton.click();

        // Start wallet recovery process and confirm on device
        await onboardingPage.recoverWalletButton.click();
        await onboardingPage.startRecoveryButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();

        // Disconnect device
        await page.waitForTimeout(1000);
        await trezorUserEnvLink.stopEmu();
        await page.waitForTimeout(500);
        await devicePrompt.connectDevicePromptIsShown();
        await trezorUserEnvLink.startEmu({ model: 'T2T1', wipe: false });

        // Check that you can retry
        await onboardingPage.retryRecoveryButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();
    });
});
