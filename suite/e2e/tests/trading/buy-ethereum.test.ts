import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { localizeNumber } from '@suite-common/wallet-utils';

import { expect, test } from '../../support/fixtures';

const fiatAmount = '1000';
const formattedFiatAmount = `CZK ${localizeNumber(fiatAmount, 'en-US', 2)}`;

test.describe('Trading - Buy Ethereum', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage, dashboardPage, tradingMockNew }) => {
        tradingMockNew.setTradeFlow('buy');
        await tradingMockNew.rewriteProviderRedirect();
        await tradingMockNew.setStatus('SUBMITTED');

        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['btc'] });
        await dashboardPage.navigateTo();
    });

    test('Enable Ethereum on account by buying it', async ({
        page,
        walletPage,
        tradingPage,
        tradingMockNew,
        tradingResponses,
    }) => {
        let receiveAmount: string;
        let providerName: string;

        await test.step('Request to buy Ethereum', async () => {
            await walletPage.openTradingGlobalButton.click();
            await tradingPage.assetPicker.selectBuyAsset({
                searchFilter: 'Ethereum',
                networkFilter: 'eth',
                assetCryptoId: getCryptoId(asNetworkSymbol('eth')),
            });
            await tradingPage.fillBuyForm({
                amount: fiatAmount,
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectAddSuiteReceiveAccount(0, 'eth');
                },
            });
        });

        await test.step('Continue to preview and confirm the trade', async () => {
            receiveAmount = await tradingPage.quotes.getBestOfferAmount();
            providerName = (await tradingPage.quotes.selectedProviderName.innerText()).trim();

            await tradingPage.buyBestOfferButton.click();

            await expect(tradingPage.confirmation.fiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmation.cryptoAmount).toHaveText(`${receiveAmount} ETH`);
            await expect(tradingPage.confirmation.provider).toHaveText(providerName);

            await page.clock.install();
            await tradingPage.confirmation.buyButton.click();

            const { exchange } = await tradingResponses.buy.trade();
            expect(await tradingResponses.buy.companyName(exchange)).toBe(providerName);
        });

        await tradingPage.waitForRedirectCompletion();

        await test.step('Verify transaction detail', async () => {
            await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                'TR_BUY_DETAIL_WAITING_FOR_USER_TITLE',
            );

            await tradingMockNew.advanceStatus('SUCCESS');

            await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                'TR_BUY_DETAIL_SUCCESS_TITLE',
            );
            await expect(tradingPage.confirmation.fiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmation.cryptoAmount).toHaveText(`${receiveAmount} ETH`);
            await expect(tradingPage.confirmation.provider).toHaveText(providerName);
        });

        await test.step('Return to account buy form', async () => {
            await tradingPage.backToAccountButton('Buy').click();
            await expect(page).toHaveURL(/\/accounts\/coinmarket\/buy$/);
        });
    });
});
