import { capitalizeFirstLetter } from '@trezor/utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    sellQuotesEthereumToken,
    sellTradeEthereumToken,
    sellWatchEthereum,
} from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = sellQuotesEthereumToken[0].fiatStringAmount;
const cryptoAmount = sellQuotesEthereumToken[0].cryptoStringAmount;
const provider = getCompanyNameFromList(sellQuotesEthereumToken[0].exchange, 'sellList');
// const providerAddress = sellWatchEthereum.destinationAddress;
// const providerPaymentId = sellWatchEthereum.destinationPaymentExtraId;
// const formattedCryptoAmount = `${cryptoAmount} ETH`;
// const formattedFiatAmount = `€${fiatAmount}`;
// const { paymentMethodName } = sellTradeEthereum.trade;

test.describe('Trading - Sell Ethereum', { tag: ['@group=other', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
    });
    test.beforeEach(
        async ({ page, tradingMock, onboardingPage, dashboardPage, settingsPage, walletPage }) => {
            await test.step('Mocking responses', async () => {
                await page.route(invityEndpoint.sellQuotes, async route => {
                    await route.fulfill({ json: sellQuotesEthereumToken });
                });
                await tradingMock.routeTrade(invityEndpoint.sellTrade, sellTradeEthereumToken);
                await page.route(invityEndpoint.sellWatch, async route => {
                    await route.fulfill({ json: sellWatchEthereum });
                });
            });
            await onboardingPage.completeOnboarding();
            await dashboardPage.discoveryShouldFinish();

            await test.step('Enable Ethereum and open its token sell trading', async () => {
                await settingsPage.navigateTo('coins');
                await settingsPage.coins.enableNetwork('eth');
                await dashboardPage.deviceSwitchingOpenButton.click();
                await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
                await walletPage.openSellTradingOfToken('eth', 'USD Coin');
            });
        },
    );

    test('Sell Ethereum', async ({ marketPage }) => {
        await test.step('Fill in a sell request', async () => {
            await marketPage.setYouSellAmount(
                cryptoAmount,
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            );
            await expect(marketPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(marketPage.quoteProvider).toHaveText(capitalizeFirstLetter(provider));
        });

        await test.step('Confirm sell', async () => {
            await marketPage.formSellButton.click();
            await marketPage.sellTermsConfirmButton.click();
        });

        // TODO: Fix the redirection. I need to troubleshoot this with the team.
        // await marketPage.waitForRedirectCompletion();

        // await test.step('Verify all confirmation values', async () => {
        //     await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
        //     await expect(marketPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
        //     await expect(marketPage.confirmationProvider).toHaveText(provider);
        //     await expect(marketPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
        //     await expect(marketPage.confirmationAddress).toHaveText(providerAddress);
        //     await expect(marketPage.confirmationAccount).toHaveText('Bitcoin #1');
        //     await expect(marketPage.confirmationPaymentId).toHaveText(providerPaymentId);
        // });

        // await test.step('Initiate send', async () => {
        //     await marketPage.confirmSend();
        //     await expect(devicePrompt.cryptoAmountOf('amount')).toHaveText(formattedCryptoAmount);
        // });

        // Rest of the flow is not implemented as we don't know how to mock the send request and actually not send the crypto
    });
});
