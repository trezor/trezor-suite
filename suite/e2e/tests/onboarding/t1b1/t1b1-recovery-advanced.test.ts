import { expect, test } from '../../../support/fixtures';

test.describe('Onboarding - recover wallet T1B1', { tag: ['@firmware-ready', '@T1B1'] }, () => {
    test.use({
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test('Incomplete run of advanced recovery', async ({
        onboardingPage,
        analyticsSection,
        devicePrompt,
        recoveryModal,
        page,
        trezorUserEnvLink,
        emulatorStartConf,
    }) => {
        await test.step('Navigate through onboarding steps', async () => {
            await analyticsSection.passThroughAnalytics();
            await onboardingPage.firmware.continueThroughFirmware();
            await onboardingPage.recoverWalletButton.click();
        });

        await test.step('Select advanced recovery', async () => {
            await recoveryModal.selectWordCount(24);
            await recoveryModal.selectRecoveryButton('advanced').click();
            // Emulator isn't sometimes ready to accept confirm right away. Retry approach doesn't work.
            await page.waitForTimeout(500);
            await devicePrompt.waitForPromptAndConfirm();
            await expect(recoveryModal.wordInputAtIndex(1)).toBeVisible();
        });

        await test.step('Simulate user input', async () => {
            for (let i = 0; i <= 4; i++) {
                await recoveryModal.wordInputAtIndex(1).click({ force: true });
            }
        });

        await test.step('Simulate device disconnection due to lack of cancel button', async () => {
            await page.waitForTimeout(501);
            await trezorUserEnvLink.stopEmu();
            await devicePrompt.connectDevicePromptIsShown({ timeout: 15_000 });
        });

        await test.step('Restart emulator', async () => {
            await trezorUserEnvLink.startEmu(emulatorStartConf);
        });

        await test.step('Retry recovery with basic type', async () => {
            await onboardingPage.retryRecoveryButton.click({ timeout: 15_000 });
            await recoveryModal.selectWordCount(12);
            await recoveryModal.selectRecoveryButton('standard').click();
            // Emulator isn't sometimes ready to accept confirm right away. Retry approach doesn't work.
            await page.waitForTimeout(500);
        });

        await test.step('Confirm on device', async () => {
            await devicePrompt.confirmOnDevicePromptIsShown();
            await trezorUserEnvLink.pressYes();
        });

        await test.step('Ensure input field for basic recovery is visible', async () => {
            await expect(page.getByTestId('@word-input-select/input')).toBeVisible();
        });

        // Note: Completion of reading device data requires support in trezor-user-env
    });
});
