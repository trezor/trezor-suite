import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import {
    buyQuotesSolana,
    buyTradeSolana,
    invityEndpoint,
    invityRequest,
} from '../../fixtures/invity';
import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = localizeNumber(buyQuotesSolana[2].fiatStringAmount, 'en', 2);
const cryptoAmount = buyQuotesSolana[2].receiveStringAmount;
const provider = capitalizeFirstLetter(buyQuotesSolana[2].exchange);
const formattedCryptoAmount = `${cryptoAmount} SOL`;
const formattedFiatAmount = `CZK ${fiatAmount}`;
const { receiveAddress, paymentMethodName } = buyTradeSolana.trade;

test.describe('Trading - Buy Solana', { tag: ['@group=other', '@webOnly'] }, () => {
    test.beforeEach(async ({ page, marketPage, onboardingPage, dashboardPage }) => {
        await marketPage.mockInvity();
        await marketPage.mockInvityTrade(buyTradeSolana, invityEndpoint.buyTrade);
        await page.route(invityEndpoint.buyQuotes, async route => {
            await route.fulfill({ json: buyQuotesSolana });
        });
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    test('Buy specific crypto amount of Solana token', async ({
        page,
        settingsPage,
        dashboardPage,
        walletPage,
        marketPage,
    }) => {
        await test.step('Enable Solana and open its trading', async () => {
            await settingsPage.navigateTo('coins');
            await settingsPage.coins.enableNetwork('sol');
            await dashboardPage.navigateTo();
            await dashboardPage.discoveryShouldFinish();
            await walletPage.openTrading({ symbol: 'sol' });
        });

        await test.step('Request a specific crypto amount to buy', async () => {
            await marketPage.waitForBuyOffersSync();
            await marketPage.youPayFiatCryptoSwitchButton.click();
            const isCryptoInput = true;
            await marketPage.setYouPayAmount(cryptoAmount, 'solana', isCryptoInput);
            await expect(marketPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(marketPage.quoteProvider).toHaveText(provider);
            await marketPage.buyBestOfferButton.click();
        });

        await test.step('Confirm the trade', async () => {
            await marketPage.confirmTrade(formatAddress(receiveAddress));
            await expect(marketPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(marketPage.confirmationProvider).toHaveText(
                capitalizeFirstLetter(provider),
            );
            await expect(marketPage.confirmationPaymentMethod).toHaveText(paymentMethodName);
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.buyTrade);
            await marketPage.confirmTradeButton.click();
            await expect(tradeRequestPromise).toHavePayload(invityRequest.buyTradeSolanaPayload, {
                omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'],
            });
        });

        await test.step('Verify transaction detail', async () => {
            await expect(marketPage.transactionDetailStatus).toHaveText('Approved', {
                timeout: 15_000,
            });
            await expect(marketPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(marketPage.confirmationCryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(marketPage.confirmationProvider).toHaveText(provider);
        });
    });
});
