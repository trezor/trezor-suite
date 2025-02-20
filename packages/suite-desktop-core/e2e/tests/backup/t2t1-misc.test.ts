import { expect, test } from '../../support/fixtures';

test.describe('Backup misc', { tag: ['@group=device-management'] }, () => {
    test.use({
        emulatorStartConf: { model: 'T2T1', wipe: true },
        emulatorSetupConf: { needs_backup: true },
    });

    test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    test('Backup should reset if modal is closed', async ({ onboardingPage, dashboardPage }) => {
        await dashboardPage.notificationNoBackupButton.click();
        await onboardingPage.backup.undertandWhatSeedIsCheckbox.click();
        await onboardingPage.backup.hasEnoughTimeCheckbox.click();
        await onboardingPage.backup.isInPrivateCheckbox.click();
        await expect(
            onboardingPage.backup.undertandWhatSeedIsCheckbox.locator('input'),
        ).toBeChecked();
        await expect(onboardingPage.backup.hasEnoughTimeCheckbox.locator('input')).toBeChecked();
        await expect(onboardingPage.backup.isInPrivateCheckbox.locator('input')).toBeChecked();
        await onboardingPage.backup.closeButton.click();
        await dashboardPage.notificationNoBackupButton.click();

        //at this moment, after modal was closed and opened again, no checkbox should be checked
        await expect(
            onboardingPage.backup.undertandWhatSeedIsCheckbox.locator('input'),
        ).not.toBeChecked();
        await expect(
            onboardingPage.backup.hasEnoughTimeCheckbox.locator('input'),
        ).not.toBeChecked();
        await expect(onboardingPage.backup.isInPrivateCheckbox.locator('input')).not.toBeChecked();
    });

    test('User disconnected device that is remembered. Should not be allowed to initiate backup', async ({
        page,
        dashboardPage,
        onboardingPage,
        trezorUserEnvLink,
    }) => {
        await expect(dashboardPage.graph).toBeVisible();
        await dashboardPage.openDeviceSwitcher();
        await dashboardPage.walletAtIndex(0).click();
        await dashboardPage.notificationNoBackupButton.click();
        await onboardingPage.backup.undertandWhatSeedIsCheckbox.click();
        await onboardingPage.backup.hasEnoughTimeCheckbox.click();
        await onboardingPage.backup.isInPrivateCheckbox.click();

        await trezorUserEnvLink.stopEmu();
        await expect(page.getByTestId('@backup/no-device')).toBeVisible();
    });
});
