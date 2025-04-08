import { createTestAnnotation } from '../../../support/annotations';
import { SeedType } from '../../../support/enums/seedType';
import { TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe('Onboarding - create wallet', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { wipe: true, model: 'T3T1' },
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test(
        'Success (Shamir backup)',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully create a wallet during the onboarding process.',
                category: TestCategory.Onboarding,
                priority: TestPriority.Critical,
            }),
        },
        async ({ page, onboardingPage, devicePrompt, analyticsSection, trezorUserEnvLink }) => {
            await analyticsSection.passThroughAnalytics();

            // Device onboarding steps
            await onboardingPage.firmware.continueThroughFirmware();
            await onboardingPage.passThroughAuthenticityCheck();
            await page.waitForTimeout(500);
            await onboardingPage.tutorial.skip();

            // Create wallet with Shamir backup
            await onboardingPage.createWalletButton.click();
            await onboardingPage.selectSeedType(SeedType.Advanced);

            // Accept ToS
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();

            // Confirm wallet created
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();

            onboardingPage.createBackupButton.click();

            // Create backup with Shamir shares and threshold
            const shares = 3;
            const threshold = 2;
            await onboardingPage.backup.passThroughShamirBackup(shares, threshold);

            // Set PIN
            await onboardingPage.pin.setPinButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();
            await trezorUserEnvLink.inputEmu('12');
            await trezorUserEnvLink.inputEmu('12');

            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();

            await onboardingPage.pin.continueButton.click();
        },
    );
});
