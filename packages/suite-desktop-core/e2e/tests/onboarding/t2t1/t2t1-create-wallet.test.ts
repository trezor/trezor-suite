import { SeedType } from '../../../support/enums/seedType';
import { expect, test } from '../../../support/fixtures';

test.describe(
    'Onboarding - create wallet',
    { tag: ['@group=device-management', '@specificModel'] },
    () => {
        test.use({
            emulatorStartConf: { wipe: true, model: 'T2T1' },
            setupEmulator: false,
        });

        test.beforeEach(async ({ onboardingPage }) => {
            await onboardingPage.disableNecessaryFirmwareChecks();
        });

        test('Success (Shamir backup)', async ({
            page,
            analyticsSection,
            onboardingPage,
            devicePrompt,
            trezorUserEnvLink,
        }) => {
            await analyticsSection.passThroughAnalytics();
            await onboardingPage.firmware.continueThroughFirmware();

            // Will be clicking on Shamir backup button
            await onboardingPage.createWalletButton.click();
            await onboardingPage.selectSeedType(SeedType.Advanced);
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();

            await onboardingPage.createBackupButton.click();

            const shares = 3;
            const threshold = 2;
            await onboardingPage.backup.passThroughShamirBackup(shares, threshold);
            await onboardingPage.pin.setPinButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();

            await trezorUserEnvLink.pressYes();
            await page.waitForTimeout(100); // This wait fixes weird emu/tenv sync issues (https://github.com/trezor/trezor-suite/issues/23270)
            await trezorUserEnvLink.inputEmu('12');
            await page.waitForTimeout(100); // This wait fixes weird emu/tenv sync issues (https://github.com/trezor/trezor-suite/issues/23270)
            await trezorUserEnvLink.inputEmu('12');
            await page.waitForTimeout(100); // This wait fixes weird emu/tenv sync issues (https://github.com/trezor/trezor-suite/issues/23270)
            await devicePrompt.confirmOnDevicePromptIsShown();
            await page.waitForTimeout(100); // This wait fixes weird emu/tenv sync issues (https://github.com/trezor/trezor-suite/issues/23270)
            await trezorUserEnvLink.pressYes();
            await page.waitForTimeout(100); // This wait fixes weird emu/tenv sync issues (https://github.com/trezor/trezor-suite/issues/23270)
            await expect(onboardingPage.onboardingExitButton).toBeVisible();
        });
    },
);
