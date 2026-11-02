import { D } from '@mobily/ts-belt';

import {
    type GeneralPrecomposedLevels,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';

// Custom gas is user input, so it cannot establish the minimum gas required by a transaction.
export const getReferenceFeeLevel = (feeLevels: GeneralPrecomposedLevels) =>
    isFinalPrecomposedTransaction(feeLevels.normal)
        ? feeLevels.normal
        : Object.values(D.deleteKey(feeLevels, 'custom')).find(isFinalPrecomposedTransaction);
