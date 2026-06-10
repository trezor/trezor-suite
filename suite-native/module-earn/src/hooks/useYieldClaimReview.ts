import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import {
    type StablecoinYieldRootState,
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
import { isUserCancelledSignError } from '../utils';
import { pushYieldClaimReviewThunk, signYieldClaimReviewThunk } from '../yieldClaimThunks';
import { useShowPushTransactionFailedDuringReviewAlert } from './useShowPushTransactionFailedDuringReviewAlert';
import { useYieldActionReviewBackNavigation } from './useYieldActionReviewBackNavigation';

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
    const {
        showPendingTransactionConflictAlert,
        showPushTransactionFailedAlert,
        showSignTransactionFailedAlert,
    } = useShowPushTransactionFailedDuringReviewAlert('yield-claim');
    const [claimActionStatus, setClaimActionStatus] = useState<YieldReviewActionStatus>('idle');
    const txReview = useSelector((state: StablecoinYieldRootState) =>
        selectStablecoinYieldTxReview(state),
    );
    const isClaimSigned = txReview.accountKey === account.key && !!txReview.serializedTx;
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
            showSignTransactionFailedAlert();

            return 'failed';
        }

        const signResponse = deviceAccessResponse.payload;
        const isSignRejected = isRejected(signResponse);

        if (isSignRejected && isUserCancelledSignError(signResponse.payload)) {
            return 'cancelled';
        }

        if (isSignRejected) {
            showSignTransactionFailedAlert();

            return 'failed';
        }

        return 'signed';
    }, [account, claimStatus, dispatch, flowKey, showSignTransactionFailedAlert]);

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
