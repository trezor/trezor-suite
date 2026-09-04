import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { localizeNumber } from '@suite-common/wallet-utils';

import { swapStatusFlow } from '../../fixtures/trading/statusFlow';
import { formatAddressWithNewlines } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { transformAddress } from '../../support/testExtends/customMatchers';

const ethSymbol = asNetworkSymbol('eth');
const solSymbol = asNetworkSymbol('sol');

const sendAmount = '0.01';
const formattedSendAmount = `${localizeNumber(sendAmount)} ETH`;
const sendAccountLabel = 'Ethereum #1';
const receiveAccountLabel = 'Solana #1';

test.describe('Trading - Swap', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });

    test.beforeEach(
        async ({ onboardingPage, dashboardPage, settingsPage, walletPage, tradingMockNew }) => {
            tradingMockNew.setTradeFlow('swap');
            const ethBackend = await tradingMockNew.startBackend(ethSymbol);

            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({
                enableNetworks: [{ symbol: ethSymbol, backend: ethBackend }, solSymbol],
            });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: ethSymbol });
        },
    );

    test('Swap ETH to SOL', async ({
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
                    networkSymbol: ethSymbol,
                },
                buyAsset: {
                    searchFilter: 'Solana',
                    assetCryptoId: getCryptoId(solSymbol),
                },
                selectReceiveAddress: async () => {
                    await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, solSymbol);
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
                    header: { title: 'Send' },
                    body: [transformAddress(sendAddress, 'evmTetragrams')],
                    actions: { right_button: 'Continue' },
                },
                T3T1: {
                    header: { title: 'Address', subtitle: 'Recipient' },
                    body: [transformAddress(sendAddress, 'evmTetragrams')],
                },
            });
            await devicePrompt.waitForPromptAndConfirm();
        });

        await test.step('Verify amount and fee on prompt and device', async () => {
            await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                formattedSendAmount,
            );
            // The EVM max fee is live; we just crosscheck modal and device.
            const reviewFee = await devicePrompt.cryptoAmountOf('fee').innerText();
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
                `${receiveAmount} SOL`,
            );
            await expect(tradingPage.confirmation.provider).toHaveText(providerName);
        });
    });
});
