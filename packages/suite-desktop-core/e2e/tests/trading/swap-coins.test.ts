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
            await dashboardPage.discoveryShouldFinish();
            await settingsPage.navigateTo('coins');
            await settingsPage.coins.enableNetwork('sol');
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading();
        },
    );

    test('Swap Solana to Bitcoin', async ({ marketPage, page, tradingMock, devicePrompt }) => {
        await test.step('Fill in a Swap form', async () => {
            await marketPage.setYouSwapAmount({
                amount: sendAmount,
                sendCurrency: 'solana',
                sendTicker: 'SOL',
                receiveCurrency: 'Bitcoin',
                receiveSymbol: 'btc',
                receiveNetwork: 'bitcoin',
            });
        });

        await test.step('Confirm the Swap trade', async () => {
            await expect(marketPage.bestOfferAmount).toHaveText(formattedReceiveAmount);
            await marketPage.clickSwapBestOfferAndWaitForFees();
            await marketPage.confirmTrade(formatAddress(receiveAddress));
        });

        await test.step('Verify all confirmation values', async () => {
            await expect(marketPage.confirmationAccountDropdown).toContainText('Bitcoin #1');
            await expect(marketPage.confirmationAddress).toContainText(receiveAddress);
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
            await marketPage.initiateSendConfirmation();
            await expect(devicePrompt.outputValueOf('address')).toHaveText(formattedSendAddress);
            await expect(devicePrompt.cryptoAmountOf('total')).toHaveText(formattedSendAmount);
        });

        // Thanks to our mocked responses, the crypto is actually not send.
        await test.step('Send crypto to provider', async () => {
            await page.clock.install();
            await devicePrompt.sendButton.click();
            await expect(marketPage.transactionDetailStatus).toHaveText('Pending');
            await expect(page.getByRole('link', { name: 'Go to provider support' })).toBeVisible();
            await expect(page.getByTestId('@toast/tx-sent')).toContainText(toastText);
        });

        // Statuses: SENDING -> CONVERTING -> CONFIRMING -> SUCCESS
        for (const { transactionStatus, displayedText } of transactionStates) {
            await test.step(`Wait 30s for status change to ${displayedText}`, async () => {
                await tradingMock.routeAndWaitForWatchResponse(invityEndpoint.swapWatch, {
                    status: transactionStatus,
                    sendAddress,
                });
                await expect(marketPage.transactionDetailStatus).toHaveText(displayedText);
            });
        }
    });
});
