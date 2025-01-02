import { test, expect } from '../../support/fixtures';

const regexpBtcValue = /^\d+(\.\d+)? BTC$/;

test.describe('Coin market buy', { tag: ['@group=other'] }, () => {
    test.use({ emulatorStartConf: { wipe: true } });
    test.beforeEach(async ({ onboardingPage, dashboardPage, walletPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await walletPage.openCoinMarket();
    });

    // TOOD: #16041 Once solved, fix and uncomment, invity calls are not stable on CI
    test.skip('Buy crypto from compared offers', async ({ marketPage }) => {
        await test.step('Fill input amount and opens offer comparison', async () => {
            await marketPage.setYouPayAmount('1234');
            await expect(marketPage.layout).toHaveScreenshot('buy-coins-layout.png', {
                mask: [marketPage.bestOfferYouGet, marketPage.bestOfferProvider],
            });
            await marketPage.compareButton.click();
        });

        await test.step('Check offers and chooses the first one', async () => {
            // TOOD: #16041 Once solved, add verification of offer compare items
            await expect(marketPage.buyOffersPage).toBeVisible();
            expect(await marketPage.quotes.count()).toBeGreaterThan(1);
            await marketPage.selectThisQuoteButton.first().click();
        });

        await test.step('Confirm trade and verifies confirmation summary', async () => {
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
            // TOOD: #16041 Once solved, Assert mocked price
            await expect(marketPage.tradeConfirmationCryptoAmount).toHaveText(regexpBtcValue);
            await expect(marketPage.tradeConfirmationContinueButton).toBeEnabled();
        });
    });

    // TOOD: #16041 Once solved, fix and uncomment, invity calls are not stable on CI
    test.skip('Buy crypto from best offer', async ({ marketPage }) => {
        await marketPage.setYouPayAmount('1234');
        const { amount, provider } = await marketPage.readBestOfferValues();
        await marketPage.buyBestOfferButton.click();
        await marketPage.confirmTrade();
        await expect(marketPage.tradeConfirmation).toHaveScreenshot(
            'best-offer-buy-confirmation.png',
            {
                mask: [
                    marketPage.tradeConfirmationCryptoAmount,
                    marketPage.tradeConfirmationProvider,
                ],
            },
        );
        await expect(marketPage.tradeConfirmationCryptoAmount).toHaveText(amount);
        await expect(marketPage.tradeConfirmationProvider).toHaveText(provider);
        await expect(marketPage.tradeConfirmationContinueButton).toBeEnabled();
    });
});
