import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type YieldRootState,
    type YieldWithdrawFlowType,
    selectYieldSessionByFlowKey,
    yieldActions,
} from '@suite-common/wallet-core';
import {
    type StackNavigationProps,
    type YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { WrappedNativeTokenReviewContent } from '../../components/earn/WrappedNativeTokenReviewContent';
import { useWrappedNativeReviewPreview } from '../../hooks/earn/useWrappedNativeReviewPreview';
import { useYieldFlowData } from '../../hooks/yield/useYieldFlowData';
import { type YieldBroadcastTransaction } from '../../types';

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldWithdrawUnwrapReview>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldWithdrawUnwrapReview
>;

export const YieldWithdrawUnwrapReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();

    const flowType: YieldWithdrawFlowType = route.params.withdrawFlowType ?? 'withdraw';

    const yieldFlowData = useYieldFlowData(route.params);
    const { account, flowKey, resolutionStatus } = yieldFlowData;

    const session = useSelector((state: YieldRootState) =>
        selectYieldSessionByFlowKey(state, flowType, flowKey),
    );

    const actionReview = session?.action.review;
    const review = actionReview?.type === 'unwrap' ? actionReview : null;

    const { preview, spentToken } = useWrappedNativeReviewPreview({
        account,
        amount: review?.amount,
        flowType: 'unwrap',
        unsignedTransaction: review?.unsignedTransaction,
    });

    useEffect(() => {
        if (resolutionStatus !== 'resolved') {
            return;
        }

        if (!review || session?.step !== 'unwrap') {
            navigation.navigate(YieldStackRoutes.YieldWithdrawUnwrap, route.params);
        }
    }, [navigation, resolutionStatus, review, route.params, session?.step]);

    const handleBroadcast = useCallback(
        ({ txid, fee }: YieldBroadcastTransaction) => {
            if (!flowKey || !review) {
                return;
            }

            dispatch(
                yieldActions.setPendingTx({
                    flowType,
                    flowKey,
                    tx: {
                        type: 'unwrap',
                        txid,
                        amount: review.amount,
                        fee,
                        submittedAt: Date.now(),
                    },
                }),
            );
            navigation.popTo(YieldStackRoutes.YieldWithdrawUnwrap, route.params);
        },
        [dispatch, flowKey, flowType, navigation, review, route.params],
    );

    if (resolutionStatus !== 'resolved' || !account || !spentToken || !review || !preview) {
        return null;
    }

    return (
        <WrappedNativeTokenReviewContent
            account={account}
            amount={review.amount}
            flowContext="in-flow"
            flowType="unwrap"
            onBroadcast={handleBroadcast}
            preview={preview}
            spentToken={spentToken}
            unsignedTransaction={review.unsignedTransaction}
        />
    );
};
