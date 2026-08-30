import { localizeNumber } from '@suite-common/wallet-utils';

import { expect, test } from '../../support/fixtures';

const fiatAmount = '1000';
const formattedFiatAmount = `CZK ${localizeNumber(fiatAmount, 'en-US', 2)}`;

test.describe('Trading - Buy BTC', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage, walletPage, tradingMockNew }) => {
        tradingMockNew.setTradeFlow('buy');
        await tradingMockNew.rewriteProviderRedirect();
        await tradingMockNew.setStatus('SUBMITTED');

        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await walletPage.openTrading();
    });

    test('Buy Bitcoin from compared offer', async ({ tradingPage, tradingResponses }) => {
        await test.step('Fill input amount and open the offer comparison modal', async () => {
            await tradingPage.fillBuyForm({
                amount: fiatAmount,
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'btc');
                },
            });
        });

        let comparedProviderName: string;

        await test.step('Pick an offer other than the best one', async () => {
            await tradingPage.quotes.chooseDifferentOfferIfAvailable();
            comparedProviderName = (
                await tradingPage.quotes.selectedProviderName.innerText()
            ).trim();
        });

        await test.step('Verify the trade is created with the picked provider', async () => {
            await tradingPage.buyBestOfferButton.click();
            await tradingPage.confirmation.buyButton.click();

            const { exchange } = await tradingResponses.buy.trade();
            expect(await tradingResponses.buy.companyName(exchange)).toBe(comparedProviderName);
        });
    });

    test('Buy Bitcoin from best offer', async ({
        page,
        tradingPage,
        tradingMockNew,
        tradingResponses,
    }) => {
        await test.step('Fill in a buy request', async () => {
            await tradingPage.fillBuyForm({
                amount: fiatAmount,
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'btc');
                },
            });
        });

        let receiveAmount: string;

        await test.step('Form CTA shows Continue', async () => {
            await expect(tradingPage.buyBestOfferButton).toHaveTranslation('TR_CONTINUE');
        });

        await test.step('Continue to the preview showing provider name and KYC warning', async () => {
            receiveAmount = await tradingPage.quotes.getBestOfferAmount();
            const providerName = (await tradingPage.quotes.selectedProviderName.innerText()).trim();

            await tradingPage.buyBestOfferButton.click();

            await expect(tradingPage.confirmation.buyButton).toHaveTranslation(
                'TR_TRADING_BUY_VIA',
                {
                    values: { providerName },
                },
            );
            await expect(tradingPage.confirmation.buyButton.locator('svg')).toBeVisible();
            await expect(tradingPage.kycWarning).toBeVisible();

            await expect(tradingPage.confirmation.fiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmation.cryptoAmount).toHaveText(`${receiveAmount} BTC`);
            await expect(tradingPage.confirmation.provider).toHaveText(providerName);
        });

        let providerName: string;

        await test.step('Confirm the trade and get redirected to transaction detail', async () => {
            await page.clock.install();
            await tradingPage.confirmation.buyButton.click();

            const { exchange } = await tradingResponses.buy.trade();
            providerName = await tradingResponses.buy.companyName(exchange);

            await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                'TR_BUY_DETAIL_WAITING_FOR_USER_TITLE',
            );
            await expect(tradingPage.proceedToPayButton).toBeVisible();
        });

        await test.step('Wait for the watch refresh and status change to Approved', async () => {
            await tradingMockNew.advanceStatus('SUCCESS');

            await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                'TR_BUY_DETAIL_SUCCESS_TITLE',
            );
            await expect(tradingPage.confirmation.fiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmation.cryptoAmount).toHaveText(`${receiveAmount} BTC`);
            await expect(tradingPage.confirmation.provider).toHaveText(providerName);
        });

        await test.step('Return to account buy form', async () => {
            await tradingPage.backToAccountButton('Buy').click();
            await expect(page).toHaveURL(/\/accounts\/coinmarket\/buy$/);
        });
    });
});
