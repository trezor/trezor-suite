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
const fiatAmount = buyQuotesBTC[0]?.fiatStringAmount ?? '';
const bestBuyProvider = capitalizeFirstLetter(buyQuotesBTC[0]?.exchange ?? '');
const bestBuyCryptoAmount = `${buyQuotesBTC[0]?.receiveStringAmount} BTC`;
const formattedFiatWithoutSymbol = localizeNumber(fiatAmount);
const formattedFiatAmount = `CZK ${localizeNumber(fiatAmount, 'en-US', 2)}`;
const { receiveAddress, paymentMethodName } = buyTradeBTC.trade;
// secondOffer via Bank Transfer that matches input criteria has index 5
const updateFiatAmount = buyQuotesBTCUpdate[5]?.fiatStringAmount ?? '';

test.describe('Trading - Buy BTC', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ page, tradingMock, onboardingPage, walletPage }) => {
        await page.route(invityEndpoint.buyQuotes, async route => {
            await route.fulfill({ json: buyQuotesBTC });
        });
        await tradingMock.routeTrade(invityEndpoint.buyTrade, buyTradeBTC);
        await onboardingPage.completeOnboarding();
        await walletPage.openTrading();
    });

    test('Buy Bitcoin from compared offer', async ({ page, tradingPage }) => {
        await test.step('Fill input amount and opens offer comparison', async () => {
            await tradingPage.fillBuyForm({
                amount: fiatAmount,
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'btc');
                },
            });
            await expect(tradingPage.quotes.bestOfferAmount).toHaveText(bestBuyCryptoAmount);
            await expect(tradingPage.quotes.provider).toHaveText(bestBuyProvider);
            await tradingPage.quotes.selectedProvider.click();
        });

        await test.step('Check compared offers', async () => {
            await expect(tradingPage.inputs.fiatAmount).toHaveValue(formattedFiatWithoutSymbol);
            await expect(tradingPage.quotes.refreshTime).toHaveText(
                /Offers refresh in(0:2[5-9]|0:30)/,
            );
            await expect(tradingPage.inputs.fiatAmount).toHaveValue(localizeNumber(fiatAmount));
            await expect(tradingPage.inputs.paymentMethodSelect).toHaveValue(paymentMethodName);
            await tradingPage.quotes.validateBuyQuotes(
                buyQuotesBTC,
                tradingPage.inputs.getSelectedPaymentMethod,
            );
        });

        await test.step('Change payment method to Bank Transfer', async () => {
            await tradingPage.inputs.selectPaymentMethod('bankTransfer');
            await tradingPage.quotes.validateBuyQuotes(
                buyQuotesBTC,
                tradingPage.inputs.getSelectedPaymentMethod,
            );
        });

        await test.step('Change fiat input to trigger offer update', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesBTCUpdate });
            });
            const quoteRequestPromise = page.waitForRequest(invityEndpoint.buyQuotes);
            await tradingPage.inputs.fiatAmount.fill(updateFiatAmount);
            await quoteRequestPromise;
            await tradingPage.quotes.validateBuyQuotes(
                buyQuotesBTCUpdate,
                tradingPage.inputs.getSelectedPaymentMethod,
            );
        });

        await test.step('Select second offer', async () => {
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.buyTrade);
            await tradingPage.quotes.selectButton.nth(1).click();
            await tradingPage.buyBestOfferButton.click();
            await expect(tradeRequestPromise).toHavePayload(
                { trade: { ...buyQuotesBTCUpdate[5], receiveAddress } },
                { omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'] },
            );
        });
    });

    test('Buy Bitcoin from best offer', async ({ page, tradingPage, tradingMock }) => {
        await test.step('Request a trade', async () => {
            await tradingPage.fillBuyForm({
                amount: fiatAmount,
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'btc');
                },
            });
        });

        await page.clock.install();

        await test.step('Confirm the trade and get redirected to transaction detail', async () => {
            await tradingMock.changeBuyWatchResponseTo('SUBMITTED');
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.buyTrade);
            const watchRequestPromise = page.waitForRequest(invityEndpoint.buyWatch);

            await tradingPage.buyBestOfferButton.click();

            await expect.soft(tradeRequestPromise).toHavePayload(invityRequest.buyTradeBTCPayload, {
                omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'],
            });
            await expect.soft(watchRequestPromise).toHavePayload(invityRequest.buyWatchPayload, {
                omit: ['partnerData', 'orderId', 'paymentId'],
            });
            await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                'TR_BUY_DETAIL_WAITING_FOR_USER_TITLE',
            );
            await expect(tradingPage.proceedToPayButton).toBeVisible();
        });

        await test.step('Wait 30s for watch refresh and status change to Approved', async () => {
            await tradingMock.changeBuyWatchResponseTo('SUCCESS');
            await page.clock.fastForward(tradingMock.watchPeriod);
            await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                'TR_BUY_DETAIL_SUCCESS_TITLE',
            );
            await expect(tradingPage.confirmation.fiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmation.cryptoAmount).toHaveText(bestBuyCryptoAmount);
            await expect(tradingPage.confirmation.provider).toHaveText(bestBuyProvider);
        });

        await test.step('Return to account buy form', async () => {
            await tradingPage.backToAccountButton('Buy').click();
            await expect(page).toHaveURL(/\/accounts\/coinmarket\/buy$/);
        });
    });
});
