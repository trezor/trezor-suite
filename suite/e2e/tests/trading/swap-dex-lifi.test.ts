import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { fromGwei, localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { swapStatusFlow } from '../../fixtures/trading/statusFlow';
import { expect, test } from '../../support/fixtures';

const ethSymbol = asNetworkSymbol('eth');
const sendAmount = '0.03';
const formattedSendAmount = `${localizeNumber(sendAmount)} ETH`;
const accountLabel = 'Ethereum #1';
const usdcCryptoId = getCryptoId(ethSymbol, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const usdcDecimals = 6;

// A DEX swap broadcasts the swap itself, so there is no CONFIRMING deposit phase.
const dexStatusFlow = swapStatusFlow.filter(phase => phase.status !== 'CONFIRMING');

// Firmware strings on the DEX review pages.
const deviceReview = {
    providerTitle: 'Provider',
    // The emulator still runs the previous FW release, which renders 'LiFI Diamond'.
    // TODO: change to 'LI.FI' once trezor-user-env ships the firmware with the renamed provider.
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

test.describe('Trading - DEX swap (LI.FI)', { tag: ['@T3T1', '@T3W1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(
        async ({ onboardingPage, dashboardPage, settingsPage, walletPage, tradingMockNew }) => {
            tradingMockNew.setTradeFlow('swap');
            const ethBackend = await tradingMockNew.startBackend(ethSymbol);
            await tradingMockNew.captureTxSimulation();

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [{ symbol: ethSymbol, backend: ethBackend }],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: ethSymbol });
        },
    );

    test('User can swap ETH to USDC via LI.FI DEX', async ({
        page,
        device,
        tradingPage,
        devicePrompt,
        tradingMockNew,
        tradingResponses,
    }) => {
        const dexProvider = await tradingResponses.swap.companyName('lifi');

        await test.step('Fill in the Swap form (ETH -> USDC)', async () => {
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sellAsset: { networkSymbol: ethSymbol },
                buyAsset: {
                    searchFilter: 'USDC',
                    networkFilter: ethSymbol,
                    assetCryptoId: usdcCryptoId,
                },
            });
        });

        let reviewedGasLimit: string;
        let maxFeePerGas: string;
        let feeRate: string;
        let priorityFeeRate: string;

        await test.step('Select the LI.FI DEX offer', async () => {
            await tradingPage.quotes.chooseDifferentOfferIfAvailable(dexProvider);
            await expect(tradingPage.quotes.selectedProviderName).toHaveText(dexProvider);
            await tradingPage.quotes.waitForSync();

            let maxFeePerGasRounded: string;
            let maxPriorityFeePerGasRounded: string;
            ({ maxFeePerGas, maxFeePerGasRounded, maxPriorityFeePerGasRounded } =
                await tradingPage.fees.getStandardFeeWorkaround());
            feeRate = `${maxFeePerGasRounded} Gwei`;
            priorityFeeRate = `${maxPriorityFeePerGasRounded} Gwei`;

            await tradingPage.swapBestOfferButton.click();
        });

        // The DEX re-quotes on trade creation, so amounts come from the trade, not the offer.
        let receiveAmount: string;
        let formattedReceiveAmount: string;
        let minimumReceived: BigNumber;
        let formattedMinimumReceived: string;
        let promptMinimumReceived: string;
        let displayedMinimumReceived: string;
        let slippagePercent: string;

        await test.step('Verify DEX details on the Confirm & send screen', async () => {
            const { receiveStringAmount, swapSlippage, receive } =
                await tradingResponses.swap.trade();
            receiveAmount = localizeNumber(receiveStringAmount);
            formattedReceiveAmount = `${receiveAmount} USDC`;
            slippagePercent = `${swapSlippage}%`;
            const guaranteedShare = new BigNumber(100).minus(swapSlippage).div(100);
            minimumReceived = new BigNumber(receiveStringAmount).times(guaranteedShare);
            formattedMinimumReceived = `${localizeNumber(minimumReceived.toFixed(4))} USDC`;
            promptMinimumReceived = `${minimumReceived.toFixed()} USDC`;
            // The device renders the amount at USDC's own precision, rounded and zero-trimmed.
            displayedMinimumReceived = `${minimumReceived.decimalPlaces(usdcDecimals).toFixed()} USDC`;

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

            // The subtitle appears only once the simulation settles, gating the amount assertion
            // below on the simulated value instead of the skeleton.
            await expect(tradingPage.confirmation.dexSimulationSubtitle).toHaveTranslation(
                'TR_SIMULATION_POWERED_BY',
                { values: { provider: 'Blockaid' } },
            );
            // Every re-quote refetches the simulation with a freshly credited amount, so the
            // rendered value is compared against the last captured scan on each attempt.
            await expect(async () => {
                await expect(tradingPage.confirmation.receiveCryptoAmount).toHaveText(
                    `${localizeNumber(tradingMockNew.simulatedReceiveAmount(receive))} USDC`,
                    { timeout: 2_000 },
                );
            }).toPass({ timeout: 15_000 });
            // The simulation credits close to what the trade promised, so the swap has no issue to
            // resolve. Were the banner to show up, it would also replace the confirm button below.
            await expect(tradingPage.confirmation.issueBanner).toBeHidden();
        });

        await test.step('Open Confirm & send modal', async () => {
            await tradingPage.confirmation.openConfirmAndSendModal();
        });

        await test.step('Confirm the DEX transaction on device', async () => {
            const { receiveAddress } = await tradingResponses.swap.trade();

            await devicePrompt.confirmOnDevicePromptIsShown();

            await expect(devicePrompt.outputValueOf('recipient_name')).toHaveText(dexProvider);
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: deviceReview.providerTitle },
                    body: [[dexProvider]],
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
                `+ ${promptMinimumReceived}`,
            );
            // The recipient is the user's own receive address, not the LI.FI router (dexTx.to).
            await expect(devicePrompt.assetsReceiveAddress).toHaveText(receiveAddress);
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: deviceReview.contractTitle },
                    body: [
                        [deviceReview.sendLabel],
                        device.wrapText(formattedSendAmount, { isAmount: true }),
                        [deviceReview.receiveLabel],
                        device.wrapText(displayedMinimumReceived, { isAmount: true }),
                    ],
                    actions: { right_button: deviceReview.confirmButton },
                },
            });
            await devicePrompt.waitForPromptAndConfirm();

            await expect(devicePrompt.header.feePerGasRate).toHaveText(feeRate);
            await expect(devicePrompt.header.priorityFeeRate).toHaveText(priorityFeeRate);
            reviewedGasLimit = await devicePrompt.header.gasLimitValue.innerText();
            const maximumFeeInGwei = new BigNumber(maxFeePerGas).times(reviewedGasLimit).toFixed();
            const maximumFee = `${localizeNumber(fromGwei(maximumFeeInGwei).toEther())} ETH`;
            await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(maximumFee);
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: deviceReview.feeTitle },
                    body: [
                        [deviceReview.feeLabel],
                        device.wrapText(maximumFee, { isAmount: true }),
                    ],
                    actions: { right_button: deviceReview.signButton },
                },
            });
            await devicePrompt.waitForFinalPromptAndConfirm();
        });

        await test.step('Re-verify the fully revealed review form', async () => {
            const { receiveAddress } = await tradingResponses.swap.trade();

            await expect(devicePrompt.outputValueOf('recipient_name')).toHaveText(dexProvider);
            await expect(devicePrompt.outputValueOf('swap_intent')).toHaveTranslation(
                'TR_TRADING_INTENT_SWAP',
            );
            await expect(devicePrompt.assetsSendCryptoAmount).toHaveText(
                `- ${formattedSendAmount}`,
            );
            await expect(devicePrompt.assetsReceiveCryptoAmount).toHaveText(
                `+ ${promptMinimumReceived}`,
            );
            await expect(devicePrompt.assetsReceiveAddress).toHaveText(receiveAddress);
            await expect(devicePrompt.header.gasLimitValue).toHaveText(reviewedGasLimit);
        });

        await test.step('Send the DEX transaction (broadcast blocked by mock)', async () => {
            await tradingMockNew.setStatus('SENDING');
            await page.clock.install();
            await devicePrompt.sendButton.click();

            const { sendStringAmount } = await tradingResponses.swap.trade();

            await tradingPage.verifySwapToast({
                sendAccount: accountLabel,
                receiveAccount: accountLabel,
                // The toast echoes the provider's formatting of the amount, not the one we typed.
                sendAmount: sendStringAmount,
                receiveAmount,
            });
        });

        for (const step of dexStatusFlow) {
            await test.step(`Wait for status change to ${step.status}`, async () => {
                await tradingMockNew.advanceStatus(step.status);
                await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                    step.translationKey,
                    { values: step.translationValues?.(dexProvider) },
                );
            });
        }

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
