import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { typedObjectTransformValues } from '@trezor/utils';

import { type FeeLevelsMaxAmount } from '../types/fees';

export const createFeeLevel = (
    overrides: Partial<PrecomposedTransactionFinal> = {},
): PrecomposedTransactionFinal => ({
    type: 'final',
    totalSpent: '1000433210428000',
    fee: '433210428000',
    feePerByte: '1',
    feeLimit: '11000',
    estimatedFeeLimit: '11000',
    bytes: 250,
    inputs: [],
    outputs: [],
    outputsPermutation: [],
    ...overrides,
});

export const createFeeLevels = <T extends Record<string, Partial<PrecomposedTransactionFinal>>>(
    levels: T,
): { [K in keyof T]: PrecomposedTransactionFinal } =>
    typedObjectTransformValues<T, PrecomposedTransactionFinal>(levels, value =>
        createFeeLevel(value),
    );

export const createFeeLevelsMaxAmount = (
    overrides: Partial<FeeLevelsMaxAmount> = {},
): FeeLevelsMaxAmount => ({
    custom: undefined,
    economy: undefined,
    high: undefined,
    low: undefined,
    normal: undefined,
    ...overrides,
});
