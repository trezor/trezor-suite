import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import { prepareYieldDepositThunk } from '@suite-common/wallet-core';

import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { useShowYieldAlert } from './useShowYieldAlert';
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
    const showYieldAlert = useShowYieldAlert();

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
            showYieldAlert({
                title: 'earn.yieldDepositFlowScreen.alerts.depositUnavailable.title',
                description: 'earn.yieldDepositFlowScreen.alerts.depositUnavailable.description',
            });

            return;
        }

        if (response.payload.type === 'action-ready') {
            const feePreview = buildYieldDepositFeePreview(response.payload.unsignedTransaction);

            if (!feePreview) {
                showYieldAlert({
                    title: 'earn.yieldDepositFlowScreen.alerts.depositUnavailable.title',
                    description:
                        'earn.yieldDepositFlowScreen.alerts.depositUnavailable.description',
                });

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
            showYieldAlert({
                title: 'earn.yieldDepositFlowScreen.alerts.approvalResetNotSupported.title',
                description:
                    'earn.yieldDepositFlowScreen.alerts.approvalResetNotSupported.description',
            });

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
        showYieldAlert,
    ]);

    return { handleSubmitDeposit };
};
