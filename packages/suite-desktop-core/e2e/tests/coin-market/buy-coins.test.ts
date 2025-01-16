import { test, expect } from '../../support/fixtures';
import { invityResponses } from '../../fixtures/invity/index';

const regexpBtcValue = /^\d+(\.\d+)? BTC$/;

test.describe('Coin market buy', { tag: ['@group=other', '@snapshot'] }, () => {
    test.beforeEach(async ({ page, onboardingPage, dashboardPage, walletPage }) => {
        const InvityApiUrlToIntercept = 'https://exchange.trezor.io';
        for (const [path, response] of Object.entries(invityResponses)) {
            await page.route(`${InvityApiUrlToIntercept}/${path}`, async route => {
                await route.fulfill({ json: response });
            });
        }

        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await walletPage.openCoinMarket();
    });

    test('Buy crypto from compared offers', async ({ page, marketPage }) => {
        await test.step('Fill input amount and opens offer comparison', async () => {
            await marketPage.setYouPayAmount('1234');
            await expect(marketPage.section).toHaveScreenshot('buy-coins-layout.png');
            await marketPage.compareButton.click();
        });

        await test.step('Check offers and chooses the first one', async () => {
            // TOOD: #16041 Once solved, add verification of offer compare items
            await page.pause();
            await expect(marketPage.buyOffersPage).toHaveScreenshot('compared-offers.png');
            expect(await marketPage.quotes.count()).toBeGreaterThan(1);
            await marketPage.selectThisQuoteButton.first().click();
        });

        await test.step('Confirm trade and verifies confirmation summary', async () => {
            await marketPage.confirmTrade();
            await expect(marketPage.tradeConfirmation).toHaveScreenshot(
                'compared-offers-buy-confirmation.png',
            );
            // TOOD: #16041 Once solved, Assert mocked price
            await expect(marketPage.tradeConfirmationCryptoAmount).toHaveText(regexpBtcValue);
            await expect(marketPage.tradeConfirmationContinueButton).toBeEnabled();
        });
    });

    test('Buy crypto from best offer', async ({ marketPage }) => {
        await marketPage.setYouPayAmount('1234');
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
