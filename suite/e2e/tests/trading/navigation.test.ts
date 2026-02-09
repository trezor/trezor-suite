import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Trading - Navigation', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage, dashboardPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: ['eth', 'ltc'],
        });
        await dashboardPage.deviceSwitchingOpenButton.click();
        await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
    });

    test(
        'Navigate to',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies navigation to all Trading Forms.',
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
                const isBuyButtonUnderDropDown = await walletPage.walletExtraDropDown.isVisible();
                if (isBuyButtonUnderDropDown) {
                    await walletPage.walletExtraDropDown.click();
                }
                await walletPage.openTradingGlobalButton.click();
                await tradingPage.verifyBuyFormOpened(/Bitcoin|Ethereum|Litecoin/);
            });

            await test.step('Buy from empty account', async () => {
                await walletPage.openAccount({ symbol: 'ltc' });
                await walletPage.buyButton.click();
                await tradingPage.verifyBuyFormOpened(/Litecoin/);
            });

            await test.step('Buy from token', async () => {
                await walletPage.openBuyTradingOfToken('eth', 'TrueUSD');
                await tradingPage.verifyBuyFormOpened(/TrueUSD/);
            });

            // SELL
            // We don't test cases where navigation goes first thru buy form
            await test.step('Sell from account trade section', async () => {
                await walletPage.openAccount({ symbol: 'btc' });
                await walletPage.sellButton.click();
                await tradingPage.verifySellFormOpened(/Bitcoin/);
            });

            await test.step('Sell from token', async () => {
                // There is instability in test, sell form has Ethereum instead of USD Coin
                // We cannot reproduce it manually, so we are using retry workaround to stabilize automation
                await expect(async () => {
                    await walletPage.openSellTradingOfToken('eth', 'USD Coin');
                    await tradingPage.verifySellFormOpened(/USD Coin/);
                }).toPass({ timeout: 15_000 });
            });

            // SWAP
            await test.step('Swap from Global header', async () => {
                await dashboardPage.navigateTo();
                await walletPage.openSwapGlobalButton.click();
                await tradingPage.verifySwapFormOpened(/Bitcoin|Ethereum|Litecoin/);
            });

            await test.step('Swap from account trade section', async () => {
                await walletPage.openAccount({ symbol: 'btc' });
                await walletPage.swapButton.click();
                await tradingPage.verifySwapFormOpened(/Bitcoin/);
            });

            await test.step('Swap from token', async () => {
                await walletPage.openSwapTradingOfToken('eth', 'USD Coin');
                await tradingPage.verifySwapFormOpened(/USD Coin/);
            });
        },
    );
});
