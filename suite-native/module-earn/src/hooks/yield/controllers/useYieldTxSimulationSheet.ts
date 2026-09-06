import { useCallback, useState } from 'react';

import { useDispatch } from '@suite-common/redux-utils';
import { type YieldPositionFlowType, yieldActions } from '@suite-common/wallet-core';
import { useBottomSheetModal } from '@suite-native/atoms';

type YieldSimulationPreparedAction = {
    amount: string;
    receiptAmount: string;
    unsignedTransaction: string;
};

type UseYieldTxSimulationSheetParams = {
    flowKey: string | null;
    flowType: YieldPositionFlowType;
    onConfirmed: () => void;
    onReportAction: (action: 'continue' | 'cancel') => void;
};

export const useYieldTxSimulationSheet = ({
    flowKey,
    flowType,
    onConfirmed,
    onReportAction,
}: UseYieldTxSimulationSheetParams) => {
    const dispatch = useDispatch();
    const { bottomSheetRef, closeModal, openModal } = useBottomSheetModal();
    const [preparedAction, setPreparedAction] = useState<YieldSimulationPreparedAction | null>(
        null,
    );

    const openSimulation = useCallback(
        (action: YieldSimulationPreparedAction) => {
            setPreparedAction(action);
            // The sheet ref is only attached once `preparedAction` renders it.
            requestAnimationFrame(openModal);
        },
        [openModal],
    );

    const handleConfirm = useCallback(() => {
        if (!flowKey || !preparedAction) {
            return;
        }

        onReportAction('continue');
        dispatch(
            yieldActions.storeActionReviewData({
                amount: preparedAction.amount,
                flowKey,
                flowType,
                receiptAmount: preparedAction.receiptAmount,
                unsignedTransaction: preparedAction.unsignedTransaction,
            }),
        );
        closeModal();
        onConfirmed();
    }, [closeModal, dispatch, flowKey, flowType, onConfirmed, onReportAction, preparedAction]);

    const handleCancel = useCallback(() => {
        onReportAction('cancel');
        closeModal();
    }, [closeModal, onReportAction]);

    return { bottomSheetRef, handleCancel, handleConfirm, openSimulation, preparedAction };
};
