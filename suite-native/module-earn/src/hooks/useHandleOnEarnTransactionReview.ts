import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { type AccountKey } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { signEthStakeTransactionNativeThunk } from '@suite-native/staking';

import { handleEarnReviewError } from '../utils';
import { useEarnReviewBackNavigation } from './useEarnReviewBackNavigation';
import { useEarnSelectedPrecomposedTransaction } from './useEarnSelectedPrecomposedTransaction';
import { useShowDeviceDisconnectedDuringEarnReviewAlert } from './useShowDeviceDisconnectedDuringEarnReviewAlert';
import { useShowPushTransactionFailedDuringReviewAlert } from './useShowPushTransactionFailedDuringReviewAlert';

type NavigationProps = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.EarnTransactionDataReview
>;

type HandleOnEarnTransactionReviewProps = {
    accountKey: AccountKey;
    amount: string;
    onTransactionSubmitted: (txid: string) => void;
};

export const useHandleOnEarnTransactionReview = ({
    accountKey,
    amount,
    onTransactionSubmitted,
}: HandleOnEarnTransactionReviewProps) => {
    useEarnReviewBackNavigation('stake', accountKey);

    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedDuringEarnReviewAlert();
    const { showPushTransactionFailedAlert, showPendingTransactionConflictAlert } =
        useShowPushTransactionFailedDuringReviewAlert('stake');
    const precomposedTransaction = useEarnSelectedPrecomposedTransaction('stake', accountKey);

    const handleOnEarnTransactionReview = useCallback(async () => {
        if (!precomposedTransaction) return;

        const response = await dispatch(
            signEthStakeTransactionNativeThunk({ accountKey, amount, precomposedTransaction }),
        );

        if (isFulfilled(response)) {
            onTransactionSubmitted(response.payload.txid);

            return;
        }

        if (!isRejected(response)) {
            return;
        }

        handleEarnReviewError({
            payload: response.payload,
            navigation,
            showPushTransactionFailedAlert,
            showPendingTransactionConflictAlert,
            showDeviceDisconnectedAlert,
        });
    }, [
        accountKey,
        amount,
        dispatch,
        navigation,
        onTransactionSubmitted,
        precomposedTransaction,
        showDeviceDisconnectedAlert,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
    ]);

    return handleOnEarnTransactionReview;
};
