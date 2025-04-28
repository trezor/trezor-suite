import { localizeNumber } from '@suite-common/wallet-utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    swapQuotesSolanaBTC,
    swapTradeSolanaBTC,
} from '../../fixtures/invity';
import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

// In beforeEach, We set initial status to 'SENDING'
const transactionStates = [
    { transactionStatus: 'CONFIRMING', displayedText: 'Pending' },
    { transactionStatus: 'CONVERTING', displayedText: 'Converting' },
    { transactionStatus: 'SUCCESS', displayedText: 'Approved' },
];

// Expected values based on our mocked responses
const sendAmount = swapQuotesSolanaBTC[1].sendStringAmount;
const provider = getCompanyNameFromList(swapQuotesSolanaBTC[1].exchange, 'swapList');
const formattedSendAmount = `${localizeNumber(sendAmount)} SOL`;
const formattedReceiveAmount = `${localizeNumber(swapQuotesSolanaBTC[1].receiveStringAmount)} BTC`;
const { sendAddress, receiveAddress } = swapTradeSolanaBTC;
const formattedSendAddress = formatAddress(sendAddress);
const toastText = `${formattedSendAmount} sent from Solana #1`;

test.describe('Trading - Swap coins', { tag: ['@group=other', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(
        async ({ page, onboardingPage, dashboardPage, tradingMock, walletPage, settingsPage }) => {
            await test.step('Mocking responses', async () => {
                await page.route(invityEndpoint.swapQuotes, route => {
                    route.fulfill({ json: swapQuotesSolanaBTC });
                });
                await tradingMock.routeSwapTrade(swapTradeSolanaBTC);
                await tradingMock.routeSolanaSendRequests();
                await page.route(invityEndpoint.swapWatch, async route => {
                    await route.fulfill({ json: { status: 'SENDING', sendAddress } });
                });
            });
            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({ enableNetworks: ['sol'] });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'sol' });
        },
    );

    test('Swap Solana to Bitcoin', async ({ tradingPage, page, tradingMock, devicePrompt }) => {
        await test.step('Fill in a Swap form', async () => {
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sendCurrency: 'solana',
                sendTicker: 'SOL',
                receiveCurrency: 'Bitcoin',
                receiveSymbol: 'btc',
                receiveNetwork: 'bitcoin',
            });
        });

        await test.step('Confirm the Swap trade', async () => {
            await expect(tradingPage.bestOfferAmount).toHaveText(formattedReceiveAmount);
            await tradingPage.clickSwapBestOfferAndWaitForFees();
            await tradingPage.confirmTrade('Bitcoin #1', receiveAddress);
        });

        await test.step('Verify all confirmation values', async () => {
            await expect(tradingPage.confirmationAccountDropdown).toContainText('Bitcoin #1');
            await expect(tradingPage.confirmationAddress).toContainText(receiveAddress);
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
            await page.clock.install();
            await devicePrompt.sendButton.click();
            await expect(tradingPage.transactionDetailStatus).toHaveText('Pending');
            await expect(page.getByTestId('@toast/tx-sent')).toContainText(toastText);
        });

        await test.step('Verify button opens provider support page in new tab', async () => {
            // There was minor instability, so we are adding retry to this step group
            await expect(async () => {
                const partnerPagePromise = page.context().waitForEvent('page', { timeout: 5_000 });
                await page.getByRole('link', { name: 'Go to provider support' }).click();
                const partnerTab = await partnerPagePromise;
                // Mocked data have URL changed to https://example.org/orders/{{orderId}} for stability reasons
                await expect(partnerTab).toHaveURL(/https:\/\/example\.org\/orders\//);
                await partnerTab.close();
            }).toPass({ timeout: 20_000 });
        });

        // Statuses: SENDING -> CONVERTING -> CONFIRMING -> SUCCESS
        for (const { transactionStatus, displayedText } of transactionStates) {
            await test.step(`Wait 30s for status change to ${displayedText}`, async () => {
                await tradingMock.routeAndWaitForWatchResponse(invityEndpoint.swapWatch, {
                    status: transactionStatus,
                    sendAddress,
                });
                await expect(tradingPage.transactionDetailStatus).toHaveText(displayedText);
            });
        }

        await test.step('Verify all transaction values', async () => {
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
