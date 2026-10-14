import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type YieldFlowType,
    type YieldRootState,
    selectYieldSessionByFlowKey,
    yieldActions,
} from '@suite-common/wallet-core';
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
    const navigation = useNavigation();
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

    useEffect(() => {
        if (!shouldDisposeOnGoBack || !flowKey || hasPendingTransaction) {
            return;
        }

        const sessionParams = { flowType, flowKey };

        return navigation.addListener('beforeRemove', event => {
            if (event.data.action.type === 'GO_BACK') {
                dispatch(yieldActions.disposeSession(sessionParams));
            }
        });
    }, [dispatch, flowKey, flowType, hasPendingTransaction, navigation, shouldDisposeOnGoBack]);

    return session;
};
