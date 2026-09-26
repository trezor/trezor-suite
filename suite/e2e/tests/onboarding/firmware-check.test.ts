import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { BRIDGE_VERSION } from '../../support/bridge';
import { expect, test } from '../../support/fixtures';
import { MOCKED_FIRMWARE_CHANGELOG } from '../../support/mocks/firmwareReleaseConfigMock';
import { createTestAnnotation } from '../../support/reporters/annotations';

const MOCKED_FIRMWARE_UPDATE_VERSION = '99.0.0';

test.describe('Firmware - update availability', { tag: ['@T3W1'] }, () => {
    test.use({ setupEmulator: false });

    let currentVersion: string;

    test.beforeEach(async ({ trezorUserEnv, device }) => {
        await trezorUserEnv.stopBridge();
        currentVersion = await device.getFirmwareVersion();
        await trezorUserEnv.startBridge(BRIDGE_VERSION);
    });

    test(
        'Onboarding reports firmware as ready and Suite offers no update',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a device running the latest firmware passes onboarding without being offered an update.',
                category: TestCategory.Onboarding,
                priority: TestPriority.Critical,
                stream: TestStream.Growth,
            }),
        },
        async ({ onboardingPage, analyticsSection, dashboardPage, firmwareReleaseConfigMock }) => {
            await firmwareReleaseConfigMock.start(currentVersion);
            await onboardingPage.disableNecessaryFirmwareChecks();

            await test.step('Pass through onboarding', async () => {
                await analyticsSection.continueButton.click();
                await onboardingPage.pairTHP();
                await analyticsSection.continueButton.click();
                await firmwareReleaseConfigMock.expectReleaseConfigServed();

                await onboardingPage.firmware.expectFirmwareToBeReady();
                await onboardingPage.firmware.continueButton.click();

                await onboardingPage.tutorial.skip();
                await onboardingPage.createWalletWithoutBackupAndPin();
            });

            await test.step('Land in Suite without an update notification', async () => {
                await expect(onboardingPage.suiteLoadedIndicator).toBeVisible({ timeout: 30_000 });
                await dashboardPage.verifyDiscoveryEmpty();
                await expect(dashboardPage.updateNotificationBanner).toBeHidden();
            });
        },
    );

    test(
        'Onboarding offers a firmware update and Suite keeps notifying after it is skipped',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a device with a newer firmware release available is offered an update in onboarding and keeps the update notification after the update is skipped.',
                category: TestCategory.Onboarding,
                priority: TestPriority.Critical,
                stream: TestStream.Growth,
            }),
        },
        async ({ onboardingPage, analyticsSection, dashboardPage, firmwareReleaseConfigMock }) => {
            await firmwareReleaseConfigMock.start(MOCKED_FIRMWARE_UPDATE_VERSION);
            await onboardingPage.disableNecessaryFirmwareChecks();

            await test.step('Skip the offered update and pass through onboarding', async () => {
                await analyticsSection.continueButton.click();
                await onboardingPage.pairTHP();
                await analyticsSection.continueButton.click();
                await firmwareReleaseConfigMock.expectReleaseConfigServed();

                await onboardingPage.firmware.expectFirmwareUpdateToBeOffered({
                    currentVersion,
                    offeredVersion: MOCKED_FIRMWARE_UPDATE_VERSION,
                    changelog: MOCKED_FIRMWARE_CHANGELOG,
                });
                await onboardingPage.firmware.skip();

                await onboardingPage.tutorial.skip();
                await onboardingPage.createWalletWithoutBackupAndPin();
            });

            await test.step('Land in Suite with an update notification', async () => {
                await expect(onboardingPage.suiteLoadedIndicator).toBeVisible({ timeout: 30_000 });
                await dashboardPage.verifyDiscoveryEmpty();
                await expect(dashboardPage.updateNotificationBannerHeading).toHaveTranslation(
                    'TR_QUICK_ACTION_UPDATE_POPOVER_TREZOR_UPDATE_AVAILABLE',
                );
            });
        },
    );
});
