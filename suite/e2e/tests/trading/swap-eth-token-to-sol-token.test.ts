import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { localizeNumber } from '@suite-common/wallet-utils';

import { getCompanyNameFromList } from '../../fixtures/trading';
import { swapStatusFlow } from '../../fixtures/trading/statusFlow';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { transformAddress } from '../../support/testExtends/customMatchers';

const sendAmount = '5';
const sourceTokenSymbol = 'USDC';
const formattedSendAmount = `${localizeNumber(sendAmount)} ${sourceTokenSymbol}`;
const sendAccountLabel = 'Ethereum #1';
const receiveAccountLabel = 'Solana #1';
const receiveTokenSymbol = 'USDT';

test.describe('Trading - Swap', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(
        async ({ onboardingPage, dashboardPage, settingsPage, walletPage, tradingMockNew }) => {
            tradingMockNew.setTradeFlow('swap');
            const ethBackend = await tradingMockNew.startBackend('eth');

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [{ symbol: 'eth', backend: ethBackend }, 'sol'],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'eth' });
        },
    );

    test('Swap ETH USDC token to SOL USDT token', async ({
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
                    networkSymbol: 'eth',
                    tokenSymbol: sourceTokenSymbol,
                },
                buyAsset: {
                    searchFilter: receiveTokenSymbol,
                    networkFilter: 'sol',
                    assetCryptoId: getCryptoId(
                        asNetworkSymbol('sol'),
                        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
                    ),
                },
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'sol');
                },
            });
        });

        let receiveAmount: string;
        let providerName: string;
        let liveTradePromise: ReturnType<typeof tradingMockNew.waitForLiveTrade>;

        await test.step('Confirm the Swap trade', async () => {
            receiveAmount = await tradingPage.quotes.getBestOfferAmount();
            await expect(tradingPage.fees.maximumFeeAmountToBeCalculated).toBeHidden();
            liveTradePromise = tradingMockNew.waitForLiveTrade();
            await tradingPage.swapBestOfferButton.click();
        });

        await test.step('Open modal and verify recipient on prompt and device', async () => {
            await tradingPage.confirmation.openConfirmAndSendModal();
            await liveTradePromise;
            providerName = getCompanyNameFromList(tradingMockNew.liveTrade.exchange, 'swapList');

            await expect(devicePrompt.headerParagraph).toContainText(sendAccountLabel);
            await expect(devicePrompt.outputValueOf('address')).toHaveText(
                formatAddressWithNewlines(tradingMockNew.liveTrade.sendAddress),
            );
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [transformAddress(tradingMockNew.liveTrade.sendAddress, 'evmTetragrams')],
                    actions: { right_button: 'Continue' },
                },
                T3T1: {
                    header: { title: 'Address', subtitle: 'Recipient' },
                    body: [transformAddress(tradingMockNew.liveTrade.sendAddress, 'evmTetragrams')],
                },
            });
            await devicePrompt.waitForPromptAndConfirm();
        });

        await test.step('Verify amount and fee on prompt and device', async () => {
            await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                formattedSendAmount,
            );
            // The EVM max fee is live; we just crosscheck modal and device.
            const reviewFee = (await devicePrompt.cryptoAmountOf('fee').innerText())?.trim();
            if (!reviewFee) {
                throw new Error('Review fee amount was not displayed on the confirmation modal');
            }
            const maxFeeWrapped = device.wrapText(`${reviewFee} ETH`, { isAmount: true });
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Send' },
                    body: [['Amount'], [formattedSendAmount], ['Maximum fee'], maxFeeWrapped],
                    actions: { right_button: 'Hold to sign' },
                },
                T3T1: {
                    header: { title: 'Summary' },
                    body: [['Amount'], [formattedSendAmount], ['Maximum fee'], maxFeeWrapped],
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
                sendAmount,
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
