import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import {
    buyQuotesSolanaToken,
    buyTradeSolanaToken,
    invityEndpoint,
    invityRequest,
} from '../../fixtures/invity';
import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = localizeNumber(buyQuotesSolanaToken[0].fiatStringAmount, 'en', 2);
const cryptoAmount = buyQuotesSolanaToken[0].receiveStringAmount;
const provider = capitalizeFirstLetter(buyQuotesSolanaToken[0].exchange);
const formattedCryptoAmount = `${cryptoAmount} JUP`;
const formattedFiatAmount = `CZK ${fiatAmount}`;
const { receiveAddress, paymentMethodName } = buyTradeSolanaToken.trade;

test.describe('Trading - Buy Solana', { tag: ['@group=other', '@webOnly'] }, () => {
    test.beforeEach(
        async ({ page, tradingMock, onboardingPage, settingsPage, walletPage, dashboardPage }) => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesSolanaToken });
            });
            await tradingMock.routeTrade(invityEndpoint.buyTrade, buyTradeSolanaToken);
            await onboardingPage.completeOnboarding();
            await dashboardPage.discoveryShouldFinish();

            await test.step('Enable Solana and open its trading', async () => {
                await settingsPage.navigateTo('coins');
                await settingsPage.coins.enableNetwork('sol');
                await dashboardPage.navigateTo();
                await dashboardPage.discoveryShouldFinish();
                await walletPage.openTrading({ symbol: 'sol' });
            });
        },
    );

    test('Buy Solana Jupiter token - amount specified in crypto', async ({ page, tradingPage }) => {
        await test.step('Request a specific crypto amount of Jupiter token to buy', async () => {
            await tradingPage.selectAccount('Jupiter', 'sol');
            await tradingPage.waitForOffersSync();
            await tradingPage.youPayFiatCryptoSwitchButton.click();
            const isCryptoInput = true;
            await tradingPage.setYouBuyAmount(
                cryptoAmount,
                'solana--JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
                isCryptoInput,
            );
            await expect(tradingPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(tradingPage.quoteProvider).toHaveText(provider);
            await tradingPage.buyBestOfferButton.click();
        });

        await test.step('Confirm the trade', async () => {
            await tradingPage.confirmTrade(formatAddress(receiveAddress));
            await expect(tradingPage.confirmationAccountDropdown).toContainText('Solana #1');
            await expect(tradingPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmationProvider).toHaveText(
                capitalizeFirstLetter(provider),
            );
            await expect(tradingPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.buyTrade);
            await tradingPage.finishTransactionButton.click();
            await expect(tradeRequestPromise).toHavePayload(invityRequest.buyTradeSolanaPayload, {
                omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'],
            });
        });

        await tradingPage.waitForRedirectCompletion();

        await test.step('Verify transaction detail', async () => {
            await expect(tradingPage.transactionDetailStatus).toHaveText('Approved');
            await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmationProvider).toHaveText(provider);
        });
    });
});
