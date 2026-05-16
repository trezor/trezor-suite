import { useCallback, useState } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import {
    type StablecoinYieldRootState,
    initYieldAllowanceThunk,
    selectStablecoinYieldSession,
    stablecoinYieldActions,
    submitYieldApproveThunk,
} from '@suite-common/wallet-core';
import {
    type StackNavigationProps,
    type YieldFlowParams,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { useWorkInProgressAlert } from './useWorkInProgressAlert';
import { type YieldApprovalLimitType } from '../types';
import { prepareYieldApprovalReviewTransactionThunk } from '../yieldApprovalThunks';
import { isYieldApprovalAllowanceEnough } from '../yieldApprovalUtils';

type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldSupplyApproval
>;

type UseYieldSupplyApprovalSubmitParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    approvalLimitType: YieldApprovalLimitType;
    routeParams: YieldFlowParams;
};

type YieldDepositSessionParams = {
    flowType: 'deposit';
    flowKey: string;
};

type CheckIsAllowanceEnoughParams = {
    amount: string;
    resolvedFlowData: NonNullable<ResolvedYieldFlowData['flowData']>;
    resolvedFlowKey: string;
    sessionParams: YieldDepositSessionParams;
};

export const useYieldSupplyApprovalSubmit = ({
    approvalLimitType,
    flowData,
    flowKey,
    routeParams,
}: UseYieldSupplyApprovalSubmitParams) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const store = useStore<StablecoinYieldRootState>();
    const showWorkInProgressAlert = useWorkInProgressAlert();
    const [isCheckingApproval, setIsCheckingApproval] = useState(false);

    const checkIsAllowanceEnough = useCallback(
        async ({
            amount,
            resolvedFlowData,
            resolvedFlowKey,
            sessionParams,
        }: CheckIsAllowanceEnoughParams) => {
            let sessionWithAllowance = selectStablecoinYieldSession(
                store.getState(),
                'deposit',
                resolvedFlowKey,
            );

            if (sessionWithAllowance.approval.allowanceStatus !== 'loaded') {
                await dispatch(
                    initYieldAllowanceThunk({
                        ...sessionParams,
                        flowData: resolvedFlowData,
                        shouldSkipApprovalStep: false,
                    }),
                );

                sessionWithAllowance = selectStablecoinYieldSession(
                    store.getState(),
                    'deposit',
                    resolvedFlowKey,
                );
            }

            return isYieldApprovalAllowanceEnough({
                amount,
                session: sessionWithAllowance,
                token: resolvedFlowData.token,
            });
        },
        [dispatch, store],
    );

    const handleSubmitApproval = useCallback(
        async (amount: string) => {
            if (isCheckingApproval || !flowData || !flowKey) {
                return;
            }

            const sessionParams = { flowType: 'deposit' as const, flowKey };
            const showSupplyWorkInProgress = (title?: string) => {
                // TODO: Replace with correct handling flow once deposit is implemented.
                showWorkInProgressAlert(title);
                dispatch(stablecoinYieldActions.resetSession(sessionParams));
            };

            setIsCheckingApproval(true);

            try {
                const isAllowanceEnough = await checkIsAllowanceEnough({
                    amount,
                    resolvedFlowData: flowData,
                    resolvedFlowKey: flowKey,
                    sessionParams,
                });

                if (isAllowanceEnough) {
                    dispatch(stablecoinYieldActions.clearError(sessionParams));
                    dispatch(stablecoinYieldActions.completeApproval({ ...sessionParams, amount }));
                    navigation.navigate(YieldStackRoutes.YieldSupply, routeParams);

                    return;
                }

                const response = await dispatch(
                    submitYieldApproveThunk({
                        ...sessionParams,
                        flowData,
                        amount,
                    }),
                );

                if (!isFulfilled(response)) {
                    showSupplyWorkInProgress();

                    return;
                }

                const session = selectStablecoinYieldSession(store.getState(), 'deposit', flowKey);

                if (session.error) {
                    // TODO: Show a dedicated approval error
                    showSupplyWorkInProgress();

                    return;
                }

                if (!session.approval.modalState) {
                    if (session.step === 'action') {
                        navigation.navigate(YieldStackRoutes.YieldSupply, routeParams);
                    }

                    return;
                }

                const reviewTransactionResponse = await dispatch(
                    prepareYieldApprovalReviewTransactionThunk({
                        amount,
                        approvalLimitType,
                        flowData,
                        flowKey,
                        tokenContract: routeParams.tokenContract,
                    }),
                );

                if (!isFulfilled(reviewTransactionResponse)) {
                    // TODO: Show a dedicated error
                    showSupplyWorkInProgress();

                    return;
                }

                navigation.navigate(YieldStackRoutes.YieldSupplyApprovalReview, {
                    ...routeParams,
                    amount,
                    approvalLimitType,
                });
            } finally {
                setIsCheckingApproval(false);
            }
        },
        [
            approvalLimitType,
            checkIsAllowanceEnough,
            dispatch,
            flowData,
            flowKey,
            isCheckingApproval,
            navigation,
            routeParams,
            showWorkInProgressAlert,
            store,
        ],
    );

    return {
        handleSubmitApproval,
        isCheckingApproval,
    };
};
