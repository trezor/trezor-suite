import { useCallback, useState } from 'react';
import { useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type ResolvedYieldFlowData,
    type YieldRootState,
    getYieldApprovalAction,
    initYieldAllowanceThunk,
    selectYieldSession,
    submitYieldApproveThunk,
    yieldActions,
} from '@suite-common/wallet-core';
import {
    type StackNavigationProps,
    type YieldFlowParams,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { useShowYieldAlert } from './useShowYieldAlert';
import { prepareYieldAllowanceReviewTransactionThunk } from '../../thunks/yieldApprovalThunks';
import { type YieldApprovalLimitType } from '../../types';

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
    const store = useStore<YieldRootState>();
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
                let sessionWithAllowance = selectYieldSession(store.getState(), 'deposit', flowKey);

                if (sessionWithAllowance.approval.allowanceStatus !== 'loaded') {
                    await dispatch(
                        initYieldAllowanceThunk({
                            ...sessionParams,
                            flowData,
                            shouldSkipApprovalStep: false,
                        }),
                    );

                    sessionWithAllowance = selectYieldSession(store.getState(), 'deposit', flowKey);
                }

                const approvalAction = getYieldApprovalAction({
                    liveAmount: amount,
                    allowanceAmount: sessionWithAllowance.approval.allowanceAmount,
                    shouldConsiderAllowance: true,
                    isRevokeRequired: sessionWithAllowance.approval.isRevokeRequired,
                    tokenContractAddress: flowData.token.contractAddress,
                });

                if (approvalAction === 'continue') {
                    dispatch(yieldActions.clearError(sessionParams));
                    dispatch(yieldActions.completeApproval({ ...sessionParams, amount }));
                    navigation.navigate(YieldStackRoutes.YieldDeposit, routeParams);

                    return;
                }

                if (approvalAction === 'revoke') {
                    dispatch(yieldActions.enterModifyMode({ ...sessionParams, amount }));
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

                const session = selectYieldSession(store.getState(), 'deposit', flowKey);

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
