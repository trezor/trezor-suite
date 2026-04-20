import {
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';

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

export const createFeeLevels = (
    levels: Record<string, Partial<PrecomposedTransactionFinal>>,
): PrecomposedLevels =>
    Object.fromEntries(Object.entries(levels).map(([key, value]) => [key, createFeeLevel(value)]));
