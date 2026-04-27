import { buyQuotesNegativeMax, buyQuotesNegativeMin, invityEndpoint } from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

test.describe('Trading - Buy Negative scenarios', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await dashboardPage.navigateTo();
    });

    test('Buy form handles input limits and empty quotes', async ({
        page,
        walletPage,
        tradingPage,
    }) => {
        await test.step('Navigate to Buy form and wait for it to be loaded', async () => {
            await walletPage.openTradingGlobalButton.click();

            await expect(tradingPage.inputs.fiatAmount).toHaveValue(''); // waits for trading form to load
            await tradingPage.assetPicker.openBuyModal.click({ trial: true }); // checking actionability of the dropdown, which means page is properly loaded

            await tradingPage.inputs.selectFiatCurrency('eur');
        });

        await test.step('Input amount above maximum', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesNegativeMax });
            });
            await expect(page.getByText('Receive account')).toBeVisible();
            await tradingPage.inputs.fiatAmount.fill('1000000000');
            await expect(page.getByText(/Maximum is (5000000|5,000,000)(\.00)? EUR/)).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
        });

        await test.step('Input amount below minimum', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesNegativeMin });
            });
            await expect(page.getByText('Receive account')).toBeVisible();
            await tradingPage.inputs.fiatAmount.fill('0.01');
            await expect(page.getByText('Minimum is 96.61 EUR')).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
        });

        await test.step('Empty quotes', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: {} });
            });
            await expect(page.getByText('Receive account')).toBeVisible();
            await tradingPage.inputs.fiatAmount.fill('5000');
            await expect(page.getByTestId('trading-offer-found-none')).toBeVisible();
            await expect(tradingPage.buyBestOfferButton).toBeDisabled();
            await expect(tradingPage.quotes.selectedProvider).toBeHidden();
            await expect(page.getByTestId('trading-offer-found-none')).toBeVisible();
        });
    });
});
