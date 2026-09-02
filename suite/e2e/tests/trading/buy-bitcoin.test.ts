import { localizeNumber } from '@suite-common/wallet-utils';
import { TestStream } from '@trezor/e2e-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import {
    buyQuotesBTC,
    buyTradeBTC,
    getCompanyNameFromList,
    tradeApiRequest,
    tradeEndpoint,
} from '../../fixtures/trading';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

// Expected values based on our mocked responses
const fiatAmount = buyQuotesBTC[0]?.fiatStringAmount ?? '';
const bestBuyProvider = capitalizeFirstLetter(buyQuotesBTC[0]?.exchange ?? '');
const bestBuyProviderCompanyName = getCompanyNameFromList(
    buyQuotesBTC[0]?.exchange ?? '',
    'buyList',
);
const bestBuyCryptoAmount = `${buyQuotesBTC[0]?.receiveStringAmount} BTC`;
const formattedFiatAmount = `CZK ${localizeNumber(fiatAmount, 'en-US', 2)}`;
const { receiveAddress } = buyTradeBTC.trade;
const secondOfferQuote = buyQuotesBTC[5];

test.describe('Trading - Buy BTC', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ page, tradingMock, onboardingPage, walletPage, settingsPage }) => {
        await page.route(tradeEndpoint.buyQuotes, async route => {
            await route.fulfill({ json: buyQuotesBTC });
        });
        await tradingMock.routeTrade(tradeEndpoint.buyTrade, buyTradeBTC);
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await walletPage.openTrading();
    });

    test(
        'Buy Bitcoin from compared offer',
        { annotation: createTestAnnotation({ stream: TestStream.Trade }) },
        async ({ page, tradingPage }) => {
            await test.step('Fill input amount and opens offer comparison modal', async () => {
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

            await test.step('Select second offer from modal and continue to preview', async () => {
                await tradingPage.quotes.selectQuoteByProvider(
                    capitalizeFirstLetter(secondOfferQuote?.exchange ?? ''),
                );
                await tradingPage.buyBestOfferButton.click();
            });

            await test.step('Confirm the compared offer from the preview', async () => {
                const tradeRequestPromise = page.waitForRequest(tradeEndpoint.buyTrade);
                await tradingPage.confirmation.buyButton.click();
                await expect(tradeRequestPromise).toHavePayload(
                    { trade: { ...secondOfferQuote, receiveAddress } },
                    { omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'] },
                );
            });
        },
    );

    test(
        'Buy Bitcoin from best offer',
        { annotation: createTestAnnotation({ stream: TestStream.Trade }) },
        async ({ page, tradingPage, tradingMock }) => {
            await test.step('Request a trade', async () => {
                await tradingPage.fillBuyForm({
                    amount: fiatAmount,
                    selectReceiveAddress: async () => {
                        await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'btc');
                    },
                });
            });

            await test.step('Form CTA shows Continue', async () => {
                await expect(tradingPage.buyBestOfferButton).toHaveTranslation('TR_CONTINUE');
            });

            await test.step('Continue to the preview showing provider name and KYC warning', async () => {
                await tradingPage.buyBestOfferButton.click();
                await expect(tradingPage.confirmation.buyButton).toHaveTranslation(
                    'TR_TRADING_BUY_VIA',
                    {
                        values: { providerName: bestBuyProviderCompanyName },
                    },
                );
                await expect(tradingPage.confirmation.buyButton.locator('svg')).toBeVisible();
                await expect(tradingPage.kycWarning).toBeVisible();

                await expect(tradingPage.confirmation.fiatAmount).toHaveText(formattedFiatAmount);
                await expect(tradingPage.confirmation.cryptoAmount).toHaveText(bestBuyCryptoAmount);
                await expect(tradingPage.confirmation.provider).toHaveText(bestBuyProvider);
            });

            await page.clock.install();

            await test.step('Confirm the trade and get redirected to transaction detail', async () => {
                await tradingMock.changeBuyWatchResponseTo('SUBMITTED');
                const tradeRequestPromise = page.waitForRequest(tradeEndpoint.buyTrade);
                const watchRequestPromise = page.waitForRequest(tradeEndpoint.buyWatch);

                await tradingPage.confirmation.buyButton.click();

                await expect
                    .soft(tradeRequestPromise)
                    .toHavePayload(tradeApiRequest.buyTradeBTCPayload, {
                        omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'],
                    });
                await expect
                    .soft(watchRequestPromise)
                    .toHavePayload(tradeApiRequest.buyWatchPayload, {
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
        },
    );
});
