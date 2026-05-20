import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { type YieldFlowType, stablecoinYieldActions } from '@suite-common/wallet-core';

import { useShowYieldAlert } from './useShowYieldAlert';

const TRANSACTION_FAILED_ERROR = 'TR_EARN_YIELD_ERROR_TRANSACTION_FAILED';

type UseShowYieldTransactionFailureAlertParams = {
    flowKey: string | null;
    flowType: YieldFlowType;
    error: string | null | undefined;
    isEnabled: boolean;
};

export const useShowYieldTransactionFailureAlert = ({
    flowKey,
    flowType,
    error,
    isEnabled,
}: UseShowYieldTransactionFailureAlertParams) => {
    const dispatch = useDispatch();
    const showYieldAlert = useShowYieldAlert();

    useEffect(() => {
        if (!isEnabled || !flowKey || error !== TRANSACTION_FAILED_ERROR) {
            return;
        }

        showYieldAlert({
            title: 'earn.yieldDepositFlowScreen.alerts.transactionFailed.title',
            description: 'earn.yieldDepositFlowScreen.alerts.transactionFailed.description',
            onPressPrimaryButton: () =>
                dispatch(stablecoinYieldActions.clearError({ flowType, flowKey })),
        });
    }, [dispatch, error, flowKey, flowType, isEnabled, showYieldAlert]);
};
