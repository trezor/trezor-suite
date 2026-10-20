import { formatEther, parseEther } from 'viem';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';
import { localizeNumber } from '@trezor/utils';

import { formatAddressWithNewlines, toCompactAmount } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { transformAddress } from '../../support/testExtends/customMatchers';

const ethSymbol = asNetworkSymbol('eth');
const accountLabel = 'Ethereum #1';
// Ethereum #1 of mnemonic_all (m/44'/60'/0'/0/0)
const senderAddress = '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8';
const recipientAddress = '0xdcaB74E62b9D08a9f8Fa4A3Ccb5c46AE039C9d7C';
const formattedRecipientAddress = formatAddressWithNewlines(recipientAddress);
const fundedAmount = '1';
const sendAmount = '0.1';
const formattedSendAmount = `${localizeNumber(sendAmount)} ETH`;

test.describe('Send ETH on a mainnet fork', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    test.beforeEach(async ({ page, anvil, onboardingPage, settingsPage, walletPage }) => {
        // The fork carries real mainnet state, so the funded balance replaces whatever is there.
        await anvil.setBalance(senderAddress, parseEther(fundedAmount));
        await page.clock.install();
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({
            enableNetworks: [anvil.networkToEnable],
        });
        await walletPage.openAccount({ symbol: ethSymbol });
    });

    test(
        'User can send ETH and the transfer is executed on chain',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ anvil, device, devicePrompt, walletPage, tradingPage, toastSection, page }) => {
            const recipientBalanceBefore = await anvil.getBalance(recipientAddress);
            const senderNonceBefore = await anvil.getTransactionCount(senderAddress);

            await expect(walletPage.balanceOfAccount({ symbol: ethSymbol })).toHaveText(
                toCompactAmount(fundedAmount),
            );

            await test.step('Fill in a Send form', async () => {
                await walletPage.openSendFormButton.click();
                await tradingPage.sendAddressInput.fill(recipientAddress);
                await tradingPage.sendAmountInput.fill(sendAmount);
            });

            const { gasLimit, maxFeePerGas, maxPriorityFeePerGasRounded, maxFeePerGasRounded } =
                await tradingPage.fees.getStandardFeeWorkaround();
            const { ethereumMaximumFee, errorMessageMaxCalculation } =
                tradingPage.fees.calculateEthereumMaxFee({ gasLimit, maxFeePerGas });

            await test.step('Verify Recipient address', async () => {
                await tradingPage.sendButton.click();
                await expect(devicePrompt.header.accountLabel).toHaveText(accountLabel);
                await expect(devicePrompt.outputValueOf('address')).toHaveText(
                    formattedRecipientAddress,
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Send' },
                        body: [transformAddress(recipientAddress, 'evmTetragrams')],
                        actions: { right_button: 'Continue' },
                    },
                    T3T1: {
                        header: { title: 'Address', subtitle: 'Recipient' },
                        body: [transformAddress(recipientAddress, 'evmTetragrams')],
                    },
                });
            });

            await test.step('Verify Total including fee', async () => {
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.header.gasLimitValue).toHaveText(gasLimit);
                await expect(devicePrompt.header.feePerGasValue).toHaveText(maxFeePerGasRounded);
                await expect(devicePrompt.header.priorityFeeValue).toHaveText(
                    maxPriorityFeePerGasRounded,
                );
                await expect(devicePrompt.cryptoAmountOf('amount')).toHaveText(sendAmount);
                await expect(
                    devicePrompt.cryptoAmountOf('fee'),
                    errorMessageMaxCalculation,
                ).toHaveText(ethereumMaximumFee);
                const maxFeeWrapped = device.wrapText(`${ethereumMaximumFee} ETH`, {
                    isAmount: true,
                });
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
            });

            await test.step('Sign and broadcast the transaction', async () => {
                await devicePrompt.waitForPromptAndConfirm();
                await page.expectReduxObjectToEqual('wallet.send.serializedTx.symbol', ethSymbol);
                await devicePrompt.sendButton.click();
                await toastSection.verifyTxSentToast({
                    account: accountLabel,
                    amount: formattedSendAmount,
                });
            });

            await test.step('Transfer is executed on chain', async () => {
                await expect
                    .poll(
                        () => anvil.getBalance(recipientAddress),
                        'recipient should receive the sent amount',
                    )
                    .toBe(recipientBalanceBefore + parseEther(sendAmount));
                expect(await anvil.getTransactionCount(senderAddress)).toBe(senderNonceBefore + 1);
            });

            await test.step('Suite shows the confirmed transaction and new balance', async () => {
                await toastSection.openTxSentDetailsAndWaitForConfirmation();
                const senderBalanceAfter = await anvil.getBalance(senderAddress);
                await expect(walletPage.balanceOfAccount({ symbol: ethSymbol })).toHaveText(
                    toCompactAmount(formatEther(senderBalanceAfter)),
                );
            });
        },
    );
});
