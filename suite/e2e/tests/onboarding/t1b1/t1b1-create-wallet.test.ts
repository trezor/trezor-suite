import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Onboarding - create wallet', { tag: ['@firmware-ready', '@T1B1'] }, () => {
    test.use({
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
        async ({
            page,
            device,
            analyticsSection,
            onboardingPage,
            dashboardPage,
            devicePrompt,
            trezorInput,
        }) => {
            await test.step('Pass through analytics and firmware steps', async () => {
                await analyticsSection.passThroughAnalytics();
                await onboardingPage.firmware.continueThroughFirmware();
            });

            await test.step('Start wallet creation', async () => {
                await onboardingPage.createWalletButton.click();
            });

            await test.step('Confirm on device', async () => {
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
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
                await page.waitForTimeout(1_000);
                for (let i = 0; i < 48; i++) {
                    await device.pressYes();
                }

                await onboardingPage.backup.closeButton.click();
            });

            await test.step('Lets set PIN', async () => {
                const pin = '12345';

                await onboardingPage.pin.setPinButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
                // enter the PIN
                await trezorInput.enterPinOnBlindMatrix(pin);
                // re-enter the PIN
                await trezorInput.enterPinOnBlindMatrix(pin);
            });

            await test.step('Finish wallet creation', async () => {
                await expect(onboardingPage.suiteLoadedIndicator).toBeVisible();
                await expect(dashboardPage.walletReady).toBeVisible();
            });
        },
    );
});
