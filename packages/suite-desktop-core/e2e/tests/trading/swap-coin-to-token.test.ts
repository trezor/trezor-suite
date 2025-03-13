import { localizeNumber } from '@suite-common/wallet-utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    swapQuotesSolanaUSDC,
    swapTradeSolanaUSDC,
} from '../../fixtures/invity';
import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const sendAmount = swapQuotesSolanaUSDC[0].sendStringAmount;
const provider = getCompanyNameFromList(swapQuotesSolanaUSDC[0].exchange, 'swapList');
const formattedSendAmount = `${localizeNumber(sendAmount)} SOL`;
const formattedReceiveAmount = `${localizeNumber(swapQuotesSolanaUSDC[0].receiveStringAmount)} USDC`;
const { sendAddress, receiveAddress, receive: usdcMint } = swapTradeSolanaUSDC;
const formattedSendAddress = formatAddress(sendAddress);
const toastText = `${formattedSendAmount} sent from Solana #1`;

test.describe('Trading - Swap coin to token', { tag: ['@group=other', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(
        async ({ page, onboardingPage, dashboardPage, tradingMock, walletPage, settingsPage }) => {
            await test.step('Mocking responses', async () => {
                await page.route(invityEndpoint.swapQuotes, route => {
                    route.fulfill({ json: swapQuotesSolanaUSDC });
                });
                await tradingMock.routeSwapTrade(swapTradeSolanaUSDC);
                await tradingMock.routeSolanaSendRequests();
            });
            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: ['sol', 'eth'],
                disableNetworks: ['btc'],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'sol' });
        },
    );

    test('Swap Solana to USDC', async ({ tradingPage, page, devicePrompt }) => {
        await test.step('Fill in a Swap form', async () => {
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sendCurrency: 'solana',
                sendTicker: 'SOL',
                receiveCurrency: 'USDC',
                receiveSymbol: 'eth',
                receiveNetwork: usdcMint,
            });
        });

        await test.step('Confirm the Swap trade', async () => {
            await expect(tradingPage.bestOfferAmount).toHaveText(formattedReceiveAmount);
            await tradingPage.clickSwapBestOfferAndWaitForFees();
            await tradingPage.confirmTrade('Ethereum #1', receiveAddress);
        });

        await test.step('Verify all confirmation values', async () => {
            await expect(tradingPage.confirmationAccountDropdown).toContainText('Ethereum #1');
            await expect(tradingPage.confirmationAddress).toHaveValue(receiveAddress);
            await expect(tradingPage.confirmationCryptoAmount.first()).toHaveText(
                formattedSendAmount,
            );
            await expect(tradingPage.confirmationCryptoAmount.last()).toHaveText(
                formattedReceiveAmount,
            );
            await expect(tradingPage.confirmationProvider).toHaveText(provider);
        });

        await test.step('Finish transaction', async () => {
            await tradingPage.finishTransactionButton.click();
            await expect(tradingPage.swapTransactionFromAccount).toContainText('Solana #1');
            await expect(tradingPage.swapTransactionToAddress).toContainText(formattedSendAddress);
        });

        await test.step('Initiate send', async () => {
            await tradingPage.initiateSendConfirmation();
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
            await expect(page.getByTestId('@toast/tx-sent')).toContainText(toastText);
            await expect(tradingPage.transactionDetailStatus).toHaveText('Approved');
            await expect(tradingPage.confirmationCryptoAmount.first()).toHaveText(
                formattedSendAmount,
            );
            await expect(tradingPage.confirmationCryptoAmount.last()).toHaveText(
                formattedReceiveAmount,
            );
            await expect(tradingPage.confirmationExchangeType).toHaveText('Fixed-rate offer');
            await expect(tradingPage.confirmationProvider).toHaveText(provider);
        });

        await test.step('Return to account swap form', async () => {
            await tradingPage.backToAccountButton.click();
            await expect(page).toHaveURL(/\/accounts\/coinmarket\/exchange#\/sol\/0\/normal$/);
        });
    });
});
