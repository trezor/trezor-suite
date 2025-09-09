import { localizeNumber } from '@suite-common/wallet-utils';
import messages from '@trezor/suite/src/support/messages';
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
const { receiveAddress } = buyTradeSolanaToken.trade;

test.describe('Trading - Buy Solana', { tag: ['@group=trading', '@webOnly'] }, () => {
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
            await tradingPage.selectAccount('Jupiter', 'sol');
            await tradingPage.waitForOffersSync();
            await tradingPage.youPayFiatCryptoSwitchButton.click();
            const isCryptoInput = true;
            await tradingPage.fillBuyForm({
                amount: cryptoAmount,
                cryptoCurrency: 'solana--JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
                wantCrypto: isCryptoInput,
                receiveAccount: 'Solana #1',
                receiveAddress,
            });
            await expect(tradingPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(tradingPage.quoteProvider).toHaveText(provider);
            await tradingPage.buyBestOfferButton.click();
        });

        await test.step('Confirm the trade', async () => {
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.buyTrade);
            await tradingPage.termsConfirmButton.click();

            await expect
                .soft(tradeRequestPromise)
                .toHavePayload(invityRequest.buyTradeSolanaPayload, {
                    omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'],
                });
        });

        await tradingPage.waitForRedirectCompletion();

        await test.step('Verify transaction detail', async () => {
            await expect(tradingPage.transactionDetailStatus).toHaveText(
                messages['TR_BUY_DETAIL_SUCCESS_TITLE'].defaultMessage,
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
