import { useState } from 'react';

import type { TransactionStatus } from '@suite-common/trading';

import { useTradingDebugModeFlag } from './useTradingDebugModeFlag';

type TransactionStatusOverrideType =
    | 'none'
    | 'isConfirmed'
    | 'isFailed'
    | 'isPending'
    | 'no-override';

export type TransactionStatusWithOverride = {
    status: TransactionStatus;
    forceStatus: (forcedStatus: TransactionStatusOverrideType) => void;
};

const noop = () => {};

export const useTransactionStatusOverride = (
    status: TransactionStatus,
): TransactionStatusWithOverride => {
    const isDebugMode = useTradingDebugModeFlag();
    const [forcedStatus, forceStatus] = useState<TransactionStatusOverrideType>('no-override');

    if (!isDebugMode) {
        return { status, forceStatus: noop };
    }

    if (forcedStatus === 'no-override') {
        return { status, forceStatus };
    }

    return {
        status: {
            isPending: forcedStatus === 'isPending',
            isFailed: forcedStatus === 'isFailed',
            isConfirmed: forcedStatus === 'isConfirmed',
        } as TransactionStatus,
        forceStatus,
    };
};
