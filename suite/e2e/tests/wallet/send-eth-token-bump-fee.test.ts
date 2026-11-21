import { type Hex, parseTransaction } from 'viem';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';
import { BigNumber, localizeNumber } from '@trezor/utils';

import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_USDC_TRANSFER_PENDING_TX from '../../fixtures/wallet/eth-usdc-transfer-pending-tx.json';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { transformAddress } from '../../support/testExtends/customMatchers';

const getPendingTokenTransfer = () => {
    const tokenTransfer = ETH_USDC_TRANSFER_PENDING_TX.tokenTransfers.at(0);
    if (!tokenTransfer) {
        throw new Error('The pending transfer fixture has no token transfer');
    }

    return tokenTransfer;
};

const pendingTransfer = ETH_USDC_TRANSFER_PENDING_TX.ethereumSpecific;
const eip1559FeeEstimate = {
    feePerTx: '180000000000000',
    feePerUnit: '2000000000',
    feeLimit: '90000',
    eip1559: {
        baseFeePerGas: '1000000000',
        low: { maxFeePerGas: '1500000000', maxPriorityFeePerGas: '1100000000' },
        medium: { maxFeePerGas: '2000000000', maxPriorityFeePerGas: '1500000000' },
        high: { maxFeePerGas: '3000000000', maxPriorityFeePerGas: '2000000000' },
    },
};
const pendingTokenTransfer = getPendingTokenTransfer();
const formattedTokenAmount = `${localizeNumber(
    new BigNumber(pendingTokenTransfer.value).shiftedBy(-pendingTokenTransfer.decimals).toFixed(),
)} ${pendingTokenTransfer.symbol}`;

test.describe('Ethereum fee bump', { tag: ['@T3W1', '@T3T1', '@optional'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, blockbookMock }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('coins');
        await blockbookMock.start('eth');
        blockbookMock.setEstimateFeeResponse(eip1559FeeEstimate);
        blockbookMock.updateAccountState({
            txs: 2,
            unconfirmedTxs: 1,
            transactions: [ETH_USDC_TRANSFER_PENDING_TX, ETH_BASE_TX],
            nonce: '2',
        });
        await settingsPage.changeNetworks({
            enableNetworks: [
                {
                    symbol: asNetworkSymbol('eth'),
                    backend: { type: 'blockbook', url: blockbookMock.url },
                },
            ],
        });
    });

    test(
        'Speeding up a pending token transfer keeps the token transfer',
        { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
        async ({ device, walletPage, devicePrompt, blockbookMock }) => {
            await test.step('Speed up the pending USDC transfer', async () => {
                await walletPage.openAccount({ symbol: asNetworkSymbol('eth') });
                await walletPage.pendingTransactionBumpFeeButton.click();
                await walletPage.replaceTransactionButton.click();
            });

            await test.step('Verify the token recipient on the device', async () => {
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Send' },
                        body: [transformAddress(pendingTokenTransfer.to, 'evmTetragrams')],
                        actions: { right_button: 'Continue' },
                    },
                    T3T1: {
                        header: { title: 'Address', subtitle: 'Recipient' },
                        body: [transformAddress(pendingTokenTransfer.to, 'evmTetragrams')],
                    },
                });
                await devicePrompt.waitForPromptAndConfirm();
            });

            await test.step('Verify the token amount and fee on the device and sign', async () => {
                const reviewFee = (await devicePrompt.cryptoAmountOf('fee').innerText()).trim();
                const maxFeeWrapped = device.wrapText(`${reviewFee} ETH`, { isAmount: true });
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Send' },
                        body: [['Amount'], [formattedTokenAmount], ['Maximum fee'], maxFeeWrapped],
                        actions: { right_button: 'Hold to sign' },
                    },
                    T3T1: {
                        header: { title: 'Summary' },
                        body: [['Amount'], [formattedTokenAmount], ['Maximum fee'], maxFeeWrapped],
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await devicePrompt.sendButton.click();
            });

            await test.step('The broadcast replacement is the same token transfer at a higher fee', async () => {
                let replacementHex = '';
                await expect(() => {
                    replacementHex = blockbookMock.lastBroadcastHex;
                }).toPass({ timeout: 10_000 });
                const replacement = parseTransaction(replacementHex as Hex);

                expect({
                    type: replacement.type,
                    to: replacement.to?.toLowerCase(),
                    value: replacement.value ?? 0n,
                    data: replacement.data,
                    nonce: replacement.nonce,
                }).toEqual({
                    type: 'eip1559',
                    to: pendingTokenTransfer.contract.toLowerCase(),
                    // Recurring bug: https://github.com/trezor/trezor-suite/issues/31428
                    value: 0n,
                    // Recurring bug: https://github.com/trezor/trezor-suite/issues/22871
                    data: pendingTransfer.data,
                    nonce: pendingTransfer.nonce,
                });
                expect(replacement.maxFeePerGas).toBeGreaterThan(
                    BigInt(pendingTransfer.maxFeePerGas),
                );
                expect(replacement.maxPriorityFeePerGas).toBeGreaterThan(
                    BigInt(pendingTransfer.maxPriorityFeePerGas),
                );
            });
        },
    );
});
