import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import {
    type StackNavigationProps,
    type YieldFlowParams,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { type ResolvedYieldFlowData } from './useResolvedYieldFlowData';
import { useWorkInProgressAlert } from './useWorkInProgressAlert';
import { prepareYieldSupplyReviewTransactionThunk } from '../yieldActionThunks';

type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldSupplyFlow>;

type UseYieldSupplyActionSubmitParams = Pick<ResolvedYieldFlowData, 'flowData' | 'flowKey'> & {
    routeParams: YieldFlowParams;
};

export const useYieldSupplyActionSubmit = ({
    flowData,
    flowKey,
    routeParams,
}: UseYieldSupplyActionSubmitParams) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const showWorkInProgressAlert = useWorkInProgressAlert();
    const [isPreparingActionReview, setIsPreparingActionReview] = useState(false);

    const handleSubmitAction = useCallback(
        async (amount: string) => {
            if (isPreparingActionReview || !flowData || !flowKey) {
                return;
            }

            setIsPreparingActionReview(true);

            try {
                const response = await dispatch(
                    prepareYieldSupplyReviewTransactionThunk({
                        amount,
                        flowData,
                        flowKey,
                    }),
                );

                if (!isFulfilled(response)) {
                    showWorkInProgressAlert();

                    return;
                }

                if (response.payload.type === 'approval-required') {
                    return;
                }

                navigation.navigate(YieldStackRoutes.YieldSupplyReview, {
                    ...routeParams,
                    amount: response.payload.amount,
                    receiptAmount: response.payload.receiptAmount,
                    transactionId: response.payload.transactionId,
                });
            } finally {
                setIsPreparingActionReview(false);
            }
        },
        [
            dispatch,
            flowData,
            flowKey,
            isPreparingActionReview,
            navigation,
            routeParams,
            showWorkInProgressAlert,
        ],
    );

    return {
        handleSubmitAction,
        isPreparingActionReview,
    };
};
