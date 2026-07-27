import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { selectIsDeviceConnected } from '@suite-common/device';
import {
    type StablecoinYieldRootState,
    isYieldTxReviewForFlow,
    selectStablecoinYieldTxReview,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import type {
    StackNavigationProps,
    YieldStackParamList,
    YieldStackRoutes,
} from '@suite-native/navigation';

import {
    type YieldReviewActionStatus,
    type YieldReviewSigningResult,
    type YieldReviewStatus,
} from '../types';
import { handleEarnReviewError, isUserCancelledSignError } from '../utils';
import { pushYieldClaimReviewThunk, signYieldClaimReviewThunk } from '../yieldClaimThunks';
import { useShowDeviceDisconnectedDuringEarnReviewAlert } from './useShowDeviceDisconnectedDuringEarnReviewAlert';
import { useShowPushTransactionFailedDuringReviewAlert } from './useShowPushTransactionFailedDuringReviewAlert';
import { useYieldActionReviewBackNavigation } from './useYieldActionReviewBackNavigation';
import { useYieldReviewAnalytics } from './useYieldReviewAnalytics';

type UseYieldClaimReviewParams = {
    account: Account;
    flowKey: string;
    onReviewLeave?: () => void;
};

type UseYieldClaimReviewResult = {
    claimStatus: YieldReviewStatus;
    handleClaimSubmitted: () => Promise<void>;
    leaveReviewFromDeviceCancel: () => void;
    startClaimReview: () => Promise<YieldReviewSigningResult>;
};

type NavigationProps = StackNavigationProps<YieldStackParamList, YieldStackRoutes.YieldClaimReview>;

export const useYieldClaimReview = ({
    account,
    flowKey,
    onReviewLeave,
}: UseYieldClaimReviewParams): UseYieldClaimReviewResult => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const { showPendingTransactionConflictAlert, showPushTransactionFailedAlert } =
        useShowPushTransactionFailedDuringReviewAlert('yield-claim');
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedDuringEarnReviewAlert();

    const { reportError: reportClaimError, reportCancel: reportClaimCancel } =
        useYieldReviewAnalytics({
            flow: 'claim',
            networkSymbol: account.symbol,
        });
    const [claimActionStatus, setClaimActionStatus] = useState<YieldReviewActionStatus>('idle');
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const txReview = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldTxReview(state),
    );
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
    const claimStatus: YieldReviewStatus =
        claimActionStatus === 'idle' && isClaimSigned ? 'signed' : claimActionStatus;
    const { leaveReviewFromDeviceCancel, markReviewNavigationSuccess } =
        useYieldActionReviewBackNavigation({
            onReviewLeave,
            reviewStatus: claimStatus,
        });

    const startClaimReview = useCallback(async (): Promise<YieldReviewSigningResult> => {
        if (claimStatus === 'signed') {
            return 'signed';
        }

        if (claimStatus === 'signing' || claimStatus === 'sending') {
            return 'already-running';
        }

        if (claimStatus !== 'idle') {
            return 'not-ready';
        }

        if (!isDeviceConnected) {
            showDeviceDisconnectedAlert();

            return 'failed';
        }

        setClaimActionStatus('signing');

        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                signYieldClaimReviewThunk({
                    account,
                    flowKey,
                }),
            ),
        );

        setClaimActionStatus('idle');

        if (!deviceAccessResponse.success) {
            reportClaimError('submit-failed');
            handleEarnReviewError({
                payload: {
                    error: 'sign-transaction-failed',
                    message: 'Prioritized device access failed.',
                },
                navigation,
                showPushTransactionFailedAlert,
                showPendingTransactionConflictAlert,
                showDeviceDisconnectedAlert,
            });

            return 'failed';
        }

        const signResponse = deviceAccessResponse.payload;
        const isSignRejected = isRejected(signResponse);

        if (isSignRejected && isUserCancelledSignError(signResponse.payload)) {
            reportClaimCancel();

            return 'cancelled';
        }

        if (isSignRejected) {
            reportClaimError('submit-failed');
            handleEarnReviewError({
                payload: signResponse.payload,
                navigation,
                showPushTransactionFailedAlert,
                showPendingTransactionConflictAlert,
                showDeviceDisconnectedAlert,
            });

            return 'failed';
        }

        return 'signed';
    }, [
        account,
        claimStatus,
        dispatch,
        flowKey,
        isDeviceConnected,
        navigation,
        reportClaimCancel,
        reportClaimError,
        showDeviceDisconnectedAlert,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
    ]);

    const handleClaimSubmitted = useCallback(async () => {
        if (claimStatus !== 'signed') {
            return;
        }

        setClaimActionStatus('sending');

        const pushResponse = await dispatch(
            pushYieldClaimReviewThunk({
                account,
                flowKey,
            }),
        );

        setClaimActionStatus('idle');
        const isPushRejected = isRejected(pushResponse);

        if (isPushRejected) {
            reportClaimError('push-failed');

            if (pushResponse.payload?.error === 'push-transaction-pending-conflict') {
                showPendingTransactionConflictAlert();

                return;
            }

            showPushTransactionFailedAlert();

            return;
        }

        markReviewNavigationSuccess();
        navigation.goBack();
    }, [
        account,
        claimStatus,
        dispatch,
        flowKey,
        markReviewNavigationSuccess,
        navigation,
        reportClaimError,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
    ]);

    return {
        claimStatus,
        handleClaimSubmitted,
        leaveReviewFromDeviceCancel,
        startClaimReview,
    };
};
