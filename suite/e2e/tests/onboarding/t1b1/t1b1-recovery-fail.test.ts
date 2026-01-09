import { test } from '../../../support/fixtures';

test.describe('Onboarding - recover wallet T1B1', { tag: ['@firmware-ready', '@T1B1'] }, () => {
    test.use({
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test('Device disconnected during recovery offers retry', async ({
        onboardingPage,
        analyticsSection,
        recoveryModal,
        devicePrompt,
        trezorUserEnvLink,
        emulatorStartConf,
    }) => {
        await analyticsSection.passThroughAnalytics();

        // Start wallet recovery process
        await onboardingPage.firmware.continueThroughFirmware();
        await onboardingPage.recoverWalletButton.click();
        await recoveryModal.selectWordCount(24);
        await recoveryModal.selectRecoveryButton('standard').click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();

        // Disconnect the device
        await trezorUserEnvLink.stopEmu();
        await devicePrompt.connectDevicePromptIsShown();
        await trezorUserEnvLink.startEmu({ ...emulatorStartConf, wipe: false });

        // Retry recovery process
        await onboardingPage.retryRecoveryButton.click();
        await recoveryModal.selectWordCount(24);
        await recoveryModal.selectRecoveryButton('standard').click();
        await devicePrompt.confirmOnDevicePromptIsShown();
    });
});
