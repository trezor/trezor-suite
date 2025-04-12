import { test } from '../../support/fixtures';

test.describe('Trading - Navigation', { tag: ['@group=trading'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(async ({ page, onboardingPage, dashboardPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('coins');
        await settingsPage.coins.enableNetwork('ltc');
        await settingsPage.coins.enableNetwork('eth');
        await settingsPage.coins.activateCoinsButton.click();
        await page.discoveryShouldFinish();
        await dashboardPage.deviceSwitchingOpenButton.click();
        await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
    });

    test('Navigate to', async ({ page, dashboardPage, tradingPage, walletPage }) => {
        // BUY
        await test.step('Buy from dashboard asset card', async () => {
            await dashboardPage.navigateTo();
            await page.getByTestId('@dashboard/asset/btc/buy-button').click();
            await tradingPage.verifyBuyFormOpened('BTC');
            await page.getByTestId(`@account-menu/filter-accounts`).click();
            await walletPage.walletFilter('btc').click();
        });

        await test.step('Buy from account trade section', async () => {
            await walletPage.openAccount({ symbol: 'btc' });
            await page.getByTestId('@trading/menu/wallet-trading-buy').click();
            await tradingPage.verifyBuyFormOpened('BTC');
        });

        await test.step('Buy from global header', async () => {
            await dashboardPage.navigateTo();
            await walletPage.openTradingGlobalButton.click();
            await tradingPage.verifyBuyFormOpened('BTC');
        });

        await test.step('Buy from empty account', async () => {
            await walletPage.openAccount({ symbol: 'ltc' });
            await page.getByTestId('@accounts/empty-account/buy').click();
            await tradingPage.verifyBuyFormOpened('LTC');
        });

        await test.step('Buy from token', async () => {
            await walletPage.openBuyTradingOfToken('eth', 'TrueUSD');
            await tradingPage.verifyBuyFormOpened('TrueUSD');
        });

        // SELL
        // We don't test cases where navigation goes first thru buy form
        await test.step('Sell from account trade section', async () => {
            await walletPage.openAccount({ symbol: 'btc' });
            await page.getByTestId('@trading/menu/wallet-trading-sell').click();
            await tradingPage.verifySellFormOpened('BTC');
        });

        await test.step('Sell from token', async () => {
            await walletPage.openSellTradingOfToken('eth', 'USD Coin');
            await tradingPage.verifySellFormOpened('USD Coin');
        });

        // SWAP
        await test.step('Swap from Global header', async () => {
            await dashboardPage.navigateTo();
            await walletPage.openSwapGlobalButton.click();
            await tradingPage.verifySwapFormOpened('BTC');
        });

        await test.step('Swap from account trade section', async () => {
            await walletPage.openAccount({ symbol: 'btc' });
            await page.getByTestId('@trading/menu/wallet-trading-exchange').click();
            await tradingPage.verifySwapFormOpened('BTC');
        });

        await test.step('Swap from token', async () => {
            await walletPage.openSwapTradingOfToken('eth', 'USD Coin');
            await tradingPage.verifySwapFormOpened('USD Coin');
        });
    });
});
