import { useEffect } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
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
    const { dispatch } = useServices(injectDispatch);

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
