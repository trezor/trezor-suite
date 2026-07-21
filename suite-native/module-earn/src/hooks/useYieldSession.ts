import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    type StablecoinYieldRootState,
    type YieldFlowType,
    selectStablecoinYieldSessionByFlowKey,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';

type UseYieldSessionParams = {
    flowKey: string | null;
    flowType: YieldFlowType;
    shouldDisposeOnGoBack?: boolean;
};

export const useYieldSession = ({
    flowKey,
    flowType,
    shouldDisposeOnGoBack = false,
}: UseYieldSessionParams) => {
    const dispatch = useDispatch();
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSessionByFlowKey(state, flowType, flowKey),
    );
    const hasSession = !!session;
    const hasPendingTransaction = !!session?.action.pendingTransaction;

    useEffect(() => {
        if (flowKey && !hasSession) {
            dispatch(stablecoinYieldActions.initSession({ flowType, flowKey }));
        }
    }, [dispatch, flowKey, flowType, hasSession]);

    useNavigationRemoveActionInterceptor({
        isEnabled: shouldDisposeOnGoBack && !!flowKey && !hasPendingTransaction,
        actionTypesToIntercept: [],
        onPassThroughAction: action => {
            if ((action.type === 'GO_BACK' || action.type === 'POP') && flowKey) {
                dispatch(stablecoinYieldActions.disposeSession({ flowType, flowKey }));
            }
        },
    });

    return session;
};
