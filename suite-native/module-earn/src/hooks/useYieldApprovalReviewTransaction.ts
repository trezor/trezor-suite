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

export type YieldApprovalReviewTransaction = {
    formState: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
};

type UseYieldApprovalReviewTransactionParams = {
    accountKey: AccountKey;
};

export const useYieldApprovalReviewTransaction = ({
    accountKey,
}: UseYieldApprovalReviewTransactionParams): YieldApprovalReviewTransaction | null => {
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
