import { buyQuotesNegativeMax, buyQuotesNegativeMin, invityEndpoint } from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

test.describe('Trading - Buy Negative scenarios', { tag: ['@group=trading', '@webOnly'] }, () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('Buy form handles input limits and empty quotes', async ({
        page,
        walletPage,
        tradingPage,
    }) => {
        await walletPage.openTradingGlobalButton.click();
        // waits for trading form to load
        await expect(tradingPage.youPayFiatInput).not.toHaveValue('');
        await tradingPage.selectFiatCurrency('eur');

        await test.step('Input amount above maximum', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesNegativeMax });
            });
            await tradingPage.youPayFiatInput.fill('1000000000');
            await expect(page.getByText('Maximum is 5000000 EUR')).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
        });

        await test.step('Input amount below minimum', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesNegativeMin });
            });
            await tradingPage.youPayFiatInput.fill('0.01');
            await expect(page.getByText('Minimum is 96.61 EUR')).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
        });

        await test.step('Empty quotes', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: {} });
            });
            await tradingPage.youPayFiatInput.fill('5000');
            await expect(page.getByText('No offers available for your request.')).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
            await tradingPage.compareButton.click();
            await expect(
                page.getByText('No offers available for your request. Change country or amount.'),
            ).toBeVisible();
            await expect(tradingPage.selectThisQuoteButton).not.toBeVisible();
        });
    });
});
