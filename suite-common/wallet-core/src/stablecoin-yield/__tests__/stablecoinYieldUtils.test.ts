import { Calldata, asEvmAddress } from '@suite-common/calldata';

import type { YieldPendingTransactionState } from '../stablecoinYieldTypes';
import {
    buildEvmSelectedFee,
    buildYieldDepositCalldata,
    buildYieldUnsignedTransaction,
    buildYieldWithdrawCalldata,
    getNextYieldFlowStep,
    getYieldFlowStepSequence,
    splitYieldPendingTransaction,
} from '../stablecoinYieldUtils';

const ACCOUNT_DESCRIPTOR = asEvmAddress('0x9ea3721b5bf3b64b4418c38b603154d2d597fae3');
const VAULT_ADDRESS = '0x58d97b57bb95320f9a05dc918aef65434969c2b2';

const account = {
    descriptor: ACCOUNT_DESCRIPTOR,
    networkType: 'ethereum',
};

const flowData = {
    account,
    vault: {
        chainId: 1,
        id: 'ethereum:1:0x58d97b57bb95320f9a05dc918aef65434969c2b2',
    },
    token: {
        balance: '0',
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        decimals: 6,
        networkSymbol: 'eth',
        symbol: 'USDC',
    },
    receiptToken: {
        contractAddress: VAULT_ADDRESS,
        decimals: 18,
        networkSymbol: 'eth',
        symbol: 'trUSDC',
    },
} as unknown as Parameters<typeof buildYieldWithdrawCalldata>[0]['flowData'];

describe('stablecoinYieldUtils', () => {
    describe('buildYieldWithdrawCalldata', () => {
        it('builds ERC4626 withdraw calldata for asset input', () => {
            const calldata = buildYieldWithdrawCalldata({
                amount: '10',
                flowData,
                ownerAddress: ACCOUNT_DESCRIPTOR,
                receiverAddress: ACCOUNT_DESCRIPTOR,
                flowType: 'withdraw',
            });

            expect(Calldata.evm.erc4626.withdraw.decode(calldata)).toEqual({
                assets: 10_000_000n,
                owner: ACCOUNT_DESCRIPTOR.toLowerCase(),
                receiver: ACCOUNT_DESCRIPTOR.toLowerCase(),
            });
        });

        it('builds ERC4626 redeem calldata for shares input', () => {
            const calldata = buildYieldWithdrawCalldata({
                amount: '10',
                flowData,
                ownerAddress: ACCOUNT_DESCRIPTOR,
                receiverAddress: ACCOUNT_DESCRIPTOR,
                flowType: 'redeem',
            });

            expect(Calldata.evm.erc4626.redeem.decode(calldata)).toEqual({
                shares: 10_000_000_000_000_000_000n,
                owner: ACCOUNT_DESCRIPTOR.toLowerCase(),
                receiver: ACCOUNT_DESCRIPTOR.toLowerCase(),
            });
        });

        it('throws when calldata cannot be encoded', () => {
            expect(() =>
                buildYieldWithdrawCalldata({
                    amount: '10',
                    flowData,
                    ownerAddress: 'not-an-address' as unknown as Parameters<
                        typeof buildYieldWithdrawCalldata
                    >[0]['ownerAddress'],
                    receiverAddress: ACCOUNT_DESCRIPTOR,
                    flowType: 'withdraw',
                }),
            ).toThrow('Failed to encode withdraw calldata');
        });
    });

    describe('getNextYieldFlowStep', () => {
        it('advances deposit through approve → action → complete', () => {
            expect(getNextYieldFlowStep('deposit', 'approve')).toBe('action');
            expect(getNextYieldFlowStep('deposit', 'action')).toBe('complete');
        });

        it.each(['withdraw', 'redeem', 'claim'] as const)(
            'advances %s from action to complete',
            flowType => {
                expect(getNextYieldFlowStep(flowType, 'action')).toBe('complete');
            },
        );

        it('stays on the last step of the flow', () => {
            expect(getNextYieldFlowStep('deposit', 'complete')).toBe('complete');
            expect(getNextYieldFlowStep('claim', 'complete')).toBe('complete');
        });

        it('stays on a step that is not part of the flow', () => {
            expect(getNextYieldFlowStep('withdraw', 'approve')).toBe('approve');
        });
    });

    describe('getYieldFlowStepSequence', () => {
        it('excludes optional steps by default', () => {
            expect(getYieldFlowStepSequence({ flowType: 'deposit' })).toEqual([
                'approve',
                'action',
                'complete',
            ]);
            expect(getYieldFlowStepSequence({ flowType: 'withdraw' })).toEqual([
                'action',
                'complete',
            ]);
        });

        it('includes the wrap step for a wrapped-native vault deposit', () => {
            expect(
                getYieldFlowStepSequence({ flowType: 'deposit', isWrappedNativeVault: true }),
            ).toEqual(['wrap', 'approve', 'action', 'complete']);
        });

        it.each(['withdraw', 'redeem'] as const)(
            'includes the unwrap step in %s for a wrapped-native vault',
            flowType => {
                expect(getYieldFlowStepSequence({ flowType, isWrappedNativeVault: true })).toEqual([
                    'action',
                    'unwrap',
                    'complete',
                ]);
            },
        );

        it('keeps flows without optional steps unchanged', () => {
            expect(
                getYieldFlowStepSequence({ flowType: 'claim', isWrappedNativeVault: true }),
            ).toEqual(['action', 'complete']);
        });
    });

    describe('splitYieldPendingTransaction', () => {
        const mockPendingTx = (
            type: YieldPendingTransactionState['type'],
        ): YieldPendingTransactionState => ({
            type,
            txid: '0xabc',
            amount: '10',
        });

        it('matches a redeem tx only for the redeem flow', () => {
            const redeemTx = mockPendingTx('redeem');

            expect(splitYieldPendingTransaction(redeemTx, 'redeem')).toEqual({
                approvalPendingTransaction: undefined,
                actionPendingTransaction: redeemTx,
            });
        });

        it('does not treat a redeem tx as a withdraw action', () => {
            expect(splitYieldPendingTransaction(mockPendingTx('redeem'), 'withdraw')).toEqual({
                approvalPendingTransaction: undefined,
                actionPendingTransaction: undefined,
            });
        });

        it('matches a withdraw tx only for the withdraw flow', () => {
            const withdrawTx = mockPendingTx('withdraw');

            expect(splitYieldPendingTransaction(withdrawTx, 'withdraw')).toEqual({
                approvalPendingTransaction: undefined,
                actionPendingTransaction: withdrawTx,
            });
        });

        it('matches a deposit tx only for the deposit flow', () => {
            const depositTx = mockPendingTx('deposit');

            expect(splitYieldPendingTransaction(depositTx, 'deposit')).toEqual({
                approvalPendingTransaction: undefined,
                actionPendingTransaction: depositTx,
            });
        });

        it('classifies an approve tx as the approval tx', () => {
            const approveTx = mockPendingTx('approve');

            expect(splitYieldPendingTransaction(approveTx, 'withdraw')).toEqual({
                approvalPendingTransaction: approveTx,
                actionPendingTransaction: undefined,
            });
        });
    });

    describe('buildYieldDepositCalldata', () => {
        it('builds ERC4626 deposit calldata', () => {
            const calldata = buildYieldDepositCalldata({
                amount: '10',
                flowData,
                ownerAddress: ACCOUNT_DESCRIPTOR,
                receiverAddress: ACCOUNT_DESCRIPTOR,
            });

            expect(Calldata.evm.erc4626.deposit.decode(calldata)).toEqual({
                assets: 10_000_000n,
                receiver: ACCOUNT_DESCRIPTOR.toLowerCase(),
            });
        });

        it('throws when calldata cannot be encoded', () => {
            expect(() =>
                buildYieldDepositCalldata({
                    amount: '0',
                    flowData,
                    ownerAddress: ACCOUNT_DESCRIPTOR,
                    receiverAddress: ACCOUNT_DESCRIPTOR,
                }),
            ).toThrow('Failed to encode deposit calldata');
        });
    });

    describe('buildYieldUnsignedTransaction', () => {
        const commonParams = {
            chainId: 1,
            data: '0x1234',
            gasLimit: '21000',
            from: ACCOUNT_DESCRIPTOR,
            nonce: 7,
            to: VAULT_ADDRESS,
        };

        it('builds legacy fee fields', () => {
            expect(
                buildYieldUnsignedTransaction({
                    ...commonParams,
                    feeLevel: {
                        feePerUnit: '5',
                    },
                }),
            ).toEqual({
                chainId: 1,
                data: '0x1234',
                from: ACCOUNT_DESCRIPTOR,
                gasLimit: '0x5208',
                gasPrice: '0x12a05f200',
                nonce: 7,
                to: VAULT_ADDRESS,
                value: '0x0',
            });
        });

        it('builds EIP1559 fee fields', () => {
            expect(
                buildYieldUnsignedTransaction({
                    ...commonParams,
                    feeLevel: {
                        feePerUnit: '5',
                        maxFeePerGas: '6',
                        maxPriorityFeePerGas: '1',
                    },
                }),
            ).toEqual({
                chainId: 1,
                data: '0x1234',
                from: ACCOUNT_DESCRIPTOR,
                gasLimit: '0x5208',
                maxFeePerGas: '0x165a0bc00',
                maxPriorityFeePerGas: '0x3b9aca00',
                nonce: 7,
                to: VAULT_ADDRESS,
                type: 2,
                value: '0x0',
            });
        });
    });

    it('builds EVM selected fee with base fee', () => {
        expect(
            buildEvmSelectedFee({
                feeLevel: {
                    baseFeePerGas: '4',
                    feePerUnit: '5',
                    maxFeePerGas: '6',
                    maxPriorityFeePerGas: '1',
                },
                gasLimit: '21000',
            }),
        ).toEqual({
            baseFeePerGas: '0xee6b2800',
            gasLimit: '0x5208',
            maxFeePerGas: '0x165a0bc00',
            maxPriorityFeePerGas: '0x3b9aca00',
            type: 'eip1559',
        });
    });
});
