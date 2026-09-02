import { events } from '@suite/analytics';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Backup success', { tag: ['@T2T1'] }, () => {
    test.use({
        deviceSetup: { needs_backup: true, mnemonic: 'mnemonic_all' },
    });

    test.beforeEach(async ({ onboardingPage, analytics }) => {
        await analytics.interceptAnalytics();
        await onboardingPage.completeOnboarding();
    });

    test(
        'Successful backup happy path',
        { annotation: createTestAnnotation({ stream: TestStream.Growth }) },
        async ({ analytics, device, onboardingPage, dashboardPage, devicePrompt }) => {
            // access from notification
            await dashboardPage.notificationNoBackupButton.click();

            await onboardingPage.backup.understandWhatSeedIsCheckbox.click();
            await onboardingPage.backup.hasEnoughTimeCheckbox.click();
            await onboardingPage.backup.isInPrivateCheckbox.click();

            // Create backup on device
            await onboardingPage.backup.startButton.click();

            await devicePrompt.confirmOnDevicePromptIsShown();

            //await device.readAndConfirmMnemonic(); should be used here, but it is flaky
            // TODO: https://github.com/trezor/trezor-suite/issues/17148
            await device.pressYes();
            await device.pressYes();
            await device.pressContinue();
            await device.pressContinue();
            await device.pressYes();
            await device.type('all');
            await device.type('all');
            await device.type('all');
            await device.pressYes();
            await device.pressYes();

            // Click all after checkboxes and close backup modal
            await expect(onboardingPage.backup.closeButton).toBeDisabled();
            await onboardingPage.backup.wroteSeedProperlyCheckbox.click();
            await onboardingPage.backup.madeNoDigitalCopyCheckbox.click();
            await onboardingPage.backup.willHideSeedCheckbox.click();
            await expect(onboardingPage.backup.closeButton).toBeEnabled();

            const createBackupRequest = analytics.findLatestRequestByType(
                events.createBackupEvent.name,
            );
            expect(createBackupRequest).toMatchObject({ status: 'finished', error: '' });
        },
    );
});
