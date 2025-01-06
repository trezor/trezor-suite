import { test, expect } from '../../../support/fixtures';

test.describe('Onboarding - create wallet', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T1B1', version: '1-latest', wipe: true },
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableFirmwareHashCheck();
    });

    test('Success (basic)', async ({
        page,
        analyticsPage,
        onboardingPage,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        // Pass through analytics and firmware steps
        await analyticsPage.passThroughAnalytics();
        await onboardingPage.firmware.continueButton.click();

        // Start wallet creation
        await page.getByTestId('@onboarding/path-create-button').click();

        // Confirm on device
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();

        // Skip backup
        // It is possible to leave onboarding now
        await expect(page.getByTestId('@onboarding/skip-backup')).toBeVisible();

        // Start backup process
        await page.getByTestId('@onboarding/create-backup-button').click();

        // Check backup completion steps
        await page.getByTestId('@backup/check-item/wrote-seed-properly').click();
        await page.getByTestId('@backup/check-item/made-no-digital-copy').click();
        await page.getByTestId('@backup/check-item/will-hide-seed').click();
        await devicePrompt.confirmOnDevicePromptIsHidden();

        await page.getByTestId('@backup/start-button').click();
        await devicePrompt.confirmOnDevicePromptIsShown();

        for (let i = 0; i < 48; i++) {
            await trezorUserEnvLink.pressYes();
        }

        await page.getByTestId('@backup/close-button').click();

        // Proceed to PIN setup
        // Now we are in PIN step, skip button is available
        await expect(page.getByTestId('@onboarding/skip-button')).toBeVisible();

        // Lets set PIN
        await page.getByTestId('@onboarding/set-pin-button').click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();

        // Simulate PIN mismatch
        await page.getByTestId('@pin/input/1').click();
        await page.getByTestId('@pin/submit-button').click();
        await page.getByTestId('@pin/input/1').click();
        await page.getByTestId('@pin/input/1').click();
        await page.getByTestId('@pin/submit-button').click();
        await expect(page.getByTestId('@pin-mismatch')).toBeVisible();
        await page.getByTestId('@pin-mismatch/try-again-button').click();

        // Retry PIN setup
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();

        // Pin matrix appears again
        await expect(page.getByTestId('@pin/input/1')).toBeVisible();
    });
});
