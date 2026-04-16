import { capitalizeFirstLetter } from '@trezor/utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    invityRequest,
    sellQuotesBTC,
    sellTradeBTC,
    sellWatchBTC,
} from '../../fixtures/invity';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = sellQuotesBTC[0]?.fiatStringAmount ?? '';
const cryptoAmount = sellQuotesBTC[0]?.cryptoStringAmount ?? '';
const provider = getCompanyNameFromList(sellQuotesBTC[0]?.exchange ?? '', 'sellList');
const providerAddress = sellWatchBTC.destinationAddress;
const providerPaymentId = sellWatchBTC.destinationPaymentExtraId;
const formattedCryptoAmount = `${cryptoAmount} BTC`;
const formattedFiatAmount = `€${fiatAmount}`;
const { paymentMethodName } = sellTradeBTC.trade;
const formattedAddress = formatAddressWithNewlines(sellWatchBTC.destinationAddress);

test.describe('Trading - Sell BTC', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(async ({ page, tradingMock, onboardingPage, dashboardPage }) => {
        await test.step('Mocking responses', async () => {
            await page.route(invityEndpoint.sellQuotes, async route => {
                await route.fulfill({ json: sellQuotesBTC });
            });
            await tradingMock.routeTrade(invityEndpoint.sellTrade, sellTradeBTC);
            await page.route(invityEndpoint.sellWatch, async route => {
                await route.fulfill({ json: sellWatchBTC });
            });
            await onboardingPage.completeOnboarding();
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
        });
    });

    test('Sell Bitcoin for best offer', async ({ page, tradingPage, walletPage, devicePrompt }) => {
        await test.step('Open sell form', async () => {
            await walletPage.openTrading();
            await tradingPage.sellTabButton.click();
        });

        await test.step('Fill in a sell request', async () => {
            await tradingPage.fillSellForm({ cryptoAmount });
            await expect(tradingPage.quotes.bestOfferAmount).toHaveText(fiatAmount);
            await expect(tradingPage.quotes.provider).toHaveText(capitalizeFirstLetter(provider));
            await tradingPage.fees.expectBitcoinFeeCalculated();
        });

        await test.step('Confirm sell', async () => {
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.sellTrade);
            await tradingPage.sellBestOfferButton.click();
            await expect.soft(tradeRequestPromise).toHavePayload(invityRequest.sellTradePayload, {
                omit: ['returnUrl', 'trade.orderId', 'trade.paymentId', 'trade.refundAddress'],
            });
        });

        await tradingPage.waitForRedirectCompletion();

        await test.step('Verify all confirmation values', async () => {
            await expect(tradingPage.confirmation.fiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmation.cryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmation.provider).toHaveText(provider);
            await expect(tradingPage.confirmation.paymentMethod).toHaveText(paymentMethodName);
            await expect(tradingPage.confirmation.address).toHaveText(providerAddress);
            await expect(tradingPage.confirmation.account).toHaveText('Bitcoin #1');
            await expect(tradingPage.confirmation.paymentId).toHaveText(providerPaymentId);
        });

        await test.step('Initiate send', async () => {
            await tradingPage.confirmation.initiateSendConfirmation();
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
