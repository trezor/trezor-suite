import { localizeNumber } from '@suite-common/wallet-utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    swapQuotesSolanaTokens,
    swapTradeSolanaTokens,
} from '../../fixtures/invity';
import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const sendAmount = swapQuotesSolanaTokens[0].sendStringAmount!;
const provider = getCompanyNameFromList(swapQuotesSolanaTokens[0].exchange, 'swapList');
const formattedSendAmount = `${localizeNumber(sendAmount)} USDT`;
const formattedReceiveAmount = `${localizeNumber(swapQuotesSolanaTokens[0].receiveStringAmount!)} USDC`;
const { sendAddress, receiveAddress, send: tetherMint, receive: usdcMint } = swapTradeSolanaTokens;
const tetherRawMintAddress = tetherMint.split('--')[1];
const formattedSendAddress = formatAddress(sendAddress);
const toastText = `${formattedSendAmount} sent from Solana #1`;

test.describe('Trading - Swap tokens', { tag: ['@group=other', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(
        async ({ page, onboardingPage, dashboardPage, tradingMock, walletPage, settingsPage }) => {
            await test.step('Mocking responses', async () => {
                await page.route(invityEndpoint.swapQuotes, route => {
                    route.fulfill({ json: swapQuotesSolanaTokens });
                });
                await tradingMock.routeSwapTrade(swapTradeSolanaTokens);
                await tradingMock.routeSolanaSendRequests();
            });
            await onboardingPage.completeOnboarding();
            await dashboardPage.discoveryShouldFinish();
            await settingsPage.navigateTo('coins');
            await settingsPage.coins.enableNetwork('sol');
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'sol' });
        },
    );

    test('Swap Solana tokens', async ({ marketPage, page, devicePrompt }) => {
        await test.step('Fill in a Swap form', async () => {
            await marketPage.setYouSwapAmount({
                amount: sendAmount,
                sendCurrency: tetherMint,
                sendTicker: 'USDT',
                receiveCurrency: 'USDC',
                receiveSymbol: 'sol',
                receiveNetwork: usdcMint,
            });
        });

        await test.step('Confirm the Swap trade', async () => {
            await expect(marketPage.bestOfferAmount).toHaveText(formattedReceiveAmount);
            await marketPage.clickSwapBestOfferAndWaitForFees();
            await marketPage.confirmTrade(formatAddress(receiveAddress));
        });

        await test.step('Verify all confirmation values', async () => {
            await expect(marketPage.confirmationAccountDropdown).toContainText('Solana #1');
            await expect(marketPage.confirmationAddress).toHaveValue(receiveAddress);
            await expect(marketPage.confirmationCryptoAmount.first()).toHaveText(
                formattedSendAmount,
            );
            await expect(marketPage.confirmationCryptoAmount.last()).toHaveText(
                formattedReceiveAmount,
            );
            await expect(marketPage.confirmationProvider).toHaveText(provider);
        });

        await test.step('Finish transaction', async () => {
            await marketPage.finishTransactionButton.click();
            await expect(marketPage.swapTransactionFromAccount).toContainText('Solana #1');
            await expect(marketPage.swapTransactionToAddress).toContainText(formattedSendAddress);
        });

        await test.step('Initiate send', async () => {
            await marketPage.initiateSendConfirmation({ confirmAlsoToken: true });
            await expect(devicePrompt.outputValueOf('address')).toHaveText(formattedSendAddress);
            await expect(devicePrompt.outputValueOf('contract')).toHaveText(tetherRawMintAddress);
            await expect(devicePrompt.cryptoAmountOf('total')).toHaveText(formattedSendAmount);
        });

        // Thanks to our mocked responses, the crypto is actually not send.
        await test.step('Send crypto to provider', async () => {
            await devicePrompt.sendButton.click();
            await expect(page.getByTestId('@toast/tx-sent')).toContainText(toastText);
            await expect(marketPage.transactionDetailStatus).toHaveText('Approved');
        });
    });
});
