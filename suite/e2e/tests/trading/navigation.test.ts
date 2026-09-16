import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import { test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

test.describe('Trading - Navigation', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(async ({ onboardingPage, dashboardPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: [btcSymbol, ethSymbol, asNetworkSymbol('ltc')],
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
                await dashboardPage.buyButton(btcSymbol).click();
                await tradingPage.verifyBuyFormOpened(/Bitcoin/);
            });

            await test.step('Buy from account trade section', async () => {
                await walletPage.openAccount({ symbol: btcSymbol });
                await tradingPage.buyButton.click();
                await tradingPage.verifyBuyFormOpened(/Bitcoin/);
            });

            await test.step('Buy from global header', async () => {
                await dashboardPage.navigateTo();
                await walletPage.openTradingGlobalButton.click();
                await tradingPage.verifyBuyFormOpened(/Bitcoin|Ethereum|Litecoin/);
            });

            await test.step('Buy from empty account', async () => {
                await walletPage.openAccount({ symbol: asNetworkSymbol('ltc') });
                await walletPage.buyButton.click();
                await tradingPage.verifyBuyFormOpened(/Litecoin/);
            });

            await test.step('Buy from token', async () => {
                await walletPage.openBuyTradingOfToken(ethSymbol, 'TUSD');
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
                await walletPage.openAccount({ symbol: btcSymbol });
                await tradingPage.sellTabButton.click();
                await tradingPage.verifySellFormOpened(/Bitcoin/);
            });

            await test.step('Sell from token', async () => {
                await walletPage.openSellTradingOfToken(ethSymbol, 'USDC');
                await tradingPage.verifySellFormOpened(/USDC/);
            });

            // SWAP
            await test.step('Swap from sidebar', async () => {
                await dashboardPage.navigateTo();
                await walletPage.openSwapSidebarButton.click();
                await tradingPage.verifySwapFormOpened(/Bitcoin|Ethereum|Litecoin/);
            });

            await test.step('Swap from account trade section', async () => {
                await walletPage.openAccount({ symbol: btcSymbol });
                await walletPage.swapButton.click();
                await tradingPage.verifySwapFormOpened(/Bitcoin/);
            });

            await test.step('Swap from token', async () => {
                await walletPage.openSwapTradingOfToken(ethSymbol, 'USDC');
                await tradingPage.verifySwapFormOpened(/USDC/);
            });
        },
    );
});
