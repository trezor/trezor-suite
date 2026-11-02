import { useState } from 'react';

import type { AllowanceTransactionStatus } from '@suite-common/wallet-core';

import { useTradingDebugModeFlag } from './useTradingDebugModeFlag';

type TransactionStatusOverrideType =
    'none' | 'isConfirmed' | 'isFailed' | 'isPending' | 'no-override';

export type TransactionStatusWithOverride = {
    status: AllowanceTransactionStatus;
    forceStatus: (forcedStatus: TransactionStatusOverrideType) => void;
};

const noop = () => {};

export const useTransactionStatusOverride = (
    status: AllowanceTransactionStatus,
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
        } as AllowanceTransactionStatus,
        forceStatus,
    };
};
