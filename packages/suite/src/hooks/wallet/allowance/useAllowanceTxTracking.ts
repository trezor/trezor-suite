import { useMemo, useState } from 'react';

import { selectTransactionByAccountKeyAndTxid } from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

interface UseAllowanceTxTrackingParams {
    accountKey?: AccountKey;
}

interface TransactionStatus {
    isPending: boolean;
    isConfirmed: boolean;
    isFailed: boolean;
}

export const useAllowanceTxTracking = ({ accountKey }: UseAllowanceTxTrackingParams) => {
    const [approvalTxid, setApprovalTxid] = useState<string | null>(null);

    const transaction = useSelector(state =>
        approvalTxid && accountKey
            ? selectTransactionByAccountKeyAndTxid(state, accountKey, approvalTxid)
            : null,
    );

    const status = useMemo<TransactionStatus>(() => {
        if (!transaction) {
            return {
                isPending: false,
                isConfirmed: false,
                isFailed: false,
            };
        }

        const pending = isPending(transaction);
        const failed = !pending && transaction.type === 'failed';
        const confirmed = !pending && !failed;

        return {
            isPending: pending,
            isConfirmed: confirmed,
            isFailed: failed,
        };
    }, [transaction]);

    return {
        approvalTxid,
        status,
        setApprovalTxid,
    };
};
