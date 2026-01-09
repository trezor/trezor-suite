import { CryptoId } from 'invity-api';

import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import {
    buyQuotesSolanaToken,
    buyTradeSolanaToken,
    invityEndpoint,
    invityRequest,
} from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = localizeNumber(buyQuotesSolanaToken[0].fiatStringAmount, 'en-US', 2);
const cryptoAmount = buyQuotesSolanaToken[0].receiveStringAmount;
const provider = capitalizeFirstLetter(buyQuotesSolanaToken[0].exchange);
const formattedCryptoAmount = `${cryptoAmount} JUP`;
const formattedFiatAmount = `CZK ${fiatAmount}`;

test.describe('Trading - Buy Solana', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.beforeEach(async ({ page, tradingMock, onboardingPage, settingsPage, walletPage }) => {
        await page.route(invityEndpoint.buyQuotes, async route => {
            await route.fulfill({ json: buyQuotesSolanaToken });
        });
        await tradingMock.routeTrade(invityEndpoint.buyTrade, buyTradeSolanaToken);
        await onboardingPage.completeOnboarding();

        await test.step('Enable Solana and open its trading', async () => {
            await settingsPage.changeNetworks({ enableNetworks: ['sol'] });
            await walletPage.openTrading({ symbol: 'sol' });
        });
    });

    test('Buy Solana Jupiter token - amount specified in crypto', async ({ page, tradingPage }) => {
        await test.step('Request a specific crypto amount of Jupiter token to buy', async () => {
            const cryptoId = 'solana--JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' as CryptoId;
            await tradingPage.selectReceiveAssetInAssetPicker({
                networkFilter: 'sol',
                searchFilter: 'Jupiter',
                receiveAsset: cryptoId,
            });
            await tradingPage.waitForOffersSync();
            await tradingPage.youPayFiatCryptoSwitchButton.click();
            const isCryptoInput = true;
            await tradingPage.fillBuyForm({
                amount: cryptoAmount,
                cryptoCurrency: cryptoId,
                wantCrypto: isCryptoInput,
                selectReceiveAddress: async () => {
                    await tradingPage.selectSuiteReceiveAccount(0);
                },
            });
            await expect(tradingPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(tradingPage.quoteProvider).toHaveText(provider);
        });

        await test.step('Confirm the trade', async () => {
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.buyTrade);
            await tradingPage.buyBestOfferButton.click();

            await expect
                .soft(tradeRequestPromise)
                .toHavePayload(invityRequest.buyTradeSolanaPayload, {
                    omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'],
                });
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
            await expect(page).toHaveURL(/\/accounts\/coinmarket\/buy#\/sol\/0\/normal$/);
        });
    });
});
