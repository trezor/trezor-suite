import type { CryptoId } from 'invity-api';

import { localizeNumber } from '@suite-common/wallet-utils';

import { expect, test } from '../../support/fixtures';

// Below ~500 JUP no live provider quotes the pair, and only Mercuryo quotes it for US/CA.
const cryptoAmount = '500';
const formattedCryptoAmount = `${localizeNumber(cryptoAmount)} JUP`;
const jupiterCryptoId = 'solana--JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' as CryptoId;

test.describe('Trading - Buy Solana token', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage, walletPage, tradingMockNew }) => {
        tradingMockNew.setTradeFlow('buy');
        await tradingMockNew.rewriteProviderRedirect();
        await tradingMockNew.setStatus('SUBMITTED');

        await onboardingPage.completeOnboarding();

        await test.step('Enable Solana and open its trading', async () => {
            await settingsPage.changeNetworks({ enableNetworks: ['sol'] });
            await walletPage.openTrading({ symbol: 'sol' });
        });
    });

    test('Buy Solana Jupiter token - amount specified in crypto', async ({
        page,
        tradingPage,
        tradingMockNew,
        tradingResponses,
    }) => {
        let fiatAmount: string;
        let providerName: string;

        await test.step('Request a specific crypto amount of Jupiter token to buy', async () => {
            await tradingPage.assetPicker.selectBuyAsset({
                networkFilter: 'sol',
                searchFilter: 'Jupiter',
                assetCryptoId: jupiterCryptoId,
            });
            await tradingPage.inputs.fiatCryptoSwitchButton.click();
            await tradingPage.fillBuyForm({
                amount: cryptoAmount,
                wantCrypto: true,
                fiatCurrencyCode: 'usd',
                country: 'US',
                countrySubdivision: 'CA',
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0);
                },
            });
        });

        await test.step('Continue to the preview', async () => {
            // The crypto amount is the one typed, so the offer competes on the fiat it costs and
            // the best-offer field carries that bare number rather than an amount with a ticker.
            await expect(tradingPage.quotes.bestOfferAmount).toHaveText(/^[\d,]+(\.\d+)?$/);
            fiatAmount = (await tradingPage.quotes.bestOfferAmount.innerText()).trim();
            providerName = (await tradingPage.quotes.selectedProviderName.innerText()).trim();

            await tradingPage.buyBestOfferButton.click();

            await expect(tradingPage.confirmation.cryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmation.fiatAmount).toHaveText(`$${fiatAmount}`);
            await expect(tradingPage.confirmation.provider).toHaveText(providerName);
        });

        await test.step('Confirm the trade', async () => {
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
            await expect(tradingPage.confirmation.cryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmation.provider).toHaveText(providerName);
        });

        await test.step('Return to account buy form', async () => {
            await tradingPage.backToAccountButton('Buy').click();
            await expect(page).toHaveURL(/\/accounts\/coinmarket\/buy$/);
        });
    });
});
