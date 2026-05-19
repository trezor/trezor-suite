import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import { prepareYieldDepositThunk } from '@suite-common/wallet-core';

import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { useWorkInProgressAlert } from './useWorkInProgressAlert';
import { type PreparedYieldDepositAction } from './useYieldDepositFees';
import { buildYieldDepositFeePreview } from '../yieldDepositFeeUtils';

type UseYieldDepositSubmitParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    amount: string | undefined;
    onActionReady: (preparedAction: PreparedYieldDepositAction) => void;
    onApprovalRequired: () => void;
    preparedAction: PreparedYieldDepositAction | null;
};

export const useYieldDepositSubmit = ({
    amount,
    flowData,
    flowKey,
    onActionReady,
    onApprovalRequired,
    preparedAction,
}: UseYieldDepositSubmitParams) => {
    const dispatch = useDispatch();
    const showWorkInProgressAlert = useWorkInProgressAlert();

    const handleSubmitDeposit = useCallback(async () => {
        if (!amount || !flowData || !flowKey) {
            return;
        }

        if (preparedAction?.amount === amount) {
            onActionReady(preparedAction);

            return;
        }

        const response = await dispatch(
            prepareYieldDepositThunk({
                amount,
                flowData,
                flowKey,
            }),
        );

        if (!isFulfilled(response) || response.payload.type === 'error') {
            showWorkInProgressAlert('Deposit unavailable');

            return;
        }

        if (response.payload.type === 'action-ready') {
            const feePreview = buildYieldDepositFeePreview(response.payload.unsignedTransaction);

            if (!feePreview) {
                showWorkInProgressAlert('Deposit unavailable');

                return;
            }

            onActionReady({
                amount,
                feePreview,
                receiptAmount: response.payload.receiptAmount,
                unsignedTransaction: response.payload.unsignedTransaction,
            });

            return;
        }

        if (response.payload.type === 'revoke-required') {
            // TODO: Better handling, revoke is not supported on mobile.
            showWorkInProgressAlert('Approval reset not supported');

            return;
        }

        onApprovalRequired();
    }, [
        amount,
        dispatch,
        flowData,
        flowKey,
        onActionReady,
        onApprovalRequired,
        preparedAction,
        showWorkInProgressAlert,
    ]);

    return { handleSubmitDeposit };
};
