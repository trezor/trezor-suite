import { useCallback, useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useDispatch } from '@suite-common/redux-utils';
import { type WrappedNativeFlowType, type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    type StackNavigationProps,
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';

import {
    type YieldBroadcastTransaction,
    type YieldReviewSigningResult,
    type YieldReviewStatus,
} from '../types';
import { useEarnTransactionReview } from './useEarnTransactionReview';
import { useWrappedNativeFlowAnalytics } from './useWrappedNativeFlowAnalytics';
import { wrappedNativeTokenFlowRoutes } from '../utils/wrappedNativeTokenFlowRoutes';
import {
    type SignedWrappedNativeTokenTransaction,
    pushWrappedNativeTokenThunk,
    signWrappedNativeTokenThunk,
} from '../wrappedNativeTokenThunks';

type UseWrappedNativeTokenReviewParams = {
    account: Account;
    flowContext: 'standalone' | 'in-flow';
    flowType: WrappedNativeFlowType;
    token: YieldFlowDisplayToken;
    amount: string;
    unsignedTransaction: string;

    onBroadcast?: (broadcast: YieldBroadcastTransaction) => void;
    onReviewLeave?: () => void;
};

type UseWrappedNativeTokenReviewResult = {
    handleSubmitted: () => Promise<void>;
    leaveReviewFromDeviceCancel: () => void;
    startReview: () => Promise<YieldReviewSigningResult>;
    status: YieldReviewStatus;
};

type NavigationProps = StackNavigationProps<
    WrappedNativeTokenStackParamList,
    | WrappedNativeTokenStackRoutes.WrapNativeTokenReview
    | WrappedNativeTokenStackRoutes.UnwrapNativeTokenReview
>;

export const useWrappedNativeTokenReview = ({
    account,
    flowContext,
    flowType,
    token,
    amount,
    unsignedTransaction,
    onBroadcast,
    onReviewLeave,
}: UseWrappedNativeTokenReviewParams): UseWrappedNativeTokenReviewResult => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const [signedTransaction, setSignedTransaction] =
        useState<SignedWrappedNativeTokenTransaction | null>(null);

    // The in-flow wrap step is already tracked as yield/deposit type:'wrap', so reporting
    // yield/wrap|yield/unwrap here too would double-count it.
    const isStandaloneFlow = flowContext === 'standalone';
    const { reportError, reportSent } = useWrappedNativeFlowAnalytics({
        flowType,
        networkSymbol: account.symbol,
    });
    const reportSubmitFailed = useCallback(() => reportError('submit-failed'), [reportError]);

    const signAction = useCallback(
        () =>
            dispatch(signWrappedNativeTokenThunk({ account, token, amount, unsignedTransaction })),
        [account, amount, dispatch, token, unsignedTransaction],
    );
    const pushAction = useCallback(
        () =>
            signedTransaction
                ? dispatch(pushWrappedNativeTokenThunk({ account, flowType, signedTransaction }))
                : null,
        [account, dispatch, flowType, signedTransaction],
    );
    const onPushSuccess = useCallback(
        ({ txid }: { txid: string }) => {
            if (!signedTransaction) {
                return;
            }

            if (onBroadcast) {
                onBroadcast({ txid, fee: signedTransaction.precomposedTransaction.fee });

                return;
            }

            reportSent();
            navigation.popTo(wrappedNativeTokenFlowRoutes[flowType].form, {
                accountKey: account.key,
                pendingTransaction: {
                    amount,
                    fee: signedTransaction.precomposedTransaction.fee,
                    submittedAt: Date.now(),
                    txid,
                },
            });
        },
        [account, amount, flowType, navigation, onBroadcast, reportSent, signedTransaction],
    );

    const review = useEarnTransactionReview({
        formType: flowType === 'wrap' ? 'wrap-native' : 'unwrap-native',
        isSigned: !!signedTransaction,
        navigation,
        onPushSuccess,
        onReviewLeave,
        onSignSuccess: setSignedTransaction,
        reportCancel: isStandaloneFlow ? reportSubmitFailed : undefined,
        reportError: isStandaloneFlow ? reportError : undefined,
        signAction,
        pushAction,
    });

    return {
        handleSubmitted: review.handleSubmitted,
        leaveReviewFromDeviceCancel: review.leaveReviewFromDeviceCancel,
        startReview: review.startReview,
        status: review.status,
    };
};
