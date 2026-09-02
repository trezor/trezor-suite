import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type YieldFlowResolvedData,
    type YieldRootState,
    isYieldTxReviewForFlow,
    selectYieldTxReview,
} from '@suite-common/wallet-core';
import type {
    StackNavigationProps,
    YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { useYieldReviewAnalytics } from './useYieldReviewAnalytics';
import {
    pushYieldActionReviewThunk,
    signYieldActionReviewThunk,
} from '../../thunks/yieldTransactionThunks';
import { useEarnTransactionReview } from '../earn/useEarnTransactionReview';

type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositReview
>;

interface UseYieldDepositReviewProps {
    flowData: YieldFlowResolvedData;
    flowKey: string;
    onReviewLeave?: () => void;
}

export const useYieldDepositReview = ({
    flowData,
    flowKey,
    onReviewLeave,
}: UseYieldDepositReviewProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();

    const { reportError: reportDepositError, reportCancel: reportDepositCancel } =
        useYieldReviewAnalytics({
            flow: 'deposit',
            networkSymbol: flowData.account.symbol,
            vaultId: flowData.vault.id,
        });

    const txReview = useSelector((state: YieldRootState) => selectYieldTxReview(state));

    // A leftover signed tx from a previous review of the same account must not appear
    // as signed here, hence the flow identity and `notBefore` guard.
    const [reviewOpenedAt] = useState(() => Date.now());

    const isDepositSigned =
        isYieldTxReviewForFlow(txReview, {
            accountKey: flowData.account.key,
            flowKey,
            flowType: 'deposit',
            notBefore: reviewOpenedAt,
        }) && !!txReview.serializedTx;

    const signAction = useCallback(
        () => dispatch(signYieldActionReviewThunk({ flowData, flowKey, flowType: 'deposit' })),
        [dispatch, flowData, flowKey],
    );

    const pushAction = useCallback(
        () => dispatch(pushYieldActionReviewThunk({ flowData, flowKey, flowType: 'deposit' })),
        [dispatch, flowData, flowKey],
    );

    const onPushSuccess = useCallback(() => navigation.goBack(), [navigation]);

    const review = useEarnTransactionReview({
        formType: 'yield-deposit',
        isSigned: isDepositSigned,
        navigation,
        onPushSuccess,
        onReviewLeave,
        reportCancel: reportDepositCancel,
        reportError: reportDepositError,
        signAction,
        pushAction,
    });

    return {
        status: review.status,
        submit: review.handleSubmitted,
        startReview: review.startReview,
        leaveReviewFromDeviceCancel: review.leaveReviewFromDeviceCancel,
    };
};
