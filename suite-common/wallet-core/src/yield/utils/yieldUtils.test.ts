import { Calldata, asEvmAddress } from '@suite-common/calldata';
import type { YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import type { YieldPendingTransactionState } from '../yieldTypes';
import {
    buildEvmSelectedFee,
    buildYieldDepositCalldata,
    buildYieldUnsignedTransaction,
    buildYieldUnwrapTransactionData,
    buildYieldWithdrawCalldata,
    buildYieldWrapTransactionData,
    getMaxWrapAmount,
    getNextYieldFlowStep,
    getWrappableNativeBalance,
    getYieldDepositAvailableBalance,
    getYieldDepositableBalance,
    getYieldFlowStepSequence,
    getYieldVaultForOutputToken,
    getYieldVaultsForInputToken,
    getYieldWrapAmount,
    hasYieldVaultPosition,
    isYieldVaultOperational,
    shouldRecommendWrapReserve,
    splitYieldPendingTransaction,
} from './yieldUtils';

const ACCOUNT_DESCRIPTOR = asEvmAddress('0x9ea3721b5bf3b64b4418c38b603154d2d597fae3');
const VAULT_ADDRESS = '0x58d97b57bb95320f9a05dc918aef65434969c2b2';
const ethSymbol = asNetworkSymbol('eth');

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
        networkSymbol: ethSymbol,
        symbol: 'USDC',
    },
    receiptToken: {
        contractAddress: VAULT_ADDRESS,
        decimals: 18,
        networkSymbol: ethSymbol,
        symbol: 'trUSDC',
    },
} as unknown as Parameters<typeof buildYieldWithdrawCalldata>[0]['flowData'];

describe('yieldUtils', () => {
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
        it('advances deposit through wrap → approve → action → complete', () => {
            expect(getNextYieldFlowStep('deposit', 'wrap', true)).toBe('approve');
            expect(getNextYieldFlowStep('deposit', 'approve', true)).toBe('action');
            expect(getNextYieldFlowStep('deposit', 'action', true)).toBe('complete');
        });

        it.each(['withdraw', 'redeem', 'claim'] as const)(
            'advances %s from action to complete',
            flowType => {
                expect(getNextYieldFlowStep(flowType, 'action')).toBe('complete');
            },
        );

        it.each(['withdraw', 'redeem'] as const)(
            'advances wrapped-native %s through unwrap',
            flowType => {
                expect(getNextYieldFlowStep(flowType, 'action', true)).toBe('unwrap');
                expect(getNextYieldFlowStep(flowType, 'unwrap', true)).toBe('complete');
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

    describe('buildYieldWrapTransactionData', () => {
        it('encodes the WETH deposit() selector and carries the amount in the value', () => {
            expect(buildYieldWrapTransactionData({ wrapAmount: '1', decimals: 18 })).toEqual({
                data: '0xd0e30db0',
                value: '0xde0b6b3a7640000',
            });
        });
    });

    describe('buildYieldUnwrapTransactionData', () => {
        it('encodes WETH withdraw(uint256) calldata for the amount', () => {
            const { data } = buildYieldUnwrapTransactionData({ unwrapAmount: '1', decimals: 18 });

            expect(Calldata.evm.weth.withdraw.decode(data)).toEqual({
                wad: 1_000_000_000_000_000_000n,
            });
        });

        it('throws for a zero amount', () => {
            expect(() =>
                buildYieldUnwrapTransactionData({ unwrapAmount: '0', decimals: 18 }),
            ).toThrow('Failed to encode WETH withdraw calldata');
        });
    });

    describe('getYieldDepositableBalance', () => {
        const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

        it('returns only the matched token balance for a non-wrapped-native vault', () => {
            expect(
                getYieldDepositableBalance({
                    networkSymbol: ethSymbol,
                    nativeFormattedBalance: '5',
                    vaultTokenAddress: USDC_ADDRESS,
                    matchedTokenBalance: '100',
                }),
            ).toBe('100');
        });

        it('adds the full native balance for a wrapped-native vault', () => {
            expect(
                getYieldDepositableBalance({
                    networkSymbol: ethSymbol,
                    nativeFormattedBalance: '0.2',
                    vaultTokenAddress: WETH_ADDRESS,
                    matchedTokenBalance: '1.5',
                }),
            ).toBe('1.7');
        });

        it('counts the full native balance even below the gas reserve', () => {
            expect(
                getYieldDepositableBalance({
                    networkSymbol: ethSymbol,
                    nativeFormattedBalance: '0.003',
                    vaultTokenAddress: WETH_ADDRESS,
                    matchedTokenBalance: '1',
                }),
            ).toBe('1.003');
        });

        it('returns the full native balance when no token is matched', () => {
            expect(
                getYieldDepositableBalance({
                    networkSymbol: ethSymbol,
                    nativeFormattedBalance: '1',
                    vaultTokenAddress: WETH_ADDRESS,
                    matchedTokenBalance: undefined,
                }),
            ).toBe('1');
        });
    });

    describe('getWrappableNativeBalance', () => {
        it('keeps the gas reserve aside', () => {
            expect(getWrappableNativeBalance('0.2')).toBe('0.195');
        });

        it('floors at zero when the balance does not cover the reserve', () => {
            expect(getWrappableNativeBalance('0.003')).toBe('0');
        });

        it('treats an empty balance as zero', () => {
            expect(getWrappableNativeBalance('')).toBe('0');
        });
    });

    describe('getMaxWrapAmount', () => {
        it('keeps the gas reserve aside when the balance covers it', () => {
            expect(getMaxWrapAmount('0.2')).toBe('0.195');
        });

        it('offers the whole balance when it does not cover the reserve', () => {
            expect(getMaxWrapAmount('0.003')).toBe('0.003');
        });

        it('offers the whole balance when it exactly matches the reserve', () => {
            expect(getMaxWrapAmount('0.005')).toBe('0.005');
        });

        // Max must offer an amount that is both usable and flagged, otherwise the button reads as
        // dead — the regression behind trezor/trezor-suite#30842.
        it('offers an amount that triggers the reserve recommendation', () => {
            expect(shouldRecommendWrapReserve(getMaxWrapAmount('0.003'), '0.003')).toBe(true);
        });

        it('treats an empty balance as zero', () => {
            expect(getMaxWrapAmount('')).toBe('0');
        });

        it('returns zero for a zero balance', () => {
            expect(getMaxWrapAmount('0')).toBe('0');
        });

        it('returns zero for a negative balance', () => {
            expect(getMaxWrapAmount('-1')).toBe('0');
        });

        it('returns zero for non-numeric input', () => {
            expect(getMaxWrapAmount('abc')).toBe('0');
        });
    });

    describe('shouldRecommendWrapReserve', () => {
        it('does not recommend when enough native coin is left for the reserve', () => {
            expect(shouldRecommendWrapReserve('0.9', '1')).toBe(false);
        });

        it('recommends at exactly balance minus the reserve (the Max amount)', () => {
            expect(shouldRecommendWrapReserve('0.995', '1')).toBe(true);
        });

        it('recommends when the amount eats into the reserve', () => {
            expect(shouldRecommendWrapReserve('0.996', '1')).toBe(true);
        });

        it('recommends when wrapping the whole balance', () => {
            expect(shouldRecommendWrapReserve('1', '1')).toBe(true);
        });

        it('does not recommend when the amount exceeds the balance (hard error case)', () => {
            expect(shouldRecommendWrapReserve('1.5', '1')).toBe(false);
        });

        it('does not recommend for an empty or zero amount', () => {
            expect(shouldRecommendWrapReserve('', '1')).toBe(false);
            expect(shouldRecommendWrapReserve('0', '1')).toBe(false);
        });

        it('does not recommend for non-numeric input', () => {
            expect(shouldRecommendWrapReserve('abc', '1')).toBe(false);
        });
    });

    describe('getYieldWrapAmount', () => {
        it('wraps the shortfall between the deposit total and held WETH', () => {
            expect(getYieldWrapAmount({ totalAmount: '2', matchedWethBalance: '1.5' })).toBe('0.5');
        });

        it('returns 0 when held WETH already covers the total', () => {
            expect(getYieldWrapAmount({ totalAmount: '1', matchedWethBalance: '2' })).toBe('0');
        });

        it('wraps the whole total when no WETH is held', () => {
            expect(getYieldWrapAmount({ totalAmount: '1', matchedWethBalance: undefined })).toBe(
                '1',
            );
        });
    });

    describe('getYieldDepositAvailableBalance', () => {
        it('returns the wrapped amount while the token balance still reports zero', () => {
            expect(
                getYieldDepositAvailableBalance({ tokenBalance: '0', wrappedAmount: '1.5' }),
            ).toBe('1.5');
        });

        it('returns the token balance once it includes the wrap, without double counting', () => {
            expect(
                getYieldDepositAvailableBalance({ tokenBalance: '1.5', wrappedAmount: '1.5' }),
            ).toBe('1.5');
        });

        it('returns the larger existing balance when only part of it was wrapped', () => {
            expect(
                getYieldDepositAvailableBalance({ tokenBalance: '3', wrappedAmount: '1.5' }),
            ).toBe('3');
        });

        it('returns the token balance when wrappedAmount is null or undefined', () => {
            expect(
                getYieldDepositAvailableBalance({ tokenBalance: '2', wrappedAmount: null }),
            ).toBe('2');
            expect(
                getYieldDepositAvailableBalance({ tokenBalance: '2', wrappedAmount: undefined }),
            ).toBe('2');
        });

        it('returns 0 when neither a balance nor a wrap is present', () => {
            expect(getYieldDepositAvailableBalance({})).toBe('0');
        });

        it('falls back to 0 for non-numeric input', () => {
            expect(
                getYieldDepositAvailableBalance({ tokenBalance: 'abc', wrappedAmount: 'xyz' }),
            ).toBe('0');
        });
    });

    describe('vault token matching', () => {
        const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
        const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
        const RECEIPT_ADDRESS = '0x58d97b57bb95320f9a05dc918aef65434969c2b2';

        const createVaultFixture = ({
            network = 'ethereum',
            tokenAddress,
            tokenSymbol = 'USDC',
            tokenDecimals = 6,
            outputTokenAddress,
            underMaintenance = false,
            deprecated = false,
            enter = true,
        }: {
            network?: YieldDtoV2['network'];
            tokenAddress?: string;
            tokenSymbol?: string;
            tokenDecimals?: number;
            outputTokenAddress?: string;
            underMaintenance?: boolean;
            deprecated?: boolean;
            enter?: boolean;
        }) =>
            ({
                metadata: { name: 'Vault', underMaintenance, deprecated },
                network,
                status: { enter, exit: true },
                token: {
                    symbol: tokenSymbol,
                    network,
                    name: tokenSymbol,
                    decimals: tokenDecimals,
                    address: tokenAddress,
                },
                outputToken: outputTokenAddress
                    ? {
                          symbol: `tr${tokenSymbol}`,
                          network,
                          name: `Vault ${tokenSymbol}`,
                          decimals: 18,
                          address: outputTokenAddress,
                      }
                    : undefined,
            }) satisfies Pick<
                YieldDtoV2,
                'metadata' | 'network' | 'status' | 'token' | 'outputToken'
            >;

        const heldUsdc = { address: USDC_ADDRESS, symbol: 'USDC', decimals: 6 };

        describe('isYieldVaultOperational', () => {
            it('accepts a vault that is neither under maintenance nor deprecated', () => {
                expect(isYieldVaultOperational(createVaultFixture({}))).toBe(true);
            });

            it('rejects a vault under maintenance', () => {
                expect(
                    isYieldVaultOperational(createVaultFixture({ underMaintenance: true })),
                ).toBe(false);
            });

            it('rejects a deprecated vault', () => {
                expect(isYieldVaultOperational(createVaultFixture({ deprecated: true }))).toBe(
                    false,
                );
            });
        });

        describe('getYieldVaultsForInputToken', () => {
            it('returns vaults whose input token matches the held token regardless of address case', () => {
                const usdcVault = createVaultFixture({
                    tokenAddress: USDC_ADDRESS.toLowerCase(),
                });
                const usdtVault = createVaultFixture({
                    tokenAddress: USDT_ADDRESS,
                    tokenSymbol: 'USDT',
                });

                expect(
                    getYieldVaultsForInputToken({
                        vaults: [usdcVault, usdtVault],
                        networkSymbol: ethSymbol,
                        token: heldUsdc,
                    }),
                ).toEqual([usdcVault]);
            });

            it('filters out vaults on other networks', () => {
                const polygonVault = createVaultFixture({
                    network: 'polygon',
                    tokenAddress: USDC_ADDRESS,
                });

                expect(
                    getYieldVaultsForInputToken({
                        vaults: [polygonVault],
                        networkSymbol: ethSymbol,
                        token: heldUsdc,
                    }),
                ).toEqual([]);
            });

            it('filters out vaults under maintenance or deprecated', () => {
                const maintainedVault = createVaultFixture({
                    tokenAddress: USDC_ADDRESS,
                    underMaintenance: true,
                });
                const deprecatedVault = createVaultFixture({
                    tokenAddress: USDC_ADDRESS,
                    deprecated: true,
                });

                expect(
                    getYieldVaultsForInputToken({
                        vaults: [maintainedVault, deprecatedVault],
                        networkSymbol: ethSymbol,
                        token: heldUsdc,
                    }),
                ).toEqual([]);
            });

            it('filters out vaults with deposits closed', () => {
                const closedVault = createVaultFixture({
                    tokenAddress: USDC_ADDRESS,
                    enter: false,
                });

                expect(
                    getYieldVaultsForInputToken({
                        vaults: [closedVault],
                        networkSymbol: ethSymbol,
                        token: heldUsdc,
                    }),
                ).toEqual([]);
            });

            it('matches by symbol and decimals when the vault token has no address', () => {
                const addresslessVault = createVaultFixture({});

                expect(
                    getYieldVaultsForInputToken({
                        vaults: [addresslessVault],
                        networkSymbol: ethSymbol,
                        token: { address: USDC_ADDRESS, symbol: 'usdc', decimals: 6 },
                    }),
                ).toEqual([addresslessVault]);
            });

            it('returns an empty array when vaults are not loaded', () => {
                expect(
                    getYieldVaultsForInputToken({
                        vaults: undefined,
                        networkSymbol: ethSymbol,
                        token: heldUsdc,
                    }),
                ).toEqual([]);
            });
        });

        describe('hasYieldVaultPosition', () => {
            const vaultWithReceiptToken = createVaultFixture({
                tokenAddress: USDC_ADDRESS,
                outputTokenAddress: RECEIPT_ADDRESS,
            });

            const createHeldReceiptToken = (address: string, balance?: string) => ({
                contract: address,
                symbol: 'trUSDC',
                decimals: 18,
                balance,
            });

            it('reports a position when the receipt token is held with a balance', () => {
                expect(
                    hasYieldVaultPosition({
                        networkSymbol: ethSymbol,
                        vault: vaultWithReceiptToken,
                        accountTokens: [createHeldReceiptToken(RECEIPT_ADDRESS, '1.5')],
                    }),
                ).toBe(true);
            });

            it('matches the receipt token regardless of address case', () => {
                expect(
                    hasYieldVaultPosition({
                        networkSymbol: ethSymbol,
                        vault: vaultWithReceiptToken,
                        accountTokens: [
                            createHeldReceiptToken(
                                RECEIPT_ADDRESS.toUpperCase().replace('0X', '0x'),
                                '2',
                            ),
                        ],
                    }),
                ).toBe(true);
            });

            it('reports no position when the receipt token balance is zero', () => {
                expect(
                    hasYieldVaultPosition({
                        networkSymbol: ethSymbol,
                        vault: vaultWithReceiptToken,
                        accountTokens: [createHeldReceiptToken(RECEIPT_ADDRESS, '0')],
                    }),
                ).toBe(false);
            });

            it('reports no position when the receipt token has no balance yet', () => {
                expect(
                    hasYieldVaultPosition({
                        networkSymbol: ethSymbol,
                        vault: vaultWithReceiptToken,
                        accountTokens: [createHeldReceiptToken(RECEIPT_ADDRESS, undefined)],
                    }),
                ).toBe(false);
            });

            it('does not treat holding the deposit token as a position', () => {
                expect(
                    hasYieldVaultPosition({
                        networkSymbol: ethSymbol,
                        vault: vaultWithReceiptToken,
                        accountTokens: [
                            {
                                contract: USDC_ADDRESS,
                                symbol: 'USDC',
                                decimals: 6,
                                balance: '500',
                            },
                        ],
                    }),
                ).toBe(false);
            });

            it('reports no position for a vault without a receipt token', () => {
                expect(
                    hasYieldVaultPosition({
                        networkSymbol: ethSymbol,
                        vault: createVaultFixture({ tokenAddress: USDC_ADDRESS }),
                        accountTokens: [createHeldReceiptToken(RECEIPT_ADDRESS, '1')],
                    }),
                ).toBe(false);
            });

            it('reports no position when the account has no tokens', () => {
                expect(
                    hasYieldVaultPosition({
                        networkSymbol: ethSymbol,
                        vault: vaultWithReceiptToken,
                        accountTokens: undefined,
                    }),
                ).toBe(false);
            });
        });

        describe('getYieldVaultForOutputToken', () => {
            const heldReceiptToken = { address: RECEIPT_ADDRESS, symbol: 'trUSDC', decimals: 18 };

            it('finds the vault whose receipt token matches the held token', () => {
                const vault = createVaultFixture({
                    tokenAddress: USDC_ADDRESS,
                    outputTokenAddress: RECEIPT_ADDRESS.toUpperCase().replace('0X', '0x'),
                });

                expect(
                    getYieldVaultForOutputToken({
                        vaults: [vault],
                        networkSymbol: ethSymbol,
                        token: heldReceiptToken,
                    }),
                ).toBe(vault);
            });

            it('does not match a vault by its input token', () => {
                const vault = createVaultFixture({
                    tokenAddress: USDC_ADDRESS,
                    outputTokenAddress: RECEIPT_ADDRESS,
                });

                expect(
                    getYieldVaultForOutputToken({
                        vaults: [vault],
                        networkSymbol: ethSymbol,
                        token: heldUsdc,
                    }),
                ).toBeUndefined();
            });

            it('ignores vaults under maintenance', () => {
                const vault = createVaultFixture({
                    tokenAddress: USDC_ADDRESS,
                    outputTokenAddress: RECEIPT_ADDRESS,
                    underMaintenance: true,
                });

                expect(
                    getYieldVaultForOutputToken({
                        vaults: [vault],
                        networkSymbol: ethSymbol,
                        token: heldReceiptToken,
                    }),
                ).toBeUndefined();
            });

            it('still matches a vault with deposits closed — it describes an existing position', () => {
                const closedVault = createVaultFixture({
                    tokenAddress: USDC_ADDRESS,
                    outputTokenAddress: RECEIPT_ADDRESS,
                    enter: false,
                });

                expect(
                    getYieldVaultForOutputToken({
                        vaults: [closedVault],
                        networkSymbol: ethSymbol,
                        token: heldReceiptToken,
                    }),
                ).toBe(closedVault);
            });

            it('returns undefined when vaults are not loaded', () => {
                expect(
                    getYieldVaultForOutputToken({
                        vaults: undefined,
                        networkSymbol: ethSymbol,
                        token: heldReceiptToken,
                    }),
                ).toBeUndefined();
            });
        });
    });
});
