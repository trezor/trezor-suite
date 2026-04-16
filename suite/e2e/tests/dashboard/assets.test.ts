import { expect, test } from '../../support/fixtures';

test.describe('Assets', { tag: ['@T3W1', '@T3T1', '@smoke'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await dashboardPage.navigateTo();
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
        page,
        assetsSection,
        dashboardPage,
        settingsPage,
    }) => {
        await assetsSection.enableMoreCoins.click();
        await settingsPage.coinsTab.enableNetwork('eth');
        await dashboardPage.navigateTo();
        await page.discoveryShouldFinish();
        await assetsSection.verifyAssetContents();
        await assetsSection.tableIcon.click();
        await assetsSection.verifyAssetContents();
    });
});
