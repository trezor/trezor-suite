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
// const formattedAddress = formatAddress(sellWatchEthereum.destinationAddress);

test.describe('Trading - Sell Ethereum', { tag: ['@group=other', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
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
                await settingsPage.coins.activateCoinsButton.click();
                await dashboardPage.discoveryShouldFinish();
                await dashboardPage.deviceSwitchingOpenButton.click();
                await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
                await walletPage.openSellTradingOfToken('eth', 'USD Coin');
            });
        },
    );

    test('Sell Ethereum token USDC', async ({ tradingPage }) => {
        await test.step('Fill in a sell request', async () => {
            await tradingPage.setYouSellAmount(
                cryptoAmount,
                'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            );
            await expect(tradingPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(tradingPage.quoteProvider).toHaveText(capitalizeFirstLetter(provider));
        });

        await test.step('Confirm sell', async () => {
            await tradingPage.sellBestOfferButton.click();
            await tradingPage.termsConfirmButton.click();
        });

        // TODO: Fix the redirection. I need to troubleshoot this with the team.
        // await tradingPage.waitForRedirectCompletion();

        // await test.step('Verify all confirmation values', async () => {
        //     await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
        //     await expect(tradingPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
        //     await expect(tradingPage.confirmationProvider).toHaveText(provider);
        //     await expect(tradingPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
        //     await expect(tradingPage.confirmationAddress).toHaveText(providerAddress);
        //     await expect(tradingPage.confirmationAccount).toHaveText('Bitcoin #1');
        //     await expect(tradingPage.confirmationPaymentId).toHaveText(providerPaymentId);
        // });

        // await test.step('Initiate send', async () => {
        //     await tradingPage.confirmSend();
        //     await expect(devicePrompt.headerParagraph).toContainText('Ethereum #1');
        //     await expect(devicePrompt.outputValueOf('address')).toHaveText(formattedAddress);
        //     await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
        //         formattedCryptoAmount,
        //     );
        //     await expect(devicePrompt.cryptoAmountOf('fee')).toHaveTextGreaterThan(0);
        // });

        // Rest of the flow is not implemented as we don't know how to mock the send request and actually not send the crypto
    });
});
