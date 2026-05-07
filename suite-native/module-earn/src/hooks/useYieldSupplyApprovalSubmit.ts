import { useCallback, useState } from 'react';
import { useDispatch, useStore } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import {
    type StablecoinYieldRootState,
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

type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldSupplyFlow>;

type UseYieldSupplyApprovalSubmitParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    approvalLimitType: YieldApprovalLimitType;
    routeParams: YieldFlowParams;
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
            dispatch(stablecoinYieldActions.resetSession(sessionParams));
            dispatch(stablecoinYieldActions.initSession(sessionParams));

            try {
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
                    showSupplyWorkInProgress('Already approved');

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
