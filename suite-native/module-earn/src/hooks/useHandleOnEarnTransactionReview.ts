import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { events } from '@suite-native/analytics';
import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
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
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const analytics = useAnalytics();

    const handleOnEarnTransactionReview = useCallback(async () => {
        if (!precomposedTransaction) return;

        const response = await dispatch(
            signEthStakeTransactionNativeThunk({ accountKey, amount, precomposedTransaction }),
        );

        if (isFulfilled(response)) {
            analytics.report({
                type: events.stakingConfirmEvent.name,
                payload: {
                    action: 'stake',
                    networkSymbol: networkSymbol ?? undefined,
                },
            });
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
        analytics,
        dispatch,
        navigation,
        networkSymbol,
        onTransactionSubmitted,
        precomposedTransaction,
        showDeviceDisconnectedAlert,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
    ]);

    return handleOnEarnTransactionReview;
};
