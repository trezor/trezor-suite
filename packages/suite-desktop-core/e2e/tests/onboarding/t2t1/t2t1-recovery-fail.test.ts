import { isWebProject } from '../../../support/common';
import { test } from '../../../support/fixtures';

test.describe('Onboarding - recover wallet T2T1', { tag: ['@group=device-management'] }, () => {
    // This test always needs to run the newest possible emulator version
    // Emulator setup: wipe: true, model: T2T1, version: 2-latest
    test.use({
        emulatorStartConf: { wipe: true, model: 'T2T1', version: '2-latest' },
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableFirmwareHashCheck();
    });

    test('Device disconnected during recovery offers retry', async ({
        page,
        onboardingPage,
        analyticsPage,
        devicePrompt,
        trezorUserEnvLink,
    }, testInfo) => {
        await analyticsPage.passThroughAnalytics();
        if (isWebProject(testInfo)) {
            await onboardingPage.firmware.skip();
        } else {
            await onboardingPage.firmware.continueButton.click();
        }

        // Start wallet recovery process and confirm on device
        await onboardingPage.recoverWalletButton.click();
        await onboardingPage.startRecoveryButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();

        // Disconnect device
        await page.waitForTimeout(1000);
        await trezorUserEnvLink.stopEmu();
        await page.waitForTimeout(500);
        await devicePrompt.connectDevicePromptIsShown();
        await trezorUserEnvLink.startEmu({ model: 'T2T1', version: '2-latest', wipe: false });

        // Check that you can retry
        await onboardingPage.retryRecoveryButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();
    });
});
