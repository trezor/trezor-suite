import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import { buyQuotesEthereum, buyTradeEthereum, invityEndpoint } from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = buyQuotesEthereum[3].fiatStringAmount;
const provider = capitalizeFirstLetter(buyQuotesEthereum[3].exchange);
const formattedCryptoAmount = `${localizeNumber(buyQuotesEthereum[3].receiveStringAmount)} ETH`;
const formattedFiatAmount = `CZK ${localizeNumber(fiatAmount, 'en-US', 2)}`;
const { receiveAddress } = buyTradeEthereum.trade;

test.describe('Trading - Buy Ethereum', { tag: ['@group=trading', '@webOnly'] }, () => {
    test.beforeEach(async ({ page, tradingMock, onboardingPage }) => {
        await page.route(invityEndpoint.buyQuotes, async route => {
            await route.fulfill({ json: buyQuotesEthereum });
        });
        await tradingMock.routeTrade(invityEndpoint.buyTrade, buyTradeEthereum);
        await onboardingPage.completeOnboarding();
    });

    test('Enable Ethereum on account by buying it', async ({
        page,
        settingsPage,
        walletPage,
        tradingPage,
    }) => {
        await test.step('Request to buy Ethereum', async () => {
            await walletPage.openTradingGlobalButton.click();
            await tradingPage.selectAccount('Ethereum', 'eth');
            await tradingPage.fillBuyForm({
                amount: fiatAmount,
                cryptoCurrency: 'ethereum',
            });
            await expect(tradingPage.bestOfferAmount).toContainText('0 ETH');
        });

        await test.step('Create Ethereum account in trade confirmation dialog', async () => {
            await expect(tradingPage.confirmationAccountDropdown).toHaveText(
                "Use an account (Ethereum) that isn't in Trezor Suite.",
            );
            await expect(tradingPage.confirmationAddress).toHaveValue('');
            await tradingPage.confirmationAccountDropdown.click();
            await page.getByRole('option', { name: 'Create a new Ethereum account' }).click();
            await expect(settingsPage.coins.networkButton('eth')).toBeEnabledCoin();
            await page.getByRole('button', { name: 'Find my Ethereum accounts' }).click();
            await page.discoveryShouldFinish();
        });

        await test.step('Check both Ethereum account are options on Confirmation screen', async () => {
            await tradingPage.confirmationAccountDropdown.click();
            await expect(page.getByRole('option', { name: 'Ethereum #1 ' })).toBeVisible();
            await expect(page.getByRole('option', { name: 'Ethereum #2 ' })).toBeVisible();

            await page.getByRole('option', { name: 'Ethereum #1 ' }).click();

            await expect(tradingPage.confirmationAccountDropdown).toHaveText(
                'Ethereum #1Balance: 0 ETH',
            );

            await expect(tradingPage.confirmationAddress).toHaveValue(receiveAddress);
        });

        await test.step('Confirm Trade', async () => {
            await tradingPage.buyBestOfferButton.click();
            await tradingPage.termsConfirmButton.click();
        });

        await tradingPage.waitForRedirectCompletion();

        await test.step('Verify transaction detail', async () => {
            await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                'TR_BUY_DETAIL_SUCCESS_TITLE',
            );
            await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmationProvider).toHaveText(provider);
        });

        await test.step('Return to account buy form', async () => {
            await tradingPage.backToAccountButton('Buy').click();
            // The flow started on BTC so it returns to the BTC account, even tho the trade was for ETH
            await expect(page).toHaveURL(/\/accounts\/coinmarket\/buy#\/btc\/0\/normal$/);
        });
    });
});
