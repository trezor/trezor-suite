import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { type AccountKey } from '@suite-common/wallet-types';

import { getAllowanceTransactionStatus } from './getAllowanceTransactionStatus';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import {
    selectAccountTransactionByNonce,
    selectTransactionByAccountKeyAndTxid,
} from '../transactions/transactionsSelectors';

export type UseAllowanceTxTrackingParams = {
    accountKey: AccountKey | null;
};

type TrackingRootState = TransactionsRootState;

export const useAllowanceTxTracking = ({ accountKey }: UseAllowanceTxTrackingParams) => {
    const [approvalTxid, setTrackedTxid] = useState<string | null>(null);
    const [trackedNonce, setTrackedNonce] = useState<number | undefined>(undefined);

    const transaction = useSelector((state: TrackingRootState) =>
        approvalTxid ? selectTransactionByAccountKeyAndTxid(state, accountKey, approvalTxid) : null,
    );

    const replacement = useSelector((state: TrackingRootState) =>
        approvalTxid && !transaction
            ? selectAccountTransactionByNonce(state, accountKey, trackedNonce)
            : null,
    );

    const nonce = transaction?.ethereumSpecific?.nonce;

    useEffect(() => {
        if (nonce !== undefined) {
            setTrackedNonce(nonce);
        }
    }, [nonce]);

    useEffect(() => {
        if (replacement) {
            setTrackedTxid(replacement.txid);
        }
    }, [replacement]);

    const setApprovalTxid = (txid: string | null) => {
        setTrackedTxid(txid);
        setTrackedNonce(undefined);
    };

    const status = useMemo(() => getAllowanceTransactionStatus(transaction), [transaction]);

    return {
        approvalTxid,
        status,
        setApprovalTxid,
    };
};
