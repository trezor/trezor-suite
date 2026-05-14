import { getCryptoId } from '@suite-common/trading';
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
    test.beforeEach(async ({ page, onboardingPage, settingsPage, dashboardPage }) => {
        await page.route(invityEndpoint.buyQuotes, async route => {
            await route.fulfill({ json: buyQuotesEthereum });
        });
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await dashboardPage.navigateTo();
    });

    test('Enable Ethereum on account by buying it', async ({
        page,
        walletPage,
        tradingPage,
        tradingMock,
    }) => {
        await test.step('Request to buy Ethereum', async () => {
            await walletPage.openTradingGlobalButton.click();
            await tradingPage.assetPicker.selectBuyAsset({
                searchFilter: 'Ethereum',
                networkFilter: 'eth',
                assetCryptoId: getCryptoId('eth'),
            });
            await tradingPage.fillBuyForm({
                amount: fiatAmount,
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectAddSuiteReceiveAccount(0);
                },
            });
            await expect(tradingPage.quotes.bestOfferAmount).toContainText('0.018615 ETH');
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
            await expect(tradingPage.confirmation.fiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmation.cryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmation.provider).toHaveText(provider);
        });

        await test.step('Return to account buy form', async () => {
            await tradingPage.backToAccountButton('Buy').click();
            await expect(page).toHaveURL(/\/accounts\/coinmarket\/buy$/);
        });
    });
});
