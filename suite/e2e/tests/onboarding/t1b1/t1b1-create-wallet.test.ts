import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

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
                stream: TestStream.Growth,
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

            await test.step('Check backup completion steps', async () => {
                await onboardingPage.backup.wroteSeedProperlyCheckbox.click();
                await onboardingPage.backup.madeNoDigitalCopyCheckbox.click();
                await onboardingPage.backup.willHideSeedCheckbox.click();

                await page.getByTestId('@onboarding/create-backup-button').click();

                // Do you want to create wallet? > Yes
                await page.waitForTimeout(1_000);
                await device.pressYes();

                // Confirm 2 x 24 words
                await page.waitForTimeout(1_000);
                for (let i = 0; i < 48; i++) {
                    await device.pressYes();
                }
                await page.getByTestId('@onboarding/continue-button').click();
            });

            await test.step('Set PIN', async () => {
                await page.waitForTimeout(2_000);
                const pin = '12345';

                await onboardingPage.pin.setPinButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
                await trezorInput.enterPinOnBlindMatrix(pin);
                await trezorInput.enterPinOnBlindMatrix(pin);
            });

            await test.step('Finish wallet creation', async () => {
                await onboardingPage.finalButton.click();
                await expect(onboardingPage.suiteLoadedIndicator).toBeVisible();
                await expect(dashboardPage.discoveryEmptyHeader).toBeVisible({ timeout: 20_000 });
            });
        },
    );
});
