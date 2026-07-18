import { messages } from '@suite/intl';
import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Onboarding - create wallet', { tag: ['@desktopOnly', '@T3T1'] }, () => {
    test.use({
        setupEmulator: false,
        electronConf: { offlineMode: true },
        ignoreToastErrors: [
            messages.TR_FIRMWARE_REVISION_CHECK_OTHER_ERROR.defaultMessage,
            'Network request failed',
        ],
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test(
        'Success (Shamir backup) offline',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully create a wallet during the offline onboarding process.',
                category: TestCategory.Onboarding,
                priority: TestPriority.Critical,
            }),
        },
        async ({
            page,
            onboardingPage,
            devicePrompt,
            analyticsSection,
            device,
            settingsPage,
            dashboardPage,
        }) => {
            await expect(page.getByTestId('@suite/no-connection-banner')).toHaveTranslation(
                'TR_YOU_WERE_DISCONNECTED_DOT',
            );

            await analyticsSection.continueButton.click();
            await expect(page.getByTestId('@suite/no-connection-banner')).toHaveTranslation(
                'TR_YOU_WERE_DISCONNECTED_DOT',
            );
            await analyticsSection.continueButton.click();

            await test.step('Device onboarding steps', async () => {
                await onboardingPage.firmware.continueThroughFirmware();
                await onboardingPage.tutorial.skip();
            });

            await test.step('Select backup type and create wallet with backup', async () => {
                await onboardingPage.createWalletButton.click();
                await onboardingPage.selectSeedType('shamir-advanced');

                await onboardingPage.backup.passThroughShamirBackup({
                    shares: 3,
                    threshold: 2,
                    deviceConfirmations: 3,
                });
            });

            await test.step('Set PIN', async () => {
                await onboardingPage.pin.setPinButton.click();
                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
                await device.inputPin('12');
                await device.inputPin('12');

                await devicePrompt.confirmOnDevicePromptIsShown();
                await device.pressYes();
                await onboardingPage.finalButton.click();
            });

            await test.step('Enable Bitcoin so discovery can be attempted', async () => {
                await settingsPage.navigateTo('coins');
                await settingsPage.coinsTab.enableNetwork('btc');
                await settingsPage.coinsTab.activateCoinsButton.click();
                await dashboardPage.navigateTo();
            });

            await test.step('Verify offline state after onboarding completes', async () => {
                await expect(page.getByTestId('@suite/no-connection-banner')).toHaveTranslation(
                    'TR_YOU_WERE_DISCONNECTED_DOT',
                );
                await expect(
                    page.getByTestId('@exception/discovery-failed/description'),
                ).toBeVisible({ timeout: 30_000 });
            });
        },
    );
});
