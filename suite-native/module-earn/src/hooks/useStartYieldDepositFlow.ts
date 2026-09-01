import { useCallback, useRef, useState } from 'react';
import { useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type StablecoinYieldRootState,
    type YIELD_FLOW_AVAILABLE_STEPS,
    type YieldFlowResolvedData,
    type YieldFlowStepId,
    initYieldAllowanceThunk,
    selectStablecoinYieldSession,
    selectStablecoinYieldSessionByFlowKey,
    stablecoinYieldActions,
    trackWrappedNativeTokenThunk,
} from '@suite-common/wallet-core';
import {
    type StackNavigationProps,
    type YieldFlowParams,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldConsents>;

type UseStartYieldDepositFlowParams = {
    flowData: YieldFlowResolvedData | null;
    flowKey: string | null;
    routeParams: YieldFlowParams;
};

type YieldDepositStepId = (typeof YIELD_FLOW_AVAILABLE_STEPS)['deposit'][number];

// Keyed by the deposit sequence, so adding a step to it stops compiling until it is mapped here.
const DEPOSIT_STEP_ROUTES = {
    wrap: YieldStackRoutes.YieldDepositWrap,
    approve: YieldStackRoutes.YieldDepositApproval,
    action: YieldStackRoutes.YieldDeposit,
    complete: YieldStackRoutes.YieldDepositComplete,
} as const satisfies Record<YieldDepositStepId, YieldStackRoutes>;

const isYieldDepositStep = (step: YieldFlowStepId): step is YieldDepositStepId =>
    step in DEPOSIT_STEP_ROUTES;

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
        const isWrappedNativeVault = isWrappedNativeToken(
            flowData.account.symbol,
            flowData.token.contractAddress,
        );

        isStartingDepositFlowRef.current = true;
        setIsStartingDepositFlow(true);

        const navigateToDepositStep = (step: YieldFlowStepId) => {
            // 'unwrap' belongs to the withdraw sequence only, so a deposit session never reports
            // it; staying put beats navigating to an unrelated step.
            if (!isYieldDepositStep(step)) {
                return;
            }

            navigation.navigate(DEPOSIT_STEP_ROUTES[step], routeParams);
        };

        const navigateBySessionStep = () => {
            const session = selectStablecoinYieldSession(store.getState(), 'deposit', flowKey);

            navigateToDepositStep(session.step);
        };

        try {
            const existingSession = selectStablecoinYieldSessionByFlowKey(
                store.getState(),
                'deposit',
                flowKey,
            );

            if (existingSession?.action.pendingTransaction) {
                navigateToDepositStep(existingSession.step);

                return true;
            }

            dispatch(
                stablecoinYieldActions.resetSession({ ...sessionParams, isWrappedNativeVault }),
            );

            if (isWrappedNativeVault) {
                const trackResponse = await dispatch(
                    trackWrappedNativeTokenThunk({ accountKey: flowData.account.key }),
                );
                const wrappedTokenBalance = isFulfilled(trackResponse)
                    ? (trackResponse.payload ?? flowData.token.balance)
                    : flowData.token.balance;

                // Mirrors desktop: holding any wrapped token skips the wrap step up front; the
                // user can still come back to it from the approve step.
                if (new BigNumber(wrappedTokenBalance).gt(0)) {
                    dispatch(
                        stablecoinYieldActions.resolveWrappedNativeStep({
                            ...sessionParams,
                            step: 'wrap',
                        }),
                    );
                }
            }

            const response = await dispatch(
                initYieldAllowanceThunk({
                    ...sessionParams,
                    flowData,
                }),
            );

            if (!isFulfilled(response)) {
                navigateBySessionStep();

                return true;
            }

            navigateBySessionStep();
        } catch {
            navigateBySessionStep();
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
