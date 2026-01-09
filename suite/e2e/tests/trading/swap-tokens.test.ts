import { CryptoId } from 'invity-api';

import { localizeNumber } from '@suite-common/wallet-utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    swapQuotesSolanaTokens,
    swapTradeSolanaTokens,
} from '../../fixtures/invity';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const sendAmount = swapQuotesSolanaTokens[1].sendStringAmount!;
const receiveAmount = localizeNumber(swapQuotesSolanaTokens[1].receiveStringAmount!);
const provider = getCompanyNameFromList(swapQuotesSolanaTokens[1].exchange, 'swapList');
const formattedSendAmount = `${localizeNumber(sendAmount)} USDT`;
const formattedReceiveAmount = `${receiveAmount} USDC`;
const { sendAddress, send: tetherMint, receive: usdcMint, receiveAddress } = swapTradeSolanaTokens;
const formattedSendAddress = formatAddressWithNewlines(sendAddress);

test.describe('Trading - Swap tokens', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
    });
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
            await settingsPage.changeNetworks({ enableNetworks: ['sol'] });
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'sol' });
        },
    );

    test('Swap Solana tokens', async ({ tradingPage, page, devicePrompt }) => {
        await test.step('Fill in a Swap form', async () => {
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sellAsset: {
                    networkFilter: 'sol',
                    networkSymbol: 'sol',
                    tokenSymbol: 'usdt',
                    assetCryptoId: tetherMint as CryptoId,
                },
                buyAsset: {
                    searchFilter: 'USDC',
                    networkFilter: 'sol',
                    assetCryptoId: usdcMint as CryptoId,
                },
                receiveAddress,
                selectReceiveAddress: async () => {
                    await tradingPage.selectSuiteReceiveAccount(0);
                },
            });
        });

        await test.step('Confirm the Swap trade', async () => {
            await expect(tradingPage.bestOfferAmount).toHaveText(formattedReceiveAmount);
            await tradingPage.clickSwapBestOfferAndWaitForFees();
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
            await expect(page.getByTestId('@toast/tx-exchange')).toHaveTranslation(
                'TOAST_TX_EXCHANGE_BROADCASTED',
                {
                    values: {
                        sendAmount,
                        sendAsset: 'USDT',
                        sendAccount: 'Solana #1',
                        receiveAmount,
                        receiveAsset: 'USDC',
                        receiveAccount: 'Solana #1',
                    },
                },
            );
            await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                'TR_EXCHANGE_DETAIL_SUCCESS_TITLE',
            );
            await expect(tradingPage.confirmationCryptoAmount.first()).toHaveText(
                formattedSendAmount,
            );
            await expect(tradingPage.confirmationCryptoAmount.last()).toHaveText(
                formattedReceiveAmount,
            );
            await expect(tradingPage.confirmationExchangeType).toHaveTranslation(
                'TR_EXCHANGE_FLOAT',
            );
            await expect(tradingPage.confirmationProvider).toHaveText(provider);
        });
    });
});
