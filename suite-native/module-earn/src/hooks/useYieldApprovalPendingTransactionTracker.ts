import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type TransactionsRootState,
    type YieldPendingTransactionState,
    selectTransactionByAccountKeyAndTxid,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

type UseYieldApprovalPendingTransactionTrackerParams = {
    accountKey: AccountKey | null;
    flowKey: string | null;
    onApprovalPending: () => void;
    onApprovalSettled: () => void;
    pendingTransaction?: YieldPendingTransactionState;
};

export const useYieldApprovalPendingTransactionTracker = ({
    accountKey,
    flowKey,
    onApprovalPending,
    onApprovalSettled,
    pendingTransaction,
}: UseYieldApprovalPendingTransactionTrackerParams) => {
    const dispatch = useDispatch();
    const pendingTxidRef = useRef<string | undefined>(undefined);
    const transaction = useSelector((state: TransactionsRootState & AccountsRootState) =>
        pendingTransaction && accountKey
            ? selectTransactionByAccountKeyAndTxid(state, accountKey, pendingTransaction.txid)
            : null,
    );

    useEffect(() => {
        if (!pendingTransaction?.txid) {
            pendingTxidRef.current = undefined;

            return;
        }

        if (pendingTxidRef.current === pendingTransaction.txid) {
            return;
        }

        pendingTxidRef.current = pendingTransaction.txid;
        onApprovalPending();
    }, [onApprovalPending, pendingTransaction?.txid]);

    useEffect(() => {
        if (!flowKey || !pendingTransaction || !transaction || isPending(transaction)) {
            return;
        }

        onApprovalSettled();

        if (transaction.type === 'failed') {
            dispatch(stablecoinYieldActions.transactionFailed({ flowType: 'supply', flowKey }));

            return;
        }

        dispatch(
            stablecoinYieldActions.completeApproval({
                flowType: 'supply',
                flowKey,
                amount: pendingTransaction.amount,
            }),
        );
    }, [dispatch, flowKey, onApprovalSettled, pendingTransaction, transaction]);
};
