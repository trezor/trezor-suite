import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import {
    type ResolvedYieldFlowData,
    type YieldAllowanceStatus,
    initYieldAllowanceThunk,
} from '@suite-common/wallet-core';

interface UseRefreshYieldDepositAllowanceOnIdleParams {
    allowanceStatus: YieldAllowanceStatus | undefined;
    yieldFlowData: ResolvedYieldFlowData;
}

export const useRefreshYieldDepositAllowanceOnIdle = ({
    allowanceStatus,
    yieldFlowData,
}: UseRefreshYieldDepositAllowanceOnIdleParams) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (yieldFlowData.resolutionStatus !== 'resolved' || allowanceStatus !== 'idle') {
            return;
        }

        void dispatch(
            initYieldAllowanceThunk({
                flowData: yieldFlowData.flowData,
                flowKey: yieldFlowData.flowKey,
                flowType: 'deposit',
                shouldSkipApprovalStep: false,
            }),
        );
    }, [allowanceStatus, dispatch, yieldFlowData]);
};
