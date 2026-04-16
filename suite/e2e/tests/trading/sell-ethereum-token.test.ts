import { capitalizeFirstLetter } from '@trezor/utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    sellQuotesEthereumToken,
    sellTradeEthereumToken,
    sellWatchEthereum,
} from '../../fixtures/invity';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const fiatAmount = sellQuotesEthereumToken[0]?.fiatStringAmount ?? '';
const cryptoAmount = sellQuotesEthereumToken[0]?.cryptoStringAmount ?? '';
const provider = getCompanyNameFromList(sellQuotesEthereumToken[0]?.exchange ?? '', 'sellList');
const providerAddress = sellWatchEthereum.destinationAddress;
const formattedCryptoAmount = `${cryptoAmount} USDC`;
const formattedFiatAmount = `€${fiatAmount}`;
const { paymentMethodName } = sellTradeEthereumToken.trade;
const formattedAddress = formatAddressWithNewlines(sellWatchEthereum.destinationAddress);

test.describe('Trading - Sell Ethereum', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
    });
    test.beforeEach(async ({ page, tradingMock, onboardingPage, dashboardPage, walletPage }) => {
        await test.step('Mocking responses', async () => {
            await page.route(invityEndpoint.sellQuotes, async route => {
                await route.fulfill({ json: sellQuotesEthereumToken });
            });
            await tradingMock.routeTrade(invityEndpoint.sellTrade, sellTradeEthereumToken);
            await page.route(invityEndpoint.sellWatch, async route => {
                await route.fulfill({ json: sellWatchEthereum });
            });
        });
        await onboardingPage.completeOnboarding();

        await test.step('Open Ethereum token sell trading', async () => {
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSellTradingOfToken('eth', 'USD Coin');
        });
    });

    test('Sell Ethereum token USDC', async ({ tradingPage, devicePrompt }) => {
        await test.step('Fill in a sell request', async () => {
            await tradingPage.fillSellForm({
                cryptoAmount,
                networkSymbolOrTokenId: 'eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            });
            await expect(tradingPage.quotes.bestOfferAmount).toHaveText(fiatAmount);
            await expect(tradingPage.quotes.provider).toHaveText(capitalizeFirstLetter(provider));
        });

        await test.step('Confirm sell', async () => {
            await tradingPage.sellBestOfferButton.click();
        });

        await tradingPage.waitForRedirectCompletion();

        await test.step('Verify all confirmation values', async () => {
            await expect(tradingPage.confirmation.fiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmation.cryptoAmount).toHaveText(formattedCryptoAmount);
            await expect(tradingPage.confirmation.provider).toHaveText(provider);
            await expect(tradingPage.confirmation.paymentMethod).toHaveText(paymentMethodName);
            await expect(tradingPage.confirmation.address).toHaveText(providerAddress);
            await expect(tradingPage.confirmation.account).toHaveText('Ethereum #1');
        });

        await test.step('Initiate send', async () => {
            await tradingPage.confirmation.initiateSendConfirmation();
            await expect(devicePrompt.headerParagraph).toContainText('Ethereum #1');
            await expect(devicePrompt.outputValueOf('address')).toHaveText(formattedAddress);
            await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                formattedCryptoAmount,
            );
            await expect(devicePrompt.cryptoAmountOf('fee')).toHaveTextGreaterThan(0);
        });

        // Rest of the flow is not implemented as we don't know how to mock the send request and actually not send the crypto
    });
});
