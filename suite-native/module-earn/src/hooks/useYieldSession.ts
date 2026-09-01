import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type StablecoinYieldRootState,
    type YieldFlowType,
    selectStablecoinYieldSessionByFlowKey,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';

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
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const session = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldSessionByFlowKey(state, flowType, flowKey),
    );
    const hasSession = !!session;
    const hasPendingTransaction = !!session?.action.pendingTransaction;

    useEffect(() => {
        if (flowKey && !hasSession) {
            dispatch(
                stablecoinYieldActions.initSession({ flowType, flowKey, isWrappedNativeVault }),
            );
        }
    }, [dispatch, flowKey, flowType, hasSession, isWrappedNativeVault]);

    useEffect(() => {
        if (!shouldDisposeOnGoBack || !flowKey || hasPendingTransaction) {
            return;
        }

        const sessionParams = { flowType, flowKey };

        return navigation.addListener('beforeRemove', event => {
            if (event.data.action.type === 'GO_BACK') {
                dispatch(stablecoinYieldActions.disposeSession(sessionParams));
            }
        });
    }, [dispatch, flowKey, flowType, hasPendingTransaction, navigation, shouldDisposeOnGoBack]);

    return session;
};
