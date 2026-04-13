import { CryptoId } from 'invity-api';

import { localizeNumber } from '@suite-common/wallet-utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    swapQuotesSolanaUSDC,
    swapTradeSolanaUSDC,
} from '../../fixtures/invity';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// Expected values based on our mocked responses
const sendAmount = swapQuotesSolanaUSDC[0].sendStringAmount;
const receiveAmount = localizeNumber(swapQuotesSolanaUSDC[0].receiveStringAmount);
const provider = getCompanyNameFromList(swapQuotesSolanaUSDC[0].exchange, 'swapList');
const formattedSendAmount = `${localizeNumber(sendAmount)} SOL`;
const formattedReceiveAmount = `${receiveAmount} USDC`;
const { sendAddress, receive: usdcMint } = swapTradeSolanaUSDC;
const formattedSendAddress = formatAddressWithNewlines(sendAddress);

test.describe('Trading - Swap coin to token', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
    });
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
                sellAsset: {
                    searchFilter: 'Solana #1',
                    networkSymbol: 'sol',
                },
                buyAsset: {
                    searchFilter: 'USDC',
                    networkFilter: 'eth',
                    assetCryptoId: usdcMint as CryptoId,
                },
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0);
                },
            });
        });

        await test.step('Confirm the Swap trade', async () => {
            await expect(tradingPage.quotes.bestOfferAmount).toHaveText(formattedReceiveAmount);
            await tradingPage.waitForSolanaFeesAndClickSwapBestOffer();
        });

        await test.step('Initiate send', async () => {
            await tradingPage.confirmation.initiateSendConfirmation();
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
            await expect(tradingPage.swapToastSendAccount).toContainText('Solana #1');
            await expect(tradingPage.swapToastReceiveAccount).toContainText('Ethereum #1');
            await expect(tradingPage.swapToastSendAmount).toContainText(sendAmount);
            await expect(tradingPage.swapToastReceiveAmount).toContainText(receiveAmount);
            await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                'TR_EXCHANGE_DETAIL_SUCCESS_TITLE',
            );
            await expect(tradingPage.confirmation.cryptoAmount.first()).toHaveText(
                formattedSendAmount,
            );
            await expect(tradingPage.confirmation.cryptoAmount.last()).toHaveText(
                formattedReceiveAmount,
            );
            await expect(tradingPage.confirmation.exchangeType).toHaveTranslation(
                'TR_EXCHANGE_FLOAT',
            );
            await expect(tradingPage.confirmation.provider).toHaveText(provider);
        });

        await test.step('Return to account swap form', async () => {
            await tradingPage.backToAccountButton('Swap').click();
            await expect(page).toHaveURL(/\/accounts\/coinmarket\/exchange$/);
        });
    });
});
