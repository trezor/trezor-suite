import { test, expect } from '../../support/fixtures';

test.describe('Assets', { tag: ['@group=suite'] }, () => {
    test.use({
        emulatorStartConf: { wipe: true },
        emulatorSetupConf: { needs_backup: true },
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('User can initiate buy from Assets in table view', async ({ assetsPage, marketPage }) => {
        await assetsPage.tableIcon.click();
        await assetsPage.buyAssetButton('btc').click();
        await expect(marketPage.section).toBeVisible();
    });

    test('User can initiate buy from Assets in grid view', async ({ assetsPage, marketPage }) => {
        await assetsPage.gridIcon.click();
        await assetsPage.buyAssetButton('btc').click();
        await expect(marketPage.section).toBeVisible();
    });

    test('New asset is shown in both grid and row', async ({
        assetsPage,
        dashboardPage,
        settingsPage,
    }) => {
        await assetsPage.enableMoreCoins.click();
        await settingsPage.enableNetwork('eth');

        await dashboardPage.navigateTo();
        await dashboardPage.discoveryShouldFinish();
        await expect(assetsPage.section).toHaveScreenshot('new-asset-grid.png', {
            mask: [assetsPage.assetExchangeRate, assetsPage.assetWeekChange],
        });

        await assetsPage.tableIcon.click();
        await expect(assetsPage.section).toHaveScreenshot('new-asset-table.png', {
            mask: [assetsPage.assetExchangeRate, assetsPage.assetWeekChange],
            //The width of the table is not fixed -> higher maxDiffPixelRatio
            maxDiffPixelRatio: 0.025,
        });
    });
});
