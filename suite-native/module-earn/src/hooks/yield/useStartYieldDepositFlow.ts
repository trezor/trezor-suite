import { useCallback, useRef, useState } from 'react';
import { useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import {
    type YIELD_FLOW_AVAILABLE_STEPS,
    type YieldFlowResolvedData,
    type YieldFlowStepId,
    type YieldRootState,
    initYieldAllowanceThunk,
    selectYieldSession,
    selectYieldSessionByFlowKey,
    trackWrappedNativeTokenThunk,
    yieldActions,
} from '@suite-common/wallet-core';
import {
    type StackNavigationProps,
    type YieldFlowParams,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { BigNumber } from '@trezor/utils';

import { hasYieldDepositableBalance } from '../../utils/earn/contractTokenBalanceUtils';

type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldConsents>;

type UseStartYieldDepositFlowParams = {
    flowData: YieldFlowResolvedData | null;
    flowKey: string | null;
    routeParams: YieldFlowParams;
    shouldReplaceRoute?: boolean;
};

type YieldDepositStepId = (typeof YIELD_FLOW_AVAILABLE_STEPS)['deposit'][number];

export type YieldDepositFlowStartDestination = 'deposit-form' | 'insufficient-balance-screen';

// Keyed by the deposit sequence, so adding a step to it stops compiling until it is mapped here.
const DEPOSIT_STEP_ROUTES = {
    wrap: YieldStackRoutes.YieldDepositWrap,
    approve: YieldStackRoutes.YieldDepositApproval,
    action: YieldStackRoutes.YieldDeposit,
    complete: YieldStackRoutes.YieldDepositComplete,
} as const satisfies Record<YieldDepositStepId, YieldStackRoutes>;

const isYieldDepositStep = (step: YieldFlowStepId): step is YieldDepositStepId =>
    step in DEPOSIT_STEP_ROUTES;

type YieldDepositFlowRoute =
    (typeof DEPOSIT_STEP_ROUTES)[YieldDepositStepId] | YieldStackRoutes.YieldDepositNoBalance;

export const useStartYieldDepositFlow = ({
    flowData,
    flowKey,
    routeParams,
    shouldReplaceRoute = false,
}: UseStartYieldDepositFlowParams) => {
    const { dispatch } = useServices(injectDispatch);
    const navigation = useNavigation<NavigationProps>();
    const store = useStore<YieldRootState>();
    const isStartingDepositFlowRef = useRef(false);
    const [isStartingDepositFlow, setIsStartingDepositFlow] = useState(false);

    const handleStartYieldDepositFlow =
        useCallback(async (): Promise<YieldDepositFlowStartDestination | null> => {
            if (isStartingDepositFlowRef.current || !flowData || !flowKey) {
                return null;
            }

            const sessionParams = { flowType: 'deposit' as const, flowKey };
            const isWrappedNativeVault = isWrappedNativeToken(
                flowData.account.symbol,
                flowData.token.contractAddress,
            );

            isStartingDepositFlowRef.current = true;
            setIsStartingDepositFlow(true);

            const navigateToRoute = (route: YieldDepositFlowRoute) => {
                if (shouldReplaceRoute) {
                    navigation.replace(route, routeParams);
                } else {
                    navigation.navigate(route, routeParams);
                }
            };

            const navigateToDepositStep = (step: YieldFlowStepId) => {
                // 'unwrap' belongs to the withdraw sequence only, so a deposit session never reports
                // it; staying put beats navigating to an unrelated step.
                if (!isYieldDepositStep(step)) {
                    return;
                }

                navigateToRoute(DEPOSIT_STEP_ROUTES[step]);
            };

            const navigateBySessionStep = () => {
                const session = selectYieldSession(store.getState(), 'deposit', flowKey);

                navigateToDepositStep(session.step);
            };

            try {
                const existingSession = selectYieldSessionByFlowKey(
                    store.getState(),
                    'deposit',
                    flowKey,
                );

                if (existingSession?.action.pendingTransaction) {
                    navigateToDepositStep(existingSession.step);

                    return 'deposit-form';
                }

                let vaultTokenBalance = flowData.token.balance;

                if (isWrappedNativeVault) {
                    const trackResponse = await dispatch(
                        trackWrappedNativeTokenThunk({ accountKey: flowData.account.key }),
                    );

                    if (isFulfilled(trackResponse) && trackResponse.payload !== null) {
                        vaultTokenBalance = trackResponse.payload;
                    }
                }

                if (
                    !hasYieldDepositableBalance({
                        account: flowData.account,
                        vaultTokenContract: flowData.token.contractAddress,
                        tokenBalance: vaultTokenBalance,
                    })
                ) {
                    navigateToRoute(YieldStackRoutes.YieldDepositNoBalance);

                    return 'insufficient-balance-screen';
                }

                dispatch(yieldActions.resetSession({ ...sessionParams, isWrappedNativeVault }));

                // Mirrors desktop: holding any wrapped token skips the wrap step up front; the
                // user can still come back to it from the approve step.
                if (isWrappedNativeVault && new BigNumber(vaultTokenBalance).gt(0)) {
                    dispatch(
                        yieldActions.resolveWrappedNativeStep({
                            ...sessionParams,
                            step: 'wrap',
                        }),
                    );
                }

                const response = await dispatch(
                    initYieldAllowanceThunk({
                        ...sessionParams,
                        flowData,
                    }),
                );

                if (!isFulfilled(response)) {
                    navigateBySessionStep();

                    return 'deposit-form';
                }

                navigateBySessionStep();
            } catch {
                navigateBySessionStep();
            } finally {
                isStartingDepositFlowRef.current = false;
                setIsStartingDepositFlow(false);
            }

            return 'deposit-form';
        }, [dispatch, flowData, flowKey, navigation, routeParams, store, shouldReplaceRoute]);

    return {
        handleStartYieldDepositFlow,
        isStartingDepositFlow,
    };
};
