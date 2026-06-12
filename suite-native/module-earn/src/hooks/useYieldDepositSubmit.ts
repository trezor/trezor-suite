import { useCallback } from 'react';

import { useShowYieldAlert } from './useShowYieldAlert';
import { type PreparedYieldDepositAction } from './useYieldDepositFees';

type UseYieldDepositSubmitParams = {
    amount: string | undefined;
    onActionReady: (preparedAction: PreparedYieldDepositAction) => void;
    preparedAction: PreparedYieldDepositAction | null;
};

export const useYieldDepositSubmit = ({
    amount,
    onActionReady,
    preparedAction,
}: UseYieldDepositSubmitParams) => {
    const showYieldAlert = useShowYieldAlert();

    const handleSubmitDeposit = useCallback(() => {
        if (!preparedAction || preparedAction.amount !== amount) {
            showYieldAlert({
                title: 'earn.yieldDepositFlowScreen.alerts.depositUnavailable.title',
                description: 'earn.yieldDepositFlowScreen.alerts.depositUnavailable.description',
            });

            return;
        }

        onActionReady(preparedAction);
    }, [amount, onActionReady, preparedAction, showYieldAlert]);

    return { handleSubmitDeposit };
};
