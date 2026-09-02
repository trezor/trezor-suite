import { useEffect } from 'react';

import { useDispatch } from '@suite-common/redux-utils';
import { type YieldFlowType, yieldActions } from '@suite-common/wallet-core';
import { type TxKeyPath } from '@suite-native/intl';

import { useShowYieldAlert } from './useShowYieldAlert';

type FailureAlertContent = {
    title: TxKeyPath;
    description: TxKeyPath;
};

const FAILURE_ALERT_CONTENT: Record<string, FailureAlertContent> = {
    TR_EARN_YIELD_ERROR_TRANSACTION_FAILED: {
        title: 'earn.yieldDepositFlowScreen.alerts.transactionFailed.title',
        description: 'earn.yieldDepositFlowScreen.alerts.transactionFailed.description',
    },
    TR_EARN_YIELD_ERROR_CLAIM_REVIEW_MISMATCH: {
        title: 'earn.yieldClaimFlowScreen.alerts.reviewMismatch.title',
        description: 'earn.yieldClaimFlowScreen.alerts.reviewMismatch.description',
    },
};

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
        const alertContent = error ? FAILURE_ALERT_CONTENT[error] : undefined;

        if (!isEnabled || !flowKey || !alertContent) {
            return;
        }

        showYieldAlert({
            title: alertContent.title,
            description: alertContent.description,
            onPressPrimaryButton: () => dispatch(yieldActions.clearError({ flowType, flowKey })),
        });
    }, [dispatch, error, flowKey, flowType, isEnabled, showYieldAlert]);
};
