import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import { prepareYieldDepositThunk } from '@suite-common/wallet-core';

import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { useWorkInProgressAlert } from './useWorkInProgressAlert';
import { type PreparedYieldSupplyAction } from './useYieldSupplyFees';

type UseYieldSupplySubmitParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    amount: string | undefined;
    onApprovalRequired: () => void;
    preparedAction: PreparedYieldSupplyAction | null;
};

export const useYieldSupplySubmit = ({
    amount,
    flowData,
    flowKey,
    onApprovalRequired,
    preparedAction,
}: UseYieldSupplySubmitParams) => {
    const dispatch = useDispatch();
    const showWorkInProgressAlert = useWorkInProgressAlert();

    const handleSubmitSupply = useCallback(async () => {
        if (!amount || !flowData || !flowKey) {
            return;
        }

        if (preparedAction?.amount === amount) {
            showWorkInProgressAlert('Supply transaction ready');

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
            showWorkInProgressAlert('Supply unavailable');

            return;
        }

        if (response.payload.type === 'action-ready') {
            showWorkInProgressAlert('Supply transaction ready');

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
        onApprovalRequired,
        preparedAction,
        showWorkInProgressAlert,
    ]);

    return { handleSubmitSupply };
};
