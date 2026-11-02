import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { type AccountKey } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

import { type AccountsRootState } from '../accounts/accountsReducer';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import { selectTransactionByAccountKeyAndTxid } from '../transactions/transactionsSelectors';

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

export const useAllowanceTxTracking = ({ accountKey }: UseAllowanceTxTrackingParams) => {
    const [approvalTxid, setApprovalTxid] = useState<string | null>(null);

    const transaction = useSelector((state: TransactionsRootState & AccountsRootState) =>
        approvalTxid ? selectTransactionByAccountKeyAndTxid(state, accountKey, approvalTxid) : null,
    );

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
