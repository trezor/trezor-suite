import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { type YieldFlowType, stablecoinYieldActions } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

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
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    useEffect(() => {
        if (!isEnabled || !flowKey || error !== TRANSACTION_FAILED_ERROR) {
            return;
        }

        showAlert({
            title: error,
            primaryButtonTitle: translate('generic.buttons.close'),
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            onPressPrimaryButton: () =>
                dispatch(stablecoinYieldActions.clearError({ flowType, flowKey })),
        });
    }, [dispatch, error, flowKey, flowType, isEnabled, showAlert, translate]);
};
