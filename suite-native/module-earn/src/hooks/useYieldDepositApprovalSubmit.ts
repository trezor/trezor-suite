import { useCallback, useState } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import {
    type ResolvedYieldFlowData,
    type StablecoinYieldRootState,
    getYieldApprovalAction,
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

import { useShowYieldAlert } from './useShowYieldAlert';
import { type YieldApprovalLimitType } from '../types';
import { prepareYieldAllowanceReviewTransactionThunk } from '../yieldApprovalThunks';

type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositApproval
>;

type UseYieldDepositApprovalSubmitParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    approvalLimitType: YieldApprovalLimitType;
    routeParams: YieldFlowParams;
};

export const useYieldDepositApprovalSubmit = ({
    approvalLimitType,
    flowData,
    flowKey,
    routeParams,
}: UseYieldDepositApprovalSubmitParams) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const store = useStore<StablecoinYieldRootState>();
    const showYieldAlert = useShowYieldAlert();
    const [isCheckingApproval, setIsCheckingApproval] = useState(false);

    const handleSubmitApproval = useCallback(
        async (amount: string) => {
            if (isCheckingApproval || !flowData || !flowKey) {
                return;
            }

            const sessionParams = { flowType: 'deposit' as const, flowKey };

            setIsCheckingApproval(true);

            try {
                let sessionWithAllowance = selectStablecoinYieldSession(
                    store.getState(),
                    'deposit',
                    flowKey,
                );

                if (sessionWithAllowance.approval.allowanceStatus !== 'loaded') {
                    await dispatch(
                        initYieldAllowanceThunk({
                            ...sessionParams,
                            flowData,
                            shouldSkipApprovalStep: false,
                        }),
                    );

                    sessionWithAllowance = selectStablecoinYieldSession(
                        store.getState(),
                        'deposit',
                        flowKey,
                    );
                }

                const approvalAction = getYieldApprovalAction({
                    liveAmount: amount,
                    allowanceAmount: sessionWithAllowance.approval.allowanceAmount,
                    isModifyMode: true,
                    isRevokeRequired: sessionWithAllowance.approval.isRevokeRequired,
                    tokenContractAddress: flowData.token.contractAddress,
                });

                if (approvalAction === 'continue') {
                    dispatch(stablecoinYieldActions.clearError(sessionParams));
                    dispatch(stablecoinYieldActions.completeApproval({ ...sessionParams, amount }));
                    navigation.navigate(YieldStackRoutes.YieldDeposit, routeParams);

                    return;
                }

                if (approvalAction === 'revoke') {
                    dispatch(stablecoinYieldActions.enterModifyMode({ ...sessionParams, amount }));
                    navigation.navigate(YieldStackRoutes.YieldDepositRevoke, {
                        ...routeParams,
                        amount,
                        shouldShowLowLimitWarning: true,
                    });

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
                    showYieldAlert({
                        title: 'earn.yieldDepositFlowScreen.alerts.approvalUnavailable.title',
                        description:
                            'earn.yieldDepositFlowScreen.alerts.approvalUnavailable.description',
                    });

                    return;
                }

                const session = selectStablecoinYieldSession(store.getState(), 'deposit', flowKey);

                if (session.error) {
                    showYieldAlert({
                        title: 'earn.yieldDepositFlowScreen.alerts.approvalUnavailable.title',
                        description:
                            'earn.yieldDepositFlowScreen.alerts.approvalUnavailable.description',
                    });

                    return;
                }

                if (!session.approval.modalState) {
                    if (session.step === 'action') {
                        navigation.navigate(YieldStackRoutes.YieldDeposit, routeParams);
                    }

                    return;
                }

                const reviewTransactionResponse = await dispatch(
                    prepareYieldAllowanceReviewTransactionThunk({
                        amount,
                        approvalLimitType,
                        flowData,
                        flowKey,
                        transactionType: 'approve',
                        tokenContract: routeParams.tokenContract,
                    }),
                );

                if (!isFulfilled(reviewTransactionResponse)) {
                    showYieldAlert({
                        title: 'earn.yieldDepositFlowScreen.alerts.approvalReviewUnavailable.title',
                        description:
                            'earn.yieldDepositFlowScreen.alerts.approvalReviewUnavailable.description',
                    });

                    return;
                }

                navigation.navigate(YieldStackRoutes.YieldDepositApprovalReview, {
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
            dispatch,
            flowData,
            flowKey,
            isCheckingApproval,
            navigation,
            routeParams,
            showYieldAlert,
            store,
        ],
    );

    return {
        handleSubmitApproval,
        isCheckingApproval,
    };
};
