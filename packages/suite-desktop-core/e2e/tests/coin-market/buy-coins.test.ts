import { test, expect } from '../../support/fixtures';
import buyQuotes from '../../fixtures/invity/buy/quotes.json';

const mockedInputAmount = buyQuotes[0].fiatStringAmount; // 1234, The mocked quotes are for a fixed input amount

// TODO: #16041 Fix the Invity mocking on desktop
test.describe('Coin market buy', { tag: ['@group=other', '@snapshot', '@webOnly'] }, () => {
    test.beforeEach(async ({ marketPage, onboardingPage, dashboardPage, walletPage }) => {
        await marketPage.mockInvity();
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await walletPage.openCoinMarket();
    });

    test('Buy crypto from compared offers', async ({ marketPage }) => {
        await test.step('Fill input amount and opens offer comparison', async () => {
            await marketPage.setYouPayAmount(mockedInputAmount);
            await expect(marketPage.section).toHaveScreenshot('buy-coins-layout.png');
            await marketPage.compareButton.click();
        });

        await test.step('Check offers and chooses the first one', async () => {
            await expect(marketPage.buyOffersPage).toHaveScreenshot('compared-offers-buy.png', {
                mask: [marketPage.refreshTime],
            });
            await marketPage.validateBuyQuotes();
            await marketPage.selectThisQuoteButton.first().click();
        });

        await test.step('Confirm trade and verifies confirmation summary', async () => {
            await marketPage.confirmTrade();
            await expect(marketPage.tradeConfirmation).toHaveScreenshot(
                'compared-offers-buy-confirmation.png',
            );
            await expect(marketPage.tradeConfirmationContinueButton).toBeEnabled();
        });
    });

    test('Buy crypto from best offer', async ({ marketPage }) => {
        await marketPage.setYouPayAmount(mockedInputAmount);
        const { amount, provider } = await marketPage.readBestOfferValues();
        await marketPage.buyBestOfferButton.click();
        await marketPage.confirmTrade();
        await expect(marketPage.tradeConfirmation).toHaveScreenshot(
            'best-offer-buy-confirmation.png',
        );
        await expect(marketPage.tradeConfirmationCryptoAmount).toHaveText(amount);
        await expect(marketPage.tradeConfirmationProvider).toHaveText(provider);
        await expect(marketPage.tradeConfirmationContinueButton).toBeEnabled();
    });
});
