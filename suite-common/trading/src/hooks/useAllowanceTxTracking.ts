import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type TransactionsRootState,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

export type UseAllowanceTxTrackingParams = {
    accountKey: AccountKey | null;
};

export type TransactionStatus =
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

export const useAllowanceTxTracking = ({ accountKey }: UseAllowanceTxTrackingParams) => {
    const [approvalTxid, setApprovalTxid] = useState<string | null>(null);

    const transaction = useSelector((state: TransactionsRootState & AccountsRootState) =>
        approvalTxid ? selectTransactionByAccountKeyAndTxid(state, accountKey, approvalTxid) : null,
    );

    const status = useMemo<TransactionStatus>(() => {
        const baseRetValue: TransactionStatus = {
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
