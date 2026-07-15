import { expect, test } from '../../../support/fixtures';

test.describe('Suite Sync - Unsupported device banner', { tag: ['@T1B1', '@T2T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, metadataPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('application');
        await settingsPage.toggleDebugModeInSettings();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await metadataPage.setupQuotaManager();
        await metadataPage.initiateSuiteSyncSetup();
    });

    test('Banner appears once and does not reappear after dismissal', async ({
        dashboardPage,
        walletPage,
        metadataPage,
    }) => {
        await test.step('Banner is visible after enabling Suite Sync', async () => {
            await expect(metadataPage.unsupportedBanner).toHaveTranslation(
                'TR_SUITE_SYNC_UNSUPPORTED_DEVICE_BANNER',
            );
        });

        await test.step('Banner stays visible when selecting a wallet', async () => {
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.walletAtIndex(0).click();
            await expect(metadataPage.unsupportedBanner).toHaveTranslation(
                'TR_SUITE_SYNC_UNSUPPORTED_DEVICE_BANNER',
            );
        });

        await test.step('Banner stays visible when navigating to Send', async () => {
            await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
            await walletPage.openSendFormButton.click();
            await expect(metadataPage.unsupportedBanner).toHaveTranslation(
                'TR_SUITE_SYNC_UNSUPPORTED_DEVICE_BANNER',
            );
        });

        await test.step('Banner stays visible when navigating to Receive', async () => {
            await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
            await walletPage.receiveButton.click();
            await expect(metadataPage.unsupportedBanner).toHaveTranslation(
                'TR_SUITE_SYNC_UNSUPPORTED_DEVICE_BANNER',
            );
        });

        await test.step('Dismiss the banner', async () => {
            await metadataPage.suiteSyncBannerDismissButton.click();
            await expect(metadataPage.unsupportedBanner).toBeHidden();
        });

        await test.step('Banner does not reappear when selecting a wallet', async () => {
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.walletAtIndex(0).click();
            await expect(metadataPage.unsupportedBanner).toBeHidden();
        });

        await test.step('Banner does not reappear when navigating to Send', async () => {
            await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
            await walletPage.openSendFormButton.click();
            await expect(metadataPage.unsupportedBanner).toBeHidden();
        });

        await test.step('Banner does not reappear when navigating to Receive', async () => {
            await walletPage.openAccount({ symbol: 'btc', type: 'normal', atIndex: 0 });
            await walletPage.receiveButton.click();
            await expect(metadataPage.unsupportedBanner).toBeHidden();
        });
    });
});
