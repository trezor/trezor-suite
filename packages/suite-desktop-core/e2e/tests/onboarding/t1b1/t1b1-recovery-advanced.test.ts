import { test, expect } from '../../../support/fixtures';

test.describe('Onboarding - recover wallet T1B1', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T1B1', version: '1-latest', wipe: true },
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableFirmwareHashCheck();
    });

    test('Incomplete run of advanced recovery', async ({
        onboardingPage,
        analyticsPage,
        devicePrompt,
        recoveryPage,
        page,
        trezorUserEnvLink,
    }) => {
        // Navigate through onboarding steps
        await analyticsPage.passThroughAnalytics();
        await onboardingPage.firmware.continueButton.click();
        await onboardingPage.recoverWalletButton.click();

        // Select advanced recovery
        await recoveryPage.selectWordCount(24);
        await page.getByTestId('@recover/select-type/advanced').click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();

        // Simulate user input
        for (let i = 0; i <= 4; i++) {
            await page.getByTestId('@recovery/word-input-advanced/1').click({ force: true });
        }

        // Simulate device disconnection due to lack of cancel button
        await page.waitForTimeout(501);
        await trezorUserEnvLink.stopEmu();
        await devicePrompt.confirmOnDevicePromptIsShown();

        // Restart emulator
        await trezorUserEnvLink.startEmu({ model: 'T1B1', version: '1-latest' });

        // Retry recovery with basic type
        await onboardingPage.retryRecoveryButton.click();
        await recoveryPage.selectWordCount(12);
        await page.getByTestId('@recover/select-type/basic').click();

        // Confirm on device
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();

        // Ensure input field for basic recovery is visible
        await expect(page.getByTestId('@word-input-select/input')).toBeVisible();

        // Note: Completion of reading device data requires support in trezor-user-env
    });
});
