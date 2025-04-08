import { createTestAnnotation } from '../../../support/annotations';
import { TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { expect, test } from '../../../support/fixtures';

test.describe('Onboarding - recover wallet T2T1', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { wipe: true, model: 'T2T1' },
        setupEmulator: false,
    });
    test.beforeEach(async ({ analyticsSection, onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();

        analyticsSection.passThroughAnalytics();
    });

    test(
        'Successfully recovers wallet from mnemonic',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully recover a wallet from a mnemonic during the onboarding process.',
                category: TestCategory.Onboarding,
                priority: TestPriority.Critical,
            }),
        },
        async ({ onboardingPage, devicePrompt, trezorUserEnvLink }) => {
            // Start wallet recovery process and confirm on device
            await onboardingPage.firmware.continueThroughFirmware();
            await onboardingPage.recoverWalletButton.click();
            await onboardingPage.startRecoveryButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();

            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.selectNumOfWordsEmu(12);

            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();

            // Input mnemonic
            for (let i = 0; i < 12; i++) {
                await trezorUserEnvLink.inputEmu('all');
            }

            // Confirm recovery success
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();

            // Finalize recovery, skip pin, and check success
            await onboardingPage.continueRecoveryButton.click();
            await onboardingPage.pin.skip();
            await onboardingPage.continueCoinsButton.click();
            await expect(onboardingPage.finalTitle).toBeVisible();
            await expect(onboardingPage.finalTitle).toContainText('Setup complete!');
        },
    );
});
