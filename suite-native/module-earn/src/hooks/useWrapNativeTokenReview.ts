import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    type StackNavigationProps,
    type WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes,
} from '@suite-native/navigation';

import { type YieldReviewSigningResult, type YieldReviewStatus } from '../types';
import {
    type SignedWrapNativeTokenTransaction,
    pushWrapNativeTokenThunk,
    signWrapNativeTokenThunk,
} from '../wrapNativeTokenThunks';
import { useEarnTransactionReview } from './useEarnTransactionReview';

type UseWrapNativeTokenReviewParams = {
    account: Account;
    /** Native coin of the account (`contractAddress: null`) — the token being spent. */
    token: YieldFlowDisplayToken;
    amount: string;
    unsignedTransaction: string;
    onReviewLeave?: () => void;
};

type UseWrapNativeTokenReviewResult = {
    handleWrapSubmitted: () => Promise<void>;
    leaveReviewFromDeviceCancel: () => void;
    startWrapReview: () => Promise<YieldReviewSigningResult>;
    wrapStatus: YieldReviewStatus;
};

type NavigationProps = StackNavigationProps<
    WrappedNativeTokenStackParamList,
    WrappedNativeTokenStackRoutes.WrapNativeTokenReview
>;

/**
 * Session-less analogue of `useYieldDepositReview` for the standalone wrap flow — the signed
 * transaction is held in local state instead of the yield-session txReview store, because there
 * is no vault behind the flow.
 */
export const useWrapNativeTokenReview = ({
    account,
    token,
    amount,
    unsignedTransaction,
    onReviewLeave,
}: UseWrapNativeTokenReviewParams): UseWrapNativeTokenReviewResult => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const [signedTransaction, setSignedTransaction] =
        useState<SignedWrapNativeTokenTransaction | null>(null);

    const signAction = useCallback(
        () => dispatch(signWrapNativeTokenThunk({ account, token, amount, unsignedTransaction })),
        [account, amount, dispatch, token, unsignedTransaction],
    );
    const pushAction = useCallback(
        () =>
            signedTransaction
                ? dispatch(pushWrapNativeTokenThunk({ account, signedTransaction }))
                : null,
        [account, dispatch, signedTransaction],
    );
    const onPushSuccess = useCallback(
        ({ txid }: { txid: string }) => {
            if (!signedTransaction) {
                return;
            }

            navigation.popTo(WrappedNativeTokenStackRoutes.WrapNativeToken, {
                accountKey: account.key,
                pendingTransaction: {
                    amount,
                    fee: signedTransaction.precomposedTransaction.fee,
                    submittedAt: Date.now(),
                    txid,
                },
            });
        },
        [account, amount, navigation, signedTransaction],
    );

    const review = useEarnTransactionReview({
        formType: 'wrap-native',
        isSigned: !!signedTransaction,
        navigation,
        onPushSuccess,
        onReviewLeave,
        onSignSuccess: setSignedTransaction,
        signAction,
        pushAction,
    });

    return {
        handleWrapSubmitted: review.handleSubmitted,
        leaveReviewFromDeviceCancel: review.leaveReviewFromDeviceCancel,
        startWrapReview: review.startReview,
        wrapStatus: review.status,
    };
};
