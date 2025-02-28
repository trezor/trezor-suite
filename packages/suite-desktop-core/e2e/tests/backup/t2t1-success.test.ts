import { EventType } from '@trezor/suite-analytics';

import { expect, test } from '../../support/fixtures';
import { ExtractByEventType } from '../../support/types';

test.describe('Backup success', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T2T1', wipe: true },
        emulatorSetupConf: { needs_backup: true, mnemonic: 'mnemonic_all' },
    });

    test.beforeEach(async ({ onboardingPage, analytics }) => {
        await analytics.interceptAnalytics();
        await onboardingPage.completeOnboarding();
    });

    test('Successful backup happy path', async ({
        analytics,
        onboardingPage,
        dashboardPage,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        // access from notification
        await dashboardPage.notificationNoBackupButton.click();

        await onboardingPage.backup.understandWhatSeedIsCheckbox.click();
        await onboardingPage.backup.hasEnoughTimeCheckbox.click();
        await onboardingPage.backup.isInPrivateCheckbox.click();

        // Create backup on device
        await onboardingPage.backup.startButton.click();

        await devicePrompt.confirmOnDevicePromptIsShown();

        //await trezorUserEnvLink.readAndConfirmMnemonicEmu(); should be used here, but it is flaky
        // TODO: https://github.com/trezor/trezor-suite/issues/17148
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.swipeEmu('up');
        await trezorUserEnvLink.swipeEmu('up');
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.inputEmu('all');
        await trezorUserEnvLink.inputEmu('all');
        await trezorUserEnvLink.inputEmu('all');
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.pressYes();

        // Click all after checkboxes and close backup modal
        await expect(onboardingPage.backup.closeButton).toBeDisabled();
        await onboardingPage.backup.wroteSeedProperlyCheckbox.click();
        await onboardingPage.backup.madeNoDigitalCopyCheckbox.click();
        await onboardingPage.backup.willHideSeedCheckbox.click();
        await expect(onboardingPage.backup.closeButton).toBeEnabled();

        const createBackupEvent = analytics.findAnalyticsEventByType<
            ExtractByEventType<EventType.CreateBackup>
        >(EventType.CreateBackup);
        expect(createBackupEvent.status).toEqual('finished');
        expect(createBackupEvent.error).toEqual('');
    });
});
