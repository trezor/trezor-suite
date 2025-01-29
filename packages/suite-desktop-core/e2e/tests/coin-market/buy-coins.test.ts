import { capitalizeFirstLetter, splitStringEveryNCharacters } from '@trezor/utils';
import { localizeNumber } from '@suite-common/wallet-utils';

import { buyQuotes, buyTrade, invityEndpoint } from '../../fixtures/invity';
import expectedWatchRequestPayload from '../../fixtures/invity/buy/watch-request.json';
import { expect, test } from '../../support/fixtures';

const mockedFiatAmount = buyQuotes[0].fiatStringAmount; // 1234, The mocked quotes are for a fixed input amount
const mockedCryptoAmount = buyQuotes[0].receiveStringAmount;
const mockedProvider = capitalizeFirstLetter(buyQuotes[0].exchange);
const formattedCryptoAmount = `${mockedCryptoAmount} BTC`;
const formattedFiatAmount = `CZK ${localizeNumber(mockedFiatAmount, 'en', 2)}`;
const { receiveAddress } = buyTrade.trade;

// TODO: #16041 Fix the Invity mocking on desktop
test.describe('Coin market buy', { tag: ['@group=other', '@snapshot', '@webOnly'] }, () => {
    test.beforeEach(async ({ marketPage, onboardingPage, dashboardPage, walletPage }) => {
        await marketPage.mockInvity();
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await walletPage.openTrading();
    });

    test('Select compared offers to buy', async ({ marketPage }) => {
        await test.step('Fill input amount and opens offer comparison', async () => {
            await marketPage.setYouPayFiatAmount(mockedFiatAmount);
            await expect(marketPage.bestOfferAmount).toHaveText(formattedCryptoAmount);
            await expect(marketPage.quoteProvider).toHaveText(mockedProvider);
            await expect(marketPage.section).toHaveScreenshot('buy-coins-layout.png');
            await marketPage.compareButton.click();
        });

        await test.step('Check offers and chooses the first one', async () => {
            await expect(marketPage.refreshTime).toHaveText(/Offers refresh in(0:2[5-9]|0:30)/);
            await expect(marketPage.youPayFiatInput).toHaveValue(localizeNumber(mockedFiatAmount));
            await expect(marketPage.paymentMethodDropdown).toHaveText('Credit Card');
            await marketPage.validateBuyQuotes();
            await marketPage.selectThisQuoteButton.first().click();
        });

        await test.step('Confirm trade and verifies confirmation summary', async () => {
            await marketPage.confirmTrade(receiveAddress);
            await expect(marketPage.confirmationAddress).toHaveText(
                splitStringEveryNCharacters(receiveAddress, 4).join(' '),
            );
            await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(marketPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(marketPage.confirmationProvider).toHaveText(mockedProvider);
            await expect(marketPage.confirmationSection).toHaveScreenshot(
                'compared-offers-buy-confirmation.png',
                { mask: [marketPage.confirmOnTrezorButton] },
            );
            await expect(marketPage.confirmTradeButton).toBeEnabled();
        });
    });

    test('Buy crypto from best offer', async ({ page, marketPage }) => {
        await test.step('Request a trade', async () => {
            await marketPage.setYouPayFiatAmount(mockedFiatAmount);
            await marketPage.buyBestOfferButton.click();
            await marketPage.confirmTrade();
        });

        const watchRequestPromise = page.waitForRequest(invityEndpoint.buyWatch);
        await page.clock.install();
        // We bypass the provider part of the flow by having a modified redirect in trade response.
        // This redirect is provided by Invity and normaly leads to provider's page.
        // But our mocked response redirects us to transaction detail where our flow continues.
        await test.step('Confirm the trade and get redirected to transaction detail', async () => {
            await marketPage.finishMockedTrade();
            await expect(watchRequestPromise).toHavePayload(expectedWatchRequestPayload, {
                omit: ['partnerData'],
            });
            await expect(marketPage.transactionDetailStatus).toHaveText(
                'Waiting for your payment...',
            );
            await expect(marketPage.proceedToPayButton).toBeVisible();
        });

        await test.step('Wait 30s for watch refresh and change of status to Approved', async () => {
            await marketPage.changeTransactionWatchResponseTo('SUCCESS');
            await page.clock.fastForward(marketPage.transactionWatchPeriod);
            await expect(watchRequestPromise).toHavePayload(expectedWatchRequestPayload, {
                omit: ['partnerData'],
            });
            await expect(marketPage.transactionDetailStatus).toHaveText('Approved');
            await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(marketPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(marketPage.confirmationProvider).toHaveText(mockedProvider);
            await expect(marketPage.transactionDetail).toHaveScreenshot('transactions-detail.png');
        });
    });
});
