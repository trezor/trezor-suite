import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Onboarding - recover wallet T1B1', { tag: ['@firmware-ready', '@T1B1'] }, () => {
    test.use({
        setupEmulator: false,
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test(
        'Incomplete run of advanced recovery',
        { annotation: createTestAnnotation({ stream: TestStream.Growth }) },
        async ({ device, onboardingPage, analyticsSection, devicePrompt, recoveryModal, page }) => {
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
                await device.powerOff();
                await devicePrompt.connectDevicePromptIsShown({ timeout: 15_000 });
            });

            await test.step('Restart emulator', async () => {
                await device.powerOn();
            });

            await test.step('Retry recovery with 12 words (automatically uses advanced recovery)', async () => {
                await onboardingPage.retryRecoveryButton.click({ timeout: 15_000 });
                // For T1B1 with 12 words, Standard recovery is disabled, so it automatically uses Advanced recovery
                await recoveryModal.selectWordCount(12);
                // No recovery type selection needed - it goes directly to advanced recovery
                // Emulator isn't sometimes ready to accept confirm right away. Retry approach doesn't work.
                await page.waitForTimeout(500);
            });

            await test.step('Confirm on device', async () => {
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
            });

            await test.step('Ensure input field for advanced recovery is visible', async () => {
                await expect(recoveryModal.wordInputAtIndex(1)).toBeVisible();
            });

            // Note: Completion of reading device data requires support in trezor-user-env
        },
    );
});
