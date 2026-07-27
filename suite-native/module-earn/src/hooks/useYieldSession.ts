import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type StablecoinYieldRootState,
    type YieldFlowType,
    selectStablecoinYieldSessionByFlowKey,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';

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
    const navigation = useNavigation();
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
