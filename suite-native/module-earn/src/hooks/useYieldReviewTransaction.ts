import { useSelector } from 'react-redux';

import {
    selectPrecomposedSendForm,
    selectSendFormAccountKey,
    selectSendPrecomposedTx,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormState,
    type PrecomposedTransactionFinal,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';

export type YieldReviewTransaction = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
};

type UseYieldReviewTransactionParams = {
    accountKey: AccountKey;
};

export const useYieldReviewTransaction = ({
    accountKey,
}: UseYieldReviewTransactionParams): YieldReviewTransaction | null => {
    const formState = useSelector(selectPrecomposedSendForm);
    const precomposedTransaction = useSelector(selectSendPrecomposedTx);
    const storedAccountKey = useSelector(selectSendFormAccountKey);

    if (
        storedAccountKey !== accountKey ||
        !formState ||
        !isFinalPrecomposedTransaction(precomposedTransaction)
    ) {
        return null;
    }

    return {
        formState,
        precomposedTransaction,
    };
};
