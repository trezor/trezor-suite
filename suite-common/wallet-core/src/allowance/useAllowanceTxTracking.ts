import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { type AccountKey } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

import { type AccountsRootState } from '../accounts/accountsReducer';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import {
    selectAccountTransactionByNonce,
    selectTransactionByAccountKeyAndTxid,
} from '../transactions/transactionsSelectors';

export type UseAllowanceTxTrackingParams = {
    accountKey: AccountKey | null;
};

export type AllowanceTransactionStatus =
    | {
          isPending: false;
          isConfirmed: false;
          isFailed: false;
      }
    | {
          isPending: true;
          isConfirmed: false;
          isFailed: false;
      }
    | {
          isPending: false;
          isConfirmed: true;
          isFailed: false;
      }
    | {
          isPending: false;
          isConfirmed: false;
          isFailed: true;
      };

type TrackingRootState = TransactionsRootState & AccountsRootState;

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

    const status = useMemo<AllowanceTransactionStatus>(() => {
        const baseRetValue: AllowanceTransactionStatus = {
            isPending: false,
            isConfirmed: false,
            isFailed: false,
        };

        if (!transaction) {
            return baseRetValue;
        }

        if (isPending(transaction)) {
            return {
                ...baseRetValue,
                isPending: true,
            };
        }

        if (transaction.type === 'failed') {
            return {
                ...baseRetValue,
                isFailed: true,
            };
        }

        return {
            ...baseRetValue,
            isConfirmed: true,
        };
    }, [transaction]);

    return {
        approvalTxid,
        status,
        setApprovalTxid,
    };
};
