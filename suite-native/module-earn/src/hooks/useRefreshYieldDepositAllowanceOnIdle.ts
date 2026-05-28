import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { type YieldAllowanceStatus, initYieldAllowanceThunk } from '@suite-common/wallet-core';

import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';

type UseRefreshYieldDepositAllowanceOnIdleParams = {
    allowanceStatus: YieldAllowanceStatus | undefined;
    resolvedFlowData: ResolvedYieldFlowData;
};

export const useRefreshYieldDepositAllowanceOnIdle = ({
    allowanceStatus,
    resolvedFlowData,
}: UseRefreshYieldDepositAllowanceOnIdleParams) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (resolvedFlowData.resolutionStatus !== 'resolved' || allowanceStatus !== 'idle') {
            return;
        }

        void dispatch(
            initYieldAllowanceThunk({
                flowData: resolvedFlowData.flowData,
                flowKey: resolvedFlowData.flowKey,
                flowType: 'deposit',
                shouldSkipApprovalStep: false,
            }),
        );
    }, [allowanceStatus, dispatch, resolvedFlowData]);
};
