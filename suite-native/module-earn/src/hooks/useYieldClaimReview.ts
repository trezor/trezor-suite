import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import {
    type YieldRootState,
    isYieldTxReviewForFlow,
    selectYieldTxReview,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import type {
    StackNavigationProps,
    YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import { pushYieldClaimReviewThunk, signYieldClaimReviewThunk } from '../yieldClaimThunks';
import { useEarnTransactionReview } from './useEarnTransactionReview';
import { useYieldReviewAnalytics } from './useYieldReviewAnalytics';

type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldClaimReview>;

interface UseYieldClaimReviewProps {
    account: Account;
    flowKey: string;
    onReviewLeave?: () => void;
}

export const useYieldClaimReview = ({
    account,
    flowKey,
    onReviewLeave,
}: UseYieldClaimReviewProps) => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();

    const { reportError: reportClaimError, reportCancel: reportClaimCancel } =
        useYieldReviewAnalytics({
            flow: 'claim',
            networkSymbol: account.symbol,
        });

    const txReview = useSelector((state: YieldRootState) => selectYieldTxReview(state));

    // A leftover signed tx from a previous review of the same account must not appear
    // as signed here, hence the flow identity and `notBefore` guard.
    const [reviewOpenedAt] = useState(() => Date.now());

    const isClaimSigned =
        isYieldTxReviewForFlow(txReview, {
            accountKey: account.key,
            flowKey,
            flowType: 'claim',
            notBefore: reviewOpenedAt,
        }) && !!txReview.serializedTx;

    const signAction = useCallback(
        () => dispatch(signYieldClaimReviewThunk({ account, flowKey })),
        [account, dispatch, flowKey],
    );

    const pushAction = useCallback(
        () => dispatch(pushYieldClaimReviewThunk({ account, flowKey })),
        [account, dispatch, flowKey],
    );

    const onPushSuccess = useCallback(() => navigation.goBack(), [navigation]);

    const review = useEarnTransactionReview({
        formType: 'yield-claim',
        isSigned: isClaimSigned,
        navigation,
        onPushSuccess,
        onReviewLeave,
        reportCancel: reportClaimCancel,
        reportError: reportClaimError,
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
