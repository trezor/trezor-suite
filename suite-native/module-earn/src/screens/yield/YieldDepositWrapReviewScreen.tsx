import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type YieldRootState,
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

type RouteProps = RouteProp<YieldStackParamList, YieldStackRoutes.YieldDepositWrapReview>;
type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositWrapReview
>;

export const YieldDepositWrapReviewScreen = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const dispatch = useDispatch();

    const yieldFlowData = useYieldFlowData(route.params);
    const { account, flowKey, resolutionStatus } = yieldFlowData;

    const session = useSelector((state: YieldRootState) =>
        selectYieldSessionByFlowKey(state, 'deposit', flowKey),
    );

    const actionReview = session?.action.review;
    const review = actionReview?.type === 'wrap' ? actionReview : null;

    const { preview, spentToken } = useWrappedNativeReviewPreview({
        account,
        amount: review?.amount,
        flowType: 'wrap',
        unsignedTransaction: review?.unsignedTransaction,
    });

    useEffect(() => {
        if (resolutionStatus !== 'resolved') {
            return;
        }

        if (!review || session?.step !== 'wrap') {
            navigation.navigate(YieldStackRoutes.YieldDepositWrap, route.params);
        }
    }, [navigation, resolutionStatus, review, route.params, session?.step]);

    const handleBroadcast = useCallback(
        ({ txid, fee }: YieldBroadcastTransaction) => {
            if (!flowKey || !review) {
                return;
            }

            dispatch(
                yieldActions.setPendingTx({
                    flowType: 'deposit',
                    flowKey,
                    tx: {
                        type: 'wrap',
                        txid,
                        amount: review.amount,
                        fee,
                        submittedAt: Date.now(),
                    },
                }),
            );
            navigation.popTo(YieldStackRoutes.YieldDepositWrap, route.params);
        },
        [dispatch, flowKey, navigation, review, route.params],
    );

    if (resolutionStatus !== 'resolved' || !account || !spentToken || !review || !preview) {
        return null;
    }

    return (
        <WrappedNativeTokenReviewContent
            account={account}
            amount={review.amount}
            flowContext="in-flow"
            flowType="wrap"
            onBroadcast={handleBroadcast}
            preview={preview}
            spentToken={spentToken}
            unsignedTransaction={review.unsignedTransaction}
        />
    );
};
