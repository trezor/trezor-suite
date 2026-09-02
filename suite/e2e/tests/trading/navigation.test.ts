import { TestStream } from '@trezor/e2e-utils';

import { test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Trading - Navigation', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(async ({ onboardingPage, dashboardPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: ['btc', 'eth', 'ltc'],
        });
        await dashboardPage.deviceSwitchingOpenButton.click();
        await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
    });

    test(
        'Navigate to',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies navigation to all Trading Forms.',
                stream: TestStream.Trade,
            }),
        },
        async ({ dashboardPage, tradingPage, walletPage }) => {
            // BUY
            await test.step('Buy from dashboard asset card', async () => {
                await dashboardPage.navigateTo();
                await dashboardPage.buyButton('btc').click();
                await tradingPage.verifyBuyFormOpened(/Bitcoin/);
            });

            await test.step('Buy from account trade section', async () => {
                await walletPage.openAccount({ symbol: 'btc' });
                await tradingPage.buyButton.click();
                await tradingPage.verifyBuyFormOpened(/Bitcoin/);
            });

            await test.step('Buy from global header', async () => {
                await dashboardPage.navigateTo();
                await walletPage.openTradingGlobalButton.click();
                await tradingPage.verifyBuyFormOpened(/Bitcoin|Ethereum|Litecoin/);
            });

            await test.step('Buy from empty account', async () => {
                await walletPage.openAccount({ symbol: 'ltc' });
                await walletPage.buyButton.click();
                await tradingPage.verifyBuyFormOpened(/Litecoin/);
            });

            await test.step('Buy from token', async () => {
                await walletPage.openBuyTradingOfToken('eth', 'TUSD');
                await tradingPage.verifyBuyFormOpened(/TrueUSD/);
            });

            // SELL
            // We don't test cases where navigation goes first thru buy form
            await test.step('Sell from global header', async () => {
                await dashboardPage.navigateTo();
                await walletPage.openSellGlobalButton.click();
                await tradingPage.verifySellFormOpened(/Bitcoin|Ethereum|Litecoin/);
            });

            await test.step('Sell from account trade section', async () => {
                await walletPage.openAccount({ symbol: 'btc' });
                await tradingPage.sellTabButton.click();
                await tradingPage.verifySellFormOpened(/Bitcoin/);
            });

            await test.step('Sell from token', async () => {
                await walletPage.openSellTradingOfToken('eth', 'USDC');
                await tradingPage.verifySellFormOpened(/USDC/);
            });

            // SWAP
            await test.step('Swap from sidebar', async () => {
                await dashboardPage.navigateTo();
                await walletPage.openSwapSidebarButton.click();
                await tradingPage.verifySwapFormOpened(/Bitcoin|Ethereum|Litecoin/);
            });

            await test.step('Swap from account trade section', async () => {
                await walletPage.openAccount({ symbol: 'btc' });
                await walletPage.swapButton.click();
                await tradingPage.verifySwapFormOpened(/Bitcoin/);
            });

            await test.step('Swap from token', async () => {
                await walletPage.openSwapTradingOfToken('eth', 'USDC');
                await tradingPage.verifySwapFormOpened(/USDC/);
            });
        },
    );
});
