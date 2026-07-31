import { getYieldFlowStepSequence } from '@suite-common/wallet-core';

import { getYieldFlowSteps, getYieldUnwrapDefaultAmount } from './yieldFlowUtils';

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
        networkSymbol: 'eth',
        symbol: 'WETH',
        decimals: 18,
        contractAddress: WETH_ADDRESS,
        balance: '5',
    },
    receiptToken: {
        networkSymbol: 'eth',
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
});
