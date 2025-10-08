import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe(
    'Onboarding - create wallet',
    { tag: ['@group=device-management', '@firmware-ready', '@specificModel'] },
    () => {
        test.use({
            emulatorStartConf: { model: 'T1B1', wipe: true },
            setupEmulator: false,
        });

        test.beforeEach(async ({ onboardingPage }) => {
            await onboardingPage.disableNecessaryFirmwareChecks();
        });

        test(
            'Success (basic)',
            {
                annotation: createTestAnnotation({
                    testCase:
                        'Verify that a user can successfully create a wallet during the onboarding process.',
                    category: TestCategory.Onboarding,
                    priority: TestPriority.Critical,
                }),
            },
            async ({ analyticsSection, onboardingPage, devicePrompt, trezorUserEnvLink, page }) => {
                await test.step('Pass through analytics and firmware steps', async () => {
                    await analyticsSection.passThroughAnalytics();
                    await onboardingPage.firmware.continueThroughFirmware();
                });

                await test.step('Start wallet creation', async () => {
                    await onboardingPage.createWalletButton.click();
                });

                await test.step('Confirm on device', async () => {
                    await devicePrompt.confirmOnDevicePromptIsShown();
                    await trezorUserEnvLink.pressYes();
                });

                await test.step('Skip backup, It is possible to leave onboarding now', async () => {
                    await expect(onboardingPage.backup.skipBackupButton).toBeVisible();
                });

                await test.step('Start backup process', async () => {
                    await onboardingPage.createBackupButton.click();
                });

                await test.step('Check backup completion steps', async () => {
                    await onboardingPage.backup.wroteSeedProperlyCheckbox.click();
                    await onboardingPage.backup.madeNoDigitalCopyCheckbox.click();
                    await onboardingPage.backup.willHideSeedCheckbox.click();
                    await devicePrompt.confirmOnDevicePromptIsHidden();
                    await onboardingPage.backup.startButton.click();
                    await devicePrompt.confirmOnDevicePromptIsShown();

                    // Emulator needs to initialize the seed first
                    await page.waitForTimeout(500);
                    for (let i = 0; i < 48; i++) {
                        await trezorUserEnvLink.pressYes();
                    }

                    await onboardingPage.backup.closeButton.click();
                });

                await test.step('Proceed to PIN setup, Now we are in PIN step, skip button is available', async () => {
                    await expect(onboardingPage.pin.skipButton).toBeVisible();
                });

                await test.step('Lets set PIN', async () => {
                    await onboardingPage.pin.setPinButton.click();
                    await devicePrompt.confirmOnDevicePromptIsShown();
                    await trezorUserEnvLink.pressYes();
                });

                await test.step('Simulate PIN mismatch', async () => {
                    await onboardingPage.pin.pinButton(1).click();
                    await onboardingPage.pin.submitButton.click();
                    await onboardingPage.pin.pinButton(1).click();
                    await onboardingPage.pin.pinButton(1).click();
                    await onboardingPage.pin.submitButton.click();
                    await expect(onboardingPage.pin.pinMismatch).toBeVisible();
                    await onboardingPage.pin.tryAgainButton.click();
                });

                await test.step('Retry PIN setup', async () => {
                    await devicePrompt.confirmOnDevicePromptIsShown();
                    await trezorUserEnvLink.pressYes();
                });

                await test.step('Pin matrix appears again', async () => {
                    await expect(onboardingPage.pin.pinButton(1)).toBeVisible();
                });
            },
        );
    },
);
