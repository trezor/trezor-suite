import { expect, test } from '../../support/fixtures';

test.describe('Assets', { tag: ['@group=suite'] }, () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('User can initiate buy from Assets in table view', async ({
        assetsSection,
        tradingPage,
    }) => {
        await assetsSection.tableIcon.click();
        await assetsSection.buyAssetButton('btc').click();
        await expect(tradingPage.section).toBeVisible();
    });

    test('User can initiate buy from Assets in grid view', async ({
        assetsSection,
        tradingPage,
    }) => {
        await assetsSection.gridIcon.click();
        await assetsSection.buyAssetButton('btc').click();
        await expect(tradingPage.section).toBeVisible();
    });

    test('New asset is shown in both grid and row', async ({
        assetsSection,
        dashboardPage,
        settingsPage,
    }) => {
        await assetsSection.enableMoreCoins.click();
        await settingsPage.coins.enableNetwork('eth');
        await dashboardPage.navigateTo();
        await dashboardPage.discoveryShouldFinish();
        await assetsSection.verifyAssetContents();
        await assetsSection.tableIcon.click();
        await assetsSection.verifyAssetContents();
    });
});
