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

    test('Buy Solana Jupiter token - amount specified in crypto', async ({ page, marketPage }) => {
        await test.step('Request a specific crypto amount of Jupiter token to buy', async () => {
            await marketPage.selectAccount('Jupiter', 'sol');
            await marketPage.waitForOffersSync();
            await marketPage.youPayFiatCryptoSwitchButton.click();
            const isCryptoInput = true;
            await marketPage.setYouBuyAmount(
                cryptoAmount,
                'solana--JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
                isCryptoInput,
            );
            await expect(marketPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(marketPage.quoteProvider).toHaveText(provider);
            await marketPage.buyBestOfferButton.click();
        });

        await test.step('Confirm the trade', async () => {
            await marketPage.confirmTrade(formatAddress(receiveAddress));
            await expect(marketPage.confirmationAccountDropdown).toContainText('Solana #1');
            await expect(marketPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(marketPage.confirmationProvider).toHaveText(
                capitalizeFirstLetter(provider),
            );
            await expect(marketPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.buyTrade);
            await marketPage.finishTransactionButton.click();
            await expect(tradeRequestPromise).toHavePayload(invityRequest.buyTradeSolanaPayload, {
                omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'],
            });
        });

        await marketPage.waitForRedirectCompletion();

        await test.step('Verify transaction detail', async () => {
            await expect(marketPage.transactionDetailStatus).toHaveText('Approved');
            await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(marketPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(marketPage.confirmationProvider).toHaveText(provider);
        });
    });
});
