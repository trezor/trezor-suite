import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import { prepareYieldDepositThunk } from '@suite-common/wallet-core';

import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { useWorkInProgressAlert } from './useWorkInProgressAlert';

type UseYieldSupplySubmitParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    amount: string | undefined;
    onApprovalRequired: () => void;
};

export const useYieldSupplySubmit = ({
    amount,
    flowData,
    flowKey,
    onApprovalRequired,
}: UseYieldSupplySubmitParams) => {
    const dispatch = useDispatch();
    const showWorkInProgressAlert = useWorkInProgressAlert();

    const handleSubmitSupply = useCallback(async () => {
        if (!amount || !flowData || !flowKey) {
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
            //TODO: better handling, revoke is not supported on mobile
            showWorkInProgressAlert('Approval reset not supported');

            return;
        }

        onApprovalRequired();
    }, [amount, dispatch, flowData, flowKey, onApprovalRequired, showWorkInProgressAlert]);

    return { handleSubmitSupply };
};
