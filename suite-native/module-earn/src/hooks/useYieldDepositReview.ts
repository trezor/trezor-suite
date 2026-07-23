import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import { selectIsDeviceConnected } from '@suite-common/device';
import {
    type StablecoinYieldRootState,
    type YieldFlowResolvedData,
    isYieldTxReviewForFlow,
    selectStablecoinYieldTxReview,
} from '@suite-common/wallet-core';
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
import { pushYieldActionReviewThunk, signYieldActionReviewThunk } from '../yieldTransactionThunks';
import { useShowDeviceDisconnectedDuringEarnReviewAlert } from './useShowDeviceDisconnectedDuringEarnReviewAlert';
import { useShowPushTransactionFailedDuringReviewAlert } from './useShowPushTransactionFailedDuringReviewAlert';
import { useYieldActionReviewBackNavigation } from './useYieldActionReviewBackNavigation';
import { useYieldReviewAnalytics } from './useYieldReviewAnalytics';

type UseYieldDepositReviewParams = {
    flowData: YieldFlowResolvedData;
    flowKey: string;
    onReviewLeave?: () => void;
};

type UseYieldDepositReviewResult = {
    depositStatus: YieldReviewStatus;
    handleDepositSubmitted: () => Promise<void>;
    leaveReviewFromDeviceCancel: () => void;
    startDepositReview: () => Promise<YieldReviewSigningResult>;
};

type NavigationProps = StackNavigationProps<
    YieldStackParamList,
    YieldStackRoutes.YieldDepositReview
>;

export const useYieldDepositReview = ({
    flowData,
    flowKey,
    onReviewLeave,
}: UseYieldDepositReviewParams): UseYieldDepositReviewResult => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const { showPendingTransactionConflictAlert, showPushTransactionFailedAlert } =
        useShowPushTransactionFailedDuringReviewAlert('yield-deposit');
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedDuringEarnReviewAlert();

    const { reportError: reportDepositError, reportCancel: reportDepositCancel } =
        useYieldReviewAnalytics({
            flow: 'deposit',
            networkSymbol: flowData.account.symbol,
            vaultId: flowData.vault.id,
        });
    const [depositActionStatus, setDepositActionStatus] = useState<YieldReviewActionStatus>('idle');
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const txReview = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldTxReview(state),
    );
    // A leftover signed tx from a previous review of the same account must not appear
    // as signed here, hence the flow identity and `notBefore` guard.
    const [reviewOpenedAt] = useState(() => Date.now());
    const isDepositSigned =
        isYieldTxReviewForFlow(txReview, {
            accountKey: flowData.account.key,
            flowKey,
            flowType: 'deposit',
            notBefore: reviewOpenedAt,
        }) && !!txReview.serializedTx;
    const depositStatus: YieldReviewStatus =
        depositActionStatus === 'idle' && isDepositSigned ? 'signed' : depositActionStatus;
    const { leaveReviewFromDeviceCancel, markReviewNavigationSuccess } =
        useYieldActionReviewBackNavigation({
            onReviewLeave,
            reviewStatus: depositStatus,
        });

    const startDepositReview = useCallback(async (): Promise<YieldReviewSigningResult> => {
        if (depositStatus === 'signed') {
            return 'signed';
        }

        if (depositStatus === 'signing' || depositStatus === 'sending') {
            return 'already-running';
        }

        if (depositStatus !== 'idle') {
            return 'not-ready';
        }

        if (!isDeviceConnected) {
            showDeviceDisconnectedAlert();

            return 'failed';
        }

        setDepositActionStatus('signing');

        const deviceAccessResponse = await requestPrioritizedDeviceAccess(() =>
            dispatch(
                signYieldActionReviewThunk({
                    flowData,
                    flowKey,
                    flowType: 'deposit',
                }),
            ),
        );

        setDepositActionStatus('idle');

        if (!deviceAccessResponse.success) {
            reportDepositError('submit-failed');
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
            reportDepositCancel();

            return 'cancelled';
        }

        if (isSignRejected) {
            reportDepositError('submit-failed');
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
        depositStatus,
        dispatch,
        flowData,
        flowKey,
        isDeviceConnected,
        navigation,
        reportDepositCancel,
        reportDepositError,
        showDeviceDisconnectedAlert,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
    ]);

    const handleDepositSubmitted = useCallback(async () => {
        if (depositStatus !== 'signed') {
            return;
        }

        setDepositActionStatus('sending');

        const pushResponse = await dispatch(
            pushYieldActionReviewThunk({
                flowData,
                flowKey,
                flowType: 'deposit',
            }),
        );

        setDepositActionStatus('idle');
        const isPushRejected = isRejected(pushResponse);

        if (isPushRejected) {
            reportDepositError('push-failed');

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
        depositStatus,
        dispatch,
        flowData,
        flowKey,
        markReviewNavigationSuccess,
        navigation,
        reportDepositError,
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
    ]);

    return {
        depositStatus,
        handleDepositSubmitted,
        leaveReviewFromDeviceCancel,
        startDepositReview,
    };
};
