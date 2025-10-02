import { localizeNumber } from '@suite-common/wallet-utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    swapQuotesTetherBTC,
    swapTradeTetherBTC,
} from '../../fixtures/invity';
import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const sendAmount = swapQuotesTetherBTC[2].sendStringAmount!;
const provider = getCompanyNameFromList(swapQuotesTetherBTC[2].exchange, 'swapList');
const formattedSendAmount = `${localizeNumber(sendAmount)} USDT`;
const formattedReceiveAmount = `${localizeNumber(swapQuotesTetherBTC[2].receiveStringAmount!)} BTC`;
const { sendAddress, receiveAddress, send: tetherMint } = swapTradeTetherBTC;
const formattedSendAddress = formatAddress(sendAddress);
const toastText = `Swap transaction of ${formattedSendAmount} (Solana #1) to ${formattedReceiveAmount} (Bitcoin #1) was broadcasted`;

test.describe('Trading - Swap token to coin', { tag: ['@group=trading', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(
        async ({ page, onboardingPage, dashboardPage, tradingMock, walletPage, settingsPage }) => {
            await test.step('Mocking responses', async () => {
                await page.route(invityEndpoint.swapQuotes, route => {
                    route.fulfill({ json: swapQuotesTetherBTC });
                });
                await tradingMock.routeSwapTrade(swapTradeTetherBTC);
                await tradingMock.routeSolanaSendRequests();
            });
            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({ enableNetworks: ['sol'] });
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'sol' });
        },
    );

    test('Swap Solana Tether token to Bitcoin', async ({ tradingPage, page, devicePrompt }) => {
        await test.step('Fill in a Swap form', async () => {
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sendCurrency: tetherMint,
                sendTicker: 'USDT',
                receiveCurrency: 'Bitcoin',
                receiveSymbol: 'btc',
                receiveNetwork: 'bitcoin',

                receiveAccount: 'Bitcoin #1',
                receiveAddress,
            });
        });

        await test.step('Confirm the Swap trade', async () => {
            await expect(tradingPage.bestOfferAmount).toHaveText(formattedReceiveAmount);
            await tradingPage.clickSwapBestOfferAndWaitForFees();
            await tradingPage.termsConfirmButton.click();
        });

        await test.step('Initiate send', async () => {
            await tradingPage.initiateSendConfirmation({ confirmAlsoToken: true });
            await expect(devicePrompt.headerParagraph).toContainText('Solana #1');
            await expect(devicePrompt.outputValueOf('address')).toHaveText(formattedSendAddress);
            await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                formattedSendAmount,
            );
            await expect(devicePrompt.cryptoAmountOf('fee')).toHaveTextGreaterThan(0);
        });

        // Thanks to our mocked responses, the crypto is actually not send.
        await test.step('Send crypto to provider', async () => {
            await devicePrompt.sendButton.click();
            await expect(page.getByTestId('@toast/tx-exchange')).toContainText(toastText);
            await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                'TR_EXCHANGE_DETAIL_SUCCESS_TITLE',
            );
            await expect(tradingPage.confirmationCryptoAmount.first()).toHaveText(
                formattedSendAmount,
            );
            await expect(tradingPage.confirmationCryptoAmount.last()).toHaveText(
                formattedReceiveAmount,
            );
            await expect(tradingPage.confirmationExchangeType).toHaveText('Fixed-rate offer');
            await expect(tradingPage.confirmationProvider).toHaveText(provider);
        });
    });
});
