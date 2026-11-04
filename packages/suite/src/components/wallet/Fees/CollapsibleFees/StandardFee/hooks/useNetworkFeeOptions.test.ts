import { renderHook } from '@testing-library/react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { type UseNetworkFeeOptionsProps, useNetworkFeeOptions } from './useNetworkFeeOptions';

const levels: FeeLevel[] = [
    { label: 'normal', feePerUnit: '2', blocks: 2 },
    { label: 'high', feePerUnit: '5', blocks: 1 },
    { label: 'custom', feePerUnit: '3', blocks: -1 },
];

const composedTransaction: PrecomposedTransactionFinal = {
    type: 'final',
    totalSpent: '100000',
    fee: '1025',
    feePerByte: '9.15',
    bytes: 112,
    inputs: [],
    outputs: [],
    outputsPermutation: [],
};

const props: UseNetworkFeeOptionsProps = {
    networkType: 'bitcoin',
    networkSymbol: asNetworkSymbol('btc'),
    levels,
};

describe('useNetworkFeeOptions', () => {
    it('uses the composed bitcoin rate without changing the requested levels', () => {
        const { result } = renderHook(() =>
            useNetworkFeeOptions({
                ...props,
                composedLevels: { normal: composedTransaction },
            }),
        );

        expect(result.current).toEqual([
            {
                label: 'normal',
                value: 'normal',
                feePerUnit: '9.15',
                blocks: 2,
                networkAmount: expect.any(BigNumber),
            },
            {
                label: 'high',
                value: 'high',
                feePerUnit: '5',
                blocks: 1,
                networkAmount: null,
            },
        ]);
        expect(result.current[0]?.networkAmount?.toFixed()).toBe('0.00001025');
        expect(levels[0]?.feePerUnit).toBe('2');
    });

    it('uses the composed rate of a nonfinal bitcoin transaction', () => {
        const { result } = renderHook(() =>
            useNetworkFeeOptions({
                ...props,
                composedLevels: {
                    normal: {
                        type: 'nonfinal',
                        max: undefined,
                        totalSpent: '100000',
                        fee: '1025',
                        feePerByte: '9.15',
                        bytes: 112,
                        inputs: [],
                    },
                },
            }),
        );

        expect(result.current[0]?.feePerUnit).toBe('9.15');
    });

    it.each<PrecomposedLevels | undefined>([
        undefined,
        {},
        { normal: { type: 'error', error: 'NOT-ENOUGH-FUNDS' } },
    ])('keeps the requested rate when no transaction was composed: %j', composedLevels => {
        const { result } = renderHook(() => useNetworkFeeOptions({ ...props, composedLevels }));

        expect(result.current[0]?.feePerUnit).toBe('2');
        expect(result.current[0]?.networkAmount).toBeNull();
    });

    it('updates the displayed rate after recomposition', () => {
        const { result, rerender } = renderHook(
            (composedLevels: PrecomposedLevels) =>
                useNetworkFeeOptions({ ...props, composedLevels }),
            { initialProps: { normal: composedTransaction } },
        );

        expect(result.current[0]?.feePerUnit).toBe('9.15');

        rerender({ normal: { ...composedTransaction, feePerByte: '3.5' } });

        expect(result.current[0]?.feePerUnit).toBe('3.5');
    });

    it('keeps the requested rate on Ethereum', () => {
        const { result } = renderHook(() =>
            useNetworkFeeOptions({
                ...props,
                networkType: 'ethereum',
                networkSymbol: asNetworkSymbol('eth'),
                composedLevels: { normal: composedTransaction },
            }),
        );

        expect(result.current[0]?.feePerUnit).toBe('2');
    });

    it('preserves the composed per-transaction fee on Solana', () => {
        const { result } = renderHook(() =>
            useNetworkFeeOptions({
                ...props,
                networkType: 'solana',
                networkSymbol: asNetworkSymbol('sol'),
                composedLevels: { normal: composedTransaction },
            }),
        );

        expect(result.current[0]?.feePerUnit).toBe('2');
        expect(result.current[0]?.feePerTx).toBe('1025');
    });
});
