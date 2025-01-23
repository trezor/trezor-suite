import { test, expect } from '../../support/fixtures';
import expectedWatchRequestPayload from '../../fixtures/invity/buy/watch-request.json';
import { invityEndpoint, buyQuotes } from '../../fixtures/invity';

const mockedInputAmount = buyQuotes[0].fiatStringAmount; // 1234, The mocked quotes are for a fixed input amount

// TODO: #16041 Fix the Invity mocking on desktop
test.describe('Coin market buy', { tag: ['@group=other', '@snapshot', '@webOnly'] }, () => {
    test.beforeEach(async ({ marketPage, onboardingPage, dashboardPage, walletPage }) => {
        await marketPage.mockInvity();
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await walletPage.openCoinMarket();
    });

    test('Select compared offers to buy', async ({ marketPage }) => {
        await test.step('Fill input amount and opens offer comparison', async () => {
            await marketPage.setYouPayAmount(mockedInputAmount);
            await expect(marketPage.section).toHaveScreenshot('buy-coins-layout.png');
            await marketPage.compareButton.click();
        });

        await test.step('Check offers and chooses the first one', async () => {
            await marketPage.validateBuyQuotes();
            await marketPage.selectThisQuoteButton.first().click();
        });

        await test.step('Confirm trade and verifies confirmation summary', async () => {
            await marketPage.confirmTrade();
            await expect(marketPage.confirmationSection).toHaveScreenshot(
                'compared-offers-buy-confirmation.png',
                { mask: [marketPage.confirmOnTrezorButton] },
            );
            await expect(marketPage.confirmTradeButton).toBeEnabled();
        });
    });

    test('Buy crypto from best offer', async ({ page, marketPage }) => {
        await test.step('Request a trade', async () => {
            await marketPage.setYouPayAmount(mockedInputAmount);
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
            await expect(marketPage.transactionDetail).toHaveScreenshot('transactions-detail.png');
        });
    });
});
