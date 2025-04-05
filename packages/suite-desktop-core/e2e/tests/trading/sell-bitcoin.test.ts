import { capitalizeFirstLetter } from '@trezor/utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    invityRequest,
    sellQuotesBTC,
    sellTradeBTC,
    sellWatchBTC,
} from '../../fixtures/invity';
import { formatAddress } from '../../support/common';
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
const formattedAddress = formatAddress(sellWatchBTC.destinationAddress);

test.describe('Trading - Sell BTC', { tag: ['@group=other', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(
        async ({ page, tradingPage, tradingMock, onboardingPage, dashboardPage, walletPage }) => {
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
            await tradingPage.sellTabButton.click();
        },
    );

    test('Sell Bitcoin for best offer', async ({ page, tradingPage, devicePrompt }) => {
        await test.step('Fill in a sell request', async () => {
            await tradingPage.fillSellForm(cryptoAmount);
            await expect(tradingPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(tradingPage.quoteProvider).toHaveText(capitalizeFirstLetter(provider));
        });

        await test.step('Confirm sell', async () => {
            await tradingPage.sellBestOfferButton.click();
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.sellTrade);
            await tradingPage.termsConfirmButton.click();
            await expect(tradeRequestPromise).toHavePayload(invityRequest.sellTradePayload, {
                omit: ['returnUrl', 'trade.orderId', 'trade.paymentId', 'trade.refundAddress'],
            });
        });

        await tradingPage.waitForRedirectCompletion();

        await test.step('Verify all confirmation values', async () => {
            await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmationProvider).toHaveText(provider);
            await expect(tradingPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
            await expect(tradingPage.confirmationAddress).toHaveText(providerAddress);
            await expect(tradingPage.confirmationAccount).toHaveText('Bitcoin #1');
            await expect(tradingPage.confirmationPaymentId).toHaveText(providerPaymentId);
        });

        await test.step('Initiate send', async () => {
            await tradingPage.initiateSendConfirmation();
            await expect(devicePrompt.headerParagraph).toContainText('Bitcoin #1');
            await expect(devicePrompt.outputValueOf('address')).toHaveText(formattedAddress);
            await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                formattedCryptoAmount,
            );
            await expect(devicePrompt.cryptoAmountOf('fee')).toHaveTextGreaterThan(0);
        });

        // Rest of the flow is not implemented as we don't know how to mock the send request and actually not send the crypto
    });
});
