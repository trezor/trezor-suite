import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { localizeNumber } from '@suite-common/wallet-utils';

import { swapStatusFlow } from '../../fixtures/trading/statusFlow';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { transformAddress } from '../../support/testExtends/customMatchers';

const solSymbol = asNetworkSymbol('sol');
const ethSymbol = asNetworkSymbol('eth');

const sendAmount = '5';
const tokenSymbol = 'USDT';
const formattedSendAmount = `${localizeNumber(sendAmount)} ${tokenSymbol}`;
const sendAccountLabel = 'Solana #1';
const receiveAccountLabel = 'Ethereum #1';

test.describe('Trading - Swap', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(
        async ({ onboardingPage, dashboardPage, settingsPage, walletPage, tradingMockNew }) => {
            tradingMockNew.setTradeFlow('swap');
            const solBackend = await tradingMockNew.startBackend(solSymbol);

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [ethSymbol, { symbol: solSymbol, backend: solBackend }],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: solSymbol });
        },
    );

    test('Swap SOL USDT token to ETH', async ({
        tradingPage,
        page,
        device,
        devicePrompt,
        tradingMockNew,
        tradingResponses,
    }) => {
        await test.step('Fill in a Swap form', async () => {
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sellAsset: {
                    networkSymbol: solSymbol,
                    tokenSymbol,
                },
                buyAsset: {
                    searchFilter: 'Ethereum',
                    networkFilter: ethSymbol,
                    assetCryptoId: getCryptoId(ethSymbol),
                },
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, ethSymbol);
                },
            });
        });

        let receiveAmount: string;
        let providerName: string;

        await test.step('Confirm the Swap trade', async () => {
            receiveAmount = await tradingPage.quotes.getBestOfferAmount();
            await expect(tradingPage.fees.maximumFeeAmountToBeCalculated).toBeHidden();
            await tradingPage.swapBestOfferButton.click();
        });

        await test.step('Open modal and verify recipient on prompt and device', async () => {
            const { exchange, sendAddress } = await tradingResponses.swap.trade();
            providerName = await tradingResponses.swap.companyName(exchange);

            await tradingPage.confirmation.openConfirmAndSendModal();

            await expect(devicePrompt.header.accountLabel).toHaveText(sendAccountLabel);
            await expect(devicePrompt.outputValueOf('address')).toHaveText(
                formatAddressWithNewlines(sendAddress),
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Recipient' },
                    body: [transformAddress(sendAddress, 'fourTetragrams')],
                    actions: { right_button: 'Continue' },
                },
            });
            await devicePrompt.waitForPromptAndConfirm();
        });

        await test.step('Verify amount and fee on prompt and device', async () => {
            await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                formattedSendAmount,
            );
            const reviewFee = (await devicePrompt.cryptoAmountOf('fee').innerText())?.trim();
            if (!reviewFee) {
                throw new Error('Review fee amount was not displayed on the confirmation modal');
            }
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [
                        ['Amount'],
                        [formattedSendAmount],
                        ['Max fees and rent'],
                        device.wrapText(`${reviewFee} SOL`, { wrapByWords: true }),
                    ],
                    actions: { right_button: 'Hold to sign' },
                },
                T3T1: {
                    header: { title: 'Summary' },
                },
            });
            await devicePrompt.waitForFinalPromptAndConfirm();
            await expect(devicePrompt.sendButton).toBeEnabled();
        });

        await test.step('Send crypto to provider (broadcast blocked by mock)', async () => {
            await tradingMockNew.setStatus('SENDING');
            await page.clock.install();
            await devicePrompt.sendButton.click();

            const { sendStringAmount } = await tradingResponses.swap.trade();

            await tradingPage.verifySwapToast({
                sendAccount: sendAccountLabel,
                receiveAccount: receiveAccountLabel,
                // The toast echoes the provider's formatting of the amount, not the one we typed.
                sendAmount: sendStringAmount,
                receiveAmount,
            });
        });

        for (const step of swapStatusFlow) {
            await test.step(`Wait for status change to ${step.status}`, async () => {
                await tradingMockNew.advanceStatus(step.status);
                const values = step.translationValues?.(providerName);
                await expect(tradingPage.transactionDetailStatus).toHaveTranslation(
                    step.translationKey,
                    { values },
                );
            });
        }

        await test.step('Verify transaction detail values', async () => {
            await expect(tradingPage.confirmation.sendCryptoAmount).toHaveText(formattedSendAmount);
            await expect(tradingPage.confirmation.receiveCryptoAmount).toHaveText(
                `${receiveAmount} ETH`,
            );
            await expect(tradingPage.confirmation.provider).toHaveText(providerName);
        });
    });
});
