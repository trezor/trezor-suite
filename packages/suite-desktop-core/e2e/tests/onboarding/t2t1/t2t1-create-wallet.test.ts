import { test, expect } from '../../../support/fixtures';

test.describe('Onboarding - create wallet', { tag: ['@group=device-management'] }, () => {
    // This test always needs to run the newest possible emulator version
    // Emulator setup: wipe: true, model: T2T1, version: 2-latest
    test.use({
        emulatorStartConf: { wipe: true, model: 'T2T1', version: '2-latest' },
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableFirmwareHashCheck();
    });

    test('Success (Shamir backup)', async ({
        page,
        analyticsPage,
        onboardingPage,
        backupPage,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        await analyticsPage.passThroughAnalytics();
        await onboardingPage.firmwareContinueButton.click();

        await page.getByTestId('@onboarding/path-create-button').click();

        // Will be clicking on Shamir backup button
        await page.getByTestId('@onboarding/select-seed-type-open-dialog').click();
        await page.getByTestId('@onboarding/select-seed-type-shamir-advanced').click();
        await page.getByTestId('@onboarding/select-seed-type-confirm').click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();

        await page.getByTestId('@onboarding/create-backup-button').click();

        const shares = 3;
        const threshold = 2;
        await backupPage.passThroughShamirBackup(shares, threshold);
        await page.getByTestId('@onboarding/set-pin-button').click();
        await devicePrompt.confirmOnDevicePromptIsShown();

        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.inputEmu('12');
        await trezorUserEnvLink.inputEmu('12');
        await expect(page.getByTestId('@prompts/confirm-on-device')).toBeVisible();
        await trezorUserEnvLink.pressYes();
        await expect(page.getByTestId('@onboarding/pin/continue-button')).toBeVisible();
    });
});
