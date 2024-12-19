import { test, expect } from '../../support/fixtures';

const regexpBtcValue = /^\d+(\.\d+)? BTC$/;

test.describe('Coin market buy', { tag: ['@group=settings'] }, () => {
    test.use({ emulatorStartConf: { wipe: true } });
    test.beforeEach(async ({ onboardingPage, dashboardPage, marketPage }) => {
        // TOOD: #16041 Fix invity mocked data
        // await marketPage.interceptInvity();
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await marketPage.openCoinMarket();
    });

    test('Buy crypto from compared offers', async ({ marketPage }) => {
        await marketPage.waitForOffers();
        await expect(marketPage.layout).toHaveScreenshot('buy-coins-layout.png', {
            mask: [marketPage.bestOfferAmount, marketPage.bestOfferProvider],
        });
        await marketPage.setYouPayAmount('500');
        await marketPage.compareButton.click();

        // TOOD: #16041 Uncommented assert once invity mock is fixed. This verify offers against our mocked data
        // const expectedQuotes = buyQuotesFixture.filter(
        //     quote => quote.paymentMethod === 'bankTransfer',
        // );
        // for (const expectedQuote of expectedQuotes) {
        //     const quote = await marketPage.findQuoteRow(expectedQuote.exchange);
        //     await expect(quote.locator(marketPage.quoteAmount)).toHaveText(
        //         expectedQuote.receiveStringAmount,
        //     );
        // }
        // expect(
        //     await marketPage.quotes.all(),
        //     'number of displayed quotes should match the number quotes provided by the fixture',
        // ).toHaveLength(expectedQuotes.length);

        // await marketPage.selectQuote(providerToBuy);
        await marketPage.selectThisQuoteButton.first().click();
        await marketPage.confirmTrade();
        await expect(marketPage.tradeConfirmation).toHaveScreenshot(
            'compared-offers-buy-confirmation.png',
            {
                mask: [
                    marketPage.tradeConfirmationCryptoAmount,
                    marketPage.tradeConfirmationProvider,
                ],
            },
        );
        // TOOD: #16041 Replace with the commented assert once mock is fixed
        await expect(marketPage.tradeConfirmationCryptoAmount).toHaveText(regexpBtcValue);
    });

    test('Buy crypto from best offer', async ({ marketPage }) => {
        await marketPage.waitForOffers();
        await marketPage.setYouPayAmount('500');
        const amount = await marketPage.bestOfferAmount.textContent();
        const provider = await marketPage.bestOfferProvider.textContent();
        if (!amount || !provider) {
            throw new Error(
                `Test was not able to extract amount or provider from the page. Amount: ${amount}, Provider: ${provider}`,
            );
        }
        await marketPage.buyBestOfferButton.click();
        await marketPage.confirmTrade();
        await expect(marketPage.tradeConfirmation).toHaveScreenshot(
            'best-offer-buy-confirmation.png',
            {
                mask: [marketPage.tradeConfirmationCryptoAmount],
            },
        );
        await expect(marketPage.tradeConfirmationCryptoAmount).toHaveText(amount);
        await expect(marketPage.tradeConfirmationProvider).toHaveText(provider);
    });
});
