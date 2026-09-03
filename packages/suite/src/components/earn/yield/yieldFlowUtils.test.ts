import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getYieldFlowStepSequence } from '@suite-common/wallet-core';

import {
    getYieldCryptoInputValue,
    getYieldFiatInputValue,
    getYieldFiatRateToken,
    getYieldFlowSteps,
    getYieldMaxFiatInputValue,
    getYieldModifyAmountInput,
    getYieldStepEntryAmount,
    getYieldUnwrapDefaultAmount,
    shouldInitializeYieldAllowance,
} from './yieldFlowUtils';

// Checksummed WETH address; the helper lower-cases it for the (evm) rate key.
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const WETH_LOWER = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const ethSymbol = asNetworkSymbol('eth');
const ethToken = { networkSymbol: ethSymbol, contractAddress: WETH } as const;

const depositSequence = getYieldFlowStepSequence({ flowType: 'deposit' });
const depositWithWrapSequence = getYieldFlowStepSequence({
    flowType: 'deposit',
    isWrappedNativeVault: true,
});
const withdrawSequence = getYieldFlowStepSequence({ flowType: 'withdraw' });
const withdrawWithUnwrapSequence = getYieldFlowStepSequence({
    flowType: 'withdraw',
    isWrappedNativeVault: true,
});

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const VAULT_ADDRESS = '0x58d97b57bb95320f9a05dc918aef65434969c2b2';

// Vault price-per-share: 1 share (trSHETHp) is worth 0.02 WETH.
const pricePerShareState = {
    price: '0.02',
    shareToken: {
        symbol: 'trSHETHp',
        network: 'ethereum',
        name: 'Trezor Staked Holesky ETH',
        decimals: 18,
        address: VAULT_ADDRESS,
    },
    quoteToken: {
        symbol: 'WETH',
        network: 'ethereum',
        name: 'Wrapped Ether',
        decimals: 18,
        address: WETH_ADDRESS,
    },
};

const baseUnwrapParams: Parameters<typeof getYieldUnwrapDefaultAmount>[0] = {
    flowType: 'withdraw',
    withdrawnAmount: '0.5',
    token: {
        networkSymbol: ethSymbol,
        symbol: 'WETH',
        decimals: 18,
        contractAddress: WETH_ADDRESS,
        balance: '5',
    },
    receiptToken: {
        networkSymbol: ethSymbol,
        symbol: 'trSHETHp',
        decimals: 18,
        contractAddress: VAULT_ADDRESS,
    },
    pricePerShareState,
    fallbackAmount: '5',
};

describe('yieldFlowUtils', () => {
    describe('getYieldFlowSteps', () => {
        // A normal deposit lists only approve + action (the leading `wrap` step is native-only and
        // excluded from the list), so `wrap` shows as an out-of-flow (done, unnumbered) step.
        it('describes deposit steps on the approve step', () => {
            expect(getYieldFlowSteps(depositSequence, 'approve')).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 2 } },
                approve: { state: 'active', indicator: { index: 1, total: 2 } },
                action: { state: 'pending', indicator: { index: 2, total: 2 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 2 } },
                complete: { state: 'pending', indicator: { index: 0, total: 2 } },
            });
        });

        it('describes deposit steps on the action step', () => {
            expect(getYieldFlowSteps(depositSequence, 'action')).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 2 } },
                approve: { state: 'done', indicator: { index: 1, total: 2 } },
                action: { state: 'active', indicator: { index: 2, total: 2 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 2 } },
                complete: { state: 'pending', indicator: { index: 0, total: 2 } },
            });
        });

        it('describes deposit steps on the complete step', () => {
            expect(getYieldFlowSteps(depositSequence, 'complete')).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 2 } },
                approve: { state: 'done', indicator: { index: 1, total: 2 } },
                action: { state: 'done', indicator: { index: 2, total: 2 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 2 } },
                complete: { state: 'active', indicator: { index: 0, total: 2 } },
            });
        });

        it('describes wrap-deposit steps on the wrap step', () => {
            expect(getYieldFlowSteps(depositWithWrapSequence, 'wrap')).toEqual({
                wrap: { state: 'active', indicator: { index: 1, total: 3 } },
                approve: { state: 'pending', indicator: { index: 2, total: 3 } },
                action: { state: 'pending', indicator: { index: 3, total: 3 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 3 } },
                complete: { state: 'pending', indicator: { index: 0, total: 3 } },
            });
        });

        it('describes wrap-deposit steps on the approve step', () => {
            expect(getYieldFlowSteps(depositWithWrapSequence, 'approve')).toEqual({
                wrap: { state: 'done', indicator: { index: 1, total: 3 } },
                approve: { state: 'active', indicator: { index: 2, total: 3 } },
                action: { state: 'pending', indicator: { index: 3, total: 3 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 3 } },
                complete: { state: 'pending', indicator: { index: 0, total: 3 } },
            });
        });

        it('describes unwrap-withdraw steps on the unwrap step', () => {
            expect(getYieldFlowSteps(withdrawWithUnwrapSequence, 'unwrap')).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 2 } },
                approve: { state: 'done', indicator: { index: 0, total: 2 } },
                action: { state: 'done', indicator: { index: 1, total: 2 } },
                unwrap: { state: 'active', indicator: { index: 2, total: 2 } },
                complete: { state: 'pending', indicator: { index: 0, total: 2 } },
            });
        });

        it('numbers the complete step when it is displayed as a list item', () => {
            expect(
                getYieldFlowSteps(depositSequence, 'approve', ['approve', 'action', 'complete']),
            ).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 3 } },
                approve: { state: 'active', indicator: { index: 1, total: 3 } },
                action: { state: 'pending', indicator: { index: 2, total: 3 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 3 } },
                complete: { state: 'pending', indicator: { index: 3, total: 3 } },
            });
        });

        it('reports steps outside the flow as passed', () => {
            expect(getYieldFlowSteps(withdrawSequence, 'action')).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 1 } },
                approve: { state: 'done', indicator: { index: 0, total: 1 } },
                action: { state: 'active', indicator: { index: 1, total: 1 } },
                unwrap: { state: 'done', indicator: { index: 0, total: 1 } },
                complete: { state: 'pending', indicator: { index: 0, total: 1 } },
            });
        });
    });

    describe('getYieldUnwrapDefaultAmount', () => {
        // The regression from #30559: the unwrap step must not default to the full WETH balance.
        it('defaults to the withdrawn asset amount for an asset (withdraw) input', () => {
            expect(
                getYieldUnwrapDefaultAmount({
                    ...baseUnwrapParams,
                    flowType: 'withdraw',
                    withdrawnAmount: '0.5',
                }),
            ).toBe('0.5');
        });

        it('converts the withdrawn shares to their asset equivalent for a redeem input', () => {
            expect(
                getYieldUnwrapDefaultAmount({
                    ...baseUnwrapParams,
                    flowType: 'redeem',
                    withdrawnAmount: '1',
                }),
            ).toBe('0.02');
        });

        it('falls back to the balance when the withdrawn amount is zero', () => {
            expect(
                getYieldUnwrapDefaultAmount({
                    ...baseUnwrapParams,
                    flowType: 'withdraw',
                    withdrawnAmount: '0',
                    fallbackAmount: '5',
                }),
            ).toBe('5');
        });

        it('falls back to the balance when shares cannot be converted without a price', () => {
            expect(
                getYieldUnwrapDefaultAmount({
                    ...baseUnwrapParams,
                    flowType: 'redeem',
                    withdrawnAmount: '1',
                    pricePerShareState: undefined,
                    fallbackAmount: '5',
                }),
            ).toBe('5');
        });
    });

    describe('getYieldStepEntryAmount', () => {
        const baseEntryParams = {
            committedAmount: '3',
            maxAmount: '25',
            unwrapDefaultAmount: '0.5',
        };

        it.each(['wrap', 'complete'] as const)('opens the %s step empty', step => {
            expect(getYieldStepEntryAmount({ ...baseEntryParams, step })).toBe('');
        });

        it('carries the committed amount into the approve step', () => {
            expect(getYieldStepEntryAmount({ ...baseEntryParams, step: 'approve' })).toBe('3');
        });

        it('does not cap the approve entry to the max amount', () => {
            expect(
                getYieldStepEntryAmount({
                    ...baseEntryParams,
                    step: 'approve',
                    committedAmount: '30',
                }),
            ).toBe('30');
        });

        it('caps the action entry to the max amount', () => {
            expect(
                getYieldStepEntryAmount({
                    ...baseEntryParams,
                    step: 'action',
                    committedAmount: '30',
                }),
            ).toBe('25');
        });

        it('carries the committed amount into the action step when it fits the max', () => {
            expect(getYieldStepEntryAmount({ ...baseEntryParams, step: 'action' })).toBe('3');
        });

        it.each(['approve', 'action'] as const)(
            'opens the %s step empty without a committed amount',
            step => {
                expect(
                    getYieldStepEntryAmount({ ...baseEntryParams, step, committedAmount: null }),
                ).toBe('');
            },
        );

        it('pre-fills the unwrap step with the unwrap default', () => {
            expect(getYieldStepEntryAmount({ ...baseEntryParams, step: 'unwrap' })).toBe('0.5');
        });
    });

    describe('getYieldModifyAmountInput', () => {
        it('prefers the live amount over the committed one', () => {
            expect(
                getYieldModifyAmountInput({ liveAmount: '2', actionAmount: '3', maxAmount: '25' }),
            ).toBe('2');
        });

        it('falls back to the committed amount when the field was cleared', () => {
            expect(
                getYieldModifyAmountInput({ liveAmount: '', actionAmount: '3', maxAmount: '25' }),
            ).toBe('3');
        });

        it('clamps the committed fallback to the max amount', () => {
            expect(
                getYieldModifyAmountInput({ liveAmount: '', actionAmount: '30', maxAmount: '25' }),
            ).toBe('25');
        });
    });

    describe('getYieldFiatRateToken', () => {
        it('prices wrap/unwrap by the account native symbol (no token address)', () => {
            expect(
                getYieldFiatRateToken({
                    step: 'wrap',
                    flowType: 'deposit',
                    accountSymbol: ethSymbol,
                    token: ethToken,
                }),
            ).toEqual({ symbol: 'eth' });

            expect(
                getYieldFiatRateToken({
                    step: 'unwrap',
                    flowType: 'withdraw',
                    accountSymbol: ethSymbol,
                    token: ethToken,
                }),
            ).toEqual({ symbol: 'eth' });
        });

        it('prices deposit by the asset token contract address (lower-cased)', () => {
            expect(
                getYieldFiatRateToken({
                    step: 'action',
                    flowType: 'deposit',
                    accountSymbol: ethSymbol,
                    token: ethToken,
                }),
            ).toEqual({ symbol: 'eth', tokenAddress: WETH_LOWER });
        });

        it('returns null when fiat entry is impossible (withdraw flow or no token address)', () => {
            expect(
                getYieldFiatRateToken({
                    step: 'action',
                    flowType: 'withdraw',
                    accountSymbol: ethSymbol,
                    token: ethToken,
                }),
            ).toBeNull();

            expect(
                getYieldFiatRateToken({
                    step: 'action',
                    flowType: 'redeem',
                    accountSymbol: ethSymbol,
                    token: ethToken,
                }),
            ).toBeNull();

            expect(
                getYieldFiatRateToken({
                    step: 'action',
                    flowType: 'deposit',
                    accountSymbol: ethSymbol,
                    token: null,
                }),
            ).toBeNull();

            expect(
                getYieldFiatRateToken({
                    step: 'action',
                    flowType: 'deposit',
                    accountSymbol: ethSymbol,
                    token: { networkSymbol: ethSymbol, contractAddress: null },
                }),
            ).toBeNull();
        });
    });

    describe('getYieldFiatInputValue', () => {
        it('converts crypto to fiat with two decimals', () => {
            expect(getYieldFiatInputValue({ amount: '2', rate: 1500 })).toBe('3000.00');
            expect(getYieldFiatInputValue({ amount: '0.001', rate: 1234.5 })).toBe('1.23');
        });

        it('returns an empty string for an empty amount or missing rate', () => {
            expect(getYieldFiatInputValue({ amount: '', rate: 1500 })).toBe('');
            expect(getYieldFiatInputValue({ amount: '2', rate: undefined })).toBe('');
        });
    });

    describe('getYieldMaxFiatInputValue', () => {
        it('rounds the max fiat down so it never converts back above the balance', () => {
            // 0.1 * 3333.35 = 333.335 → down = 333.33 (half-up would overstate it as 333.34).
            expect(getYieldMaxFiatInputValue({ amount: '0.1', rate: 3333.35 })).toBe('333.33');
            expect(getYieldFiatInputValue({ amount: '0.1', rate: 3333.35 })).toBe('333.34');
        });

        it('returns an empty string for an empty amount or missing rate', () => {
            expect(getYieldMaxFiatInputValue({ amount: '', rate: 1500 })).toBe('');
            expect(getYieldMaxFiatInputValue({ amount: '1', rate: undefined })).toBe('');
        });
    });

    describe('getYieldCryptoInputValue', () => {
        it('converts fiat to crypto, trimming trailing zeros and capping at the token decimals', () => {
            expect(getYieldCryptoInputValue({ fiat: '3000', rate: 1500, decimals: 18 })).toBe('2');
            expect(getYieldCryptoInputValue({ fiat: '10', rate: 3, decimals: 6 })).toBe('3.333333');
        });

        it('returns an empty string for an empty fiat or missing rate', () => {
            expect(getYieldCryptoInputValue({ fiat: '', rate: 1500, decimals: 18 })).toBe('');
            expect(getYieldCryptoInputValue({ fiat: '100', rate: undefined, decimals: 6 })).toBe(
                '',
            );
        });
    });

    describe('shouldInitializeYieldAllowance', () => {
        const wrappedNativeParams = {
            isWrappedNativeVault: true,
            hasWrappedNativeSession: true,
            step: 'approve',
            allowanceStatus: 'idle',
        } as const;

        it('reads the allowance for a plain ERC-20 vault on any step', () => {
            const erc20Params = {
                isWrappedNativeVault: false,
                hasWrappedNativeSession: false,
                allowanceStatus: 'idle',
            } as const;

            expect(shouldInitializeYieldAllowance({ ...erc20Params, step: 'approve' })).toBe(true);
            expect(shouldInitializeYieldAllowance({ ...erc20Params, step: 'action' })).toBe(true);
        });

        it('reads the allowance only when it is idle', () => {
            expect(
                shouldInitializeYieldAllowance({
                    ...wrappedNativeParams,
                    allowanceStatus: 'loading',
                }),
            ).toBe(false);
            expect(
                shouldInitializeYieldAllowance({
                    ...wrappedNativeParams,
                    allowanceStatus: 'loaded',
                }),
            ).toBe(false);
            expect(
                shouldInitializeYieldAllowance({
                    ...wrappedNativeParams,
                    allowanceStatus: 'error',
                }),
            ).toBe(false);
        });

        it('skips the read on the wrap step, before the amount to approve is known', () => {
            expect(shouldInitializeYieldAllowance({ ...wrappedNativeParams, step: 'wrap' })).toBe(
                false,
            );
        });

        it('reads the allowance on the approve step of a wrapped-native deposit', () => {
            expect(shouldInitializeYieldAllowance(wrappedNativeParams)).toBe(true);
        });

        // Otherwise the status stays idle for the rest of the flow and the banner never returns.
        it('re-reads the allowance on the action step of a wrapped-native deposit', () => {
            expect(shouldInitializeYieldAllowance({ ...wrappedNativeParams, step: 'action' })).toBe(
                true,
            );
        });

        it('skips the read until the session reports the wrapped-native shape', () => {
            expect(
                shouldInitializeYieldAllowance({
                    ...wrappedNativeParams,
                    hasWrappedNativeSession: false,
                }),
            ).toBe(false);
        });

        it('skips the read once the flow is complete', () => {
            expect(
                shouldInitializeYieldAllowance({ ...wrappedNativeParams, step: 'complete' }),
            ).toBe(false);
        });
    });
});
