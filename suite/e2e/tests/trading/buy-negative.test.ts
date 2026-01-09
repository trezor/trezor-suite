import { buyQuotesNegativeMax, buyQuotesNegativeMin, invityEndpoint } from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

test.describe('Trading - Buy Negative scenarios', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test('Buy form handles input limits and empty quotes', async ({
        page,
        walletPage,
        tradingPage,
    }) => {
        await test.step('Navigate to Buy form and wait for it to be loaded', async () => {
            await walletPage.openTradingGlobalButton.click();

            await expect(tradingPage.youPayFiatInput).toHaveValue(''); // waits for trading form to load
            await tradingPage.accountDropdown.click({ trial: true }); // checking actionability of the dropdown, which means page is properly loaded

            await tradingPage.selectFiatCurrency('eur');
        });

        await test.step('Input amount above maximum', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesNegativeMax });
            });
            await expect(page.getByText('Receive account')).toBeVisible();
            await tradingPage.youPayFiatInput.fill('1000000000');
            await expect(page.getByText('Maximum is 5000000 EUR')).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
        });

        await test.step('Input amount below minimum', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesNegativeMin });
            });
            await expect(page.getByText('Receive account')).toBeVisible();
            await tradingPage.youPayFiatInput.fill('0.01');
            await expect(page.getByText('Minimum is 96.61 EUR')).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
        });

        await test.step('Empty quotes', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: {} });
            });
            await expect(page.getByText('Receive account')).toBeVisible();
            await tradingPage.youPayFiatInput.fill('5000');
            await expect(page.getByTestId('trading-offer-found-none')).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
            await expect(tradingPage.selectedOfferProvider).toBeHidden();
            await expect(page.getByTestId('trading-offer-found-none')).toBeVisible();
            await expect(tradingPage.selectThisQuoteButton).toBeHidden();
        });
    });
});
