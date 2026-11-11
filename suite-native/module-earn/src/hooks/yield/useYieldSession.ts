import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    type YieldFlowType,
    type YieldRootState,
    selectYieldSessionByFlowKey,
    yieldActions,
} from '@suite-common/wallet-core';
import { useOnNavigationRemove } from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type UseYieldSessionParams = {
    flowKey: string | null;
    flowType: YieldFlowType;
    isWrappedNativeVault?: boolean;
    shouldDisposeOnGoBack?: boolean;
};

export const useYieldSession = ({
    flowKey,
    flowType,
    isWrappedNativeVault,
    shouldDisposeOnGoBack = false,
}: UseYieldSessionParams) => {
    const { dispatch } = useServices(injectDispatch);
    const session = useSelector((state: YieldRootState) =>
        selectYieldSessionByFlowKey(state, flowType, flowKey),
    );
    const hasSession = !!session;
    const hasPendingTransaction = !!session?.action.pendingTransaction;

    useEffect(() => {
        if (flowKey && !hasSession) {
            dispatch(yieldActions.initSession({ flowType, flowKey, isWrappedNativeVault }));
        }
    }, [dispatch, flowKey, flowType, hasSession, isWrappedNativeVault]);

    useOnNavigationRemove({
        isEnabled: shouldDisposeOnGoBack && !hasPendingTransaction,
        actionTypes: ['GO_BACK'],
        onRemoveAttempt: () => {
            if (flowKey) dispatch(yieldActions.disposeSession({ flowType, flowKey }));
        },
    });

    return session;
};
