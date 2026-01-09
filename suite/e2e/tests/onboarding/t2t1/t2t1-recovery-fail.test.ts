import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Onboarding - recover wallet T2T1', { tag: ['@T2T1'] }, () => {
    test.use({
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test(
        'Device disconnected during recovery offers retry',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that if the device is disconnected during the recovery process, the user is given the option to retry the recovery.',
            }),
        },
        async ({
            page,
            onboardingPage,
            analyticsSection,
            devicePrompt,
            trezorUserEnvLink,
            emulatorStartConf,
        }) => {
            await analyticsSection.passThroughAnalytics();
            await onboardingPage.firmware.continueThroughFirmware();

            // Start wallet recovery process and confirm on device
            await onboardingPage.recoverWalletButton.click();
            await onboardingPage.startRecoveryButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();

            // Disconnect device
            await page.waitForTimeout(1000);
            await trezorUserEnvLink.stopEmu();
            await page.waitForTimeout(500);
            await devicePrompt.connectDevicePromptIsShown();
            await trezorUserEnvLink.startEmu({ ...emulatorStartConf, wipe: false });

            // Check that you can retry
            await onboardingPage.retryRecoveryButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
        },
    );
});
