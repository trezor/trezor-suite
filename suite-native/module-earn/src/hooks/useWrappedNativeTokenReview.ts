import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type WrappedNativeFlowType, type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    type StackNavigationProps,
    type WrappedNativeTokenStackParamList,
    type WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';

import { type YieldReviewSigningResult, type YieldReviewStatus } from '../types';
import {
    type SignedWrappedNativeTokenTransaction,
    pushWrappedNativeTokenThunk,
    signWrappedNativeTokenThunk,
} from '../wrappedNativeTokenThunks';
import { useEarnTransactionReview } from './useEarnTransactionReview';
import { wrappedNativeTokenFlowRoutes } from '../utils/wrappedNativeTokenFlowRoutes';

type UseWrappedNativeTokenReviewParams = {
    account: Account;
    flowType: WrappedNativeFlowType;
    token: YieldFlowDisplayToken;
    amount: string;
    unsignedTransaction: string;
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
    flowType,
    token,
    amount,
    unsignedTransaction,
    onReviewLeave,
}: UseWrappedNativeTokenReviewParams): UseWrappedNativeTokenReviewResult => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const [signedTransaction, setSignedTransaction] =
        useState<SignedWrappedNativeTokenTransaction | null>(null);

    const signAction = useCallback(
        () =>
            dispatch(signWrappedNativeTokenThunk({ account, token, amount, unsignedTransaction })),
        [account, amount, dispatch, token, unsignedTransaction],
    );
    const pushAction = useCallback(
        () =>
            signedTransaction
                ? dispatch(pushWrappedNativeTokenThunk({ account, signedTransaction }))
                : null,
        [account, dispatch, signedTransaction],
    );
    const onPushSuccess = useCallback(
        ({ txid }: { txid: string }) => {
            if (!signedTransaction) {
                return;
            }

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
        [account, amount, flowType, navigation, signedTransaction],
    );

    const review = useEarnTransactionReview({
        formType: flowType === 'wrap' ? 'wrap-native' : 'unwrap-native',
        isSigned: !!signedTransaction,
        navigation,
        onPushSuccess,
        onReviewLeave,
        onSignSuccess: setSignedTransaction,
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
