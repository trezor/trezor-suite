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
import { signEthUnstakeTransactionNativeThunk } from '@suite-native/staking';

import { useEarnReviewBackNavigation } from './useEarnReviewBackNavigation';
import { useShowDeviceDisconnectedDuringEarnReviewAlert } from './useShowDeviceDisconnectedDuringEarnReviewAlert';
import { useShowPushTransactionFailedDuringUnstakeReviewAlert } from './useShowPushTransactionFailedDuringUnstakeReviewAlert';

type NavigationProps = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.UnstakeTransactionDataReview
>;

type HandleOnUnstakeTransactionReviewProps = {
    accountKey: AccountKey;
    amount: string;
    onTransactionSubmitted: (txid: string) => void;
};

const USER_CANCELLED_ERROR_CODES = [
    'Failure_PinCancelled',
    'Method_Cancel',
    'Failure_ActionCancelled',
] as const;

export const useHandleOnUnstakeTransactionReview = ({
    accountKey,
    amount,
    onTransactionSubmitted,
}: HandleOnUnstakeTransactionReviewProps) => {
    useEarnReviewBackNavigation('unstake', accountKey);

    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedDuringEarnReviewAlert();
    const { showPushTransactionFailedAlert, showPendingTransactionConflictAlert } =
        useShowPushTransactionFailedDuringUnstakeReviewAlert();

    const handleOnUnstakeTransactionReview = useCallback(async () => {
        const response = await dispatch(
            signEthUnstakeTransactionNativeThunk({ accountKey, amount }),
        );

        if (isFulfilled(response)) {
            onTransactionSubmitted(response.payload.txid);

            return;
        }

        if (!isRejected(response)) {
            return;
        }

        if (response.payload?.error === 'push-transaction-pending-conflict') {
            showPendingTransactionConflictAlert();

            return;
        }

        if (response.payload?.error === 'push-transaction-failed') {
            showPushTransactionFailedAlert();

            return;
        }

        const errorCode = response.payload?.errorCode;

        if (USER_CANCELLED_ERROR_CODES.some(code => code === errorCode)) {
            navigation.pop();

            return;
        }

        showDeviceDisconnectedAlert();
    }, [
        accountKey,
        amount,
        dispatch,
        navigation,
        onTransactionSubmitted,
        showDeviceDisconnectedAlert,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
    ]);

    return handleOnUnstakeTransactionReview;
};
