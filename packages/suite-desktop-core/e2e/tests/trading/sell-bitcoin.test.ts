import { capitalizeFirstLetter } from '@trezor/utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    invityRequest,
    sellQuotesBTC,
    sellTradeBTC,
    sellWatchBTC,
} from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = sellQuotesBTC[0].fiatStringAmount;
const cryptoAmount = sellQuotesBTC[0].cryptoStringAmount;
const provider = getCompanyNameFromList(sellQuotesBTC[0].exchange, 'sellList');
const providerAddress = sellWatchBTC.destinationAddress;
const providerPaymentId = sellWatchBTC.destinationPaymentExtraId;
const formattedCryptoAmount = `${cryptoAmount} BTC`;
const formattedFiatAmount = `€${fiatAmount}`;
const { paymentMethodName } = sellTradeBTC.trade;

test.describe('Trading - Sell BTC', { tag: ['@group=other', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
    });
    test.beforeEach(
        async ({ page, marketPage, tradingMock, onboardingPage, dashboardPage, walletPage }) => {
            await test.step('Mocking responses', async () => {
                await page.route(invityEndpoint.sellQuotes, async route => {
                    await route.fulfill({ json: sellQuotesBTC });
                });
                await tradingMock.routeTrade(invityEndpoint.sellTrade, sellTradeBTC);
                await page.route(invityEndpoint.sellWatch, async route => {
                    await route.fulfill({ json: sellWatchBTC });
                });
            });
            await onboardingPage.completeOnboarding();
            await dashboardPage.discoveryShouldFinish();
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openTrading();
            await marketPage.sellTabButton.click();
        },
    );

    test('Sell Bitcoin for best offer', async ({ page, marketPage, devicePrompt }) => {
        await test.step('Fill in a sell request', async () => {
            await marketPage.setYouSellAmount(cryptoAmount);
            await expect(marketPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(marketPage.quoteProvider).toHaveText(capitalizeFirstLetter(provider));
        });

        await test.step('Confirm sell', async () => {
            await marketPage.formSellButton.click();
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.sellTrade);
            await marketPage.sellTermsConfirmButton.click();
            await expect(tradeRequestPromise).toHavePayload(invityRequest.sellTradePayload, {
                omit: ['returnUrl', 'trade.orderId', 'trade.paymentId', 'trade.refundAddress'],
            });
        });

        await marketPage.waitForRedirectCompletion();

        await test.step('Verify all confirmation values', async () => {
            await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(marketPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(marketPage.confirmationProvider).toHaveText(provider);
            await expect(marketPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
            await expect(marketPage.confirmationAddress).toHaveText(providerAddress);
            await expect(marketPage.confirmationAccount).toHaveText('Bitcoin #1');
            await expect(marketPage.confirmationPaymentId).toHaveText(providerPaymentId);
        });

        await test.step('Initiate send', async () => {
            await marketPage.initiateSendConfirmation();
            await expect(devicePrompt.cryptoAmountOf('amount')).toHaveText(formattedCryptoAmount);
        });

        // Rest of the flow is not implemented as we don't know how to mock the send request and actually not send the crypto
    });
});
