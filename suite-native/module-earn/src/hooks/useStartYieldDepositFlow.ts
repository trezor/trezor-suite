import { useCallback, useRef, useState } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import {
    type StablecoinYieldRootState,
    type YieldFlowResolvedData,
    initYieldAllowanceThunk,
    selectStablecoinYieldSession,
    selectStablecoinYieldSessionByFlowKey,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import {
    type StackNavigationProps,
    type YieldFlowParams,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldConsents>;

type UseStartYieldDepositFlowParams = {
    flowData: YieldFlowResolvedData | null;
    flowKey: string | null;
    routeParams: YieldFlowParams;
};

export const useStartYieldDepositFlow = ({
    flowData,
    flowKey,
    routeParams,
}: UseStartYieldDepositFlowParams) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const store = useStore<StablecoinYieldRootState>();
    const isStartingDepositFlowRef = useRef(false);
    const [isStartingDepositFlow, setIsStartingDepositFlow] = useState(false);

    const handleStartYieldDepositFlow = useCallback(async (): Promise<boolean> => {
        if (isStartingDepositFlowRef.current || !flowData || !flowKey) {
            return false;
        }

        const sessionParams = { flowType: 'deposit' as const, flowKey };

        isStartingDepositFlowRef.current = true;
        setIsStartingDepositFlow(true);

        try {
            const existingSession = selectStablecoinYieldSessionByFlowKey(
                store.getState(),
                'deposit',
                flowKey,
            );

            if (existingSession?.action.pendingTransaction) {
                navigation.navigate(
                    existingSession.step === 'action'
                        ? YieldStackRoutes.YieldDeposit
                        : YieldStackRoutes.YieldDepositApproval,
                    routeParams,
                );

                return true;
            }

            dispatch(stablecoinYieldActions.resetSession(sessionParams));

            const response = await dispatch(
                initYieldAllowanceThunk({
                    ...sessionParams,
                    flowData,
                }),
            );

            if (!isFulfilled(response)) {
                navigation.navigate(YieldStackRoutes.YieldDepositApproval, routeParams);

                return true;
            }

            const session = selectStablecoinYieldSession(store.getState(), 'deposit', flowKey);

            navigation.navigate(
                session.step === 'action'
                    ? YieldStackRoutes.YieldDeposit
                    : YieldStackRoutes.YieldDepositApproval,
                routeParams,
            );
        } catch {
            navigation.navigate(YieldStackRoutes.YieldDepositApproval, routeParams);
        } finally {
            isStartingDepositFlowRef.current = false;
            setIsStartingDepositFlow(false);
        }

        return true;
    }, [dispatch, flowData, flowKey, navigation, routeParams, store]);

    return {
        handleStartYieldDepositFlow,
        isStartingDepositFlow,
    };
};
