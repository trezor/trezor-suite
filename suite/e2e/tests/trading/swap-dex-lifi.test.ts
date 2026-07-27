import type { CryptoId } from 'invity-api';

import { messages } from '@suite/intl';
import { localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    swapQuotesEthDex,
    swapTradeEthDex,
} from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

// Expected values derived from the captured LI.FI trade fixture.
const sendAmount = swapTradeEthDex.sendStringAmount;
const receiveAmount = localizeNumber(swapTradeEthDex.receiveStringAmount);
const dexProvider = getCompanyNameFromList(swapTradeEthDex.exchange, 'swapList');
const formattedSendAmount = `${localizeNumber(sendAmount)} ETH`;
const formattedReceiveAmount = `${receiveAmount} USDC`;
const usdcCryptoId = swapTradeEthDex.receive as CryptoId;
const slippagePercent = `${swapTradeEthDex.swapSlippage}%`;
const guaranteedShare = new BigNumber(100).minus(swapTradeEthDex.swapSlippage).div(100);
const minimumReceived = new BigNumber(swapTradeEthDex.receiveStringAmount).times(guaranteedShare);
const formattedMinimumReceived = `${localizeNumber(minimumReceived.toFixed(4))} USDC`;
// Mocked feeLimit 21000 (eth-endpoints estimateFee) × the 1.25 DEX buffer (ETHEREUM_ADJUST_GAS_LIMIT).
const dexGasLimit = '26250';
// dexGasLimit × the mocked gas price.
const dexMaximumFee = '0.00003161748342375 ETH';
const gasLimitWithLabel = `${messages.TR_GAS_LIMIT.defaultMessage}: ${dexGasLimit}`;
const accountLabel = 'Ethereum #1';

// Firmware strings on the DEX review pages.
const deviceReview = {
    providerTitle: 'Provider',
    providerName: 'LiFI Diamond',
    intentTitle: 'Intent',
    intentValue: 'Swap',
    contractTitle: 'Confirm contract',
    sendLabel: 'Amount to send',
    receiveLabel: 'Minimum to Receive',
    feeTitle: '', // this page renders no header title
    feeLabel: 'Maximum fee',
    confirmButton: 'Confirm',
    signButton: 'Hold to sign',
};

test.describe('Trading - DEX swap (LI.FI)', { tag: ['@webOnly', '@T3T1', '@T3W1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(
        async ({
            page,
            onboardingPage,
            dashboardPage,
            settingsPage,
            walletPage,
            tradingMock,
            blockbookMock,
        }) => {
            await test.step('Mock the ETH backend', async () => {
                await onboardingPage.completeOnboarding();
                await settingsPage.navigateTo('coins');
                await blockbookMock.start('eth');
                blockbookMock.updateAccountState({
                    balance: '1000000000000000000', // 1 ETH
                    nonce: '0',
                    txs: 0,
                    nonTokenTxs: 0,
                    internalTxs: 0,
                    transactions: [],
                });
                //TODO: Switch to changeNetworks once mocks are refactored
                await settingsPage.coinsTab.openNetworkAdvanceSettings('eth');
                await settingsPage.coinsTab.changeBackend('blockbook', blockbookMock.url);
            });

            await test.step('Mock the trading API', async () => {
                await tradingMock.routeInvityGeneralEndpoints();
                await page.route(invityEndpoint.swapQuotes, route => {
                    route.fulfill({ json: swapQuotesEthDex });
                });
                await tradingMock.routeSwapTrade(swapTradeEthDex);
                await page.route(invityEndpoint.swapWatch, route => {
                    route.fulfill({ json: { status: 'CONFIRM' } });
                });
            });

            await dashboardPage.navigateTo();
            await page.discoveryShouldFinish();
            await walletPage.openSwapTrading({ symbol: 'eth' });
        },
    );

    test('User can swap ETH to USDC via LI.FI DEX', async ({
        page,
        tradingPage,
        tradingMock,
        devicePrompt,
        device,
    }) => {
        await test.step('Fill in the Swap form (ETH -> USDC)', async () => {
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sellAsset: {
                    networkSymbol: 'eth',
                },
                buyAsset: {
                    searchFilter: 'USDC',
                    networkFilter: 'eth',
                    assetCryptoId: usdcCryptoId,
                },
            });
        });

        await test.step('Select the LI.FI DEX offer', async () => {
            await tradingPage.quotes.chooseDifferentOfferIfAvailable(dexProvider);
            await expect(tradingPage.quotes.selectedProviderName).toHaveText(dexProvider);
            await expect(tradingPage.quotes.bestOfferAmount).toHaveText(formattedReceiveAmount);
            await tradingPage.swapBestOfferButton.click();
        });

        await test.step('Verify DEX details on the Confirm & send screen', async () => {
            await expect(tradingPage.confirmation.dexExchangeType).toHaveTranslation(
                'TR_EXCHANGE_DEX',
            );
            await expect(tradingPage.confirmation.dexMaximumSlippage).toHaveText(slippagePercent);
            await expect(tradingPage.confirmation.dexMinimumReceivedAmount).toHaveText(
                formattedMinimumReceived,
            );

            // The fee's fiat value depends on live rates; assert only the format.
            await expect(tradingPage.confirmation.dexNetworkFee).toHaveText(/^≈\s\$\d+\.\d{2}$/);
            await expect(tradingPage.confirmation.provider).toHaveText(dexProvider);
            await expect(tradingPage.confirmation.sendAccount).toHaveText(`from ${accountLabel}`);
            await expect(tradingPage.confirmation.receiveAccount).toHaveText(`to ${accountLabel}`);
            await expect(tradingPage.confirmation.sendCryptoAmount).toHaveText(formattedSendAmount);
            await expect(tradingPage.confirmation.receiveCryptoAmount).toHaveText(
                formattedReceiveAmount,
            );
        });

        await test.step('Open Confirm & send modal', async () => {
            await tradingPage.confirmation.openConfirmAndSendModal();
        });

        await test.step('Confirm the DEX transaction on device', async () => {
            await devicePrompt.confirmOnDevicePromptIsShown();

            await expect(devicePrompt.outputValueOf('recipient_name')).toHaveText(
                deviceReview.providerName,
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: deviceReview.providerTitle },
                    body: [[deviceReview.providerName]],
                    actions: { right_button: deviceReview.confirmButton },
                },
            });
            await devicePrompt.waitForPromptAndConfirm();

            await expect(devicePrompt.outputValueOf('swap_intent')).toHaveTranslation(
                'TR_TRADING_INTENT_SWAP',
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: deviceReview.intentTitle },
                    body: [[deviceReview.intentValue]],
                    actions: { right_button: deviceReview.confirmButton },
                },
            });
            await devicePrompt.waitForPromptAndConfirm();

            await expect(devicePrompt.assetsSendCryptoAmount).toHaveText(
                `- ${formattedSendAmount}`,
            );
            await expect(devicePrompt.assetsReceiveCryptoAmount).toHaveText(
                `+ ${minimumReceived.toFixed()} USDC`,
            );
            // The recipient is the user's own receive address, not the LI.FI router (dexTx.to).
            await expect(devicePrompt.assetsReceiveAddress).toHaveText(
                swapTradeEthDex.receiveAddress,
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: deviceReview.contractTitle },
                    body: [
                        [deviceReview.sendLabel],
                        device.wrapText(formattedSendAmount, { isAmount: true }),
                        [deviceReview.receiveLabel],
                        device.wrapText(`${minimumReceived.toFixed(6)} USDC`, { isAmount: true }),
                    ],
                    actions: { right_button: deviceReview.confirmButton },
                },
            });
            await devicePrompt.waitForPromptAndConfirm();

            await expect(devicePrompt.ethereumGasLimit).toHaveText(gasLimitWithLabel);
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: deviceReview.feeTitle },
                    body: [
                        [deviceReview.feeLabel],
                        device.wrapText(dexMaximumFee, { isAmount: true }),
                    ],
                    actions: { right_button: deviceReview.signButton },
                },
            });
            await devicePrompt.waitForFinalPromptAndConfirm();
        });

        await test.step('Re-verify the fully revealed review form', async () => {
            await expect(devicePrompt.outputValueOf('recipient_name')).toHaveText(
                deviceReview.providerName,
            );
            await expect(devicePrompt.outputValueOf('swap_intent')).toHaveTranslation(
                'TR_TRADING_INTENT_SWAP',
            );
            await expect(devicePrompt.assetsSendCryptoAmount).toHaveText(
                `- ${formattedSendAmount}`,
            );
            await expect(devicePrompt.assetsReceiveCryptoAmount).toHaveText(
                `+ ${minimumReceived.toFixed()} USDC`,
            );
            await expect(devicePrompt.assetsReceiveAddress).toHaveText(
                swapTradeEthDex.receiveAddress,
            );
            await expect(devicePrompt.ethereumGasLimit).toHaveText(gasLimitWithLabel);
        });

        await test.step('Broadcast the signed DEX transaction', async () => {
            await page.clock.install();
            await devicePrompt.sendButton.click();
            await tradingPage.verifySwapToast({
                sendAccount: accountLabel,
                receiveAccount: accountLabel,
                sendAmount,
                receiveAmount,
            });
        });

        await test.step('Wait 30s for watch refresh and status change to Processing', async () => {
            await tradingMock.routeAndWaitForWatchResponse(invityEndpoint.swapWatch, {
                status: 'CONVERTING',
            });
            await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                'TR_TRADING_DETAIL_PROCESSING',
                { values: { providerName: dexProvider, type: 'swap' } },
            );
        });

        await test.step('Wait 30s for watch refresh and status change to Success', async () => {
            await tradingMock.routeAndWaitForWatchResponse(invityEndpoint.swapWatch, {
                status: 'SUCCESS',
            });
            await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                'TR_EXCHANGE_DETAIL_SUCCESS_TITLE',
            );
        });

        await test.step('Verify final transaction detail values', async () => {
            await expect(tradingPage.confirmation.sendCryptoAmount).toHaveText(formattedSendAmount);
            await expect(tradingPage.confirmation.receiveCryptoAmount).toHaveText(
                formattedReceiveAmount,
            );
            await expect(tradingPage.confirmation.provider).toHaveText(dexProvider);
            await expect(tradingPage.confirmation.dexMaximumSlippage).toHaveText(slippagePercent);
            await expect(tradingPage.confirmation.dexMinimumReceivedAmount).toHaveText(
                formattedMinimumReceived,
            );
            await expect(tradingPage.confirmation.detailSendAccount).toHaveText(
                `from ${accountLabel}`,
            );
            await expect(tradingPage.confirmation.detailReceiveAccount).toHaveText(
                `to ${accountLabel}`,
            );
        });
    });
});
