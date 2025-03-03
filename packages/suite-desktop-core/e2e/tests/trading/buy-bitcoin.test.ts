import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import { buyQuotesBTC, buyTradeBTC, invityEndpoint, invityRequest } from '../../fixtures/invity';
import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = buyQuotesBTC[0].fiatStringAmount;
const bestBuyProvider = capitalizeFirstLetter(buyQuotesBTC[0].exchange);
const bestBuyCryptoAmount = `${buyQuotesBTC[0].receiveStringAmount} BTC`;
// secondOffer that matches input criteria has index 5
const secondOfferProvider = capitalizeFirstLetter(buyQuotesBTC[5].exchange);
const secondOfferCryptoAmount = `${buyQuotesBTC[5].receiveStringAmount} BTC`;
const formattedFiatAmount = `CZK ${localizeNumber(fiatAmount, 'en', 2)}`;
const { receiveAddress, paymentMethodName } = buyTradeBTC.trade;

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

    test('Buy Bitcoin from compared offer', async ({ tradingPage }) => {
        await test.step('Fill input amount and opens offer comparison', async () => {
            await tradingPage.setYouBuyAmount(fiatAmount);
            await expect(tradingPage.bestOfferAmount).toHaveText(bestBuyCryptoAmount);
            await expect(tradingPage.quoteProvider).toHaveText(bestBuyProvider);
            await tradingPage.compareButton.click();
        });

        await test.step('Check offers and chooses the second one', async () => {
            await expect(tradingPage.refreshTime).toHaveText(/Offers refresh in(0:2[5-9]|0:30)/);
            await expect(tradingPage.youPayFiatInput).toHaveValue(localizeNumber(fiatAmount));
            await expect(tradingPage.paymentMethodDropdown).toHaveText(paymentMethodName);
            await tradingPage.validateBuyQuotes();
            await tradingPage.selectThisQuoteButton.nth(1).click();
        });

        await test.step('Confirm trade and verifies confirmation summary', async () => {
            await tradingPage.confirmTrade('Bitcoin #1', formatAddress(receiveAddress));
            await expect(tradingPage.confirmationAddress).toHaveText(receiveAddress);
            await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmationCryptoAmount).toHaveText(secondOfferCryptoAmount);
            await expect(tradingPage.confirmationProvider).toHaveText(secondOfferProvider);
            await expect(tradingPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
            await expect(tradingPage.finishTransactionButton).toBeEnabled();
        });
    });

    test('Buy Bitcoin from best offer', async ({ page, tradingPage, tradingMock }) => {
        await test.step('Request a trade', async () => {
            await tradingPage.setYouBuyAmount(fiatAmount);
            await tradingPage.buyBestOfferButton.click();
            await tradingPage.confirmTrade('Bitcoin #1', formatAddress(receiveAddress));
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
