import { expect, test } from '../../support/fixtures';

//'@T3T1'
test.describe('stablecoin yield', { tag: ['@webOnly', '@T3W1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(
        async ({ onboardingPage, settingsPage, blockbookMock, dashboardPage, page }) => {
            await onboardingPage.completeOnboarding();
            await blockbookMock.start('eth');
            await settingsPage.navigateTo('coins');
            await settingsPage.coinsTab.enableNetwork('eth');
            await settingsPage.coinsTab.openNetworkAdvanceSettings('eth');
            await settingsPage.coinsTab.changeBackend('blockbook', blockbookMock.url);
            await dashboardPage.dashboardMenuButton.click();
            await page.discoveryShouldFinish();
        },
    );

    test('yield deposit', async ({
        page,
        device,
        walletPage,
        stakingSection,
        devicePrompt,
        solanaStakingMock,
    }) => {
        await test.step('Check yield dashboard', async () => {
            await page.pause();
            await page.getByTestId('@suite/menu/suite-earn').click();

            await walletPage.openAccount({ symbol: 'sol', type: 'normal', atIndex: 0 });
            await stakingSection.stakingTabButton.click();
            await expect(stakingSection.stakingDashboardCard).toBeHidden();
            await expect(stakingSection.stakingEmptyCard).toBeVisible();
            await expect(stakingSection.stakeMoreButton).toBeHidden();
            await expect(stakingSection.unstakeToClaimButton).toBeHidden();
        });
    });
});
