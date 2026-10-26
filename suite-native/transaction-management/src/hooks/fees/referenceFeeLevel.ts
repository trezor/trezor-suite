import {
    type GeneralPrecomposedLevels,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';

export const predefinedFeeLevelOrder = ['economy', 'low', 'normal', 'high'] as const;

// Custom gas is user input, so it cannot establish the minimum gas required by a transaction.
export const getReferenceFeeLevel = (feeLevels: GeneralPrecomposedLevels) =>
    isFinalPrecomposedTransaction(feeLevels.normal)
        ? feeLevels.normal
        : predefinedFeeLevelOrder.map(key => feeLevels[key]).find(isFinalPrecomposedTransaction);
