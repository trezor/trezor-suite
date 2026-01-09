import { CryptoId } from 'invity-api';

import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import { buyQuotesEthereum, buyTradeEthereum, invityEndpoint } from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = buyQuotesEthereum[3].fiatStringAmount;
const provider = capitalizeFirstLetter(buyQuotesEthereum[3].exchange);
const formattedCryptoAmount = `${localizeNumber(buyQuotesEthereum[3].receiveStringAmount)} ETH`;
const formattedFiatAmount = `CZK ${localizeNumber(fiatAmount, 'en-US', 2)}`;

test.describe('Trading - Buy Ethereum', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ page, onboardingPage }) => {
        await page.route(invityEndpoint.buyQuotes, async route => {
            await route.fulfill({ json: buyQuotesEthereum });
        });
        await onboardingPage.completeOnboarding();
    });

    test('Enable Ethereum on account by buying it', async ({
        page,
        walletPage,
        tradingPage,
        tradingMock,
    }) => {
        await test.step('Request to buy Ethereum', async () => {
            await walletPage.openTradingGlobalButton.click();
            await tradingPage.selectReceiveAssetInAssetPicker({
                searchFilter: 'Ethereum',
                networkFilter: 'eth',
                receiveAsset: 'ethereum' as CryptoId,
            });
            await tradingPage.fillBuyForm({
                amount: fiatAmount,
                cryptoCurrency: 'ethereum',
                selectReceiveAddress: async () => {
                    await tradingPage.selectAddSuiteReceiveAccount(0);
                },
            });
            await expect(tradingPage.bestOfferAmount).toContainText('0.018615 ETH');
        });

        await test.step('Confirm Trade', async () => {
            await tradingMock.routeTrade(invityEndpoint.buyTrade, buyTradeEthereum);

            await tradingPage.buyBestOfferButton.click();
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
