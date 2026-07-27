import { escapeRegExp } from 'lodash';

import { messages } from '@suite/intl';
import { HELP_CENTER_RECOVERY_ISSUES_URL } from '@trezor/urls';

import { expect, test } from '../../support/fixtures';

test.describe('Backup errors', { tag: ['@T2T1'] }, () => {
    test.use({
        deviceSetup: { needs_backup: true },
        ignoreToastErrors: [messages.TOAST_BACKUP_FAILED.defaultMessage],
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('Device disconnected during action', async ({
        page,
        device,
        onboardingPage,
        dashboardPage,
        devicePrompt,
        settingsPage,
        walletPage,
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
            await device.powerOff();
            await expect(walletPage.deviceDisconnectedStatus).toBeVisible({ timeout: 30_000 });
        });

        await test.step('Simulate reconnect and check errors', async () => {
            await device.powerOn();
            await expect(page.getByTestId('@toast/backup-failed')).toBeVisible({ timeout: 30_000 });
            await page.getByTestId('@backup/close-button').click();
        });

        await test.step('Check dashboard notification error banner', async () => {
            await expect(onboardingPage.backup.errorBanner).toBeVisible({ timeout: 30_000 });
            await expect(onboardingPage.backup.errorBanner).toContainTranslation(
                'TR_FAILED_BACKUP',
            );
        });

        await test.step('Check backup errored setting in device settings', async () => {
            await settingsPage.navigateTo('device');
            await expect(onboardingPage.backup.failedBackupSetting).toBeVisible();
            await expect(onboardingPage.backup.failedBackupSetting).toContainTranslation(
                'TR_BACKUP_RECOVERY_SEED_FAILED_DESC',
            );
            // removes URL query params .../recovery-issues?utm_medium=desktop|web|???
            const urlBase = HELP_CENTER_RECOVERY_ISSUES_URL.split('?')[0];
            const urlBaseRegexp = new RegExp(escapeRegExp(urlBase));
            await expect(onboardingPage.backup.backupFailedSettingLink).toHaveAttribute(
                'href',
                urlBaseRegexp,
            );
            await expect(onboardingPage.backup.backupFailedSettingButton).toBeDisabled();
        });
    });
});
