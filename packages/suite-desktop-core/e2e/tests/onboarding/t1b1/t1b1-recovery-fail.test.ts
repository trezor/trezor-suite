import { test } from '../../../support/fixtures';

test.describe('Onboarding - recover wallet T1B1', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T1B1', version: '1-latest', wipe: true },
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableFirmwareHashCheck();
    });

    test('Device disconnected during recovery offers retry', async ({
        onboardingPage,
        analyticsPage,
        recoverPage,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        await analyticsPage.passThroughAnalytics();

        // Start wallet recovery process
        await onboardingPage.firmwareContinueButton.click();
        await onboardingPage.recoverWalletButton.click();
        await recoverPage.selectWordCount(24);
        await recoverPage.selectBasicRecoveryButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();

        // Disconnect the device
        await trezorUserEnvLink.stopEmu();
        await devicePrompt.connectDevicePromptIsShown();
        await trezorUserEnvLink.startEmu({ model: 'T1B1', version: '1-latest', wipe: false });

        // Retry recovery process
        await onboardingPage.retryRecoveryButton.click();
        await recoverPage.selectWordCount(24);
        await recoverPage.selectBasicRecoveryButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();
    });
});
