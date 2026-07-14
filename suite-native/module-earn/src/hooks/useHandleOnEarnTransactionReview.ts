import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import { useServices } from '@suite-common/dependency-injection';
import { type AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import {
    pushStakeTransactionNativeThunk,
    signStakeTransactionNativeThunk,
} from '@suite-native/staking';

import { type EarnFormDraftPrefix } from '../types';
import { handleEarnReviewError } from '../utils';
import { useEarnReviewBackNavigation } from './useEarnReviewBackNavigation';
import { useEarnSelectedPrecomposedTransaction } from './useEarnSelectedPrecomposedTransaction';
import { useShowDeviceDisconnectedDuringEarnReviewAlert } from './useShowDeviceDisconnectedDuringEarnReviewAlert';
import { useShowPushTransactionFailedDuringReviewAlert } from './useShowPushTransactionFailedDuringReviewAlert';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

type HandleOnEarnTransactionReviewProps = {
    accountKey: AccountKey;
    stakeType: EarnFormDraftPrefix;
};

export const useHandleOnEarnTransactionReview = ({
    accountKey,
    stakeType,
}: HandleOnEarnTransactionReviewProps) => {
    const { closeReview, markReviewNavigationSuccess } = useEarnReviewBackNavigation(
        stakeType,
        accountKey,
    );

    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedDuringEarnReviewAlert();
    const { showPushTransactionFailedAlert, showPendingTransactionConflictAlert } =
        useShowPushTransactionFailedDuringReviewAlert(stakeType);
    const precomposedTransaction = useEarnSelectedPrecomposedTransaction(stakeType, accountKey);
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const { analytics } = useServices(selectNativeAnalyticsDep);

    const handleSign = useCallback(async (): Promise<boolean> => {
        if (!precomposedTransaction) return false;

        const response = await dispatch(
            signStakeTransactionNativeThunk({
                accountKey,
                stakeType,
                precomposedTransaction,
            }),
        );

        if (!isRejected(response)) {
            return true;
        }

        handleEarnReviewError({
            payload: response.payload,
            navigation,
            showPushTransactionFailedAlert,
            showPendingTransactionConflictAlert,
            showDeviceDisconnectedAlert,
        });

        return false;
    }, [
        accountKey,
        dispatch,
        navigation,
        precomposedTransaction,
        showDeviceDisconnectedAlert,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
        stakeType,
    ]);

    const handlePush = useCallback(async (): Promise<string | undefined> => {
        const response = await dispatch(pushStakeTransactionNativeThunk({ accountKey }));

        if (isFulfilled(response)) {
            analytics.report({
                type: events.stakingConfirmEvent.name,
                payload: {
                    action: stakeType,
                    networkSymbol: networkSymbol ?? undefined,
                },
            });

            return response.payload.txid;
        }

        if (isRejected(response)) {
            handleEarnReviewError({
                payload: response.payload,
                navigation,
                showPushTransactionFailedAlert,
                showPendingTransactionConflictAlert,
                showDeviceDisconnectedAlert,
            });
        }

        return undefined;
    }, [
        accountKey,
        analytics,
        dispatch,
        navigation,
        networkSymbol,
        showDeviceDisconnectedAlert,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
        stakeType,
    ]);

    return { handleSign, handlePush, closeReview, markReviewNavigationSuccess };
};
