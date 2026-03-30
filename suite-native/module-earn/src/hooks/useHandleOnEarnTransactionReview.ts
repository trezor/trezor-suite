import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { formDraftActions, sendFormActions } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackNavigationProps,
    useOverrideBackNavigation,
} from '@suite-native/navigation';
import { signEthStakeTransactionNativeThunk } from '@suite-native/staking';
import {
    type TransactionReviewOutputsState,
    selectIsTransactionReviewInProgress,
    useShowReviewCancellationAlert,
} from '@suite-native/transaction-management';

import { useShowDeviceDisconnectedDuringEarnReviewAlert } from './useShowDeviceDisconnectedDuringEarnReviewAlert';
import { useShowPushTransactionFailedDuringEarnReviewAlert } from './useShowPushTransactionFailedDuringEarnReviewAlert';

type NavigationProps = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.EarnTransactionDataReview
>;

type HandleOnEarnTransactionReviewProps = {
    accountKey: AccountKey;
    amount: string;
    onTransactionSubmitted: (txid: string) => void;
};

const USER_CANCELLED_ERROR_CODES = [
    'Failure_PinCancelled',
    'Method_Cancel',
    'Failure_ActionCancelled',
] as const;

export const useHandleOnEarnTransactionReview = ({
    accountKey,
    amount,
    onTransactionSubmitted,
}: HandleOnEarnTransactionReviewProps) => {
    const isTransactionReviewInProgress = useSelector((state: TransactionReviewOutputsState) =>
        selectIsTransactionReviewInProgress(state, 'stake', accountKey),
    );

    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const showReviewCancellationAlert = useShowReviewCancellationAlert();
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedDuringEarnReviewAlert();
    const { showPushTransactionFailedAlert, showPendingTransactionConflictAlert } =
        useShowPushTransactionFailedDuringEarnReviewAlert();

    const onNavigateBack = useCallback(async () => {
        if (isTransactionReviewInProgress) {
            const { wasReviewCanceled } = await showReviewCancellationAlert();
            if (!wasReviewCanceled) return;
        }
        dispatch(sendFormActions.discardTransaction());
        dispatch(formDraftActions.removeDraft({ key: getFormDraftKey('stake', '') }));
        navigation.goBack();
    }, [isTransactionReviewInProgress, showReviewCancellationAlert, dispatch, navigation]);

    useOverrideBackNavigation({ onNavigateBack });

    const handleOnEarnTransactionReview = useCallback(async () => {
        const response = await dispatch(signEthStakeTransactionNativeThunk({ accountKey, amount }));

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

    return handleOnEarnTransactionReview;
};
