import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import { getSolanaPrecomposedNetAmount } from './getSolanaPrecomposedNetAmount';

type GetEarnPendingAmountInBaseUnitsParams = {
    fallbackAmountInBaseUnits: string;
    isSolanaStaking: boolean;
    precomposedTransaction: Pick<PrecomposedTransactionFinal, 'totalSpent' | 'fee'> | undefined;
};

export const getEarnPendingAmountInBaseUnits = ({
    fallbackAmountInBaseUnits,
    isSolanaStaking,
    precomposedTransaction,
}: GetEarnPendingAmountInBaseUnitsParams) =>
    isSolanaStaking && precomposedTransaction
        ? getSolanaPrecomposedNetAmount(precomposedTransaction)
        : fallbackAmountInBaseUnits;
