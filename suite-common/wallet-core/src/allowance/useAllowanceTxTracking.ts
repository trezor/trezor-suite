import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { type AccountKey } from '@suite-common/wallet-types';

import { getAllowanceTransactionStatus } from './getAllowanceTransactionStatus';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import { selectTransactionByAccountKeyAndTxid } from '../transactions/transactionsSelectors';

export type UseAllowanceTxTrackingParams = {
    accountKey: AccountKey | null;
};

export const useAllowanceTxTracking = ({ accountKey }: UseAllowanceTxTrackingParams) => {
    const [approvalTxid, setApprovalTxid] = useState<string | null>(null);

    const transaction = useSelector((state: TransactionsRootState & AccountsRootState) =>
        approvalTxid ? selectTransactionByAccountKeyAndTxid(state, accountKey, approvalTxid) : null,
    );

    const status = useMemo(() => getAllowanceTransactionStatus(transaction), [transaction]);

    return {
        approvalTxid,
        status,
        setApprovalTxid,
    };
};
