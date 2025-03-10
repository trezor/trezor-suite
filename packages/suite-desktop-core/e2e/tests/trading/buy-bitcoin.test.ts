import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import {
    buyQuotesBTC,
    buyQuotesBTCUpdate,
    buyTradeBTC,
    invityEndpoint,
    invityRequest,
} from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = buyQuotesBTC[0].fiatStringAmount;
const bestBuyProvider = capitalizeFirstLetter(buyQuotesBTC[0].exchange);
const bestBuyCryptoAmount = `${buyQuotesBTC[0].receiveStringAmount} BTC`;
const formattedFiatWithoutSymbol = localizeNumber(fiatAmount);
const formattedFiatAmount = `CZK ${localizeNumber(fiatAmount, 'en', 2)}`;
const { receiveAddress, paymentMethodName } = buyTradeBTC.trade;
// secondOffer that matches input criteria has index 11
const updateFiatAmount = buyQuotesBTCUpdate[11].fiatStringAmount;
const secondOfferProvider = capitalizeFirstLetter(buyQuotesBTCUpdate[11].exchange);
const secondOfferCryptoAmount = `${buyQuotesBTCUpdate[11].receiveStringAmount} BTC`;
const formattedUpdateFiatAmount = `CZK ${localizeNumber(updateFiatAmount, 'en', 2)}`;

test.describe('Trading - Buy BTC', { tag: ['@group=other', '@webOnly'] }, () => {
    test.beforeEach(async ({ page, tradingMock, onboardingPage, dashboardPage, walletPage }) => {
        await page.route(invityEndpoint.buyQuotes, async route => {
            await route.fulfill({ json: buyQuotesBTC });
        });
        await tradingMock.routeTrade(invityEndpoint.buyTrade, buyTradeBTC);
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await walletPage.openTrading();
    });

    test('Buy Bitcoin from compared offer', async ({ page, tradingPage }) => {
        await test.step('Fill input amount and opens offer comparison', async () => {
            await tradingPage.fillBuyForm(fiatAmount);
            await expect(tradingPage.bestOfferAmount).toHaveText(bestBuyCryptoAmount);
            await expect(tradingPage.quoteProvider).toHaveText(bestBuyProvider);
            await tradingPage.compareButton.click();
        });

        await test.step('Check compared offers', async () => {
            await expect(tradingPage.youPayFiatInput).toHaveValue(formattedFiatWithoutSymbol);
            await expect(tradingPage.refreshTime).toHaveText(/Offers refresh in(0:2[5-9]|0:30)/);
            await expect(tradingPage.youPayFiatInput).toHaveValue(localizeNumber(fiatAmount));
            await expect(tradingPage.paymentMethodDropdown).toHaveText(paymentMethodName);
            await tradingPage.validateBuyQuotes(buyQuotesBTC);
        });

        await test.step('Change fiat input to trigger offer update', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesBTCUpdate });
            });
            const quoteRequestPromise = page.waitForRequest(invityEndpoint.buyQuotes);
            await tradingPage.youPayFiatInput.fill(updateFiatAmount);
            await quoteRequestPromise;
            await tradingPage.validateBuyQuotes(buyQuotesBTCUpdate);
        });

        await test.step('Select second offer', async () => {
            await tradingPage.selectThisQuoteButton.nth(1).click();
        });

        await test.step('Confirm trade and verifies confirmation summary', async () => {
            await tradingPage.confirmTrade('Bitcoin #1', receiveAddress);
            await expect(tradingPage.confirmationAddress).toHaveText(receiveAddress);
            await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedUpdateFiatAmount);
            await expect(tradingPage.confirmationCryptoAmount).toHaveText(secondOfferCryptoAmount);
            await expect(tradingPage.confirmationProvider).toHaveText(secondOfferProvider);
            await expect(tradingPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
            await expect(tradingPage.finishTransactionButton).toBeEnabled();
        });
    });

    test('Buy Bitcoin from best offer', async ({ page, tradingPage, tradingMock }) => {
        await test.step('Request a trade', async () => {
            await tradingPage.fillBuyForm(fiatAmount);
            await tradingPage.buyBestOfferButton.click();
            await tradingPage.confirmTrade('Bitcoin #1', receiveAddress);
        });

        await page.clock.install();

        await test.step('Confirm the trade and get redirected to transaction detail', async () => {
            await tradingMock.changeBuyWatchResponseTo('SUBMITTED');
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.buyTrade);
            const watchRequestPromise = page.waitForRequest(invityEndpoint.buyWatch);
            await tradingPage.finishTransactionButton.click();
            await expect(tradeRequestPromise).toHavePayload(invityRequest.buyTradeBTCPayload, {
                omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'],
            });
            await expect(watchRequestPromise).toHavePayload(invityRequest.buyWatchPayload, {
                omit: ['partnerData', 'orderId', 'paymentId'],
            });
            await expect(tradingPage.transactionDetailStatus).toHaveText(
                'Waiting for your payment...',
            );
            await expect(tradingPage.proceedToPayButton).toBeVisible();
        });

        await test.step('Wait 30s for watch refresh and status change to Approved', async () => {
            await tradingMock.changeBuyWatchResponseTo('SUCCESS');
            await page.clock.fastForward(tradingMock.watchPeriod);
            await expect(tradingPage.transactionDetailStatus).toHaveText('Approved');
            await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmationCryptoAmount).toHaveText(bestBuyCryptoAmount);
            await expect(tradingPage.confirmationProvider).toHaveText(bestBuyProvider);
        });

        await test.step('Return to account buy form', async () => {
            await tradingPage.backToAccountButton.click();
            await expect(page).toHaveURL(/\/accounts\/coinmarket\/buy#\/btc\/0\/normal$/);
        });
    });
});
