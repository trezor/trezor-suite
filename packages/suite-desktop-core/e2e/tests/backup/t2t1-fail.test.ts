import { EventType } from '@trezor/suite-analytics';
import { ExtractByEventType } from '@trezor/suite-web/e2e/support/types';

import { expect, test } from '../../support/fixtures';

test.describe('Backup fail', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T2T1', wipe: true },
        emulatorSetupConf: { needs_backup: true },
    });

    test.beforeEach(async ({ onboardingPage, analytics }) => {
        await onboardingPage.completeOnboarding();
        await analytics.interceptAnalytics();
    });

    //TEST: #17241 Fix unstable test
    test.skip('Device disconnected during action', async ({
        page,
        analytics,
        onboardingPage,
        dashboardPage,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        await dashboardPage.notificationNoBackupButton.click();
        await onboardingPage.backup.undertandWhatSeedIsCheckbox.click();
        await onboardingPage.backup.hasEnoughTimeCheckbox.click();
        await onboardingPage.backup.isInPrivateCheckbox.click();
        await onboardingPage.backup.startButton.click();
        await devicePrompt.confirmOnDevicePromptIsShown();
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.stopEmu();

        // This screen is not always visible. Sometimes it goes directly to '@backup/error-message'
        // await expect(page.getByTestId('@backup/no-device')).toBeVisible();

        await trezorUserEnvLink.startEmu();

        await expect(page.getByTestId('@backup/error-message')).toBeVisible({ timeout: 30000 });

        // Now go to dashboard and see if security card and notification reflects backup failed state correctly
        await onboardingPage.backup.closeButton.click();
        await expect(page.getByTestId('@notification/failed-backup/cta')).toBeVisible();

        const createBackupEvent = analytics.findAnalyticsEventByType<
            ExtractByEventType<EventType.CreateBackup>
        >(EventType.CreateBackup);
        expect(createBackupEvent.status).toEqual('error');
        expect(createBackupEvent.error).toMatch(
            /device\+disconnected\+during\+action|Device\+disconnected|session\+not\+found/,
        );
    });
});
