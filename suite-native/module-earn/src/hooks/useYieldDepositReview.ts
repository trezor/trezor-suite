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
import { isUserCancelledSignError } from '../utils';
import { pushYieldActionReviewThunk, signYieldActionReviewThunk } from '../yieldTransactionThunks';
import { useHandleEarnReviewError } from './useHandleEarnReviewError';
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
    const { showReviewAlert } = useShowPushTransactionFailedDuringReviewAlert('yield-deposit');
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedDuringEarnReviewAlert();
    const handleReviewError = useHandleEarnReviewError('yield-deposit', navigation);
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
            handleReviewError({
                error: 'sign-transaction-failed',
                message: 'Prioritized device access failed.',
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
            handleReviewError(signResponse.payload);

            return 'failed';
        }

        return 'signed';
    }, [
        depositStatus,
        dispatch,
        flowData,
        flowKey,
        handleReviewError,
        isDeviceConnected,
        reportDepositCancel,
        reportDepositError,
        showDeviceDisconnectedAlert,
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
                showReviewAlert('pendingConflict');

                return;
            }

            showReviewAlert('pushFailed');

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
        showReviewAlert,
    ]);

    return {
        depositStatus,
        handleDepositSubmitted,
        leaveReviewFromDeviceCancel,
        startDepositReview,
    };
};
