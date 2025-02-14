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
    test.beforeEach(async ({ page, marketPage, onboardingPage, dashboardPage, walletPage }) => {
        await marketPage.mockInvity();
        await marketPage.mockInvityTrade(buyTradeBTC, invityEndpoint.buyTrade);
        await page.route(invityEndpoint.buyQuotes, async route => {
            await route.fulfill({ json: buyQuotesBTC });
        });
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await walletPage.openTrading();
    });

    test('Select compared offers to buy', async ({ marketPage }) => {
        await test.step('Fill input amount and opens offer comparison', async () => {
            await marketPage.setYouPayAmount(fiatAmount);
            await expect(marketPage.bestOfferAmount).toHaveText(bestBuyCryptoAmount);
            await expect(marketPage.quoteProvider).toHaveText(bestBuyProvider);
            await marketPage.compareButton.click();
        });

        await test.step('Check offers and chooses the second one', async () => {
            await expect(marketPage.refreshTime).toHaveText(/Offers refresh in(0:2[5-9]|0:30)/);
            await expect(marketPage.youPayFiatInput).toHaveValue(localizeNumber(fiatAmount));
            await expect(marketPage.paymentMethodDropdown).toHaveText(paymentMethodName);
            await marketPage.validateBuyQuotes();
            await marketPage.selectThisQuoteButton.nth(1).click();
        });

        await test.step('Confirm trade and verifies confirmation summary', async () => {
            await marketPage.confirmTrade(formatAddress(receiveAddress));
            await expect(marketPage.confirmationAddress).toHaveText(receiveAddress);
            await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(marketPage.confirmationCryptoAmount).toHaveText(secondOfferCryptoAmount);
            await expect(marketPage.confirmationProvider).toHaveText(secondOfferProvider);
            await expect(marketPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
            await expect(marketPage.confirmTradeButton).toBeEnabled();
        });
    });

    test('Buy crypto from best offer', async ({ page, marketPage }) => {
        await test.step('Request a trade', async () => {
            await marketPage.setYouPayAmount(fiatAmount);
            await marketPage.buyBestOfferButton.click();
            await marketPage.confirmTrade();
        });

        await page.clock.install();

        await test.step('Confirm the trade and get redirected to transaction detail', async () => {
            await marketPage.changeBuyWatchResponseTo('SUBMITTED');
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.buyTrade);
            const watchRequestPromise = page.waitForRequest(invityEndpoint.buyWatch);
            await marketPage.confirmTradeButton.click();
            await expect(tradeRequestPromise).toHavePayload(invityRequest.buyTradeBTCPayload, {
                omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'],
            });
            await expect(watchRequestPromise).toHavePayload(invityRequest.buyWatchPayload, {
                omit: ['partnerData', 'orderId', 'paymentId'],
            });
            await expect(marketPage.transactionDetailStatus).toHaveText(
                'Waiting for your payment...',
            );
            await expect(marketPage.proceedToPayButton).toBeVisible();
        });

        await test.step('Wait 30s for watch refresh and change of status to Approved', async () => {
            await marketPage.changeBuyWatchResponseTo('SUCCESS');
            await page.clock.fastForward(marketPage.watchPeriod);
            await expect(marketPage.transactionDetailStatus).toHaveText('Approved');
            await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(marketPage.confirmationCryptoAmount).toHaveText(bestBuyCryptoAmount);
            await expect(marketPage.confirmationProvider).toHaveText(bestBuyProvider);
        });
    });
});
