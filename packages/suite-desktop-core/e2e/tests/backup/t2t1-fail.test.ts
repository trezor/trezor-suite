import messages from '@trezor/suite/src/support/messages';
import { EventType } from '@trezor/suite-analytics';
import { HELP_CENTER_RECOVERY_ISSUES_URL } from '@trezor/urls';

import { expect, test } from '../../support/fixtures';
import { ExtractByEventType } from '../../support/types';

test.describe('Backup fail', { tag: ['@group=device-management', '@specificModel'] }, () => {
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
            await expect(
                page.getByTestId('@menu/switch-device').getByTestId('@deviceStatus-disconnected'),
            ).toBeVisible({ timeout: 30_000 });
        });

        await test.step('Simulate reconnect and check errors', async () => {
            await trezorUserEnvLink.startEmu();
            await expect(page.getByTestId('@toast/backup-failed')).toBeVisible({ timeout: 30_000 });
            await dashboardPage.deviceSwitchingCloseButton.click();
        });

        await test.step('Check dashboard notification error banner', async () => {
            await expect(onboardingPage.backup.errorBanner).toBeVisible({ timeout: 30_000 });
            await expect(onboardingPage.backup.errorBanner).toContainText(
                messages['TR_FAILED_BACKUP'].defaultMessage,
            );
        });

        await test.step('Check backup failed setting in device settings', async () => {
            await onboardingPage.backup.errorBannerContinueButton.click();
            await expect(onboardingPage.backup.failedBackupSetting).toBeVisible();
            await expect(onboardingPage.backup.failedBackupSetting).toContainText(
                messages['TR_BACKUP_RECOVERY_SEED_FAILED_DESC'].defaultMessage,
            );
            await expect(onboardingPage.backup.backupFailedSettingLink).toHaveAttribute(
                'href',
                HELP_CENTER_RECOVERY_ISSUES_URL,
            );
            await expect(onboardingPage.backup.backupFailedSettingButton).toBeDisabled();
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
