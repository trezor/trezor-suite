import { AddressFormatter } from '@suite-common/formatters';
import { asNetworkSymbol } from '@suite-common/networks';
import { TestStream } from '@trezor/e2e-utils';

import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_STAKE_CONFIRMED_TX from '../../fixtures/staking/eth-stake-confirmed-tx.json';
import { expect, test } from '../../support/fixtures';
import { ETH_MOCKED_ACCOUNT } from '../../support/mocks/eth-endpoints';
import {
    YIELD_NEW_BLOCK,
    YIELD_VAULTS,
    YIELD_WETH_TOKEN,
    YIELD_WETH_VAULT_SHARE_TOKEN,
} from '../../support/mocks/yieldMock';
import { createTestAnnotation } from '../../support/reporters/annotations';

const { wethPrime } = YIELD_VAULTS;
const ETH_ACCOUNT_NAME = 'Ethereum #1';
const WITHDRAW_AMOUNT = '5';
const WITHDRAW_AMOUNT_FORMATTED = '5.00';
// The dashboard shows the deposited position compactly: 8 shares at pricePerShare 1.25 = 10.
const YIELD_WETH_DEPOSITED_AMOUNT_COMPACT = '10.00';
const YIELD_WETH_REMAINING_AMOUNT_COMPACT = '5.00';
const YIELD_WETH_VAULT_DISPLAY_NAME = ['Trezor Steakhouse', '\n', 'ETH Prime Vault'];
const YIELD_WETH_VAULT_DISPLAY_NAME_T3T1 = ['Trezor Steakhouse ETH', '\n', 'Prime Vault'];
const WITHDRAW_MAX_FEE = '0.00010840280031 ETH';
const UNWRAP_MAX_FEE = '0.00010840280031 ETH';
const BALANCE_AFTER_WITHDRAW = '1233999891597199690000';
const BALANCE_AFTER_UNWRAP = '1238999783194399380000';

const WITHDRAW_TXID = '0x5b8e3d2a70c1f6b49e27d05a8c31f7e604b92d5c1a8f4e7b3062c9d1e5a48f07';
const UNWRAP_TXID = '0x7d2f9b4c1a6e8305f4d2c7b9e1a35608bf6d2c40a9e8b7f5013c4e6d2a5b7f93';

const buildEthAccountTokens = ({
    wethBalance,
    shareBalance,
    shareTransfers = 1,
}: {
    wethBalance?: string;
    shareBalance: string;
    shareTransfers?: number;
}) => [
    ...ETH_MOCKED_ACCOUNT.tokens,
    ...(wethBalance !== undefined
        ? [{ ...YIELD_WETH_TOKEN, balance: wethBalance, transfers: 2 }]
        : []),
    { ...YIELD_WETH_VAULT_SHARE_TOKEN, balance: shareBalance, transfers: shareTransfers },
];

test.describe('eth yield withdrawal with unwrap', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, blockbookMock, yieldMock }) => {
        await onboardingPage.completeOnboarding();
        await blockbookMock.start('eth');
        blockbookMock.updateAccountState({
            txs: 3,
            nonce: '2',
            transactions: [ETH_STAKE_CONFIRMED_TX, ETH_BASE_TX],
            tokens: buildEthAccountTokens({
                shareBalance: YIELD_WETH_VAULT_SHARE_TOKEN.balance,
            }),
        });
        await yieldMock.start();
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
        'User can withdraw WETH from a yield vault and unwrap it to ETH',
        { annotation: createTestAnnotation({ stream: TestStream.Earn }) },
        async ({
            page,
            yieldSection,
            yieldFlowSection,
            txSimulationModal,
            devicePrompt,
            device,
            blockbookMock,
            yieldMock,
            toastSection,
        }) => {
            await test.step('Deposited position is shown on the dashboard', async () => {
                await yieldSection.earnMenuButton.click();

                await expect(yieldSection.depositedAmount(wethPrime.id)).toHaveTranslation(
                    'TR_EARN_YIELD_DASHBOARD_DEPOSITED',
                    {
                        values: {
                            amount: YIELD_WETH_DEPOSITED_AMOUNT_COMPACT,
                            displaySymbol: 'ETH',
                        },
                    },
                );
                await expect(yieldSection.yearlyRewardAmount(wethPrime.id)).toHaveText('0.31 ETH');
                await expect(yieldSection.depositMoreButton(wethPrime.id)).toBeEnabled();
                await expect(yieldSection.depositNowButton(wethPrime.id)).toBeHidden();

                await yieldSection.withdrawButton(wethPrime.id).click();
            });

            await test.step('Withdraw amount is validated', async () => {
                await expect(yieldFlowSection.amountLabel).toHaveTranslation(
                    'TR_EARN_YIELD_AMOUNT_TO_WITHDRAW',
                );
                await expect(yieldFlowSection.amountUnit).toHaveText('WETH');
                await expect(yieldFlowSection.summaryLabel).toContainTranslation(
                    'TR_EARN_YIELD_DEPOSITED',
                );
                await expect(yieldFlowSection.summaryAmount).toHaveText('10 WETH');
                await expect(yieldFlowSection.unwrapButton).toBeHidden();

                await yieldFlowSection.amountInput.fill('11');
                await expect(yieldFlowSection.insufficientFundsWarning).toContainTranslation(
                    'AMOUNT_IS_NOT_ENOUGH',
                );
                await expect(yieldFlowSection.withdrawButton).toBeDisabled();
            });

            await test.step(`Withdraw ${WITHDRAW_AMOUNT} WETH from the vault`, async () => {
                await page.clock.install();
                await yieldMock.mockWethWithdraw();
                blockbookMock.setBroadcastTxid(WITHDRAW_TXID);

                await yieldFlowSection.amountInput.fill(WITHDRAW_AMOUNT);
                await expect(yieldFlowSection.insufficientFundsWarning).toBeHidden();
                await yieldFlowSection.withdrawButton.click();

                await expect(txSimulationModal.sentAsset(0)).toHaveText('Sending 4 trSHWETHp');
                await expect(txSimulationModal.sentAssetFiat(0)).toHaveText('-$12,500.00');
                await expect(txSimulationModal.receivedAsset(0)).toHaveText('Receiving 5 WETH');
                await expect(txSimulationModal.receivedAssetFiat(0)).toHaveText('+$12,500.00');
                await expect(txSimulationModal.maxFeeAmount).toHaveText('0.000108403 ETH');
                await expect(txSimulationModal.maxFeeFiat).toHaveText('≈ $0.00');
                await txSimulationModal.confirmButton.click();

                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Withdraw' },
                        body: [['Review details to', '\n', 'withdraw from', '\n', 'vault.']],
                        actions: { right_button: 'Confirm' },
                    },
                    T3T1: {
                        body: [['Review details to', '\n', 'withdraw from vault.']],
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Withdraw' },
                        body: [YIELD_WETH_VAULT_DISPLAY_NAME],
                        actions: { right_button: 'Continue' },
                    },
                    T3T1: {
                        body: [['Withdraw from'], YIELD_WETH_VAULT_DISPLAY_NAME_T3T1],
                    },
                });
                await device.pressYes();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Withdraw' },
                        body: [
                            ['Withdraw amount'],
                            [`${WITHDRAW_AMOUNT} WETH`],
                            ['Chain'],
                            ['Ethereum'],
                        ],
                        actions: { right_button: 'Continue' },
                    },
                });
                await device.pressYes();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    WITHDRAW_MAX_FEE,
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Withdraw' },
                        body: [
                            ['Maximum fee'],
                            device.wrapText(WITHDRAW_MAX_FEE, { isAmount: true }),
                        ],
                        actions: { right_button: 'Hold to sign' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await devicePrompt.sendButton.click();

                await expect(toastSection.yieldWithdrawMessage).toHaveTranslation(
                    'TOAST_TX_YIELD_WITHDRAW',
                    { values: { account: ETH_ACCOUNT_NAME } },
                );
                await expect(yieldFlowSection.pendingTransactionLabel).toHaveTranslation(
                    'TR_EARN_YIELD_PENDING_WITHDRAW',
                );
                await expect(yieldFlowSection.pendingTransactionId).toHaveText(
                    AddressFormatter.format(WITHDRAW_TXID, { format: 'long', isChunked: false }),
                );

                blockbookMock.updateAccountState({
                    txs: 4,
                    nonce: '3',
                    balance: BALANCE_AFTER_WITHDRAW,
                    transactions: [
                        { ...ETH_STAKE_CONFIRMED_TX, txid: WITHDRAW_TXID },
                        ETH_STAKE_CONFIRMED_TX,
                        ETH_BASE_TX,
                    ],
                    tokens: buildEthAccountTokens({
                        wethBalance: '5000000000000000000',
                        shareBalance: '4000000000000000000',
                        shareTransfers: 2,
                    }),
                });
                await page.clock.fastForward('01:00');
            });

            await test.step('Unwrap the withdrawn WETH to ETH', async () => {
                await expect(yieldFlowSection.unwrapButton).toBeEnabled();
                await expect(yieldFlowSection.unwrapSkipButton).toBeEnabled();
                await expect(yieldFlowSection.withdrawButton).toBeHidden();
                await expect(yieldFlowSection.amountInput).toHaveValue(WITHDRAW_AMOUNT);
                await expect(yieldFlowSection.amountUnit).toHaveText('WETH');
                await expect(yieldFlowSection.summaryLabel).toContainTranslation('TR_BALANCE');
                await expect(yieldFlowSection.summaryAmount).toHaveText(`${WITHDRAW_AMOUNT} WETH`);

                await yieldFlowSection.amountInput.fill('5.5');
                await expect(yieldFlowSection.insufficientFundsWarning).toContainTranslation(
                    'AMOUNT_IS_NOT_ENOUGH',
                );
                await expect(yieldFlowSection.unwrapButton).toBeDisabled();
                await yieldFlowSection.amountInput.fill(WITHDRAW_AMOUNT);
                await expect(yieldFlowSection.insufficientFundsWarning).toBeHidden();

                await yieldMock.mockEthUnwrap();
                blockbookMock.setBroadcastTxid(UNWRAP_TXID);

                await yieldFlowSection.unwrapButton.click();
                await expect(txSimulationModal.sentAsset(0)).toHaveText('Sending 5 WETH');
                await expect(txSimulationModal.sentAssetFiat(0)).toHaveText('-$12,500.00');
                await expect(txSimulationModal.receivedAsset(0)).toHaveText('Receiving 5 ETH');
                await expect(txSimulationModal.receivedAssetFiat(0)).toHaveText('+$12,500.00');
                await expect(txSimulationModal.maxFeeAmount).toHaveText('0.000108403 ETH');
                await expect(txSimulationModal.maxFeeFiat).toHaveText('≈ $0.00');
                await txSimulationModal.confirmButton.click();

                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Provider' },
                        body: [['WETH']],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Intent' },
                        body: [['Unwrap WETH to', '\n', 'ETH']],
                        actions: { right_button: 'Confirm' },
                    },
                    T3T1: {
                        body: [['Unwrap WETH to ETH']],
                    },
                });
                await device.pressYes();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('amount')).toHaveText(
                    `${WITHDRAW_AMOUNT} ETH`,
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm contract' },
                        body: [['Amount'], [`${WITHDRAW_AMOUNT} ETH`]],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await device.pressYes();
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    UNWRAP_MAX_FEE,
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: '' },
                        body: [
                            ['Maximum fee'],
                            device.wrapText(UNWRAP_MAX_FEE, { isAmount: true }),
                        ],
                        actions: { right_button: 'Hold to sign' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await devicePrompt.sendButton.click();

                await expect(toastSection.wrappedMessage).toHaveTranslation(
                    'TOAST_TX_UNWRAP_BROADCASTED',
                );
                await expect(toastSection.wrappedSendAmount).toHaveText(WITHDRAW_AMOUNT_FORMATTED);
                await expect(toastSection.wrappedReceiveAmount).toHaveText(
                    WITHDRAW_AMOUNT_FORMATTED,
                );
                await expect(yieldFlowSection.pendingTransactionLabel).toHaveTranslation(
                    'TR_EARN_YIELD_PENDING_UNWRAP',
                );
                await expect(yieldFlowSection.pendingTransactionId).toHaveText(
                    AddressFormatter.format(UNWRAP_TXID, { format: 'long', isChunked: false }),
                );

                blockbookMock.updateAccountState({
                    txs: 5,
                    nonce: '4',
                    balance: BALANCE_AFTER_UNWRAP,
                    transactions: [
                        { ...ETH_STAKE_CONFIRMED_TX, txid: UNWRAP_TXID },
                        { ...ETH_STAKE_CONFIRMED_TX, txid: WITHDRAW_TXID },
                        ETH_STAKE_CONFIRMED_TX,
                        ETH_BASE_TX,
                    ],
                    tokens: buildEthAccountTokens({
                        wethBalance: '0',
                        shareBalance: '4000000000000000000',
                        shareTransfers: 2,
                    }),
                });
                await page.clock.fastForward('01:00');

                await expect(yieldFlowSection.flowCompleteHeading).toHaveTranslation(
                    'TR_EARN_YIELD_WITHDRAW_COMPLETE',
                );
                await expect(yieldFlowSection.flowCompleteStatus).toHaveTranslation(
                    'TR_EARN_YIELD_COMPLETED',
                );
                await expect(yieldFlowSection.flowCompleteTransferInputAmount).toHaveText(
                    '4 trSHWETHp',
                );
                await expect(yieldFlowSection.flowCompleteTransferOutputAmount).toHaveText(
                    `${WITHDRAW_AMOUNT} ETH`,
                );

                await blockbookMock.sendNewBlockNotification(YIELD_NEW_BLOCK);
            });

            await test.step('Dashboard shows the reduced position', async () => {
                await yieldFlowSection.backToOverviewButton.click();

                // 4 shares at pricePerShare 1.25 = 5, yearly reward = 5 × 3.1% APY.
                await expect(yieldSection.depositedAmount(wethPrime.id)).toHaveTranslation(
                    'TR_EARN_YIELD_DASHBOARD_DEPOSITED',
                    {
                        values: {
                            amount: YIELD_WETH_REMAINING_AMOUNT_COMPACT,
                            displaySymbol: 'ETH',
                        },
                    },
                );
                await expect(yieldSection.yearlyRewardAmount(wethPrime.id)).toHaveText('0.155 ETH');
                await expect(yieldSection.withdrawButton(wethPrime.id)).toBeEnabled();
                await expect(yieldSection.depositMoreButton(wethPrime.id)).toBeEnabled();
                await expect(yieldSection.depositNowButton(wethPrime.id)).toBeHidden();
            });
        },
    );
});
