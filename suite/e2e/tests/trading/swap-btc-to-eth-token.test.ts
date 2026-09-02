import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { localizeNumber } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { getCompanyNameFromList } from '../../fixtures/trading';
import { swapStatusFlow } from '../../fixtures/trading/statusFlow';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { transformAddress } from '../../support/testExtends/customMatchers';

const sendAmount = '0.001';
const formattedSendAmount = `${localizeNumber(sendAmount)} BTC`;
const sendAccountLabel = 'Bitcoin #1';
const receiveAccountLabel = 'Ethereum #1';
const receiveTokenSymbol = 'USDC';

test.describe('Trading - Swap', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(
        async ({ onboardingPage, dashboardPage, settingsPage, walletPage, tradingMockNew }) => {
            tradingMockNew.setTradeFlow('swap');
            const btcBackend = await tradingMockNew.startBackend('btc');

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [{ symbol: 'btc', backend: btcBackend }, 'eth'],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'btc' });
        },
    );

    test('Swap BTC to ETH USDC token', async ({
        tradingPage,
        page,
        device,
        devicePrompt,
        tradingMockNew,
    }) => {
        await test.step('Fill in a Swap form', async () => {
            await tradingPage.fillSwapForm({
                amount: sendAmount,
                sellAsset: {
                    networkSymbol: 'btc',
                },
                buyAsset: {
                    searchFilter: receiveTokenSymbol,
                    networkFilter: 'eth',
                    assetCryptoId: getCryptoId(
                        asNetworkSymbol('eth'),
                        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                    ),
                },
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'eth');
                },
            });
        });

        let receiveAmount: string;
        let providerName: string;
        let liveTradePromise: ReturnType<typeof tradingMockNew.waitForLiveTrade>;

        await test.step('Confirm the Swap trade', async () => {
            receiveAmount = await tradingPage.quotes.getBestOfferAmount();
            await tradingPage.fees.waitToBeCalculated();
            liveTradePromise = tradingMockNew.waitForLiveTrade();
            await tradingPage.swapBestOfferButton.click();
        });

        await test.step('Open modal and verify recipient on prompt and device', async () => {
            await tradingPage.confirmation.openConfirmAndSendModal();
            await liveTradePromise;
            providerName = getCompanyNameFromList(tradingMockNew.liveTrade.exchange, 'swapList');

            await expect(devicePrompt.header.accountLabel).toHaveText(sendAccountLabel);
            await expect(devicePrompt.outputValueOf('address')).toHaveText(
                formatAddressWithNewlines(tradingMockNew.liveTrade.sendAddress),
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [
                        transformAddress(tradingMockNew.liveTrade.sendAddress, 'fourTetragrams'),
                    ],
                    actions: { right_button: 'Continue' },
                },
                T3T1: {
                    header: { title: 'Address', subtitle: 'Recipient #1' },
                },
            });
            await devicePrompt.waitForPromptAndConfirm();
        });

        await test.step('Verify amount on prompt and device', async () => {
            await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                formattedSendAmount,
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [['Amount'], [formattedSendAmount]],
                    actions: { right_button: 'Confirm' },
                },
                T3T1: {
                    header: { title: 'Amount', subtitle: 'Recipient #1' },
                    body: [[formattedSendAmount]],
                },
            });
            await devicePrompt.waitForPromptAndConfirm();
        });

        await test.step('Verify total and fee on prompt and device', async () => {
            // The BTC fee is live; derive the total from it and crosscheck modal against device.
            await expect(devicePrompt.cryptoAmountOf('fee')).toHaveText(/\d/);
            const reviewFee = await devicePrompt.cryptoAmountOf('fee').innerText();
            const totalAmount = new BigNumber(reviewFee).plus(sendAmount).toString();
            await expect(devicePrompt.cryptoAmountWithSymbolOf('total')).toHaveText(
                `${totalAmount} BTC`,
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [
                        ['Total amount'],
                        [`${totalAmount} BTC`],
                        ['incl. Transaction fee'],
                        [`${reviewFee} BTC`],
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

            await tradingPage.verifySwapToast({
                sendAccount: sendAccountLabel,
                receiveAccount: receiveAccountLabel,
                // The toast echoes the provider's formatting of the amount, not the one we typed.
                sendAmount: tradingMockNew.liveTrade.sendStringAmount,
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
                `${receiveAmount} ${receiveTokenSymbol}`,
            );
            await expect(tradingPage.confirmation.provider).toHaveText(providerName);
        });
    });
});
