import { EventType } from '@trezor/suite-analytics';

import { expect, test } from '../../support/fixtures';
import { ExtractByEventType } from '../../support/types';

test.describe('Backup fail', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T2T1', wipe: true },
        emulatorSetupConf: { needs_backup: true },
    });

    test.beforeEach(async ({ onboardingPage, analytics }) => {
        await onboardingPage.completeOnboarding();
        await analytics.interceptAnalytics();
    });

    test('Device disconnected during action', async ({
        page,
        analytics,
        onboardingPage,
        dashboardPage,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        await test.step('Start backup', async () => {
            await dashboardPage.notificationNoBackupButton.click();
            await onboardingPage.backup.understandWhatSeedIsCheckbox.click();
            await onboardingPage.backup.hasEnoughTimeCheckbox.click();
            await onboardingPage.backup.isInPrivateCheckbox.click();
            await onboardingPage.backup.startButton.click();
            await devicePrompt.waitForPromptAndConfirm();
        });

        await test.step('Simulate disconnect', async () => {
            await trezorUserEnvLink.stopEmu();
            await expect(onboardingPage.backup.noDeviceModal).toBeVisible({ timeout: 30_000 });
        });

        await test.step('Simulate reconnect and check errors', async () => {
            await trezorUserEnvLink.startEmu();
            await expect(page.getByTestId('@toast/backup-failed')).toBeVisible({ timeout: 30_000 });
            await expect(onboardingPage.backup.errorModal).toBeVisible({ timeout: 30_000 });
        });

        await test.step('Check dashboard notification error banner', async () => {
            await onboardingPage.backup.closeButton.click();
            await expect(dashboardPage.notificationFailedBackup).toBeVisible();
        });

        const createBackupEvent = analytics.findAnalyticsEventByType<
            ExtractByEventType<EventType.CreateBackup>
        >(EventType.CreateBackup);
        expect(createBackupEvent.status).toEqual('error');
        expect(createBackupEvent.error).toMatch(
            /device\+disconnected\+during\+action|Device\+disconnected|session\+not\+found/,
        );
    });
});
