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
import { signEthClaimTransactionNativeThunk } from '@suite-native/staking';

import { handleEarnReviewError } from '../utils';
import { useEarnReviewBackNavigation } from './useEarnReviewBackNavigation';
import { useShowDeviceDisconnectedDuringEarnReviewAlert } from './useShowDeviceDisconnectedDuringEarnReviewAlert';
import { useShowPushTransactionFailedDuringReviewAlert } from './useShowPushTransactionFailedDuringReviewAlert';

type NavigationProps = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.ClaimTransactionDataReview
>;

type HandleOnClaimTransactionReviewProps = {
    accountKey: AccountKey;
    onTransactionSubmitted: (txid: string) => void;
};

export const useHandleOnClaimTransactionReview = ({
    accountKey,
    onTransactionSubmitted,
}: HandleOnClaimTransactionReviewProps) => {
    useEarnReviewBackNavigation('claim', accountKey);

    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedDuringEarnReviewAlert();
    const { showPushTransactionFailedAlert, showPendingTransactionConflictAlert } =
        useShowPushTransactionFailedDuringReviewAlert('claim');

    const handleOnClaimTransactionReview = useCallback(async () => {
        const response = await dispatch(signEthClaimTransactionNativeThunk({ accountKey }));

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
        dispatch,
        navigation,
        onTransactionSubmitted,
        showDeviceDisconnectedAlert,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
    ]);

    return handleOnClaimTransactionReview;
};
